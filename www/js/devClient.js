const { stringify } = JSON;
const ws = new WebSocket('ws://localhost:3000');

// Log messages from the server to the page
ws.onmessage = function(event) {
	const [fn, ...args] = JSON.parse(event.data);
	(serverFns[fn] ?? (() => undefined))(...args);
};

// Send a message to the server
ws.onopen = function() {
	ws.send(stringify(["log", "Hello, Server!"]));
};

window.onerror = function (message, url, lineno) {
	ws.send(stringify(["log", message, url, lineno]));
};

// Log errors to the console
ws.onerror = function(error) {
	console.log('WebSocket Error:', error);
};

const serverFns = {
	log: (...args) => {
		const messageDiv = document.getElementById('messages');
		messageDiv.innerHTML += `<p>Server: ${args.join(", ")}</p>`;
	}
};
