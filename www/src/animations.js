export function updateAnimation(ctx, node) {
  const deltaTime = ctx.deltaTime;
  
  for (const animation of node.animations ?? []) {
    if (!animation || animation.paused) {
      continue;
    }
    animation.time += deltaTime;
    const data = getAnimationData(ctx, animation.name);
    if (data) {
      const duration = getAnimationDuration(data);
      animation.time = animation.time % duration;
      applyAnimation(node, data, animation.time);
    }
  }
}

function getAnimationDuration(animation) {
  const duration = Math.max(...animation.timelines.map(({frames}) => frames[frames.length - 1]));
  //if (animation.name === 'weapon_cut_r') {
  //  console.log('duration:', duration);
  //}
  return duration;
}

export function setAnimation(ctx, target, name, track = 0) {
  target.animations = target.animations ?? [];
  if (target.animations[track]?.name !== name) {
    target.animations[track] = {
      name,
      time: 0,
      paused: false,
      loop: true
    };
  }
  if (name === 'weapon_cut_r') {
    //console.log(target);
  }
}

export function clearAnimation(ctx, target, track = 0) {
  target.animations?.splice(track, 1);
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

  for (const {property, frames, values, discrete = false} of timelines) {

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
    
    let targ = target;
    let prop = property[0];
    for (let i = 0; i < property.length - 1; i++) {
      targ = targ[prop];
      prop = property[i + 1];
    }

    if (!discrete && typeof values[prevframe] === 'number') {
      targ[prop] = a * values[prevframe] + b * values[frame];
    } else {
      targ[prop] = values[prevframe];
    }
  }
}


