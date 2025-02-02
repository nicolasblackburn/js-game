import {print} from "./lib.js";

function call(fn, ...args) {
	(serverFns[fn] ?? (() => undefined))(...args);
}

const restricted = [
	"devClient.js",
	"index.js"
];

const serverFns = {
	reload: async (url) => {
		if (!restricted.includes(url) && url.match(/\.js$/)) {
			try {
				const cacheBust = new Date().getTime();
				const module = await import(`./${url}?${cacheBust}`);
				for (const [key, value] of Object.entries(module)) {
					if (vtable[key]) {
						vtable[key] = value;
					}
				}
			} catch (e) {
				send("error", `${e}`);
			}
		}
	}
};

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


window.onerror = function (message, url, line, col, error) {
	send("error", `${message}
\tat (${url}:${line}:${col})`);
};

const vtable = {};

export function virtual(fn) {
	if (!vtable[fn.name]) {
		vtable[fn.name] = fn;
	}
	return function (...args) {
		return vtable[fn.name](...args);
	};
}
