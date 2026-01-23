/******************************************************************************
 * NETWORKING (PeerJS)
 ******************************************************************************/

import { PEER_CONFIG } from './config.js';
import { state } from './state.js';
import { handleMessage } from './messageHandler.js';

export function initializeAdmin() {
  state.peer = new Peer(undefined, PEER_CONFIG);

  state.peer.on("open", (id) => {
    state.myPlayerId = id;
    state.gameCode = id;

    const shareLink = `${window.location.origin}${window.location.pathname}?game=${state.gameCode}`;
    document.getElementById("shareLink").value = shareLink;
    document.getElementById("playerSetupSection").classList.remove("hidden");
  });

  state.peer.on("connection", (conn) => setupConnection(conn));

  state.peer.on("error", (err) => {
    console.error("PeerJS Error:", err);
    alert("Connection error: " + err.type + ". Try refreshing the page.");
  });
}

export function joinAsPlayer(code) {
  state.peer = new Peer(undefined, PEER_CONFIG);

  state.peer.on("open", (id) => {
    state.myPlayerId = id;
    state.gameCode = code;

    const conn = state.peer.connect(code);
    setupConnection(conn);
  });

  state.peer.on("error", (err) => {
    console.error("PeerJS Error:", err);
    alert("Could not connect: " + err.type);
  });
}

export function setupConnection(conn) {
  conn.on("open", () => {
    state.connections.push(conn);

    if (!state.isAdmin) {
      conn.send({ type: "requestGameState", playerId: state.myPlayerId });
    }
  });

  conn.on("data", (data) => handleMessage(data, conn));

  conn.on("close", () => {
    state.connections = state.connections.filter((c) => c !== conn);
  });
}

export function broadcast(data) {
  state.connections.forEach((conn) => {
    if (conn.open) conn.send(data);
  });
}

export function broadcastGameState() {
  broadcast({ type: "gameState", state: state.gameState });
}