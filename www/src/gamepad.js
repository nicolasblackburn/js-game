import {virtual} from '../client.js';
import {addEventListener, dispatchEvent} from './events.js';

const TOUCH_EVENT_TYPES = [
  'touchstart',
  'touchmove',
  'touchend',
  'axispress',
  'axischange',
  'axisrelease'
];

export function initGamepad(ctx) {
  ctx.gamepad = {
    axes: [0, 0],
    buttons: [{
      pressed: false
    }],
    axisDistanceMax: 32**2,
    touchstartDistanceThreshold: 49,
    tapTimeThreshold: 100
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
        region: [0, 0, 1, 1],
      }
    ]
  };
}

export function addGamepadEventListeners(ctx) {
  document.body.style.touchAction = 'none';

  addEventListener(ctx, 'pointerdown', event => touchPointerDown(ctx, event));
  addEventListener(ctx, 'pointermove', event => {
    touchPointerMove(ctx, event);
  });
  addEventListener(ctx, 'pointerup', event => touchPointerUp(ctx, event));
}

const touchPointerDown = virtual(function touchPointerDown(ctx, event) {
  const touch = createTouch(event);
  ctx.touch.touches.push(touch);
});

const touchPointerMove = virtual(function touchPointerMove(ctx, event) {
  const touch = findClosestTouch(ctx, event);
  touch.moveX = event.x - touch.startX;
  touch.moveY = event.y - touch.startY;
  touch.x = event.x;
  touch.y = event.y;

  let dist = touch.moveX ** 2 + touch.moveY ** 2;

  if (!touch.type) {
    const {touchstartDistanceThreshold} = ctx.gamepad;

    if (dist >= touchstartDistanceThreshold) {
      touch.type = 'move';
      dispatchEvent(ctx, 'touchstart', touch);

      ctx.gamepad.axes[0] = 0;
      ctx.gamepad.axes[1] = 0;

      dispatchEvent(ctx, 'axispress', {
        ...ctx.gamepad,
        touch
      });
    }
  }
  if (touch.type === 'move') {
    dispatchEvent(ctx, 'touchmove', touch);

    const {axisDistanceMax} = ctx.gamepad;
    //let scalar = 1 / axisDistanceMax;

    ctx.gamepad.axes[0] = touch.moveX;
    ctx.gamepad.axes[1] = touch.moveY;

    if (dist > axisDistanceMax) {
      // Cap moveX and MoveY so that it stays within
      // axes boundaries.
      const scalar = (axisDistanceMax / dist)**0.5;
      ctx.gamepad.axes[0] *= scalar;
      ctx.gamepad.axes[1] *= scalar;
    }

    const scalar = axisDistanceMax**0.5;
    ctx.gamepad.axes[0] /= scalar;
    ctx.gamepad.axes[1] /= scalar;

    dispatchEvent(ctx, 'axischange', {
      ...ctx.gamepad,
      touch
    });
  }
});

const touchPointerUp = virtual(function touchPointerUp(ctx, event) {
  const index = {value: undefined};
  const touch = findClosestTouch(ctx, event, index);
  ctx.touch.touches.splice(index.value, 1);
  if (touch.type === 'move') {
    dispatchEvent(ctx, 'touchend', touch);

    ctx.gamepad.axes[0] = 0;
    ctx.gamepad.axes[1] = 0;

    dispatchEvent(ctx, 'axischange', {
      ...ctx.gamepad,
      touch
    });
  }
});

function createTouch({x, y}) {
  const touchState = {
    x,
    y,
    moveX: 0,
    moveY: 0,
    startX: x,
    startY: y,
    type: undefined // 'move' or 'press'
  }
  return touchState;
}

function findClosestTouch(ctx, {x, y}, index = {value: null}) {
  let distance = Number.POSITIVE_INFINITY;
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
