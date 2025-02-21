import {virtual} from '../client.js';
import {addEventListener} from './events.js';

export function initTouch(ctx) {
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
        tapTimeThreshold: 100,
        region: [0, 0, 1, 1],
      }
    ]
  };

}

export function addTouchEventListeners(game, ctx) {
  addEventListener(game, ctx, 'pointerdown', event => touchPointerDown(game, ctx, event));
  addEventListener(game, ctx, 'pointermove', event => touchPointerMove(game, ctx, event));
  addEventListener(game, ctx, 'pointerup', event => touchPointerUp(game, ctx, event));
}

const touchPointerDown = virtual(function touchPointerDown(game, ctx, event) {
  const touch = createState(event);
  ctx.touch.touches.push(touch);
  const listeners = ctx.listeners.touchstart;
  for (const listener of listeners) {
    listener(touch);
  }
});

const touchPointerMove = virtual(function touchPointerMove(game, ctx, event) {
  const touch = findClosest(ctx, event);
  touch.moveX = event.x - touch.startX;
  touch.moveY = event.y - touch.startY;
  touch.x = event.x;
  touch.y = event.y;
  const listeners = ctx.listeners.touchmove;
  for (const listener of listeners) {
    listener(touch);
  }
});

const touchPointerUp = virtual(function touchPointerUp(game, ctx, event) {
  const index = {value: undefined};
  const touch = findClosest(ctx, event, index);
  ctx.touch.touches.splice(index.value, 1);
  const listeners = ctx.listeners.touchend;
  for (const listener of listeners) {
    listener(touch);
  }
});

function createTouchState({x, y}) {
  const touchState = {
    x,
    y,
    moveX: 0,
    moveY: 0,
    startX: x,
    startY: x,
  }
  return touchState;
}

function findClosest(ctx, {x, y}, index) {
  let distance = Number.POSITIVE_INFINITT;
  let closest;
  let i = 0;
  for (const touch of ctx.touch.touches) {
    const dist = (touch.x - x)**2 + (touch.y - y)**2;
    if (dist < distance) {
      distance = dist;
      closest = touch;
      index.value = i;
    }
    i++;
  }
  return closest;
}
