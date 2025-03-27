#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

let {
  fill,
  stroke,
  strokeWidth,
  width,
  height,
  images,
  output,
  prefix
} = {
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 0.125,
  width: 16,
  images: 'images',
  prefix: 'frame',
  output: '.',
  ...argv
};

height ??= width;

const defs = {};

const bonesdata = [
  {id: 'head', y: -4},
  {id: 'torso', y: 2.5},
  {id: 'arm_r', parent: 'torso', x: -3, y: -2.5, r: 33},
  {id: 'arm_l', parent: 'torso', x: 3, y: -2.5, r: -33},
  {id: 'leg_r', parent: 'torso', x: -2, y: 2.5},
  {id: 'leg_l', parent: 'torso', x: 2, y: 2.5}
];

const timelines = [
  {
    bone: 'arm_r', attribute: 'r', 
    frames: [ 0,  1,  2],
    values: [45, 33, 45]
  },
  {
    bone: 'arm_l', attribute: 'r', 
    frames: [  0,   1,   2],
    values: [-45, -33, -45]
  },
  {
    bone: 'leg_r', attribute: 'sy', 
    frames: [   0,    1,    2],
    values: [0.75, 1.00, 0.75]
  },
  {
    bone: 'leg_l', attribute: 'sy', 
    frames: [   0,    1,    2],
    values: [1.00, 0.75, 1.00]
  },
];

const {root, nodes} = createhierarchy(bonesdata);

(async () => {
  for (const {id} of bonesdata) {
    const svg = await (await fs.readFile(path.join(images, id + '.svg'))).toString();
    const [match, innerHTML] = svg.match(/^<[^>]+?>(.*)<\/[^>]+?>$/ms) ?? [];
    defs[id] = innerHTML.trim();
  }

  for (let i = 0; i < 2; i++) {
    for (const timeline of timelines) {
      applytimeline(timeline, i);
      const filename = path.join(output, `${prefix}_${i}.svg`);
      await fs.writeFile(filename, render(i));
    }
  }

})();

function createbone(attrs = {}) {
  return {
    id: 'root', 
    index: 0,
    x: 0, 
    y: 0, 
    r: 0,
    sx: 1, 
    sy: 1, 
    children: [],
    transform: [1, 0, 0, 0, 1, 0],
    wtransform: [1, 0, 0, 0, 1, 0],
    ...attrs
  };
}

function createhierarchy(bonesdata) {
  const root = createbone();
  const map = {[root.id]: root};

  const nodes = bonesdata.map((data, index) => {
    const bone = createbone({...data, index});
    map[bone.id] = bone;
    return bone;
  });

  for (const bone of Object.values(nodes)) {
    if (bone.parent) {
      const parent = map[bone.parent];
      parent.children.push(bone);
    } else if (bone !== root) {
      root.children.push(bone);
    }
  }

  updatetransform(root);

  return {root, nodes, map};
}

function updatetransform(node, parent) {
  const theta = node.r * Math.PI / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const a = node.sx * cos;
  const b = -node.sx * sin;
  const c = node.x;
  const d = node.sy * sin;
  const e = node.sy * cos;
  const f = node.y;
  node.transform = [a, b, c, d, e, f];

  if (!parent) {
    node.wtransform = [a, b, c, d, e, f];
  } else {
    const [
      wa, wb, wc, 
      wd, we, wf
    ] = parent.wtransform;

    const [
      ta, tb, tc, 
      td, te, tf
    ] = node.transform;

    node.wtransform = [
      wa * ta + wd * td,
      wa * tb + wb * te,
      wa * tc + wb * tf + wc,
      wd * ta + we * td,
      wd * tb + we * te,
      wd * tc + we * tf + wf
    ];

    const [a, b, c, d, e, f] = node.wtransform;
  }

  for (const child of node.children) {
    updatetransform(child, node);
  }
}

function render(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-width / 2} ${-height / 2} ${width} ${height}">
  <defs>
    ${Object.entries(defs).map(([id, svg]) => 
      `<g id="${id}">${svg}</g>`
    ).join('')}
  </defs>
  ${rendernodes(t)}
</svg>
`;
}

function rendernodes(t) {
  let svg = '';
  for (const node of nodes.sort((a, b) => b.index - a.index)) {
    const [a, c, e, b, d, f] = node.wtransform;
    svg += `<use href="#${node.id}" transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})" />`;
  }
  return svg;
}

function applytimeline(timeline, time) {
  const {bone, attribute, frames, values} = timeline;

  const duration = frames[frames.lentgh - 1] - frames[0];

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

  const node = nodes.find(node => node.id === bone);

  if (typeof values[prevframe] === 'number') {
    node[attribute] = a * values[prevframe] + b * values[frame];
  } else {
    node[attribute] = values[prevframe];
  }

  const parent = nodes.find(item => item.id === node.parent)
  updatetransform(node, parent);
}


