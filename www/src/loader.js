import {listDir, addReloadListener, virtual} from '../client.js';
import {createSVGElement} from './svg.js';

export const loadResources = virtual(async function load(urls, game, ctx) {
	for (const url of urls) {
		const ext = pathExtension(url);
		if (ext === 'svg') {
			await loadSVG(url, game, ctx);
		} else if (ext === 'json') {
			await loadJSON(url, game, ctx);
		}
	}
});

export const loadSVG = virtual(async function loadSVG(url, game, ctx) {
	const tmp = createSVGElement('svg');
	tmp.innerHTML = await (await fetch(url)).text();
	const svg = tmp.querySelector('svg');

  if (!svg) {
    return;
  }
	
	ctx.resources[url] = svg;
  svg.setAttribute('id', 'tex' + ctx.nextTextureId++); 
  ctx.defs.append(svg);

  // Replace all element ids
  const subs = [];
  for (const elem of svg.querySelectorAll('[id]')) {
    const oldId = elem.id;
    const newId = 'id' + ctx.nextElementId++;
    elem.id = newId;
    subs.push([oldId, newId]);
  }

  for (const [oldId, newId] of subs) {
    for (const elem of svg.querySelectorAll(`[href="#${oldId}"]`)) {
      elem.setAttribute('href', '#' + newId);
    }

    for(const elem of svg.querySelectorAll(`[fill="url(#${oldId})"]`)) {
      elem.setAttribute('fill', `url(#${newId})`);
    }

    for(const elem of svg.querySelectorAll(`[stroke="url(#${oldId})"]`)) {
      elem.setAttribute('stroke', `url(#${newId})`);
    }
  }

  const key = pathFilename(url);
  ctx.textures[key] = svg;
});

export const loadJSON = virtual(async function loadJSON(url, game, ctx) {
	try {
		const data = await (await fetch(url)).json();
	  ctx.resources[url] = data;
		if (data.tiledversion) {
		  const key = pathFilename(url);
		  ctx.maps[key] = data;
    }
	} catch(e) {
	}
});

export const reload = virtual(async function reload(url, game, ctx) {
	const extension = pathExtension(url);

	if (extension === 'svg') {
	  await reloadSVG(url, game, ctx);
  } else if (extension === 'json') {
    await loadJSON(url, game, ctx);
  }
});

const reloadSVG = virtual(async function reloadSVG(url, game, ctx) {
	const name = pathFilename(url);
	const tex = ctx.textures[name];
  await loadSVG(url, game, ctx);
	ctx.defs.removeChild(tex);
});

function pathSplit(path) {
  return (path && path.split('/') || []);
}

function pathFilename(path) {
  return pathSplit(path).slice(-1)[0].split('.')[0];
}

function pathExtension(path) {
  return pathSplit(path).slice(-1)[0].split('.').slice(1).join('.');
}

