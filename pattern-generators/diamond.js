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
  offsetY
} = {
  fill: '#000',
  stroke: 'none',
  strokeWidth: 0.125,
  width: 2,
  scaleX: 1,
  rotate: 0,
  offsetX: 0,
  ...argv
};

height ??= width;
scaleY ??= scaleX;
offsetY ??= offsetX;

console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <defs>
    <pattern id="p" width="${2 * width}" height="${2 * height}" patternUnits="userSpaceOnUse" patternTransform="translate(${width / 2 + offsetX} ${height / 2 + offsetY}) rotate(${rotate}) scale(${scaleX} ${scaleY}) translate(${-width / 2} ${-height / 2})">
      <rect width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" x="${width}" y="${-height}" stroke-width="${strokeWidth}"/>
      <rect width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <rect width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" x="${2 * width}" stroke-width="${strokeWidth}"/>
      <rect width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" x="-${width}" y="${height}" stroke-width="${strokeWidth}"/>
      <rect width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" x="${width}" y="${height}" stroke-width="${strokeWidth}"/>
      <rect width="${width}" height="${height}" y="${2 * height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      <rect width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" x="${2 * width}" y="${2 * height}" stroke-width="${strokeWidth}"/>
    </pattern>
  </defs>
  <rect fill="url(#p)" width="100%" height="100%"/>
</svg>
`);
