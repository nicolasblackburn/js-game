export function updateAnimations(ctx) {
  const {gameState} = ctx;
  const {player, enemies} = gameState;

  // Calculate deltaTime
  const deltaTime = 1000 / 60;

  const entities = [gameState, player, ...enemies];

  for (const entity of entities) {
    const animations = entity.animations ?? [];
    for (const state of animations) {
      if (!state || state.paused) {
        continue;
      }
      state.time += deltaTime;
      const animation = getAnimationData(ctx, state.name);
      if (animation) {
        const duration = getAnimationDuration(animation);
        state.time = state.time % duration;
        applyAnimation(entity, animation, state.time);
      }
    }
  }

}

function getAnimationDuration(animation) {
  const duration = Math.max(animation.timelines.map(({frames}) => frames[frames.length - 1]));
  return duration;
}

export function setAnimation(ctx, target, name, track = 0) {
  if (target.animations[track]?.name !== name) {
    target.animations[track] = {
      name,
      time: 0,
      paused: false,
      loop: true
    };
  }
}

export function clearAnimation(ctx, target, track = 0) {
  delete target.animations[track];
}

export function gotoAndPlay(ctx, target, time, name, track = 0) {
  setAnimation(ctx, target, name, track);
  target.animations[track].time = time;
  target.animations[track].paused = false;
}

function getAnimationData(ctx, name) {
  return ctx.animations[name];
}

function applyAnimation(target, animation, time) {
  const {timelines} = animation;

  const duration = getAnimationDuration(animation);

  for (const {property, frames, values} of timelines) {

    let prevframe = 0;
    let frame = 0;

    if (time >= duration) {
      frame = frames.length - 1;
      prevframe = frame;
    } else {

      // Find frame before and after. Some 
      // optimizations like searching from the last
      // frame index or using binary search could 
      // be more efficient but is it really needed?
      while (frames[frame] < time) {
        frame++;
        prevframe = frame - 1;
      }
    }

    // These will be used for interpolation.
    const t = time - frames[prevframe];
    const d = (frames[frame] - frames[prevframe]) || 1;
    const a = (d - t) / d;
    const b = t / d;

    if (typeof values[prevframe] === 'number') {
      target[property] = a * values[prevframe] + b * values[frame];
    } else {
      target[property] = values[prevframe];
    }
  }
}


