import {virtual} from '../client.js';

export function initAnimations(ctx) {
  ctx.animationsQueue = [];
}

export function playAnimation(ctx, target, name) {
  ctx.animationsQueue.push({target, name});
}
