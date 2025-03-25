import {createContext} from './src/context.js';
import {loadResources, reload} from './src/loader.js';
import {addEventListeners, addEventListener} from './src/events.js';
import {setAttributes} from './src/svg.js';
import {getMap} from './src/maps.js';
import {updateAnimations} from './src/animations.js';
import {updateStates} from './src/states.js';
import {updateMovement} from './src/movements.js';
import {render} from './src/render.js';
import {EPSILON} from './src/constants.js';

async function load() {
	const ctx = createContext();

	devEnv?.setContext(ctx);

	addEventListeners(ctx);

	devEnv?.addReloadListener(url => reload(ctx, url));
	addEventListener(ctx, 'resize', resize.bind(null, ctx));

  const urls = await (await fetch('manifest.json')).json();
	await loadResources(ctx, urls);

	(function updateFrame(currentTime) {
		update(ctx, currentTime);
		requestAnimationFrame(updateFrame);
	})();
 
}

function resize(ctx, event) {
  const {view, dom} = ctx;
  const {canvasSvg, viewSvg} = dom;
  const {innerWidth, innerHeight} = window;
  const width = Math.min(innerWidth, innerHeight * view.width / view.height);
  const height = Math.min(innerHeight, innerWidth * view.height / view.width);
  const x = Math.max(0, (innerWidth - width) / 2);
  const y = Math.max(0, (innerHeight - height) / 2);

  setAttributes(canvasSvg, {
    width: innerWidth,
    height: innerHeight
  });

  setAttributes(viewSvg, {
    x,
    y,
		width,
		height
  });

}

function update(ctx, currentTime = 0) {
  ctx.currentTime = currentTime;
  ctx.fixedTimeLeft += ctx.currentTime - ctx.lastTime;

  while (ctx.fixedTimeLeft > 0) {
    fixedUpdate(ctx);
    ctx.fixedTimeLeft -= ctx.fixedTimeStepDuration;
  }
  
  render(ctx);

  ctx.lastTime = currentTime;

}

function fixedUpdate(ctx) {
  updateStates(ctx);
  updateAnimations(ctx);

  // update physics
  const {gamepad, gameState, view} = ctx;
  const {player, enemies} = gameState;

  player.vx = gamepad.axes[0];
  player.vy = gamepad.axes[1];

  const entities = [player, ...enemies];

  for (const entity of entities) {
    if (Math.abs(entity.ax) < EPSILON) {
      entity.ax = 0;
    }

    if (Math.abs(entity.ay) < EPSILON) {
      entity.ay = 0;
    }

    if (Math.abs(entity.vx) < EPSILON) {
      entity.vx = 0;
    }

    if (Math.abs(entity.vy) < EPSILON) {
      entity.vy = 0;
    }
    
    // Process collisions
    updateMovement(ctx, entity);

    entity.vx += entity.ax;
    entity.vy += entity.ay;
    entity.x += entity.vx;
    entity.y += entity.vy;

    if (Math.abs(entity.x - Math.floor(entity.x)) < EPSILON) {
      entity.x = Math.floor(entity.x);
    }

    if (Math.abs(entity.y - Math.floor(entity.y)) < EPSILON) {
      entity.y = Math.floor(entity.y);
    }

  }

  // update map
  const map = getMap(ctx);
  const layer = map.layers[gameState.map.layer];
  const layerwidth = layer.width * map.tilewidth;
  const layerheight = layer.height * map.tileheight;
  const viewwidth = view.width * view.tilewidth;
  const viewheight = view.height * view.tileheight;
  const midpointx = (viewwidth - layerwidth) / 2;
  const midpointy = (viewheight - layerheight) / 2;
  const lowboundx = 0;
  const upboundx = layer.width * map.tilewidth - viewwidth;
  const lowboundy = 0;
  const upboundy = layer.height * map.tileheight - viewheight;
  gameState.map.x = Math.min(Math.max(lowboundx, player.x - viewwidth / 2), upboundx);
  gameState.map.y = Math.min(Math.max(lowboundy, player.y - viewheight / 2), upboundy);

}

window.addEventListener('load', load);

