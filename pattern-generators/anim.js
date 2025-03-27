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
  prefix: 'walk_r',
  output: '.',
  ...argv
};

height ??= width;

const defs = {};

const openAngle = 66;
const legHeight = 4;

const bones = [
  {id: 'head'},
  {id: 'torso'},
  {id: 'arm_r', parent: 'torso'},
  {id: 'arm_l', parent: 'torso'},
  {id: 'leg_r', parent: 'torso'},
  {id: 'leg_l', parent: 'torso'}
];

function createbone(attrs = {}) {
  return {
    id: 'root', 
    x: 0, 
    y: 0, 
    scalex: 0, 
    scaley: 0, 
    rotate: 0,
    children: [], 
    ...attrs
  };
}

function skeletonstate(bones, parent = createbone()) {
  return parent;
}

console.log(JSON.stringify(skeletonstate(bones)));
