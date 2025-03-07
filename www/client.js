const restricted = [
	"client.js"
];

const fns = {
	reload: (url) => {
		if (!restricted.includes(url) && url.match(/\.js$/)) {
			try {
				const cacheBust = new Date().getTime();
				import(`./${url}?${cacheBust}`);
			} catch (e) {
				send("error", `${e.stack}`);
			}
		} else {
      for (const listener of reloadListeners) {
        listener(url);
      }
    }
	},
	dir: files => {
		for (const listener of dirListeners) {
			listener(files);
		}
	}
};

const dirListeners = [];
function addDirListener(listener) {
	if (!dirListeners.includes(listener)) {
		dirListeners.push(listener);
	}
}

const asyncDir = new Promise(addDirListener);
export async function listDir() {
  return await asyncDir;
}

function call(fn, ...args) {
	(fns[fn] ?? (() => undefined))(...args);
}

const connection = new Promise(resolve => {
  const ws = new WebSocket('ws://localhost:3000');

  // Send a message to the server
  ws.onopen = function() {
    resolve(ws);
  };

  // Log messages from the server to the page
  ws.onmessage = function(event) {
    call(...JSON.parse(event.data));
  };

  // Log errors to the console
  ws.onerror = function(error) {
    console.log('WebSocket Error:', error);
  };
});

async function send(fn, ...args) {
  const ws = await connection;
  ws.send(JSON.stringify([fn, ...args]));
}

window.onerror = function(message, url, line, col, error) {
  send("error", `${message}
\tat ${url}:${line}:${col}`);
};

window.addEventListener('unhandledrejection', event => {
  send("error", `${event.reason.stack}`);
});

export async function printError(msg) {
  await send("error", msg);
}

export async function printInfo(msg) {
  await send("info", msg);
}

const reloadListeners = [];
export function addReloadListener(listener) {
  if (!reloadListeners.includes(listener)) {
    reloadListeners.push(listener);
  }
}

const functionReloadListeners = [];
export function functionReloadListener(listener) {
  if (!functionReloadListeners.includes(listener)) {
    functionReloadListeners.push(listener);
  }
}

const classReloadListeners = [];
export function addClassReloadListener(listener) {
  if (!classReloadListeners.includes(listener)) {
    classReloadListeners.push(listener);
  }
}

const functionTable = {};
const classTable = {};

/**
 * This creates a function or a class that can be
 * hot code reloaded.
 */
export function virtual(fn) {
  const url = new Error().stack.split('\n')[2].match(/^\s+at\s+(.*)/)[1].split(':').slice(0, -2).join(':').split('?')[0];

  const fnName = url + '/' + fn.name;

  // Detect classes by convention. Not very robust
  // but did not find something much better yet.
  const isClassName = fn.name[0].match(/[A-Z]/);

  if (!isClassName) {

    const isReload = !!functionTable[fnName];	
    functionTable[fnName] = fn;

    if (isReload) {
      for (const listener of functionReloadListeners) {
        listener(fn);
      }
    }

  } else if (!classTable[fnName]) {

    // First time we define the class
    classTable[fnName] = fn;

  } else {

    // Hot reloading the class
    for (const field of Object.getOwnPropertyNames(fn.prototype)) {
      classTable[fnName].prototype[field] = fn.prototype[field];
    }

    // This is not ideal, because that will
    // execute the constructor side effects but
    // I do not have a better way to assign
    // new properties.
    const instance = new fn();

    // We assign all instance's properties to
    // the class prototype. This allows to
    // assign values to new properties that did 
    // not exist in previous class definition.
    for (const field of Object.getOwnPropertyNames(instance)) {
      classTable[fnName].prototype[field] = instance[field];
    }

    for (const listener of classReloadListeners) {
      listener(fn);
    }
  }

  return new Proxy(fn, {
    apply(target, thisArg, args) {
      return functionTable[url + '/' + target.name](...args);
    },
    construct(target, args) {
      return new classTable[url + '/' + target.name](...args);
    }
  });
}
