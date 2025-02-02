// Import required modules
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const chokidar = require("chokidar");

// Create an Express app
const app = express();
const host = "localhost";
const port = 3000;
const wwwdir = path.join(__dirname, 'www');

// Serve static files (e.g., HTML, JS, CSS)
app.use(express.static(wwwdir));

// Start the HTTP server
const server = app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

const scheduledReloads = {};

// Watch the file for changes
chokidar.watch(wwwdir).on("change" , (filename) => {
	filename = path.relative(wwwdir, filename);
	if (!scheduledReloads[filename]) {
		console.log(`\n${filename} has been modified`);

		scheduledReloads[filename] = setTimeout(() => {
			// Notify all connected clients via WebSocket
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					send(client, 'reload', filename);  // Message to trigger a reload on the client side
				}
			});

			delete scheduledReloads[filename];
		}, 1000);
	}
});

console.log(`Watching changes in ${wwwdir}`);


function call(fn, ...args) {
	(fns[fn] ?? (() => undefined))(...args);
}

function send(ws, fn, ...args) {
	ws.send(JSON.stringify([fn, ...args]));
}

const fns = {
	log: (...args) => console.log(...args)
};



// WebSocket connection event
wss.on('connection', (ws) => {
	console.log('New WebSocket connection');

	// Send a message to the client
	send(ws, "log", 'Hello from the WebSocket server!');

	// Listen for messages from the client
	ws.on('message', (data) => {
		call(...JSON.parse(data));
	});

	// Handle WebSocket closure
	ws.on('close', () => {
		console.log('WebSocket connection closed');
	});
});

