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
			connections.game.forEach(({ws}) => {
				if (ws.readyState === WebSocket.OPEN) {
					send(ws, 'reload', filename);  // Message to trigger a reload on the client side
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

async function remoteCall(ws, fn, ...args) {
  send(ws, fn, ...args);
  const result = await new Promise(resolve => {
    function callback(data) {
      const [fn, result] = JSON.parse(data);
      if (!fn) {
        ws.off('message', callback);
        resolve(result);
      }
    }
    ws.on('message', callback);
  });
  return result;
}

const fns = {
	info: (...args) => console.log(...args.map(value => util.styleText("blue", value?.toString() ?? '')), '\n'),
	error: (...args) => console.error(...args.map(value => util.styleText("red", value?.toString() ?? '')), '\n'),
	//remoteCall: 
  getContext: async () => {
    const result = await new Promise(async resolve => {
      connections.game.forEach(async ({ws}) => {
        if (ws.readyState === WebSocket.OPEN) {
          const result = await remoteCall(ws, 'getContext');
          resolve(result);
        }
        setTimeout(resolve, 5000);
      });
    });

    connections.console.forEach(({ws}) => {
      if (ws.readyState === WebSocket.OPEN) {
        send(ws, undefined, result);
      }
    });
  },
  updateContext: (updates) => {
    connections.game.forEach(async ({ws}) => {
      if (ws.readyState === WebSocket.OPEN) {
        send(ws, 'updateContext', updates);
      }
    });
  }
};

let id = 0;
const connections = {
  game: [],
  console: []
};

// WebSocket connection event
wss.on('connection', (ws, req) => {
  const query = (req.url.split('?').slice(1) ?? [])
    .reduce((o, kv) => (([k, v]) => ({...o, [k]: (v ?? k)}))(kv.split('=')), {});
  const useragent = query.useragent ?? 'game';

  (connections[useragent] ?? []).push({id, ws});

	console.log(util.styleText('greenBright', `New ${useragent} connection #${id}`));

	// Listen for messages from the client
	ws.on('message', (data) => {
		call(...JSON.parse(data));
	});

	// Handle WebSocket closure
	ws.on('close', () => {
	  connections.game = connections.game.filter(({ws}) => ws.readyState === WebSocket.OPEN);
	  connections.console = connections.console.filter(({ws}) => ws.readyState === WebSocket.OPEN);
		console.log('WebSocket connection closed');
	});

	id++;
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
