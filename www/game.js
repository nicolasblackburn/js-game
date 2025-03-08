import {addReloadListener, listDir, printInfo, virtual} from './client.js';
import {createContext} from './src/context.js';
import {loadResources, reload, getTextureId, pathDirname, pathJoin} from './src/loader.js';
import {addEventListeners} from './src/events.js';
import {setAttributes} from './src/svg.js';

const load = virtual(async function load() {
	const ctx = createContext();

	addEventListeners(ctx);

	addReloadListener(url => reload(ctx, url));

	await loadResources(ctx, await listDir());

	(function updateFrame(currentTime) {
		update(ctx, currentTime);
		requestAnimationFrame(updateFrame);
	})();
 
  /*
  const {player} = ctx.gameState;
  player.x -= 8;
  player.y -= 8;
  checkCollisions(ctx, player);
  */
  //printInfo(JSON.stringify(ctx.textures, null, 2));
});

const update = virtual(function update(ctx, currentTime) {
  const deltaTime = !ctx.lastTime ? 0 : currentTime - ctx.lastTime;
  ctx.fixedTimeLeft += deltaTime;

  while (ctx.fixedTimeLeft > 0) {
    fixedUpdate(ctx);
    ctx.fixedTimeLeft -= ctx.fixedTimeStepDuration;
  }
  
  render(ctx);

  ctx.lastTime = currentTime;


  //ctx.dom.debug.innerText = JSON.stringify(game.player);

  /*
(px: pixel, sx: subpixel, s: second, f: frame)
256 sx = 1 px
64 f = 1 s
8 px / s
= (2048 / 64) sx / f
= 32 sx / f
*/
});

const fixedUpdate = virtual(function fixedUpdate(ctx) {
  const {gamepad} = ctx;
  const {player, enemies} = ctx.gameState;

  player.vx = gamepad.axes[0];
  player.vy = gamepad.axes[1];

  const entities = [player, ...enemies];

  for (const entity of entities) {
    entity.vx += entity.ax;
    entity.vy += entity.ay;

    entity.x += entity.vx;
   
    if (checkCollisions(ctx, entity)) {
      entity.x -= entity.vx;
    }

    entity.y += entity.vy;
    
    if (checkCollisions(ctx, entity)) {
      entity.y -= entity.vy;
    }

  }

});

const checkCollisions = virtual(function checkCollisions(ctx, entity) {
  const map = getMap(ctx); 
  const mapData = map.layers[0].data;
  const {height, width, tileheight, tilewidth} = map;
  const {x, y, vx, vy, bbx, bby, bbw, bbh} = entity;
  
  // For each sensor point (four corners of collision
  // rectangle plus extra vertexes to ensure the map's 
  // tile size is bigger than sensors distance), 
  // check if the sensor hit a solid tile. If that is
  // the case, find the shortest penetration vector 
  // that puts the entity in a non-collision position.
  
  const startx = (x + bbx) / tilewidth | 0;
  const endx = (x + bbx + bbw) / tilewidth | 0;
  const starty = (y + bby) / tileheight | 0;
  const endy = (y + bby + bbh) / tileheight | 0;

  for (let y = starty; y <= endy; y++) {
    for (let x = startx; x <= endx; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        // Get tile at x, y
        const tileId = mapData[width * y + x];
        
        // Is it a solid tile?
        if (tileId) {
          return true;
        }
      }
    }
  }

  return false;
});

const render = virtual(function render(ctx) {
  renderMap(ctx);
  renderSprites(ctx);
});

function getMap(ctx) {
  const {gameState, maps} = ctx;
  const map = maps[gameState.map];
  return map;
}

const renderMap = virtual(function renderMap(ctx) {
  const {dom, textures} = ctx;
  const {tiles} = dom;

  const map = getMap(ctx);
  const mapData = map.layers[0].data;
  const tileset = map.tilesets[0].tiles;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const x = i % (map.width + 1);
    const y = i / (map.width + 1) | 0;
    if (x >= map.width || y >= map.height) {
      setAttributes(tile, {
        href: getTextureId(ctx, 'EMPTY')
      });
    } else {
      const index = y * map.width + x;
      let name = 'EMPTY';
      if (tileset[mapData[index]]) {
        name = pathJoin(
          pathDirname(map.url),
          tileset[mapData[index]]?.image
        );
      }
      setAttributes(tile, {
        href: getTextureId(ctx, name)
      });
    }
  }

});

const renderSprites = virtual(function renderSprites(ctx) {
  const {player, enemies} = ctx.gameState;
  const {sprites} = ctx.dom;
  const entities = [player, ...enemies];

  for (let i = 0; i < Math.min(sprites.length, entities.length); i++) {
    const entity = entities[i];
    const sprite = sprites[i];
    const {texture, x, y} = entity;
    setAttributes(sprite, {
      href: getTextureId(ctx, texture),
      transform: `translate(${x}, ${y})`
    });
  }

});

window.addEventListener('load', load);

