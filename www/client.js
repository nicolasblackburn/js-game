function call(fn, ...args) {
	(serverFns[fn] ?? (() => undefined))(...args);
}

const restricted = [
	"client.js"
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
					} else if (classtable[key]) {
						for (const clss of classtable[key]) {
							for (const field of Object.getOwnPropertyNames(value.prototype)) {
								clss.prototype[field] = value.prototype[field];
							}
							const instance = new value();
							for (const field of Object.getOwnPropertyNames(instance)) {
								clss.prototype[field] = instance[field];
							}
						}
						classtable[key].push(value);
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
const classtable = {};

export function virtualClass(fn) {
	if (!classtable[fn.name]) {
		classtable[fn.name] = [fn];
	}
	return function (...args) {
		return new classtable[fn.name][classtable[fn.name].length - 1](...args);
	};
}
