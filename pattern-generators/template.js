#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

let {
  fill,
  stroke,
  strokeWidth,
  width,
  height
} = {
  fill: '#000',
  stroke: 'none',
  strokeWidth: 0.125,
  width: 16,
  ...argv
};

height ??= width;

console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
  </defs>
</svg>
`);
