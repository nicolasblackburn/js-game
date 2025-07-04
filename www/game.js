import {createContext} from './src/context.js';
import {loadResources, reload} from './src/loader.js';
import {addEventListeners, addEventListener, dispatchEvent, waitForEvent} from './src/events.js';
import {setAttributes} from './src/svg.js';
import {getMap} from './src/maps.js';
import {updateAnimation} from './src/animations.js';
import {updateState} from './src/states.js';
import {updateMovement} from './src/movements.js';
import {render} from './src/render.js';
import {EPSILON} from './src/constants.js';
import {showScreen} from './src/screens.js';
import {resetGameState} from './src/gameState.js';
import {iterateNodes} from './src/scene.js';
import {processDelayedEvents} from './src/gamepad.js';

async function load() {
	const ctx = createContext();

	devEnv?.setContext(ctx);

	addEventListeners(ctx);

	devEnv?.addReloadListener(url => reload(ctx, url));
	addEventListener(ctx, 'resize', resize.bind(null, ctx));
	addEventListener(ctx, 'blur', blur.bind(null, ctx));
	addEventListener(ctx, 'focus', focus.bind(null, ctx));

  const urls = await (await fetch('manifest.json')).json();
	await loadResources(ctx, urls);

  (function updateFrame(currentTime) {
		update(ctx, currentTime);
		requestAnimationFrame(updateFrame);
	})();

  while (true) {
    await waitForEvent(window, 'pointerdown');
    ctx.paused = false;
    resetGameState(ctx);
    showScreen(ctx, 'basegame');

    await waitForEvent(ctx, 'update', () => {
      return ctx.scene.player.health <= 0;
    });

    ctx.paused = false;
    showScreen(ctx, 'gameover');
  }
}

function resize(ctx, event) {
  const {view, dom} = ctx;
  const {canvassvg, viewsvg} = dom;
  const {innerWidth, innerHeight} = window;
  const width = Math.min(innerWidth, innerHeight * view.width / view.height);
  const height = Math.min(innerHeight, innerWidth * view.height / view.width);
  const x = Math.max(0, (innerWidth - width) / 2);
  const y = Math.max(0, (innerHeight - height) / 2);

  setAttributes(canvassvg, {
    width: innerWidth,
    height: innerHeight
  });

  setAttributes(viewsvg, {
    x,
    y,
		width,
		height
  });

}

function blur(ctx) {
  ctx.savedPausedState = ctx.paused;
  ctx.paused = true;
}

function focus(ctx) {
  ctx.paused = ctx.savedPausedState;
}

function update(ctx, currentTime = 0) {
  ctx.currentTime = currentTime;
  ctx.deltaTime = ctx.currentTime - ctx.lastTime;
  ctx.fixedTimeLeft += ctx.paused ? 0 : ctx.deltaTime;
  
  while (ctx.fixedTimeLeft > 0) {
    fixedUpdate(ctx);
    dispatchEvent(ctx, 'fixedupdate');
    ctx.fixedTimeLeft -= ctx.fixedTimeStepDuration;
  }
 
  checkCollisions(ctx);
  updateScene(ctx, ctx.scene);

  dispatchEvent(ctx, 'update');
  
  render(ctx);

  ctx.lastTime = currentTime;

  processDelayedEvents(ctx);
  ctx.events = {};

}

function updateScene(ctx, scene) {
  for (const [node, parent] of iterateNodes(ctx, scene)) {
    updateState(ctx, node);
    updateAnimation(ctx, node);
  }
}

function fixedUpdate(ctx) {
  // update physics
  const {gamepad, scene, view} = ctx;
  const {player, enemies} = scene;

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
  const layer = map.layers[scene.map.layer];
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
  scene.map.x = Math.min(Math.max(lowboundx, player.x - viewwidth / 2), upboundx);
  scene.map.y = Math.min(Math.max(lowboundy, player.y - viewheight / 2), upboundy);


}

function checkCollisions(ctx) {
  const {enemies, player} = ctx.scene;
  const {x, y, bbx, bby, bbw, bbh} = player;

  if (!player.monsterCollisionDisabled) {
    const x1 = x + bbx;
    const y1 = y + bby;
    const x2 = x1 + bbw;
    const y2 = y1 + bbh;

    for (const entity of enemies) {

      // Check enemy / player collisions
      const {x, y, bbx, bby, bbw, bbh} = entity;
      const x3 = x + bbx;
      const y3 = y + bby;
      const x4 = x3 + bbw;
      const y4 = y3 + bbh;

      const collision =
        x2 > x3 &&
        x4 > x1 &&
        y2 > y3 &&
        y4 > y1;

      if (collision) {
        player.enemyCollision = entity;
        break;
      }
    }
  }
}

window.addEventListener('load', load);

