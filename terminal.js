const readline = require('readline');
const WebSocket = require('ws');

const host = "localhost";
const port = 3000;
const wwwdir = path.join(__dirname, 'www');

// Connect to the WebSocket server
const ws = new WebSocket(`ws://${host}:${port}`);

// Create a readline interface for console input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// When connected to the WebSocket server
ws.on('open', () => {
  console.log('Connected to the WebSocket server.');
});

// Handle incoming messages from the server
ws.on('message', (message) => {
  console.log(`Server says: ${message}`);
});

// Function to prompt the user to send a message to the server
function promptMessage() {
  rl.question('Enter a message to send to the WebSocket server: ', (message) => {
    if (message.toLowerCase() === 'exit') {
      console.log('Exiting...');
      ws.close();
      rl.close();
      return;
    }

    // Send the message to the WebSocket server
    ws.send(message);
    promptMessage(); // Prompt the user again
  });
}

// Start the prompt
promptMessage();

