import {virtual} from '../client.js';
import {addTouchEventListeners} from './touch.js';

const EVENT_TYPES = [
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'resize',
  'visibilitychange'
]

export function initEvents(ctx) {
	ctx.listeners = EVENT_TYPES.reduce(
    (rest, type) => ({...rest, [type]: []}), 
    {}
  );
}

export function addEventListeners(game, ctx) {
  EVENT_TYPES.forEach(type => 
    window.addEventListener(type, event => 
      dispatchEvent(game, ctx, type, event)));

  addTouchEventListeners(game, ctx);
}

export function dispatchEvent(game, ctx, type, ...args) {
  ctx.listeners[type]?.forEach(listener => {
    listener(...args);
  });
}


export function addEventListener(game, ctx, type, listener) {

  let listeners = ctx.listeners[type];
  if (!listeners) {
    listeners = [];
    ctx.listeners[type] = listeners
  }

  if (!listeners.includes(listener)) {
    listeners.push(listener);
  }
}

export function removeEventListener(game, ctx, type, listener) {
  const listeners = ctx.listeners[type] ?? [];
  const index = listeners.indexOf(listener);
  if (index > -1) {
    listeners.splice(index, 1);
  }
}
