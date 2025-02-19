import {virtual} from '../client.js';

export const initEvents = virtual(function initEvents(ctx) {
	ctx.listeners = {
    pointerCancel: [],
    pointerDown: [],
    pointerEnter: [],
    pointerLeave: [],
    pointerMove: [],
    pointerOut: [],
    pointerOver: [],
    pointerUp: [],
    resize: [],
    visibilityChange: []
	};
});

export const addEventListeners = virtual(function addEventListeners(game, ctx) {
	window.addEventListener('pointercancel', event => pointerCancel(event, game, ctx));
	window.addEventListener('pointerdown', event => pointerDown(event, game, ctx));
	window.addEventListener('pointerenter', event => pointerEnter(event, game, ctx));
	window.addEventListener('pointerleave', event => pointerLeave(event, game, ctx));
	window.addEventListener('pointermove', event => pointerMove(event, game, ctx));
	window.addEventListener('pointerout', event => pointerOut(event, game, ctx));
	window.addEventListener('pointerover', event => pointerOver(event, game, ctx));
	window.addEventListener('pointerup', event => pointerUp(event, game, ctx));
	window.addEventListener('resize', event => resize(event, game, ctx));
	window.addEventListener('visibilitychange', event => visibilityChange(event, game, ctx));
	
});

const pointerCancel = virtual(function pointerCancel(event, game, ctx) {
  for (const listener of ctx.listeners.pointerCancel) {
    listener(event, game, ctx);
  }
});

const pointerDown = virtual(function pointerDown(event, game, ctx) {
  for (const listener of ctx.listeners.pointerDown) {
    listener(event, game, ctx);
  }
});

const pointerEnter = virtual(function pointerEnter(event, game, ctx) {
  for (const listener of ctx.listeners.pointerEnter) {
    listener(event, game, ctx);
  }
});

const pointerLeave = virtual(function pointerLeave(event, game, ctx) {
  for (const listener of ctx.listeners.pointerLeave) {
    listener(event, game, ctx);
  }
});

const pointerMove = virtual(function pointerMove(event, game, ctx) {
  for (const listener of ctx.listeners.pointerMove) {
    listener(event, game, ctx);
  }
});

const pointerOut = virtual(function pointerOut(event, game, ctx) {
  for (const listener of ctx.listeners.pointerOut) {
    listener(event, game, ctx);
  }
});

const pointerOver = virtual(function pointerOver(event, game, ctx) {
  for (const listener of ctx.listeners.pointerOver) {
    listener(event, game, ctx);
  }
});

const pointerUp = virtual(function pointerUp(event, game, ctx) {
  for (const listener of ctx.listeners.pointerUp) {
    listener(event, game, ctx);
  }
});

const resize = virtual(function resize(event, game, ctx) {
  for (const listener of ctx.listeners.pointerResize) {
    listener(event, game, ctx);
  }
});

const visibilityChange = virtual(function visibilityChange(event, game, ctx) {
  for (const listener of ctx.listeners.visibilityChange) {
    listener(event, game, ctx);
  }
});


