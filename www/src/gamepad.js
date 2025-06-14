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
    touchstartMinDistance: 49,
    tapTimeDelay: 100,
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
        region: [0, 0, 1, 1],
      }
    ],
    delayedEvents: []
  };
}

export function processDelayedEvents(ctx) {
  while (ctx.touch.delayedEvents.length) {
    const emit = ctx.touch.delayedEvents.shift();
    emit();
  }
}

export function addGamepadEventListeners(ctx) {
  document.body.style.touchAction = 'none';

  addEventListener(ctx, 'pointerdown', event => touchPointerDown(ctx, event));
  addEventListener(ctx, 'pointermove', event => {
    touchPointerMove(ctx, event);
  });
  addEventListener(ctx, 'pointerup', event => touchPointerUp(ctx, event));
}

function touchPointerDown(ctx, event) {
  const touch = createTouch(event);
  ctx.touch.touches.push(touch);
  touch.timeoutid = setTimeout(() => {
    if (!touch.type) {
      touch.type = 'press';
    
      ctx.gamepad.buttons[0].pressed = true;

      dispatchEvent(ctx, 'buttondown', {
        ...ctx.gamepad,
        touch
      });

    }
  }, ctx.gamepad.tapTimeDelay);
}

function touchPointerMove(ctx, event) {
  const touch = findClosestTouch(ctx, event);
  touch.moveX = event.x - touch.startX;
  touch.moveY = event.y - touch.startY;
  touch.x = event.x;
  touch.y = event.y;

  let dist = touch.moveX ** 2 + touch.moveY ** 2;

  if (!touch.type) {
    const {touchstartMinDistance} = ctx.gamepad;

    if (dist >= touchstartMinDistance) {
      clearTimeout(touch.timeoutid);
      touch.type = 'move';
      dispatchEvent(ctx, 'touchstart', touch);

      ctx.gamepad.axes[0] = 0;
      ctx.gamepad.axes[1] = 0;

      dispatchEvent(ctx, 'axispressed', {
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

    if (ctx.gamepad.clampAxes) {
      let angle = Math.atan2(
        ctx.gamepad.axes[1],
        ctx.gamepad.axes[0]
      );
      angle = Math.round(angle * 4 / Math.PI) / 4 * Math.PI;
      const mag = (ctx.gamepad.axes[0]**2 + ctx.gamepad.axes[1]**2)**0.5;

      ctx.gamepad.axes[0] = mag * Math.cos(angle);
      ctx.gamepad.axes[1] = mag * Math.sin(angle);
    }

    dispatchEvent(ctx, 'axischange', {
      ...ctx.gamepad,
      touch
    });
  }
}

function touchPointerUp(ctx, event) {
  const index = {value: undefined};
  const touch = findClosestTouch(ctx, event, index);
  if (!touch) {
    ctx.gamepad.axes[0] = 0;
    ctx.gamepad.axes[1] = 0;
    ctx.gamepad.buttons[0].pressed = false;

    return;
  }
      
  clearTimeout(touch.timeoutid);

  ctx.touch.touches.splice(index.value, 1);
  if (touch.type === 'move') {
    dispatchEvent(ctx, 'touchend', touch);

    ctx.gamepad.axes[0] = 0;
    ctx.gamepad.axes[1] = 0;

    dispatchEvent(ctx, 'axischange', {
      ...ctx.gamepad,
      touch
    });

    dispatchEvent(ctx, 'axisreleased', {
      ...ctx.gamepad,
      touch
    });

  } else if (touch.type === 'press') {
    ctx.gamepad.buttons[0].pressed = false;

    dispatchEvent(ctx, 'buttonup', {
      ...ctx.gamepad,
      touch
    });

  } else {
    ctx.gamepad.buttons[0].pressed = true;

    dispatchEvent(ctx, 'buttondown', {
      ...ctx.gamepad,
      touch
    });

    ctx.touch.delayedEvents.push(() => {
      ctx.gamepad.buttons[0].pressed = false;

      dispatchEvent(ctx, 'buttonup', {
        ...ctx.gamepad,
        touch
      });
    });

  }
}

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
