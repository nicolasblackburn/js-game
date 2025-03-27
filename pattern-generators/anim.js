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
    bone: 'arm_r', attribute: 'rotate', 
    frames: [ 0,  1],
    values: [45, 33]
  },
  {
    bone: 'arm_l', attribute: 'rotate', 
    frames: [  0,   1],
    values: [-45, -33]
  },
  {
    bone: 'leg_r', attribute: 'scaley', 
    frames: [0.00, 1.00],
    values: [0.75, 1.00]
  },
  {
    bone: 'leg_l', attribute: 'scaley', 
    frames: [0.00, 1.00],
    values: [1.00, 0.75]
  },
];

const {root, nodes} = createhierarchy(bonesdata);

(async () => {
  for (const {id} of bonesdata) {
    const svg = await (await fs.readFile(path.join(images, id + '.svg'))).toString();
    const [match, innerHTML] = svg.match(/^<[^>]+?>(.*)<\/[^>]+?>$/ms) ?? [];
    defs[id] = innerHTML.trim();
  }

  console.log(render(0));

  for (let t = 0; t < 2; t++) {
  }

})();

function createbone(attrs = {}) {
  return {
    id: 'root', 
    x: 0, 
    y: 0, 
    r: 0,
    sx: 1, 
    sy: 1, 
    children: [],
    transform: [1, 0, 0, 0, 1, 0],
    wx: 0,
    wy: 0,
    wr: 0,
    wsx: 1,
    wsy: 1,
    wtransform: [1, 0, 0, 0, 1, 0],
    ...attrs
  };
}

function createhierarchy(bonesdata) {
  const root = createbone();
  const map = {[root.id]: root};

  const nodes = bonesdata.map(data => {
    const bone = createbone(data);
    map[bone.id] = bone;
    return bone;
  });

  for (const bone of Object.values(nodes)) {
    if (bone.parent) {
      const parent = map[bone.parent];
      //bone.parent = parent;
      parent.children.push(bone);
    } else if (bone !== root) {
      //bone.parent = root;
      root.children.push(bone);
    }
  }

  updatetransform(root);

  return {root, nodes};
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
    node.wx = node.x;
    node.wy = node.y;
    node.wr = node.r;
    node.wsx = node.sx;
    node.wsy = node.sy;
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

    node.wx = c;
    node.wy = d;
    node.wsx = Math.sqrt(a**2 + e**2);
    node.wsy = Math.sqrt(b**2 + d**2);
    node.wr = Math.atan2(d, e) * 180 / Math.PI;
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
  for (const node of nodes.reverse()) {
    const [a, c, e, b, d, f] = node.wtransform;
    svg += `<use href="#${node.id}" transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})" />`;
  }
  return svg;
}
