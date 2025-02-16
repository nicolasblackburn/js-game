#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

let {
  fill,
  stroke,
  strokeWidth,
  width,
  height,
  scaleX,
  scaleY,
  rotate,
  offsetX,
  offsetY,
  patternWidth,
  patternHeight
} = {
  fill: '#000',
  stroke: 'none',
  strokeWidth: 0.125,
  width: 16,
  scaleX: 1,
  rotate: 0,
  offsetX: 0,
  ...argv
};

height ??= width;
scaleY ??= scaleX;
offsetY ??= offsetX;
patternWidth ??= width;
patternHeight ??= patternWidth;

console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${patternWidth} ${patternHeight}">
  <defs>
    <symbol id="s" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g transform="translate(${strokeWidth / 2} ${strokeWidth / 2})">
      <rect width="${width - strokeWidth}" height="${height - strokeWidth}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <line x2="${width}" y2="${height}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <line y1="${height - strokeWidth}" x2="${width}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      </g>
    </symbol> 
    <pattern id="p" width="${patternWidth}" height="${patternHeight}" patternUnits="userSpaceOnUse">
      <use href="#s" />
      <use href="#s" x="${patternWidth}" />
      <use href="#s" y="${patternHeight}" />
      <use href="#s" x="${patternWidth}" y="${patternHeight}" />
    </pattern>
  </defs>
  <rect fill="url(#p)" width="100%" height="100%"/>
</svg>
`);
