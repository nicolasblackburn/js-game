// Import required modules
const express = require('express');
const WebSocket = require('ws');
const path = require('path');

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

// WebSocket connection event
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Send a message to the client
  ws.send(JSON.stringify(["log", 'Hello from the WebSocket server!']));
  
  // Listen for messages from the client
  ws.on('message', (data) => {
  	const [fn, ...args] = JSON.parse(data);
  	(fns[fn] ?? (() => undefined))(...args);
  });
  
  // Handle WebSocket closure
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

const fns = {
	log: (...args) => console.log(...args)
};


