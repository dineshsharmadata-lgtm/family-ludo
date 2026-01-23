/******************************************************************************
 * MAIN ENTRY POINT - Family Ludo
 ******************************************************************************/

import { checkAdminPassword, addPlayerSetup, startGameAsAdmin, handleAvatarUpload, updatePlayerName, updatePlayerColor, removePlayer } from './admin.js';
import { joinAsPlayer } from './network.js';
import { rollDice } from './gameLogic.js';
import { createPathCells } from './rendering.js';
import { copyShareLink, shareOnWhatsApp } from './utils.js';

console.log("🎮 Loading Family Ludo...");

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);

function init() {
  console.log("🎮 Family Ludo Initializing...");
  
  setupEventListeners();
  createPathCells();
  checkIfJoining();
  
  console.log("✅ Game Ready");
}

function setupEventListeners() {
  console.log("🔧 Setting up event listeners...");
  
  // Admin controls
  const adminPassword = document.getElementById("adminPassword");
  const addPlayerBtn = document.getElementById("addPlayer");
  const copyLinkBtn = document.getElementById("copyLink");
  const whatsappBtn = document.getElementById("whatsappShare");
  const startGameBtn = document.getElementById("startGameAdmin");
  const rollDiceBtn = document.getElementById("rollDice");
  const newGameBtn = document.getElementById("newGame");

  if (adminPassword) {
    adminPassword.addEventListener("input", checkAdminPassword);
    console.log("✅ Admin password listener attached");
  }
  
  if (addPlayerBtn) {
    addPlayerBtn.addEventListener("click", addPlayerSetup);
    console.log("✅ Add player listener attached");
  }
  
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", copyShareLink);
    console.log("✅ Copy link listener attached");
  }
  
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", shareOnWhatsApp);
    console.log("✅ WhatsApp listener attached");
  }
  
  if (startGameBtn) {
    startGameBtn.addEventListener("click", startGameAsAdmin);
    console.log("✅ Start game listener attached");
  }
  
  // Game controls
  if (rollDiceBtn) {
    rollDiceBtn.addEventListener("click", rollDice);
    console.log("✅ Roll dice listener attached");
  }
  
  if (newGameBtn) {
    newGameBtn.addEventListener("click", () => location.reload());
    console.log("✅ New game listener attached");
  }
  
  console.log("✅ All event listeners attached");
}

function checkIfJoining() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameParam = urlParams.get("game");
  
  if (gameParam) {
    console.log("🔗 Joining game:", gameParam);
    joinAsPlayer(gameParam);
  } else {
    console.log("📝 No game code in URL - waiting for admin setup");
  }
}

// Expose functions to window for inline HTML handlers
window.handleAvatarUpload = handleAvatarUpload;
window.updatePlayerName = updatePlayerName;
window.updatePlayerColor = updatePlayerColor;
window.removePlayer = removePlayer;

console.log("✅ Main.js loaded");