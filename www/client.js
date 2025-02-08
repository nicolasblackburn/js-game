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
\tat ${url}:${line}:${col}`);
};

const vtable1 = {};
const vtable2 = {};
export function virtual(fn) {
	vtable1[fn.name] = fn;
	if (!vtable2[fn.name]) {
		vtable2[fn.name] = fn;
	}
	try {
		for (const field of Object.getOwnPropertyNames(fn.prototype)) {
			vtable2[fn.name].prototype[field] = fn.prototype[field];
		}
		const instance = new fn();
		// It's a class
		for (const field of Object.getOwnPropertyNames(instance)) {
			vtable2[fn.name].prototype[field] = instance[field];
		}
	} catch(e) {
	}

	return new Proxy(fn, {
		apply(target, thisArg, args) {
			return vtable1[target.name](...args);
		},
		construct(target, args) {
			return new vtable2[target.name](...args);
		}
	});
}
