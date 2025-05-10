(() => {
  // www/src/gamepad.js
  function initGamepad(ctx) {
    ctx.gamepad = {
      axes: [0, 0],
      buttons: [{
        pressed: false
      }],
      axisDistanceMax: 32 ** 2,
      touchstartDistanceThreshold: 49,
      tapTimeThreshold: 100,
      clampAxes: true
    };
    ctx.listeners.touchstart = [];
    ctx.listeners.touchmove = [];
    ctx.listeners.touchend = [];
    ctx.touch = {
      distanceThresholdSquared: 49,
      touches: [],
      regions: [
        {
          active: true,
          delayTouchStart: true,
          region: [0, 0, 1, 1]
        }
      ]
    };
  }
  function addGamepadEventListeners(ctx) {
    document.body.style.touchAction = "none";
    addEventListener(ctx, "pointerdown", (event) => touchPointerDown(ctx, event));
    addEventListener(ctx, "pointermove", (event) => {
      touchPointerMove(ctx, event);
    });
    addEventListener(ctx, "pointerup", (event) => touchPointerUp(ctx, event));
  }
  function touchPointerDown(ctx, event) {
    const touch = createTouch(event);
    ctx.touch.touches.push(touch);
  }
  function touchPointerMove(ctx, event) {
    const touch = findClosestTouch(ctx, event);
    touch.moveX = event.x - touch.startX;
    touch.moveY = event.y - touch.startY;
    touch.x = event.x;
    touch.y = event.y;
    let dist = touch.moveX ** 2 + touch.moveY ** 2;
    if (!touch.type) {
      const { touchstartDistanceThreshold } = ctx.gamepad;
      if (dist >= touchstartDistanceThreshold) {
        touch.type = "move";
        dispatchEvent(ctx, "touchstart", touch);
        ctx.gamepad.axes[0] = 0;
        ctx.gamepad.axes[1] = 0;
        dispatchEvent(ctx, "axispress", {
          ...ctx.gamepad,
          touch
        });
      }
    }
    if (touch.type === "move") {
      dispatchEvent(ctx, "touchmove", touch);
      const { axisDistanceMax } = ctx.gamepad;
      ctx.gamepad.axes[0] = touch.moveX;
      ctx.gamepad.axes[1] = touch.moveY;
      if (dist > axisDistanceMax) {
        const scalar2 = (axisDistanceMax / dist) ** 0.5;
        ctx.gamepad.axes[0] *= scalar2;
        ctx.gamepad.axes[1] *= scalar2;
      }
      const scalar = axisDistanceMax ** 0.5;
      ctx.gamepad.axes[0] /= scalar;
      ctx.gamepad.axes[1] /= scalar;
      if (ctx.gamepad.clampAxes) {
        let angle = Math.atan2(
          ctx.gamepad.axes[1],
          ctx.gamepad.axes[0]
        );
        angle = Math.round(angle * 4 / Math.PI) / 4 * Math.PI;
        const mag = (ctx.gamepad.axes[0] ** 2 + ctx.gamepad.axes[1] ** 2) ** 0.5;
        ctx.gamepad.axes[0] = mag * Math.cos(angle);
        ctx.gamepad.axes[1] = mag * Math.sin(angle);
      }
      dispatchEvent(ctx, "axischange", {
        ...ctx.gamepad,
        touch
      });
    }
  }
  function touchPointerUp(ctx, event) {
    const index = { value: void 0 };
    const touch = findClosestTouch(ctx, event, index);
    ctx.touch.touches.splice(index.value, 1);
    if (touch.type === "move") {
      dispatchEvent(ctx, "touchend", touch);
      ctx.gamepad.axes[0] = 0;
      ctx.gamepad.axes[1] = 0;
      dispatchEvent(ctx, "axischange", {
        ...ctx.gamepad,
        touch
      });
    }
  }
  function createTouch({ x, y }) {
    const touchState = {
      x,
      y,
      moveX: 0,
      moveY: 0,
      startX: x,
      startY: y,
      type: void 0
      // 'move' or 'press'
    };
    return touchState;
  }
  function findClosestTouch(ctx, { x, y }, index = { value: null }) {
    let distance = Number.POSITIVE_INFINITY;
    let closest;
    let i = 0;
    for (const touch of ctx.touch.touches) {
      const dist = (touch.x - x) ** 2 + (touch.y - y) ** 2;
      if (dist < distance) {
        distance = dist;
        closest = touch;
        index.value = i;
      }
      i++;
    }
    return closest;
  }

  // www/src/events.js
  var EVENT_TYPES = [
    "pointercancel",
    "pointerdown",
    "pointerenter",
    "pointerleave",
    "pointermove",
    "pointerout",
    "pointerover",
    "pointerup",
    "resize",
    "visibilitychange",
    "blur",
    "focus"
  ];
  function initEvents(ctx) {
    ctx.listeners = EVENT_TYPES.reduce(
      (rest, type) => ({ ...rest, [type]: [] }),
      {}
    );
  }
  function addEventListeners(ctx) {
    EVENT_TYPES.forEach((type) => window.addEventListener(type, (event) => dispatchEvent(ctx, type, event)));
    addGamepadEventListeners(ctx);
  }
  function dispatchEvent(ctx, type, ...args) {
    ctx.listeners[type]?.forEach((listener) => {
      listener(...args);
    });
  }
  function addEventListener(ctx, type, listener) {
    let listeners = ctx.listeners[type];
    if (!listeners) {
      listeners = [];
      ctx.listeners[type] = listeners;
    }
    if (!listeners.includes(listener)) {
      listeners.push(listener);
    }
  }

  // www/src/svg.js
  function createSVGElement(name, attrs = {}, style = {}) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(SVG_NS, name);
    setAttributes(element, attrs);
    Object.assign(element.style, style);
    return element;
  }
  function setAttributes(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
  }

  // www/src/loader.js
  function initLoader(ctx) {
    let nextTextureId = 0;
    let nextElementId = 0;
    ctx.resources = {};
    ctx.nextTextureId = nextTextureId;
    ctx.nextElementId = nextElementId;
    ctx.maps = {};
    ctx.animations = {};
    ctx.textures = {
      EMPTY: createSVGElement("symbol", {
        id: "tex" + ctx.nextTextureId++
      })
    };
    ctx.dom.defs.append(ctx.textures.EMPTY);
  }
  async function loadResources(ctx, urls) {
    for (const url of urls) {
      if (ctx.resources[url]) {
        continue;
      }
      const ext = pathExtension(url);
      if (ext === "svg") {
        await loadSVG(ctx, url);
      } else if (ext === "json") {
        await loadJSON(ctx, url);
      }
    }
  }
  async function loadSVG(ctx, url) {
    const tmp = createSVGElement("svg");
    tmp.innerHTML = await (await fetch(url)).text();
    const svg = tmp.querySelector("svg");
    if (!svg) {
      return;
    }
    ctx.resources[url] = svg;
    svg.setAttribute("id", "tex" + ctx.nextTextureId++);
    ctx.dom.defs.append(svg);
    const subs = [];
    for (const elem of svg.querySelectorAll("[id]")) {
      const oldId = elem.id;
      const newId = "id" + ctx.nextElementId++;
      elem.id = newId;
      subs.push([oldId, newId]);
    }
    for (const [oldId, newId] of subs) {
      for (const elem of svg.querySelectorAll(`[href="#${oldId}"]`)) {
        elem.setAttribute("href", "#" + newId);
      }
      for (const elem of svg.querySelectorAll(`[fill="url(#${oldId})"]`)) {
        elem.setAttribute("fill", `url(#${newId})`);
      }
      for (const elem of svg.querySelectorAll(`[stroke="url(#${oldId})"]`)) {
        elem.setAttribute("stroke", `url(#${newId})`);
      }
    }
    const key = pathFilename(url);
    const qualifiedName = removeSearch(url);
    ctx.textures[qualifiedName] = svg;
    ctx.textures[key] = svg;
  }
  async function loadJSON(ctx, url) {
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
      }
      if (data.animationsversion) {
        if (!ctx.animations) {
          ctx.animations = {};
        }
        for (const value of data.animations) {
          ctx.animations[value.name] = value;
        }
      }
    } catch (e) {
      console.error(e.stack);
    }
  }
  async function reload(ctx, url) {
    const extension = pathExtension(url);
    if (extension === "svg") {
      await reloadSVG(ctx, url);
    } else if (extension === "json") {
      await loadJSON(ctx, url);
    }
  }
  async function reloadSVG(ctx, url) {
    const name = pathFilename(url);
    const tex = ctx.textures[name];
    await loadSVG(ctx, url);
    ctx.defs.removeChild(tex);
  }
  function pathSplit(path) {
    return path && path.split("/") || [];
  }
  function pathFilename(path) {
    return pathSplit(path).slice(-1)[0].split(".")[0];
  }
  function pathExtension(path) {
    return pathSplit(path).slice(-1)[0].split(".").slice(1).join(".");
  }
  function removeSearch(url) {
    return url.split("?")[0];
  }
  function pathDirname(path) {
    return pathSplit(path).slice(0, -1).join("/");
  }
  function pathJoin(...parts) {
    return [].concat(...parts.map(pathSplit)).join("/");
  }

  // www/src/gameState.js
  function initGameState(ctx) {
    const player = createEntity({
      x: 24,
      y: 24,
      states: [["heroIdleState"]]
    });
    const enemies = [];
    const map = {
      current: "main",
      layer: 0,
      x: 0,
      y: 0
    };
    ctx.gameState = {
      map,
      player,
      enemies,
      states: [["gameLoadState"]]
    };
  }
  function createEntity(attrs = {}) {
    return {
      visible: true,
      active: true,
      texture: "EMPTY",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      px: 8,
      py: 8,
      bbx: -8,
      bby: -8,
      bbw: 16,
      bbh: 16,
      scalex: 1,
      scaley: 1,
      dir: 0,
      animations: [],
      states: [],
      ...attrs
    };
  }

  // www/src/animations.js
  function updateAnimations(ctx) {
    const { gameState } = ctx;
    const { player, enemies } = gameState;
    const deltaTime = 1e3 / 60;
    const entities = [gameState, player, ...enemies];
    for (const entity of entities) {
      const animations = entity.animations ?? [];
      for (const state of animations) {
        if (state.paused) {
          continue;
        }
        state.time += deltaTime;
        const animation = getAnimationData(ctx, state.name);
        if (animation) {
          if (animation.loop) {
            state.time = state.time % animation.duration;
          }
          applyAnimation(entity, animation, state.time);
        }
      }
    }
  }
  function setAnimation(ctx, target, name, track = 0) {
    if (target.animations[track]?.name !== name) {
      target.animations[track] = {
        name,
        time: 0,
        paused: false,
        loop: true
      };
    }
  }
  function getAnimationData(ctx, name) {
    return ctx.animations[name];
  }
  function applyAnimation(target, animation, time) {
    const { duration, frames, properties } = animation;
    let prevframe = 0;
    let frame = 0;
    if (time >= duration) {
      frame = frames.length - 1;
      prevframe = frame;
    } else {
      while (frames[frame] < time) {
        frame++;
        prevframe = frame - 1;
      }
    }
    const t = time - frames[prevframe];
    const d = frames[frame] - frames[prevframe] || 1;
    const a = (d - t) / d;
    const b = t / d;
    for (let { path, values } of properties) {
      let node = target;
      while (path.length > 1) {
        node = node[path.unshift()] ?? {};
      }
      if (typeof values[prevframe] === "number") {
        target[path[0]] = a * values[prevframe] + b * values[frame];
      } else {
        target[path[0]] = values[prevframe];
      }
    }
  }

  // www/src/constants.js
  var EPSILON = 100 * Number.EPSILON;
  var SQRT_1_2 = 1 / 2 ** 0.5;

  // www/src/maps.js
  function getMapProperty(map, pname) {
    return map?.properties?.find?.(({ name }) => name === pname)?.value;
  }
  function getMap(ctx, name) {
    const { gameState, maps } = ctx;
    const map = maps[name ?? gameState.map.current];
    return map;
  }
  function getLayer(ctx, map, layerIndex) {
    const { gameState } = ctx;
    const mapData = getMap(ctx, map);
    const layer = mapData.layers[layerIndex] ?? mapData.layers[gameState.map.layer];
    return layer;
  }
  function mapCollides(ctx, bbx, bby, bbw, bbh, map) {
    if (map === void 0) {
      map = getMap(ctx);
    }
    const { tileheight, tilewidth } = map;
    const startx = bbx;
    const endx = bbx + bbw;
    const starty = bby;
    const endy = bby + bbh;
    for (let x = startx; x < endx; x += tilewidth) {
      if (isSolid(ctx, x, starty) || isSolid(ctx, x, endy - EPSILON)) {
        return true;
      }
    }
    if (isSolid(ctx, endx - EPSILON, starty) || isSolid(ctx, endx - EPSILON, endy - EPSILON)) {
      return true;
    }
    for (let y = starty + tileheight; y < endy; y += tileheight) {
      if (isSolid(ctx, startx, y) || isSolid(ctx, endx - EPSILON, y)) {
        return true;
      }
    }
    return false;
  }
  function isSolid(ctx, x, y) {
    const { gameState } = ctx;
    const map = getMap(ctx);
    const layer = getLayer(ctx);
    const { data, width, height } = layer;
    const { tileheight, tilewidth, tilesets } = map;
    const tilesCollision = tilesets[0].tiles.map((tile) => getMapProperty(tile, "collision"));
    const tilex = x / tilewidth | 0;
    const tiley = y / tileheight | 0;
    if (0 <= tilex && tilex < width && 0 <= tiley && tiley < height) {
      const tileId = data[width * tiley + tilex];
      return !!tilesCollision[tileId];
    } else {
      return false;
    }
  }

  // www/src/states.js
  function initStates(ctx) {
    ctx.states = {
      gameLoadState,
      gameBaseState,
      heroNormalState,
      entityHurtState,
      seekState
    };
  }
  function updateStates(ctx) {
    const { gameState } = ctx;
    const { player, enemies } = gameState;
    const nodes = [gameState, player, ...enemies];
    for (const node of nodes) {
      for (const state of node.states ?? []) {
        const top = state.pop();
        const fn = ctx.states?.[top];
        const result = fn?.(ctx, node);
        if (!result || result === "continue") {
          state.push(top);
        } else if (Array.isArray(result)) {
          const [action, name] = result;
          if (action === "push") {
            state.push(top);
          }
          if (action === "push" || action === "terminatepush") {
            state.push(name);
          }
        }
      }
      node.states = node.states?.filter((stack) => stack.length) ?? [];
    }
  }
  function gameLoadState(ctx, game) {
    const map = getMap(ctx);
    const layer = getLayer(ctx);
    const { tilewidth, tileheight } = map;
    const { width, height } = layer;
    const halftilewidth = tilewidth / 2;
    const halftileheight = tileheight / 2;
    game.player.states = [["heroNormalState"]];
    for (let i = 0; i < 4; i++) {
      let x;
      let y;
      do {
        x = tilewidth * ((Math.random() * (width - 2) | 0) + 1) + halftilewidth;
        y = tileheight * ((Math.random() * (height - 2) | 0) + 1) + halftileheight;
      } while (isSolid(ctx, x, y));
      game.enemies.push(createEntity({
        texture: "hero_idle_u_0",
        x,
        y,
        states: [["seekState"]]
      }));
    }
    return ["terminatepush", "gameBaseState"];
  }
  function gameBaseState(ctx) {
    const { enemies, player } = ctx.gameState;
    const { x, y, bbx, bby, bbw, bbh } = player;
    const x1 = x + bbx;
    const y1 = y + bby;
    const x2 = x1 + bbw;
    const y2 = y1 + bbh;
    for (const entity of enemies) {
      const { x: x3, y: y3, bbx: bbx2, bby: bby2, bbw: bbw2, bbh: bbh2 } = entity;
      const x32 = x3 + bbx2;
      const y32 = y3 + bby2;
      const x4 = x32 + bbw2;
      const y4 = y32 + bbh2;
      const collision = x2 > x32 && x4 > x1 && y2 > y32 && y4 > y1;
      if (collision) {
        player.enemyCollision = entity;
        break;
      }
    }
  }
  function heroNormalState(ctx, entity) {
    const { gamepad } = ctx;
    if (entity.enemyCollision) {
      const [vx, vy] = [
        [-1, 0]
      ][0];
      entity.vx = vx;
      entity.vy = vy;
      entity.enemyCollision = null;
      entity.hurtCountdown = 10;
      return ["push", "entityHurtState"];
    }
    entity.vx = gamepad.axes[0];
    entity.vy = gamepad.axes[1];
    if (entity.vx !== 0 || entity.vy !== 0) {
      const tan = entity.vy / entity.vx;
      if (entity.vx >= 0) {
        if (tan < -1) {
          entity.dir = 3;
        } else if (tan < 1) {
          entity.dir = 0;
        } else {
          entity.dir = 1;
        }
      } else {
        if (tan < -1) {
          entity.dir = 1;
        } else if (tan < 1) {
          entity.dir = 2;
        } else {
          entity.dir = 3;
        }
      }
      const animation = [
        "hero_walk_r",
        "hero_walk_d",
        "hero_walk_l",
        "hero_walk_u"
      ][entity.dir];
      setAnimation(ctx, entity, animation);
    } else {
      const animation = [
        "hero_idle_r",
        "hero_idle_d",
        "hero_idle_l",
        "hero_idle_u"
      ][entity.dir];
      setAnimation(ctx, entity, animation);
    }
  }
  function entityHurtState(ctx, entity) {
    entity.hurtCountdown--;
    if (entity.hurtCountdown <= 0) {
      return "terminate";
    }
  }
  function seekState(ctx, entity) {
    const player = ctx.gameState.player;
    const map = getMap(ctx);
    const { tilewidth, tileheight } = map;
    const halftilewidth = tilewidth / 2;
    const halftileheight = tileheight / 2;
    const entitygridx = entity.x / tilewidth | 0;
    const entitygridy = entity.y / tileheight | 0;
    const playergridx = player.x / tilewidth | 0;
    const playergridy = player.y / tileheight | 0;
    const newx = entity.ax + entity.vx + entity.x;
    const newy = entity.ay + entity.vy + entity.y;
    const { bbx, bby, bbw, bbh } = entity;
    const cantMove = mapCollides(ctx, newx + bbx, newy + bby, bbw, bbh);
    if (!entity.target || cantMove || entity.vx === 0 && entity.vy === 0 || entity.target.distance <= 0) {
      if (entity.target) {
      }
      do {
        const dir = Math.random() * 4 | 0;
        let [vx, vy] = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1]
        ][dir];
        entity.origin = {
          x: (entitygridx + 0.5) * tilewidth,
          y: (entitygridy + 0.5) * tileheight
        };
        entity.target = {
          x: (entitygridx + vx + 0.5) * tilewidth,
          y: (entitygridy + vy + 0.5) * tileheight
        };
        entity.target.distance = 2 * ((vx * tilewidth) ** 2 + (vy * tileheight) ** 2) ** 0.5;
        entity.target.increment = 0.5 * (vx ** 2 + vy ** 2) ** 0.5;
        entity.vx = 0.5 * vx;
        entity.vy = 0.5 * vy;
      } while (isSolid(ctx, entity.target.x, entity.target.y));
    } else {
      entity.target.distance -= entity.target.increment;
    }
  }

  // www/src/context.js
  function createContext() {
    const view = {
      width: 10,
      height: 9,
      tilewidth: 16,
      tileheight: 16
    };
    const gameDiv = document.createElement("div");
    gameDiv.setAttribute("class", "game");
    const canvasSvg = createSVGElement("svg", {
      "class": "canvas",
      width: window.innerWidth,
      height: window.innerHeight
    });
    gameDiv.append(canvasSvg);
    const width = Math.min(window.innerWidth, window.innerHeight * view.width / view.height);
    const height = Math.min(window.innerHeight, window.innerWidth * view.height / view.width);
    const x = Math.max(0, (window.innerWidth - width) / 2);
    const y = Math.max(0, (window.innerHeight - height) / 2);
    const viewSvg = createSVGElement("svg", {
      "class": "view",
      x,
      y,
      width,
      height,
      viewBox: `0 0 ${view.tilewidth * view.width} ${view.tileheight * view.height}`
    });
    canvasSvg.append(viewSvg);
    const defs = createSVGElement("defs");
    viewSvg.append(defs);
    const background = createSVGElement("g", {
      "class": "background"
    });
    viewSvg.append(background);
    const tiles = [];
    const horizontalTilesCount = view.width + 1;
    const verticalTilesCount = view.height + 1;
    const tilesCount = horizontalTilesCount * verticalTilesCount;
    for (let i = 0; i < tilesCount; i++) {
      const width2 = view.tilewidth;
      const height2 = view.tileheight;
      const x2 = i % horizontalTilesCount * width2;
      const y2 = (i / horizontalTilesCount | 0) * height2;
      const href = "#tex0";
      const tile = createSVGElement("use", {
        x: x2,
        y: y2,
        width: width2,
        height: height2,
        href
      });
      tiles.push(tile);
      background.append(tile);
    }
    const spritesContainer = createSVGElement("g", {
      "class": "sprites"
    });
    viewSvg.append(spritesContainer);
    const sprites = [];
    for (let i = 0; i < 64; i++) {
      const display = i ? "none" : "";
      const sprite = createSVGElement("use", {
        x: 0,
        y: 0,
        width: view.tilewidth,
        height: view.tileheight,
        href: "#tex0"
      }, {
        display
      });
      sprites.push(sprite);
      spritesContainer.append(sprite);
    }
    const border = createSVGElement("rect", {
      width: 16 * 10,
      height: 16 * 9,
      stroke: "#000",
      fill: "none"
    });
    viewSvg.append(border);
    document.body.append(gameDiv);
    const ctx = {
      dom: {
        gameDiv,
        canvasSvg,
        viewSvg,
        defs,
        background,
        tiles,
        sprites
      },
      view,
      currentTime: 0,
      lastTime: 0,
      fixedTimeLeft: 0,
      fixedTimeStepDuration: 1e3 / 60,
      paused: false
    };
    initLoader(ctx);
    initEvents(ctx);
    initGamepad(ctx);
    initGameState(ctx);
    initStates(ctx);
    return ctx;
  }

  // www/src/movements.js
  function updateMovement(ctx, entity) {
    const { vx, vy } = entity;
    if (!feq(vx, 0) && !feq(vy, 0)) {
      updateMovementXY(ctx, entity);
    } else if (!feq(vx, 0)) {
      updateMovementX(ctx, entity);
    } else if (!feq(vy, 0)) {
      updateMovementY(ctx, entity);
    }
  }
  function updateMovementXY(ctx, entity) {
    const map = getMap(ctx);
    const { tileheight, tilewidth } = map;
    let { x, y, vx, vy, bbx, bby, bbw, bbh } = entity;
    if (!mapCollides(ctx, x + bbx + vx, y + bby + vy, bbw, bbh)) {
      return true;
    }
    const snapvxplus = tilewidth - (x + bbx) % tilewidth;
    const snapvxneg = -(x + bbx + bbw) % tilewidth;
    const snapvyplus = tileheight - (y + bby) % tileheight;
    const snapvyneg = -(y + bby + bbh) % tileheight;
    if (flt(0, snapvxplus) && flte(snapvxplus, vx) && !mapCollides(ctx, x + bbx + snapvxplus, y + bby + vy, bbw, bbh)) {
      entity.vx = snapvxplus;
      return true;
    } else if (fgte(vx, snapvxneg) && fgt(snapvxneg, 0) && !mapCollides(ctx, x + bbx + snapvxneg, y + bby + vy, bbw, bbh)) {
      entity.vx = snapvxneg;
      return true;
    } else if (flt(0, snapvyplus) && flte(snapvyplus, vy) && !mapCollides(ctx, x + bbx + vx, y + bby + snapvyplus, bbw, bbh)) {
      entity.vy = snapvyplus;
      return true;
    } else if (fgte(vy, snapvyneg) && fgt(snapvyneg, 0) && !mapCollides(ctx, x + bbx + vx, y + bby + snapvyneg, bbw, bbh)) {
      entity.vy = snapvyneg;
      return true;
    }
    const collidex = mapCollides(ctx, x + bbx + vx, y + bby, bbw, bbh);
    const collidey = mapCollides(ctx, x + bbx, y + bby + vy, bbw, bbh);
    if (collidex && collidey) {
      entity.vx = 0;
      entity.vy = 0;
      return true;
    } else if (collidex) {
      entity.vx = 0;
      return true;
    } else if (collidey) {
      entity.vy = 0;
      return true;
    }
  }
  function updateMovementX(ctx, entity) {
    let { x, y, vx, bbx, bby, bbw, bbh } = entity;
    if (!mapCollides(ctx, x + bbx + vx, y + bby, bbw, bbh)) {
      return;
    }
    let nudgeup = false;
    let nudgedown = false;
    if (vx > 0) {
      const collidetop = isSolid(ctx, x + bbx + bbw + vx - EPSILON, y + bby, bbw, bbh);
      const collidebottom = isSolid(ctx, x + bbx + bbw + vx - EPSILON, y + bby + bbh - EPSILON, bbw, bbh);
      nudgeup = !collidetop && collidebottom;
      nudgedown = collidetop && !collidebottom;
      if (nudgedown) {
        entity.vx = vx * SQRT_1_2;
        entity.vy = vx * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      } else if (nudgeup) {
        entity.vx = vx * SQRT_1_2;
        entity.vy = -vx * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      }
    } else {
      const collidetop = isSolid(ctx, x + bbx + vx, y + bby, bbw, bbh);
      const collidebottom = isSolid(ctx, x + bbx + vx, y + bby + bbh - EPSILON, bbw, bbh);
      nudgeup = !collidetop && collidebottom;
      nudgedown = collidetop && !collidebottom;
      if (nudgedown) {
        entity.vx = vx * SQRT_1_2;
        entity.vy = -vx * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      } else if (nudgeup) {
        entity.vx = vx * SQRT_1_2;
        entity.vy = vx * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      }
    }
    entity.vx = 0;
  }
  function updateMovementY(ctx, entity) {
    let { x, y, vy, bbx, bby, bbw, bbh } = entity;
    if (!mapCollides(ctx, x + bbx, y + bby + vy, bbw, bbh)) {
      return;
    }
    let nudgeleft = false;
    let nudgeright = false;
    if (vy > 0) {
      const collideleft = isSolid(ctx, x + bbx, y + bby + bbh + vy - EPSILON, bbw, bbh);
      const collideright = isSolid(ctx, x + bbx + bbw - EPSILON, y + bby + bbh + vy - EPSILON, bbw, bbh);
      nudgeleft = !collideleft && collideright;
      nudgeright = collideleft && !collideright;
      if (nudgeright) {
        entity.vy = vy * SQRT_1_2;
        entity.vx = vy * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      } else if (nudgeleft) {
        entity.vy = vy * SQRT_1_2;
        entity.vx = -vy * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      }
    } else {
      const collideleft = isSolid(ctx, x + bbx, y + bby + vy, bbw, bbh);
      const collideright = isSolid(ctx, x + bbx + bbw - EPSILON, y + bby + vy, bbw, bbh);
      nudgeleft = !collideleft && collideright;
      nudgeright = collideleft && !collideright;
      if (nudgeright) {
        entity.vy = vy * SQRT_1_2;
        entity.vx = -vy * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      } else if (nudgeleft) {
        entity.vy = vy * SQRT_1_2;
        entity.vx = vy * SQRT_1_2;
        return updateMovementXY(ctx, entity);
      }
    }
    entity.vy = 0;
  }
  function feq(x, y) {
    return Math.abs(x - y) < Number.EPSILON;
  }
  function flt(x, y) {
    return x < y && !feq(x, y);
  }
  function flte(x, y) {
    return x < y || feq(x, y);
  }
  function fgt(x, y) {
    return x > y && !feq(x, y);
  }
  function fgte(x, y) {
    return x > y || feq(x, y);
  }

  // www/src/render.js
  function render(ctx) {
    renderMap(ctx);
    renderSprites(ctx);
  }
  function renderMap(ctx, map) {
    map = map ?? getMap(ctx);
    const { dom, gameState, textures, view } = ctx;
    const { background, tiles } = dom;
    const layer = map.layers[gameState.map.layer];
    const mapData = layer.data;
    const tileset = map.tilesets[0].tiles;
    const viewx = -gameState.map.x % view.tilewidth;
    const viewy = -gameState.map.y % view.tileheight;
    const mapx = gameState.map.x / view.tilewidth | 0;
    const mapy = gameState.map.y / view.tileheight | 0;
    setAttributes(background, {
      transform: `translate(${viewx}, ${viewy})`
    });
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const x = mapx + i % (view.width + 1);
      const y = mapy + (i / (view.width + 1) | 0);
      if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
        setAttributes(tile, {
          href: getTextureId(ctx, "EMPTY")
        });
      } else {
        const index = y * map.width + x;
        let name = "EMPTY";
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
  }
  function renderSprites(ctx) {
    const { player, enemies, map } = ctx.gameState;
    const { sprites } = ctx.dom;
    const entities = [player, ...enemies];
    for (let i = 0; i < Math.min(sprites.length, entities.length); i++) {
      const entity = entities[i];
      const sprite = sprites[i];
      const { texture, x, y, px, py, scalex, scaley, visible } = entity;
      setAttributes(sprite, {
        href: getTextureId(ctx, texture),
        transform: `translate(${x - map.x - px},${y - map.y - py})`
      });
      Object.assign(sprite.style, {
        display: visible ? "" : "none"
      });
    }
  }
  function getTextureId(ctx, name) {
    if (ctx.textures[name]) {
      return "#" + ctx.textures[name].getAttribute("id");
    }
  }

  // www/game.js
  async function load() {
    const ctx = createContext();
    devEnv?.setContext(ctx);
    addEventListeners(ctx);
    devEnv?.addReloadListener((url) => reload(ctx, url));
    addEventListener(ctx, "resize", resize.bind(null, ctx));
    addEventListener(ctx, "blur", blur.bind(null, ctx));
    addEventListener(ctx, "focus", focus.bind(null, ctx));
    const urls = await (await fetch("manifest.json")).json();
    await loadResources(ctx, urls);
    (function updateFrame(currentTime) {
      update(ctx, currentTime);
      requestAnimationFrame(updateFrame);
    })();
  }
  function resize(ctx, event) {
    const { view, dom } = ctx;
    const { canvasSvg, viewSvg } = dom;
    const { innerWidth, innerHeight } = window;
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
  function blur(ctx) {
    ctx.paused = true;
  }
  function focus(ctx) {
    ctx.requestResume = true;
  }
  function update(ctx, currentTime = 0) {
    if (ctx.requestResume) {
      ctx.paused = false;
      ctx.lastTime = currentTime;
      ctx.requestResume = false;
    } else if (ctx.paused) {
      return;
    }
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
    const { gamepad, gameState, view } = ctx;
    const { player, enemies } = gameState;
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
  window.addEventListener("load", load);
})();
