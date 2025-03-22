const readline = require('readline');
const WebSocket = require('ws');

const host = "localhost";
const port = 3000;
const wwwdir = path.join(__dirname, 'www');

const connection = new Promise(resolve => {
  // Connect to the WebSocket server
  const ws = new WebSocket(`ws://${host}:${port}?useragent=console`);

  // When connected to the WebSocket server
  ws.on('open', () => resolve(ws));
});

async function send(fn, ...args) {
  const ws = await connection;
  ws.send(JSON.stringify([fn, ...args]));
}

async function remoteCall(fn, ...args) {
  await send(fn, ...args);
  const ws = await connection;
  const result = await new Promise(resolve => {
    function callback(data) {
      const [fn, result] = JSON.parse(data);
      if (!fn) {
        ws.off('message', callback);
        resolve(result);
      }
    }
    ws.on('message', callback);
  });
  return result;
}

function decorateObject(obj, callback, path = []) {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop];
      if (value && (
        Array.isArray(value) || 
        typeof value === 'object'
      )) {
        return decorateObject(value, callback, [...path, prop]);
      } else {
        return value;
      }
    },
    set(target, prop, value) {
      callback('set', [...path, prop], value);
      target[prop] = value;
    }
  });
}

async function getContext() {
  return await remoteCall('getContext');
};

async function setContext(callback) {
  const commands = [];
  //decorateObject
  const ctx = decorateObject(await getContext(), (...args) => {
    commands.push(args);
  });
  callback(ctx);
  send('updateContext', commands);
};

module.exports = {
  getContext,
  setContext
};
