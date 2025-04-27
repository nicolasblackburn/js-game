import {
  setAttributes,
  setInnerHTML
} from './svg.js';

export function initScreens(ctx) {
  ctx.dom.screens = {
    title: setInnerHTML(
      setAttributes(
        document.createElement('div'),
        {
          class: 'screen visible'
        }
      ),
      `
        <h1>Adventure Game</h1>
        <p>Press anywhere to start</p>
      `
    ),
    gameover: setInnerHTML(
      setAttributes(
        document.createElement('div'),
        {
          class: 'screen'
        }
      ), 
      `
        <h1>Game Over</h1>
        <p>Press anywhere to continue</p>
      `
    )
  };

  Object.values(ctx.dom.screens).forEach(screen => {
    document.body.append(screen);
  });
}

export function showScreen(ctx, name) {
  Object.entries(ctx.dom?.screens ?? []).forEach(([nameKey, screen]) => {
    if (nameKey === name) {
      screen.classList.add('visible');
    } else {
      screen.classList.remove('visible');
    }
  });
}
