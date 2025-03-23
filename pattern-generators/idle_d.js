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
  images: '.',
  prefix: 'idle_d',
  output: '.',
  ...argv
};

height ??= width;

const defs = {};

const openAngle = 66;
const legHeight = 4;

const keyFrames = [
  /*
  {
    y: 0,
    angle: 0,
    scalearm: 1,
    rotatearm: 11.25,
    scaleleg: 1,
    scalex: 1
  },
  */
  {
    y: legHeight * (1 - Math.cos(openAngle / 2 / 360 * 2 * Math.PI)),
    angle: openAngle / 2,
    scalearm: 0.75,
    rotatearm: 22.5,
    scaleleg: 0.75,
    scalex: 1
  },
  {
    y: legHeight * (1 - Math.cos(openAngle / 2 / 360 * 2 * Math.PI)),
    angle: openAngle / 2,
    scalearm: 0.75,
    rotatearm: 22.5,
    scaleleg: 0.75,
    scalex: -1
  }
];

function frame(t) {
  const {y, scalearm, rotatearm, scaleleg, scalex} = keyFrames[t];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    ${Object.entries(defs).map(([id, svg]) => `
    <g id="${id}">
      ${svg}
    </g>
    `).join('')}
  </defs>
  <g transform="translate(8, 4.5) scale(${scalex}, 1)">
    <g transform="translate(-2.5, 7.5)">
      <use href="#leg_l" />
    </g>
    <g transform="translate(2.5, 7.5) scale(1, ${scaleleg})">
      <use href="#leg_r" />
    </g>
    <g transform="translate(0, 5)">
      <use href="#body" />
    </g>
    <g transform="translate(-3.5, 3.5) rotate(${rotatearm}) scale(1, ${scalearm})">
      <use href="#arm_l" />
    </g>
    <g transform="translate(3.5, 3.5) rotate(-11.25)">
      <use href="#arm_r" />
    </g>
    <g>
      <use href="#head"/>
    </g>
  </g>
</svg>
`;
}

(async () => {
  const parts = [
    'head',
    'body',
    'arm_r',
    'arm_l',
    'leg_r',
    'leg_l'
  ];

  for (const part of parts) {
    const svg = await (await fs.readFile(path.join(images, part + '.svg'))).toString();
    const [match, innerHTML] = svg.match(/^<[^>]+?>(.*)<\/[^>]+?>$/ms) ?? [];
    defs[part] = innerHTML;
  }

  for (let i = 0; i < 2; i++) {
    const filename = path.join(output, `${prefix}_${i}.svg`);
    await fs.writeFile(filename, frame(i));
  }
})();
