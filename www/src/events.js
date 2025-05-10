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
  'visibilitychange',
  'blur',
  'focus'
]

export function initEvents(ctx) {
	ctx.listeners = EVENT_TYPES.reduce(
    (rest, type) => ({...rest, [type]: []}), 
    {}
  );
  ctx.events = {};
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
  ctx.events[type] = args[0];
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

export function waitForEvent(target, type, predicate = () => true) {
  return new Promise(resolve => {
    function listener(event) {
      if (predicate(event)) {
        if (target.removeEventListener) {
          target.removeEventListener(type, listener);
        } else {
          removeEventListener(target, type, listener);
        }
        resolve();
      }
    }
    if (target.addEventListener) {
      target.addEventListener(type, listener);
    } else {
      addEventListener(target, type, listener);
    }
  });
}
