// Import required modules
const express = require('express');
const WebSocket = require('ws');
const path = require('node:path');
const fs = require('node:fs');
const chokidar = require("chokidar");
const util = require("node:util");
const nocache = require('nocache');
const serveIndex = require('serve-index');
const acorn = require('acorn');

// Create an Express app
const app = express();
const host = "localhost";
const port = 3000;
const wwwdir = path.join(__dirname, 'www');

// Do not cache responses
app.set('etag', false);
app.use(nocache());


app.use(async (req, res, next) => {
  if (req.url === '/manifest.json') {

    res.send(getDirectoryContents(wwwdir));

  } else if (path.extname(req.path) === '.js' && req.path !== '/client.js') {

    const code = await (await fs.promises.readFile(path.join(wwwdir, req.path))).toString();
    const ast = acorn.parse(code, {sourceType: 'module'});

    let newcode = '';
    for (const node of ast.body) {
      if (
        node.type === 'ExportNamedDeclaration' && 
        (
          node.declaration.type === 'FunctionDeclaration' || 
          node.declaration.type === 'ClassDeclaration')
      ) {
        newcode += `export const ${node.declaration.id.name} = devEnv?.virtual(${code.slice(node.declaration.start, node.declaration.end)});` + '\n';
      } else if (
        node.type === 'FunctionDeclaration' || 
        node.type === 'ClassDeclaration'
      ) {
        newcode += `const ${node.id.name} = devEnv?.virtual(${code.slice(node.start, node.end)});` + '\n';
      } else {
        newcode += code.slice(node.start, node.end)+ '\n';
      }
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.send(newcode);

  } else {

    next();

  }
});

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
	info: (...args) => console.log(...args.map(value => util.styleText("blue", value?.toString() ?? '')), '\n'),
	error: (...args) => console.error(...args.map(value => util.styleText("red", value?.toString() ?? '')), '\n'),
};

// WebSocket connection event
wss.on('connection', (ws) => {
	console.log(util.styleText('greenBright', 'New WebSocket connection'));

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
