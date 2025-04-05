#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const [source] = argv._;

let {
  fill,
  stroke,
  strokeWidth,
  width,
  height,
  images,
  output,
} = {
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 0.125,
  width: 16,
  output: '.',
  ...argv
};

images = images ?? path.join(path.dirname(source), 'images');
height ??= width;

const defs = {};

(async () => {
  const scenedata = JSON.parse(await fs.readFile(source)));

  const {root, nodes} = createhierarchy(scenedata.nodes);
  updatetransform(root);

  console.log(JSON.stringify());

  for (const name of scenedata.attachments) {
    const svg = await (await fs.readFile(path.join(images, name + '.svg'))).toString();
    const [match, innerHTML] = svg.match(/^<[^>]+?>(.*)<\/[^>]+?>$/ms) ?? [];
    defs[name] = innerHTML.trim();
  }

  for (const animation of scenedata.animations) {
    for (let i = 0; i < animation.timelines[0].frames.length - 1; i++) {
      for (const timeline of animation.timelines) {
        applytimeline(timeline, i);
        const filename = path.join(output, `${animation.name}_${i}.svg`);
        await fs.writeFile(filename, render(i));
      }
    }
  }

  function createhierarchy(nodesdata) {
    const root = createnode();
    const map = {};

    const nodes = nodesdata
      .map((data, index) => {
        const order = scenedata.draworder.indexOf(data.id);
        const node = createnode({
          ...data, 
          index: order >= 0 ? order : index
        });
        map[node.name] = node;
        return node;
      });

    for (const node of Object.values(nodes)) {
      if (node.parent) {
        const parent = map[node.parent];
        parent.children.push(node);
      } else {
        root.children.push(node);
      }
    }

    return {root, nodes, map};
  }

  function createnode(attrs = {}) {
    return {
      index: -1,
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

  function updatetransform(node) {
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

    parent = nodes.find(item => item.name === node.parent);
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
      updatetransform(child);
    }
  }

  function applytimeline(timeline, time) {
    const {node: nodename, property, frames, values} = timeline;

    const duration = frames[frames.lentgh - 1];

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

    const node = nodes.find(node => node.name === nodename);

    if (typeof values[prevframe] === 'number') {
      node[property] = a * values[prevframe] + b * values[frame];
    } else {
      node[property] = values[prevframe];
    }

    const parent = nodes.find(item => item.name === node.parent) ?? root;
    updatetransform(node, parent);
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
      svg += `<use href="#${node.attachment}" transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})" />`;
    }
    return svg;
  }

})();

