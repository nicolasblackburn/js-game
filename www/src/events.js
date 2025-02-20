import {virtual} from '../client.js';

const EVENTS = [
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
	ctx.listeners = EVENTS.reduce(
    (rest, event) => ({...rest, [event]: []}), 
    {}
  );
}

export function addEventListeners(game, ctx) {
  EVENTS.forEach(name => 
    window.addEventListener(name, event => {
      ctx.listeners[name].forEach(listener => listener(event, game, ctx));
    }));
}

export function addEventListener(ctx, event, listener) {

  const listeners = ctx.listeners[event];
  if (!listeners.includes(listener)) {
    listeners.push(listener);
  }
}

export function removeEventListener(ctx, event, listener) {
  const listeners = ctx.listeners[event];
  const index = listeners.indexOf(listener);
  if (index > -1) {
    listeners.splice(index, 1);
  }
}
