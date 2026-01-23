/******************************************************************************
 * RENDERING
 ******************************************************************************/

import { PATH_POSITIONS, HOME_STRETCH, START_POSITIONS, SAFE_SPOTS, STAR_SPOTS, TOKENS_PER_PLAYER } from './config.js';
import { state } from './state.js';
import { showScreen } from './utils.js';

export function createPathCells() {
  const pathContainer = document.getElementById("pathContainer");

  PATH_POSITIONS.forEach((pos, index) => {
    const cell = document.createElement("div");
    cell.className = "path-cell";
    cell.style.left = pos.x + "%";
    cell.style.top = pos.y + "%";
    cell.dataset.position = index;

    if (SAFE_SPOTS.includes(index)) cell.classList.add("safe");
    if (STAR_SPOTS.includes(index)) cell.classList.add("star");
    if (index === START_POSITIONS.red) cell.classList.add("start-red");
    if (index === START_POSITIONS.green) cell.classList.add("start-green");
    if (index === START_POSITIONS.yellow) cell.classList.add("start-yellow");
    if (index === START_POSITIONS.blue) cell.classList.add("start-blue");

    pathContainer.appendChild(cell);
  });

  Object.keys(HOME_STRETCH).forEach((color) => {
    HOME_STRETCH[color].forEach((pos, index) => {
      const cell = document.createElement("div");
      cell.className = `path-cell home-stretch-${color}`;
      cell.style.left = pos.x + "%";
      cell.style.top = pos.y + "%";
      cell.dataset.homeStretch = color;
      cell.dataset.homePosition = index;
      pathContainer.appendChild(cell);
    });
  });
}

export function renderBoard() {
  document.querySelectorAll(".token").forEach((t) => t.remove());

  for (const color in state.gameState.tokens) {
    state.gameState.tokens[color].forEach((token, index) => {
      const homeToken = document.querySelector(
        `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
      );
      if (!homeToken) return;

      if (token.position === -1) homeToken.classList.add("has-token");
      else homeToken.classList.remove("has-token");
    });
  }

  for (const color in state.gameState.tokens) {
    state.gameState.tokens[color].forEach((token, index) => {
      if (token.position >= 0 && !token.finished) {
        const tokenEl = document.createElement("div");
        tokenEl.className = `token ${color}`;
        tokenEl.dataset.token = index;

        let targetCell;

        if (token.inHomeStretch) {
          targetCell =