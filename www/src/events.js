import {virtual} from '../client.js';
import {addGamepadEventListeners} from './gamepad.js';

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

export function addEventListeners(ctx) {
  EVENT_TYPES.forEach(type => 
    window.addEventListener(type, event => 
      dispatchEvent(ctx, type, event)));

  addGamepadEventListeners(ctx);
}

export function dispatchEvent(ctx, type, ...args) {
  ctx.listeners[type]?.forEach(listener => {
    listener(...args);
  });
}


export function addEventListener(ctx, type, listener) {

  let listeners = ctx.listeners[type];
  if (!listeners) {
    listeners = [];
    ctx.listeners[type] = listeners
  }

  if (!listeners.includes(listener)) {
    listeners.push(listener);
  }
}

export function removeEventListener(ctx, type, listener) {
  const listeners = ctx.listeners[type] ?? [];
  const index = listeners.indexOf(listener);
  if (index > -1) {
    listeners.splice(index, 1);
  }
}
