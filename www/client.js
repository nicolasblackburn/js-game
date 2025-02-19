function call(fn, ...args) {
	(serverFns[fn] ?? (() => undefined))(...args);
}

const restricted = [
	"client.js"
];

const serverFns = {
	reload: (url) => {
		if (!restricted.includes(url) && url.match(/\.js$/)) {
			try {
				const cacheBust = new Date().getTime();
				import(`./${url}?${cacheBust}`);
			} catch (e) {
				send("error", `${e.stack}`);
			}
		}
		for (const listener of reloadListeners) {
			listener(url);
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

const ws = new WebSocket('ws://localhost:3000');

// Log messages from the server to the page
ws.onmessage = function(event) {
	call(...JSON.parse(event.data));
};

// Log errors to the console
ws.onerror = function(error) {
	console.log('WebSocket Error:', error);
};

const connected = new Promise(resolve => {
	// Send a message to the server
	ws.onopen = function() {
		resolve();
	};
});

async function send(fn, ...args) {
	await connected;
	ws.send(JSON.stringify([fn, ...args]));
}


window.onerror = function(message, url, line, col, error) {
	send("error", `${message}
\tat ${url}:${line}:${col}`);
};

window.addEventListener('unhandledrejection', event => {
	send("error", `${event.reason.stack}`);
});

const reloadListeners = [];
export function addReloadListener(listener) {
	if (!reloadListeners.includes(listener)) {
		reloadListeners.push(listener);
	}
}

const functionTable = {};
const classTable = {};

/**
 * This creates a function or a class that can be
 * hot code reloaded.
 */
export function virtual(fn) {
	// Detect classes by convention. Not very robust
	// but did not find something much better yet.
	const isClassName = fn.name[0].match(/[A-Z]/);

	if (!isClassName) {
	
		functionTable[fn.name] = fn;

	} else if (!classTable[fn.name]) {

		// First time we define the class
		classTable[fn.name] = fn;

	} else {

		// Hot reloading the class
		for (const field of Object.getOwnPropertyNames(fn.prototype)) {
			classTable[fn.name].prototype[field] = fn.prototype[field];
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
			classTable[fn.name].prototype[field] = instance[field];
		}
	}

	return new Proxy(fn, {
		apply(target, thisArg, args) {
			return functionTable[target.name](...args);
		},
		construct(target, args) {
			return new classTable[target.name](...args);
		}
	});
}
