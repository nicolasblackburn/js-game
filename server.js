// Import required modules
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const chokidar = require("chokidar");
const util = require("util");
const nocache = require('nocache');
const serveIndex = require('serve-index');

// Create an Express app
const app = express();
const host = "localhost";
const port = 3000;
const wwwdir = path.join(__dirname, 'www');

// Do not cache responses
app.set('etag', false);
app.use(nocache());

// Serve static files (e.g., HTML, JS, CSS)
app.use(express.static(wwwdir), serveIndex(wwwdir));

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
		console.log(`${filename} has been modified`);

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
	info: (...args) => console.log(...args.map(value => util.styleText("blue", value?.toString() ?? ''))),
	error: (...args) => console.error(...args.map(value => util.styleText("red", value?.toString() ?? ''))),
};

// WebSocket connection event
wss.on('connection', (ws) => {
	console.log(util.styleText('greenBright', 'New WebSocket connection'));
	send(ws, "dir", getDirectoryContents(wwwdir));

	// Listen for messages from the client
	ws.on('message', (data) => {
		call(...JSON.parse(data));
	});

	// Handle WebSocket closure
	ws.on('close', () => {
		console.log('WebSocket connection closed');
	});
});

function getDirectoryContents(dirPath) {
    let results = [];

    // Read the contents of the directory
    const list = fs.readdirSync(dirPath);

	list.forEach(file => {
		const filePath = path.join(dirPath, file);
		const stat = fs.statSync(filePath);

		if (stat && stat.isDirectory()) {
			// If it's a directory, recurse into it
			results.push(
				...getDirectoryContents(filePath)
			);
		} else {
			// Otherwise, it's a file
			results.push(path.relative(wwwdir, path.join(dirPath, file)));
		}
	});

	return results;
}
