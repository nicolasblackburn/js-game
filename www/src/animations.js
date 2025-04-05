export function updateAnimations(ctx) {
  const {gameState} = ctx;
  const {player, enemies} = gameState;

  // Calculate deltaTime
  const deltaTime = 1000 / 60;

  const entities = [gameState, player, ...enemies];

  for (const entity of entities) {
    const animations = entity.animations ?? [];
    for (const state of animations) {
      if (state.paused) {
        continue;
      }
      state.time += deltaTime;
      const animation = getAnimationData(ctx, state.name);
      if (animation) {
        if (animation.loop) {
          state.time = state.time % animation.duration;
        } 
        applyAnimation(entity, animation, state.time);
      }
    }
  }

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
  const {duration, frames, properties} = animation;

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

  for (let {path, values} of properties) {
    let node = target;
    while (path.length > 1) {
      node = node[path.unshift()] ?? {};
    }

    if (typeof values[prevframe] === 'number') {
      target[path[0]] = a * values[prevframe] + b * values[frame];
    } else {
      target[path[0]] = values[prevframe];
    }
  }
}


