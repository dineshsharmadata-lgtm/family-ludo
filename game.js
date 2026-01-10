/******************************************************************************
 * FAMILY LUDO (PeerJS) - Beginner-friendly, well-commented version
 *
 * Mental model:
 * 1) Admin opens the game, creates "player slots" (name/color/avatar).
 * 2) Admin shares a link. Other devices open link and connect to Admin via PeerJS.
 * 3) Players pick an available slot.
 * 4) Admin starts the game, then everyone stays in sync by sending messages:
 *    - gameState, playerSelected, gameStart, diceRolled, tokenMoved, turnChanged, gameOver
 *
 * Note:
 * - This file assumes your HTML has the IDs used below.
 * - PeerJS runs peer-to-peer; the Admin peer acts as a "host" that broadcasts updates.
 ******************************************************************************/

/* ---------------------------------------------------------------------------
   1) GAME CONFIGURATION (constants)
--------------------------------------------------------------------------- */

// 4 classic Ludo colors
const COLORS = ["red", "green", "yellow", "blue"];

// Each player has 4 tokens
const TOKENS_PER_PLAYER = 4;

// Admin password to unlock admin controls (set your own)
const ADMIN_PASSWORD = "family2024";

/**
 * PATH_POSITIONS:
 * Board positions 0..51 are the main loop around the board.
 * Each entry is an (x,y) in percentage so we can absolutely-position cells.
 */
/**
 * PATH_POSITIONS:
 * Board positions forming a plus/cross pattern.
 * Using a percentage-based positioning system.
 */
/**
 * PATH_POSITIONS:
 * Classic Ludo board with cross pattern.
 * Positions are in percentages relative to the board container.
 */
const PATH_POSITIONS = [
  // RED path (left arm, horizontal going right)
  { x: 6.67, y: 40 },     // 0 - RED START
  { x: 13.33, y: 40 },    // 1
  { x: 20, y: 40 },       // 2
  { x: 26.67, y: 40 },    // 3
  { x: 33.33, y: 40 },    // 4
  { x: 40, y: 33.33 },    // 5 - turn (SAFE)
  
  // Vertical path going up
  { x: 40, y: 26.67 },    // 6
  { x: 40, y: 20 },       // 7
  { x: 40, y: 13.33 },    // 8
  { x: 40, y: 6.67 },     // 9
  { x: 40, y: 0 },        // 10
  { x: 46.67, y: 0 },     // 11
  { x: 53.33, y: 0 },     // 12
  
  // YELLOW path (top arm, vertical going down)
  { x: 60, y: 0 },        // 13 - YELLOW START
  { x: 60, y: 6.67 },     // 14
  { x: 60, y: 13.33 },    // 15
  { x: 60, y: 20 },       // 16
  { x: 60, y: 26.67 },    // 17
  { x: 60, y: 33.33 },    // 18
  { x: 66.67, y: 40 },    // 19 - turn (SAFE)
  
  // Horizontal path going right
  { x: 73.33, y: 40 },    // 20
  { x: 80, y: 40 },       // 21
  { x: 86.67, y: 40 },    // 22
  { x: 93.33, y: 40 },    // 23
  { x: 93.33, y: 46.67 }, // 24
  { x: 93.33, y: 53.33 }, // 25
  
  // GREEN path (right arm, horizontal going left)
  { x: 93.33, y: 60 },    // 26 - GREEN START
  { x: 86.67, y: 60 },    // 27
  { x: 80, y: 60 },       // 28
  { x: 73.33, y: 60 },    // 29
  { x: 66.67, y: 60 },    // 30
  { x: 60, y: 66.67 },    // 31
  { x: 60, y: 66.67 },    // 32 - turn (SAFE)
  
  // Vertical path going down
  { x: 60, y: 73.33 },    // 33
  { x: 60, y: 80 },       // 34
  { x: 60, y: 86.67 },    // 35
  { x: 60, y: 93.33 },    // 36
  { x: 53.33, y: 93.33 }, // 37
  { x: 46.67, y: 93.33 }, // 38
  
  // BLUE path (bottom arm, vertical going up)
  { x: 40, y: 93.33 },    // 39 - BLUE START  
  { x: 40, y: 86.67 },    // 40
  { x: 40, y: 80 },       // 41
  { x: 40, y: 73.33 },    // 42
  { x: 40, y: 66.67 },    // 43
  { x: 33.33, y: 60 },    // 44 - turn (SAFE)
  
  // Horizontal path going left (completing loop)
  { x: 26.67, y: 60 },    // 45
  { x: 20, y: 60 },       // 46
  { x: 13.33, y: 60 },    // 47
  { x: 6.67, y: 60 },     // 48
  { x: 6.67, y: 53.33 },  // 49
  { x: 6.67, y: 46.67 },  // 50 - back near red start
];

/**
 * HOME_STRETCH:
 * The colored final paths leading to center
 */
const HOME_STRETCH = {
  red: [
    { x: 46.67, y: 40 },
    { x: 53.33, y: 40 },
  ],
  yellow: [
    { x: 60, y: 46.67 },
    { x: 60, y: 53.33 },
  ],
  green: [
    { x: 53.33, y: 60 },
    { x: 46.67, y: 60 },
  ],
  blue: [
    { x: 40, y: 53.33 },
    { x: 40, y: 46.67 },
  ],
};

const START_POSITIONS = { red: 0, yellow: 13, green: 26, blue: 39 };
const SAFE_SPOTS = [0, 5, 13, 19, 26, 32, 39, 44];
const STAR_SPOTS = [5, 19, 32, 44];

/* ---------------------------------------------------------------------------
   2) GLOBAL STATE (mutable)
--------------------------------------------------------------------------- */

// PeerJS main peer (admin + players both create a peer)
let peer;

// A list of PeerJS connections (admin has multiple; player has one)
let connections = [];

/**
 * gameState is the single source of truth.
 * Think of it as a "database object" that we broadcast to all clients.
 */
let gameState = {
  players: [],          // [{ name, color, avatar, playerId, joined }]
  currentTurn: null,    // color string, e.g., "red"
  gameStarted: false,
  tokens: {},           // tokens[color] = [{id, position, inHomeStretch, finished}, ...]
  diceRoll: null,
  selectableTokens: [], // which token indices can move this turn (computed after dice roll)
  winner: null,
};

// My PeerJS ID
let myPlayerId;

// Which player slot I chose (index into gameState.players)
let myPlayerIndex = null;

// Are we the admin?
let isAdmin = false;

// Game code = admin peer ID (used by others to connect)
let gameCode;

// Counter for default naming ("Player 1", "Player 2", ...)
let playerCounter = 0;

/* ---------------------------------------------------------------------------
   3) INITIALIZATION (startup entry point)
--------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", init);

function init() {
  setupEventListeners();
  createPathCells();   // draw the board path cells once
  checkIfJoining();    // if URL has ?game=..., join as player
}

/**
 * Wire up all buttons/inputs.
 * The IDs used here must exist in your HTML.
 */
function setupEventListeners() {
  document.getElementById("adminPassword").addEventListener("input", checkAdminPassword);
  document.getElementById("addPlayer").addEventListener("click", addPlayerSetup);
  document.getElementById("copyLink").addEventListener("click", copyShareLink);
  document.getElementById("whatsappShare").addEventListener("click", shareOnWhatsApp);
  document.getElementById("startGameAdmin").addEventListener("click", startGameAsAdmin);
  document.getElementById("rollDice").addEventListener("click", rollDice);
  document.getElementById("newGame").addEventListener("click", () => location.reload());
}

/* ---------------------------------------------------------------------------
   4) ADMIN LOGIN + ADMIN PEER SETUP
--------------------------------------------------------------------------- */

function checkAdminPassword() {
  const password = document.getElementById("adminPassword").value;

  if (password === ADMIN_PASSWORD) {
    isAdmin = true;
    initializeAdmin();
  }
}

/**
 * Admin creates a peer and waits for connections.
 * Admin also generates the share link (using peer ID).
 */
function initializeAdmin() {
  peer = new Peer(undefined, {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    },
  });

  peer.on("open", (id) => {
    myPlayerId = id;
    gameCode = id;

    const shareLink = `${window.location.origin}${window.location.pathname}?game=${gameCode}`;
    document.getElementById("shareLink").value = shareLink;
    document.getElementById("playerSetupSection").classList.remove("hidden");

    // Add 2 default player slots
    addPlayerSetup();
    addPlayerSetup();
  });

  // When another device connects to admin, we configure the connection
  peer.on("connection", (conn) => setupConnection(conn));

  peer.on("error", (err) => {
    console.error("PeerJS Error:", err);
    alert("Connection error: " + err.type + ". Try refreshing the page.");
  });
}

/* ---------------------------------------------------------------------------
   5) ADMIN: PLAYER SLOT SETUP UI
--------------------------------------------------------------------------- */

/**
 * Create a new "player slot" (not a connected device yet).
 * A slot becomes "joined" when a remote device selects it.
 */
function addPlayerSetup() {
  if (gameState.players.length >= 4) {
    alert("Maximum 4 players");
    return;
  }

  // Choose the first available color not used yet
  const availableColors = COLORS.filter((c) => !gameState.players.find((p) => p.color === c));
  if (availableColors.length === 0) return;

  const playerIndex = playerCounter++;
  const defaultColor = availableColors[0];

  gameState.players.push({
    name: `Player ${playerIndex + 1}`,
    color: defaultColor,
    avatar: null,     // base64 image string
    playerId: null,   // PeerJS id of the device that selected this slot
    joined: false,
  });

  renderPlayerSetup();
  updateStartButton();
  broadcastGameState(); // keep all joined players in sync
}

/**
 * Render admin's list of player slots (name, avatar upload, color dropdown).
 *
 * IMPORTANT: This function was broken in your earlier code due to invalid HTML.
 * The <select> must be written correctly.
 */
function renderPlayerSetup() {
  const list = document.getElementById("playersSetupList");
  list.innerHTML = "";

  gameState.players.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "player-setup-item";

    // colors that are either this player's color OR unused by others
    const availableColors = COLORS.filter(
      (c) => c === player.color || !gameState.players.find((p) => p.color === c)
    );

    div.innerHTML = `
      <label class="avatar-preview" onclick="document.getElementById('avatar-${index}').click()">
        ${player.avatar ? `<img src="${player.avatar}" alt="Avatar">` : "📷"}
      </label>

      <input type="file"
             id="avatar-${index}"
             accept="image/*"
             onchange="handleAvatarUpload(${index}, event)">

      <input type="text"
             value="${player.name}"
             onchange="updatePlayerName(${index}, this.value)"
             placeholder="Player Name">

      <select class="color-select"
              onchange="updatePlayerColor(${index}, this.value)">
        ${availableColors
          .map(
            (c) => `
          <option value="${c}" ${c === player.color ? "selected" : ""}>
            ${c.toUpperCase()}
          </option>
        `
          )
          .join("")}
      </select>

      <button class="btn-remove" onclick="removePlayer(${index})">✕</button>
    `;

    // If a remote player already selected this slot, lock it in the UI
    if (player.joined) {
      div.style.opacity = "0.7";
      div.style.pointerEvents = "none";
      const status = document.createElement("span");
      status.textContent = "✓ Joined";
      status.style.color = "green";
      status.style.fontWeight = "bold";
      div.appendChild(status);
    }

    list.appendChild(div);
  });
}

/**
 * These functions are attached to window because they are used inside HTML strings
 * (onclick / onchange).
 */
window.handleAvatarUpload = function handleAvatarUpload(index, event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    gameState.players[index].avatar = e.target.result; // base64 data URL
    renderPlayerSetup();
    broadcastGameState();
  };
  reader.readAsDataURL(file);
};

window.updatePlayerName = function updatePlayerName(index, name) {
  gameState.players[index].name = name;
  broadcastGameState();
};

window.updatePlayerColor = function updatePlayerColor(index, color) {
  gameState.players[index].color = color;
  renderPlayerSetup();
  broadcastGameState();
};

window.removePlayer = function removePlayer(index) {
  if (gameState.players[index].joined) {
    alert("Cannot remove player who has already joined");
    return;
  }
  gameState.players.splice(index, 1);
  renderPlayerSetup();
  updateStartButton();
  broadcastGameState();
};

function updateStartButton() {
  const btn = document.getElementById("startGameAdmin");
  btn.disabled = !(gameState.players.length >= 2 && gameState.players.length <= 4);
}

/**
 * Admin starts the game:
 * - Create token arrays for each player color
 * - Set gameStarted and first turn
 * - Broadcast to everyone
 */
function startGameAsAdmin() {
  if (gameState.players.length < 2) {
    alert("Need at least 2 players");
    return;
  }

  // Initialize tokens: position=-1 means "in home"
  gameState.tokens = {};
  gameState.players.forEach((player) => {
    gameState.tokens[player.color] = [];
    for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
      gameState.tokens[player.color].push({
        id: i,
        position: -1,
        inHomeStretch: false,
        finished: false,
      });
    }
  });

  gameState.gameStarted = true;
  gameState.currentTurn = gameState.players[0].color;

  broadcast({ type: "gameStart", state: gameState });
  startGamePlay();
}

/* ---------------------------------------------------------------------------
   6) NETWORKING (PeerJS): join, connect, message handling
--------------------------------------------------------------------------- */

/**
 * If URL is like ...?game=ADMIN_PEER_ID then we are a player joining.
 */
function checkIfJoining() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameParam = urlParams.get("game");
  if (gameParam) joinAsPlayer(gameParam);
}

/**
 * Player creates a peer and connects to admin's peer ID.
 */
function joinAsPlayer(code) {
  peer = new Peer(undefined, {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    },
  });

  peer.on("open", (id) => {
    myPlayerId = id;
    gameCode = code;

    const conn = peer.connect(code);
    setupConnection(conn);
  });

  peer.on("error", (err) => {
    console.error("PeerJS Error:", err);
    alert("Could not connect: " + err.type);
  });
}

/**
 * Standard wiring for any PeerJS connection.
 * - on open: add to connections, request state if player
 * - on data: handleMessage
 * - on close: remove from list
 */
function setupConnection(conn) {
  conn.on("open", () => {
    connections.push(conn);

    // Only non-admins request game state on connect
    if (!isAdmin) {
      conn.send({ type: "requestGameState", playerId: myPlayerId });
    }
  });

  conn.on("data", (data) => handleMessage(data, conn));

  conn.on("close", () => {
    connections = connections.filter((c) => c !== conn);
  });
}

/**
 * Router for all network messages.
 * This is like your API endpoint handler.
 */
function handleMessage(data, conn) {
  switch (data.type) {
    case "requestGameState":
      if (isAdmin) {
        conn.send({ type: "gameState", state: gameState });
      }
      break;

    case "gameState":
      // Player receives current setup/state from admin
      gameState = data.state;

      if (!gameState.gameStarted) {
        showPlayerSelection();
      } else {
        // If game started, see if I already joined a slot earlier
        const myPlayer = gameState.players.find((p) => p.playerId === myPlayerId);
        if (myPlayer) {
          myPlayerIndex = gameState.players.indexOf(myPlayer);
          startGamePlay();
        } else {
          alert("Game already started");
        }
      }
      break;

    case "playerSelected":
      // Admin records which device selected which slot
      if (isAdmin) {
        const playerIndex = data.playerIndex;
        if (!gameState.players[playerIndex].joined) {
          gameState.players[playerIndex].playerId = data.playerId;
          gameState.players[playerIndex].joined = true;
          renderPlayerSetup();
          broadcastGameState();
        }
      }
      break;

    case "gameStart":
      gameState = data.state;
      startGamePlay();
      break;

    case "diceRolled":
      gameState.diceRoll = data.roll;
      gameState.selectableTokens = data.selectableTokens;
      updateDiceDisplay(data.roll);
      highlightSelectableTokens();
      break;

    case "tokenMoved":
      gameState = data.state;
      renderBoard();
      updatePlayersInfo();
      break;

    case "turnChanged":
      gameState.currentTurn = data.turn;
      gameState.selectableTokens = [];
      updateTurnDisplay();
      updatePlayersInfo();
      clearSelectableTokens();
      break;

    case "gameOver":
      gameState.winner = data.winner;
      showWinner(data.winner);
      break;
  }
}

/* ---------------------------------------------------------------------------
   7) PLAYER SELECTION SCREEN (for non-admins)
--------------------------------------------------------------------------- */

function showPlayerSelection() {
  showScreen("playerSelect");

  const selection = document.getElementById("playerSelection");
  selection.innerHTML = "";

  gameState.players.forEach((player, index) => {
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

/**
 * Player chooses a slot. We inform the admin.
 */
function selectPlayer(index) {
  const card = document.querySelectorAll(".player-card")[index];
  card.classList.add("selected");

  myPlayerIndex = index;

broadcast({
    type: "playerSelected",
    playerIndex: index,
    playerId: myPlayerId,
  });

  // Disable all cards so the user can’t click again
  document.querySelectorAll(".player-card").forEach((c) => {
    c.style.pointerEvents = "none";
  });

  document.querySelector(".info").textContent =
    `You are ${gameState.players[index].name}. Waiting for game to start...`;
}

/* ---------------------------------------------------------------------------
   8) BROADCAST HELPERS (admin sends to everyone)
--------------------------------------------------------------------------- */

function broadcastGameState() {
  broadcast({ type: "gameState", state: gameState });
}

/**
 * Send a message to every open connection.
 * Admin uses this to keep all clients synced.
 */
function broadcast(data) {
  connections.forEach((conn) => {
    if (conn.open) conn.send(data);
  });
}

/* ---------------------------------------------------------------------------
   9) UI HELPERS (screen navigation + board creation)
--------------------------------------------------------------------------- */

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

/**
 * Create all path cells once (main loop + home stretches).
 * Tokens will later be drawn inside these cells.
 */
function createPathCells() {
  const pathContainer = document.getElementById("pathContainer");

  // Main loop (52 cells)
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

  // Home stretch cells (per color)
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

/* ---------------------------------------------------------------------------
   10) START GAME UI (board + turn state)
--------------------------------------------------------------------------- */

function startGamePlay() {
  showScreen("gameScreen");

  // If we don't know our slot yet, try to infer it (useful when reconnecting)
  if (myPlayerIndex === null) {
    const myPlayer = gameState.players.find((p) => p.playerId === myPlayerId);
    if (myPlayer) myPlayerIndex = gameState.players.indexOf(myPlayer);
  }

  if (myPlayerIndex !== null) {
    document.getElementById("gameInfo").textContent =
      `Playing as: ${gameState.players[myPlayerIndex].name}`;
  }

  renderBoard();
  updateTurnDisplay();
  updatePlayersInfo();

  // Enable dice only if it's my turn
  if (myPlayerIndex !== null) {
    const myColor = gameState.players[myPlayerIndex].color;
    if (gameState.currentTurn === myColor) enableDiceRoll();
  }
}

/* ---------------------------------------------------------------------------
   11) GAME LOGIC: Dice roll -> compute moves -> move token -> next turn
--------------------------------------------------------------------------- */

/**
 * Called when user clicks "Roll Dice".
 * We only allow rolling when it's your turn.
 */
function rollDice() {
  const myColor = gameState.players[myPlayerIndex].color;
  if (gameState.currentTurn !== myColor) return;

  disableDiceRoll();

  // Random 1..6
  const roll = Math.floor(Math.random() * 6) + 1;
  gameState.diceRoll = roll;

  updateDiceDisplay(roll);

  // Decide which of my tokens are allowed to move
  const selectableTokens = getSelectableTokens(myColor, roll);
  gameState.selectableTokens = selectableTokens;

  broadcast({ type: "diceRolled", roll, selectableTokens });

  // If no moves possible, auto-advance turn after a short pause
  if (selectableTokens.length === 0) {
    setTimeout(() => nextTurn(), 1500);
  } else {
    highlightSelectableTokens();
  }
}

/**
 * For each token, decide if it can move given the dice roll.
 *
 * Rules in this simplified version:
 * - If token is in home (-1), it can only come out on a 6.
 * - If token is in home stretch, it must not overshoot (<= 5).
 * - Otherwise, any token on the main path is selectable.
 */
function getSelectableTokens(color, roll) {
  const tokens = gameState.tokens[color];
  const selectable = [];

  tokens.forEach((token, index) => {
    if (token.finished) return;

    if (token.position === -1) {
      if (roll === 6) selectable.push(index);
    } else if (token.inHomeStretch) {
      const newPos = token.position + roll;
      if (newPos <= 5) selectable.push(index);
    } else {
      selectable.push(index);
    }
  });

  return selectable;
}

/**
 * Visually highlight the tokens the player can click.
 * We attach click handlers to move the selected token.
 */
function highlightSelectableTokens() {
  clearSelectableTokens();

  const myColor = gameState.players[myPlayerIndex].color;

  gameState.selectableTokens.forEach((tokenId) => {
    const token = gameState.tokens[myColor][tokenId];

    // Token still in home area
    if (token.position === -1) {
      const homeToken = document.querySelector(
        `.home-tokens[data-color="${myColor}"] .home-token[data-token="${tokenId}"]`
      );
      if (homeToken) {
        homeToken.classList.add("selectable");
        homeToken.addEventListener("click", () => moveTokenFromHome(tokenId));
      }
    } else {
      // Token already on the board
      const tokenEl = document.querySelector(`.token.${myColor}[data-token="${tokenId}"]`);
      if (tokenEl) {
        tokenEl.classList.add("selectable");
        tokenEl.addEventListener("click", () => moveToken(tokenId));
      }
    }
  });
}

/**
 * Remove "selectable" state and click handlers.
 * cloneNode trick removes event listeners.
 */
function clearSelectableTokens() {
  document.querySelectorAll(".selectable").forEach((el) => {
    el.classList.remove("selectable");
    el.replaceWith(el.cloneNode(true));
  });
}

/**
 * Move a token from home to its start square.
 * Only allowed when dice=6 and start is not blocked by own token.
 */
function moveTokenFromHome(tokenId) {
  const myColor = gameState.players[myPlayerIndex].color;
  if (gameState.currentTurn !== myColor) return;
  if (!gameState.selectableTokens.includes(tokenId)) return;

  const token = gameState.tokens[myColor][tokenId];
  const startPos = START_POSITIONS[myColor];

  // Block rule: can't stack your own tokens on same cell
  const occupyingToken = findTokenAtPosition(myColor, startPos, false);
  if (occupyingToken !== null) {
    alert("Starting position blocked!");
    return;
  }

  // Capture opponents if not a safe spot (start spots are safe in our SAFE_SPOTS list)
  const capturedToken = findOpponentTokenAtPosition(startPos, false);
  if (capturedToken && !SAFE_SPOTS.includes(startPos)) {
    captureToken(capturedToken.color, capturedToken.tokenId);
  }

  token.position = startPos;
  token.inHomeStretch = false;

  clearSelectableTokens();

  broadcast({ type: "tokenMoved", state: gameState });
  renderBoard();

  // If roll is 6, player gets another roll
  if (gameState.diceRoll === 6) {
    setTimeout(() => enableDiceRoll(), 500);
  } else {
    setTimeout(() => nextTurn(), 1000);
  }
}

/**
 * Move a token that is already on the board or in home stretch.
 */
function moveToken(tokenId) {
  const myColor = gameState.players[myPlayerIndex].color;
  if (gameState.currentTurn !== myColor) return;
  if (!gameState.selectableTokens.includes(tokenId)) return;

  const token = gameState.tokens[myColor][tokenId];
  const roll = gameState.diceRoll;

  if (token.inHomeStretch) {
    // Home stretch positions are small integers
    const newPos = token.position + roll;

    // Need exact roll to finish (this code uses 6 as "finish marker")
    if (newPos === 6) {
      token.finished = true;
      token.position = 6;
      checkForWinner();
    } else if (newPos < 6) {
      token.position = newPos;
    } else {
      alert("Exact roll needed!");
      return;
    }
  } else {
    // Moving around the main 52-step loop
    let newPos = token.position + roll;

    // Entry point into home stretch (this formula is your design choice)
    const homeStretchEntry = (START_POSITIONS[myColor] + 50) % 52;

    // If crossing entry, move into home stretch
    if (token.position < homeStretchEntry && newPos >= homeStretchEntry) {
      const overflow = newPos - homeStretchEntry;
      token.position = overflow;
      token.inHomeStretch = true;
    } else {
      newPos = newPos % 52;

      // Can't land on your own token (block)
      const occupyingToken = findTokenAtPosition(myColor, newPos, false);
      if (occupyingToken !== null && occupyingToken !== tokenId) {
        alert("Blocked by your token!");
        return;
      }

      token.position = newPos;

      // Capture if not on a safe spot
      if (!SAFE_SPOTS.includes(newPos)) {
        const capturedToken = findOpponentTokenAtPosition(newPos, false);
        if (capturedToken) captureToken(capturedToken.color, capturedToken.tokenId);
      }
    }
  }

  clearSelectableTokens();

  broadcast({ type: "tokenMoved", state: gameState });
  renderBoard();

  if (gameState.diceRoll === 6) {
    setTimeout(() => enableDiceRoll(), 500);
  } else {
    setTimeout(() => nextTurn(), 1000);
  }
}

/* ---------------------------------------------------------------------------
   12) GAME LOGIC HELPERS: finding tokens, capturing, winner, turn order
--------------------------------------------------------------------------- */

/**
 * Find one of *your* tokens at a specific board position.
 * Returns token index or null.
 */
function findTokenAtPosition(color, position, inHomeStretch) {
  const tokens = gameState.tokens[color];
  for (let i = 0; i < tokens.length; i++) {
    if (
      tokens[i].position === position &&
      tokens[i].inHomeStretch === inHomeStretch &&
      !tokens[i].finished
    ) {
      return i;
    }
  }
  return null;
}

/**
 * Find an opponent token at a specific board position.
 * Returns {color, tokenId} or null.
 */
function findOpponentTokenAtPosition(position, inHomeStretch) {
  const myColor = gameState.players[myPlayerIndex].color;

  for (const color in gameState.tokens) {
    if (color === myColor) continue;

    const tokens = gameState.tokens[color];
    for (let i = 0; i < tokens.length; i++) {
      if (
        tokens[i].position === position &&
        tokens[i].inHomeStretch === inHomeStretch &&
        !tokens[i].finished
      ) {
        return { color, tokenId: i };
      }
    }
  }
  return null;
}

/**
 * Capturing sends opponent token back to home.
 */
function captureToken(color, tokenId) {
  gameState.tokens[color][tokenId].position = -1;
  gameState.tokens[color][tokenId].inHomeStretch = false;
}

/**
 * If all my tokens finished, I win.
 * (Called after finishing a token.)
 */
function checkForWinner() {
  const myColor = gameState.players[myPlayerIndex].color;
  const tokens = gameState.tokens[myColor];
  const allFinished = tokens.every((t) => t.finished);

  if (allFinished) {
    broadcast({ type: "gameOver", winner: myColor });
    showWinner(myColor);
  }
}

/**
 * Move to next player's turn (cyclic).
 */
function nextTurn() {
  const currentIndex = gameState.players.findIndex((p) => p.color === gameState.currentTurn);
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  gameState.currentTurn = gameState.players[nextIndex].color;

  broadcast({ type: "turnChanged", turn: gameState.currentTurn });

  updateTurnDisplay();
  updatePlayersInfo();

  const myColor = gameState.players[myPlayerIndex].color;
  if (gameState.currentTurn === myColor) enableDiceRoll();
}

/* ---------------------------------------------------------------------------
   13) RENDERING: draw tokens on board, dice, turn, player info
--------------------------------------------------------------------------- */

function renderBoard() {
  // Remove all existing token elements on the board (we re-draw)
  document.querySelectorAll(".token").forEach((t) => t.remove());

  // Update home tokens styling (has-token)
  for (const color in gameState.tokens) {
    gameState.tokens[color].forEach((token, index) => {
      const homeToken = document.querySelector(
        `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
      );
      if (!homeToken) return;

      if (token.position === -1) homeToken.classList.add("has-token");
      else homeToken.classList.remove("has-token");
    });
  }

  // Draw tokens on path cells / home stretch cells
  for (const color in gameState.tokens) {
    gameState.tokens[color].forEach((token, index) => {
      if (token.position >= 0 && !token.finished) {
        const tokenEl = document.createElement("div");
        tokenEl.className = `token ${color}`;
        tokenEl.dataset.token = index;

        let targetCell;

        if (token.inHomeStretch) {
          targetCell = document.querySelector(
            `.path-cell[data-home-stretch="${color}"][data-home-position="${token.position}"]`
          );
        } else {
          targetCell = document.querySelector(`.path-cell[data-position="${token.position}"]`);
        }

        if (targetCell) {
          // If multiple tokens in same cell, offset slightly so you can see them
          const existingTokens = targetCell.querySelectorAll(".token");
          if (existingTokens.length > 0) {
            tokenEl.style.transform =
              `translate(-50%, -50%) translate(${existingTokens.length * 3}px, ${existingTokens.length * 3}px)`;
            tokenEl.style.zIndex = 10 + existingTokens.length;
          }

          targetCell.appendChild(tokenEl);
        }
      }
    });
  }
}

function updateDiceDisplay(roll) {
  const diceDisplay = document.getElementById("diceDisplay");
  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  diceDisplay.textContent = diceEmojis[roll - 1];

  // Restart animation
  diceDisplay.style.animation = "none";
  setTimeout(() => {
    diceDisplay.style.animation = "diceRoll 0.5s ease-in-out";
  }, 10);
}

function updateTurnDisplay() {
  const turnDisplay = document.getElementById("currentTurn");
  const player = gameState.players.find((p) => p.color === gameState.currentTurn);

  if (player) {
    turnDisplay.textContent = `Current Turn: ${player.name}`;
    turnDisplay.style.color = getColorHex(player.color);
    turnDisplay.style.fontWeight = "bold";
  }
}

function updatePlayersInfo() {
  const playersInfo = document.getElementById("playersInfo");
  playersInfo.innerHTML = "<h3>Players</h3>";

  gameState.players.forEach((player) => {
    const tokens = gameState.tokens[player.color] || [];
    const finishedCount = tokens.filter((t) => t.finished).length;
    const onBoardCount = tokens.filter((t) => t.position >= 0 && !t.finished).length;
    const inHomeCount = TOKENS_PER_PLAYER - onBoardCount - finishedCount;

    const div = document.createElement("div");
    div.className = "player-info-item";
    if (player.color === gameState.currentTurn) div.classList.add("active");

    div.innerHTML = `
      <div class="player-info-name">
        ${player.avatar ? `<img src="${player.avatar}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">` : ""}
        <div class="player-color-dot" style="background: ${getColorHex(player.color)}"></div>
        <span>${player.name}</span>
      </div>
      <div class="player-info-tokens">
        🏠 ${inHomeCount} | 🎯 ${onBoardCount} | ✅ ${finishedCount}
      </div>
    `;

    playersInfo.appendChild(div);
  });
}

function enableDiceRoll() {
  document.getElementById("rollDice").disabled = false;
}

function disableDiceRoll() {
  document.getElementById("rollDice").disabled = true;
}

/* ---------------------------------------------------------------------------
   14) WINNER + COLOR + SHARE UTILITIES
--------------------------------------------------------------------------- */

function showWinner(winnerColor) {
  const player = gameState.players.find((p) => p.color === winnerColor);
  const winnerInfo = document.getElementById("winnerInfo");

  winnerInfo.innerHTML = `
    <div style="font-size:48px;margin:20px 0;">
      ${
        player?.avatar
          ? `<img src="${player.avatar}"
                  style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:5px solid ${getColorHex(winnerColor)};">`
          : `<div class="player-color-dot"
                  style="background:${getColorHex(winnerColor)};width:120px;height:120px;margin:0 auto 20px;"></div>`
      }
    </div>
    <h2>${player ? player.name : winnerColor} Wins!</h2>
    <p style="color:${getColorHex(winnerColor)};font-size:24px;margin-top:10px;">
      ${winnerColor.toUpperCase()} Victory!
    </p>
  `;

  setTimeout(() => showScreen("winnerScreen"), 2000);
}

function getColorHex(color) {
  const colors = {
    red: "#c92a2a",
    green: "#2f9e44",
    yellow: "#f59f00",
    blue: "#1971c2",
  };
  return colors[color] || "#000";
}

/**
 * Copy share link (admin screen).
 */
function copyShareLink() {
  const shareLink = document.getElementById("shareLink");
  shareLink.select();
  shareLink.setSelectionRange(0, 99999);

  navigator.clipboard
    .writeText(shareLink.value)
    .then(() => {
      const btn = document.getElementById("copyLink");
      const originalText = btn.textContent;
      btn.textContent = "✓ Copied!";
      setTimeout(() => (btn.textContent = originalText), 2000);
    })
    .catch(() => {
      // Older browser fallback
      document.execCommand("copy");
    });
}

/**
 * Open WhatsApp with a prefilled message.
 */
function shareOnWhatsApp() {
  const shareLink = document.getElementById("shareLink").value;
  const message = encodeURIComponent(
    `Join our Family Ludo game!\n\nClick here to play: ${shareLink}`
  );

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Try app first, then fallback to web after 800ms
    window.location.href = `whatsapp://send?text=${message}`;
    setTimeout(() => {
      window.location.href = `https://wa.me/?text=${message}`;
    }, 800);
  } else {
    window.open(`https://web.whatsapp.com/send?text=${message}`, "_blank");
  }
}
