import {createSVGElement} from './svg.js';

export function initLoader(ctx) {
	let nextTextureId = 0;
	let nextElementId = 0;

	ctx.resources = {};
	ctx.nextTextureId = nextTextureId;
  ctx.nextElementId = nextElementId;
  ctx.maps = {};
  ctx.animations = {};

	ctx.textures = {
		EMPTY: createSVGElement('symbol', {
			id: 'tex' + ctx.nextTextureId++
		})
	};

	ctx.dom.defs.append(ctx.textures.EMPTY);

}

export async function loadResources(ctx, urls) {
	for (const url of urls) {
	  if (ctx.resources[url]) {
	    continue;
    }
		const ext = pathExtension(url);
		if (ext === 'svg') {
			await loadSVG(ctx, url);
		} else if (ext === 'json') {
			await loadJSON(ctx, url);
		}
	}
}

export async function loadSVG(ctx, url) {
	const tmp = createSVGElement('svg');
	tmp.innerHTML = await (await fetch(url)).text();
	const svg = tmp.querySelector('svg');

  if (!svg) {
    return;
  }
	
	ctx.resources[url] = svg;
  svg.setAttribute('id', 'tex' + ctx.nextTextureId++); 
  ctx.dom.defs.append(svg);

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
  const qualifiedName = removeSearch(url);
  ctx.textures[qualifiedName] = svg;
  ctx.textures[key] = svg;
}

export async function loadJSON(ctx, url) {
	try {
		const data = await (await fetch(url)).json();
		data.url = removeSearch(url);
	  ctx.resources[url] = data;
		const key = pathFilename(url);
		if (data.tiledversion) {
		  if (!ctx.maps) {
		    ctx.maps = {};
		  }
		  ctx.maps[key] = data;
    } if (data.animationsversion) {
      if (!ctx.animations) {
        ctx.animations = {};
      }
      for (const value of data.animations) {
        ctx.animations[value.name] = value;
      }
    }
	} catch(e) {
	  console.error(e.stack);
	}
}

export async function reload(ctx, url) {
	const extension = pathExtension(url);

	if (extension === 'svg') {
	  await reloadSVG(ctx, url);
  } else if (extension === 'json') {
    await loadJSON(ctx, url);
  }
}

async function reloadSVG(ctx, url) {
	const name = pathFilename(url);
	const tex = ctx.textures[name];
  await loadSVG(ctx, url);
	ctx.defs.removeChild(tex);
}

export function pathSplit(path) {
  return (path && path.split('/') || []);
}

export function pathFilename(path) {
  return pathSplit(path).slice(-1)[0].split('.')[0];
}

export function pathExtension(path) {
  return pathSplit(path).slice(-1)[0].split('.').slice(1).join('.');
}

export function removeSearch(url) {
  return url.split('?')[0];
}

export function pathDirname(path) {
  return pathSplit(path).slice(0, -1).join('/');
}

export function pathJoin(...parts) {
  return [].concat(...parts.map(pathSplit)).join('/');
}

export function getTextureId(ctx, name) {
  if (ctx.textures[name]) {
    return '#' + ctx.textures[name].getAttribute('id');
  }
}
