/******************************************************************************
 * PLAYER FUNCTIONS
 ******************************************************************************/

import { state } from './state.js';
import { broadcast } from './network.js';
import { showScreen } from './utils.js';
import { getColorHex } from './rendering.js';

export function showPlayerSelection() {
  showScreen("playerSelect");

  const selection = document.getElementById("playerSelection");
  selection.innerHTML = "";

  state.gameState.players.forEach((player, index) => {
    const card = document.createElement("div");
    card.className = `player-card ${player.joined ? "taken" : ""}`;

    card.innerHTML = `
      <div class="player-avatar" style="border-color: ${getColorHex(player.color)}">
        ${player.avatar ? `<img src="${player.avatar}" alt="${player.name}">` : "👤"}
      </div>
      <div class="player-name">${player.name}</div>
      <div class="player-status">${player.joined ? "✓ Taken" : "Available"}</div>
    `;

    if (!player.joined) {
      card.addEventListener("click", () => selectPlayer(index));
    }

    selection.appendChild(card);
  });
}

export function selectPlayer(index) {
  const card = document.querySelectorAll(".player-card")[index];
  card.classList.add("selected");

  state.myPlayerIndex = index;

  broadcast({
    type: "playerSelected",
    playerIndex: index,
    playerId: state.myPlayerId,
  });

  document.querySelectorAll(".player-card").forEach((c) => {
    c.style.pointerEvents = "none";
  });

  document.querySelector(".info").textContent =
    `You are ${state.gameState.players[index].name}. Waiting for game to start...`;
}