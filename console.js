const readline = require('readline');
const WebSocket = require('ws');

const host = "localhost";
const port = 3000;
const wwwdir = path.join(__dirname, 'www');


const connection = new Promise(resolve => {
  // Connect to the WebSocket server
  const ws = new WebSocket(`ws://${host}:${port}`);

  // When connected to the WebSocket server
  ws.on('open', () => resolve(ws));

  // Handle incoming messages from the server
  ws.on('message', (message) => {
    console.log(`Server says: ${message}`);
  });
});

exports.send = async function send(fn, ...args) {
  const ws = await connection;
  ws.send(JSON.stringify([fn, ...args]));
}

