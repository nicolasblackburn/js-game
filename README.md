# JS Game

## Introduction

About 2 years ago, I had been using Termux on my Android phone for some time and I found myself using it more and for small programming experiments and other tasks to the detriment of my laptop. It came to a point were eventually I would barely open my laptop for weeks. I started to ask myself what are the limits. Could I create a game 100% using my phone?

There were obvious drawbacks to developing on a phone. The absence of a developer console is a major inconvrnient and rather painful one. The context switching between Termux and the browser is also tedious as there are various steps involved in saving changes in vim and reloading the browser. Webpack is a well known bundler that handles automatic browser reloading but I was becoming rather dissatisfied with its ecosystem and complex dependencies. All my projects built with Webpack have a tendency to rot and stop building if I don't maintain them on a consistent basis.

So I wrote down what a minimal good development experience would look like on a phone. First of all you would need a good way to catch and display execution errors. 

Second, the feedback loop needs to be almost seamless and requires better than just automatic browser reload. It requires hot code reload. That way updating an asset automatically changes its representation as the code execute within the browser, not requiring a refresh. This makes authoring assets in code much more convenient.

I would use SVG for authoring and rendering as it is very well supported in browsers and doesn't require any additional dependencies.

For the programming language, I had explored various ones, Racket, Haxe, Typescript. I really liked Haxe as a language, but found it was quite verbose to type on a phone. Racket on the other side is nice to type on a phone as the syntax is very simple and all important characters fit nicely on the touch keyboard. I found that programming web apps in Racket to be rather difficult. In the end I opted for simplicity and chose regular Javascript. Not needing a compilation step is nice and the syntax of modern Javascript can be quite terse and makes it a good candidate for typing code on a phone.

So I set up to build a little game framework using a websocket server for development, supporting messaging between the browser and the server for errors and debugging and some basic hot code reload for assets and game code. 

As time went by, I was making good progress. The project supported all key functionalities: SVG rendering, hot code reload and 2-way messaging. The setup was rather pleasing to use and I was pleased with myself. Until a catastrophe happened. I had clumsily rmrf'ed my project's folder! And worst than anything I had not saved it in a remote git repository! As I was realising with horror I had wiped months of painstaking progress, the motivation to restart from scratch was evaporating.

So I let the idea sit for some time and decided to take a stab at it again recently. This time creating the github repository is the first thing I did.

## Getting started

I use pnpm for package management as I find projects using npm bloat my disk space. You can still use npm but I rather recommend using pnpm, especially if you are developing on a device with limited disk space.

1. Install dependencies with `pnpm install`
2. Launch development server with `node server.js`
3. Open your browser at http://localhost:3000

## Features

The development server supports hot code reload. Saving changes in a code file or in an asset file will automatically reload it in the browser without requiring a refresh. Functions and classes that want to support hot cod reload must use the `virtual()` function. There are some limitations to this approach. For example, growing the state of a game or a class is not straightforward to reload. I find for this reason that a more functional style works better with hot code reload.

It also support error capture and messaging in the server's standard output.

## Backlog

- Tools - Error reporting is finicky sometimes
- Tools - From client being able to log infos in server stdout
- Tools - Hot code reload for constants
- Tools - Hot code reload for states
- Physics - Collisions
- Gameplay - Monster movements
- Gameplay - Player health
- Gameplay - Player death
- Gameplay - Room movements
- Graphics - Animations
- Gameplay - Attack
- Gameplay - Monster health
- Gameplay - Boss & victory
- Inputs - Inputs feedback

