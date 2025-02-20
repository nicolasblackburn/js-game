import {virtual} from '../client.js';
import {addEventListener} from './events.js';

export const initTouch = virtual(function initTouch(ctx) {
  ctx.touch = {
    distanceThresholdSquared: 49,
    regions: [
      {
        active: true,
        delayTouchStart: true,
        tapTimeThreshold: 100,
        region: [0, 0, 1, 1],
        touches: []
      }
    ]
  };

  addEventListener(ctx, 'pointerdown', touchPointerDown);
  addEventListener(ctx, 'pointermove', touchPointerMove);
  addEventListener(ctx, 'pointerup', touchPointerUp);

});

const touchPointerDown = virtual(function touchPointerDown(ctx) {
});

const touchPointerMove = virtual(function touchPointerMove(ctx) {
});

const touchPointerUp = virtual(function touchPointerUp(ctx) {
});

function createTouchState() {
  const touchState = {
    id: 0,
    x: 0,
    y: 0,
    moveX: 0,
    moveY: 0,
    startX: 0,
    startY: 0,
    pressed: false,
    started: false,
    startTime: new Date().getTime()
  }
  return touchState;
}
