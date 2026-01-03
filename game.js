// Game Configuration
const COLORS = ['red', 'green', 'yellow', 'blue'];
const TOKENS_PER_PLAYER = 4;
const ADMIN_PASSWORD = "sharmas2026"; // Change this!

// Path positions (same as before)
const PATH_POSITIONS = [
  // RED path (starts bottom-left, goes up)
  { x: 6.67, y: 60 },     // 0 - RED START
  { x: 6.67, y: 53.33 },  // 1
  { x: 6.67, y: 46.67 },  // 2
  { x: 6.67, y: 40 },     // 3
  { x: 6.67, y: 33.33 },  // 4
  { x: 6.67, y: 26.67 },  // 5
  { x: 0, y: 26.67 },     // 6 - corner
  { x: 0, y: 20 },        // 7
  { x: 0, y: 13.33 },     // 8 - SAFE
  
  // YELLOW path (goes right along top)
  { x: 0, y: 6.67 },      // 9
  { x: 0, y: 0 },         // 10
  { x: 6.67, y: 0 },      // 11
  { x: 13.33, y: 0 },     // 12
  { x: 20, y: 0 },        // 13 - YELLOW START
  { x: 26.67, y: 0 },     // 14
  { x: 33.33, y: 0 },     // 15
  { x: 40, y: 0 },        // 16
  { x: 46.67, y: 0 },     // 17
  { x: 53.33, y: 0 },     // 18
  { x: 60, y: 0 },        // 19 - corner
  { x: 60, y: 6.67 },     // 20
  { x: 60, y: 13.33 },    // 21 - SAFE
  
  // GREEN path (goes down on right)
  { x: 60, y: 20 },       // 22
  { x: 60, y: 26.67 },    // 23
  { x: 60, y: 33.33 },    // 24
  { x: 60, y: 40 },       // 25
  { x: 60, y: 46.67 },    // 26 - GREEN START
  { x: 60, y: 53.33 },    // 27
  { x: 60, y: 60 },       // 28
  { x: 60, y: 66.67 },    // 29
  { x: 60, y: 73.33 },    // 30
  { x: 60, y: 80 },       // 31
  { x: 60, y: 86.67 },    // 32 - corner
  { x: 53.33, y: 86.67 }, // 33
  { x: 46.67, y: 86.67 }, // 34 - SAFE
  
  // BLUE path (goes left along bottom)
  { x: 40, y: 86.67 },    // 35
  { x: 33.33, y: 86.67 }, // 36
  { x: 26.67, y: 86.67 }, // 37
  { x: 20, y: 86.67 },    // 38
  { x: 13.33, y: 86.67 }, // 39 - BLUE START
  { x: 13.33, y: 80 },    // 40
  { x: 13.33, y: 73.33 }, // 41
  { x: 13.33, y: 66.67 }, // 42
  { x: 13.33, y: 60 },    // 43
  { x: 13.33, y: 53.33 }, // 44
  { x: 13.33, y: 46.67 }, // 45 - corner
  { x: 13.33, y: 40 },    // 46
  { x: 13.33, y: 33.33 }, // 47 - SAFE
  
  // Back to RED (completes circle)
  { x: 13.33, y: 26.67 }, // 48
  { x: 13.33, y: 20 },    // 49
  { x: 13.33, y: 13.33 }, // 50
  { x: 13.33, y: 6.67 }   // 51
];

const HOME_STRETCH = {
  red: [
    { x: 20, y: 60 },      // 0
    { x: 26.67, y: 60 },   // 1
    { x: 33.33, y: 60 },   // 2
    { x: 40, y: 60 },      // 3
    { x: 46.67, y: 60 }    // 4
  ],
  yellow: [
    { x: 26.67, y: 6.67 },   // 0
    { x: 26.67, y: 13.33 },  // 1
    { x: 26.67, y: 20 },     // 2
    { x: 26.67, y: 26.67 },  // 3
    { x: 26.67, y: 33.33 }   // 4
  ],
  green: [
    { x: 53.33, y: 46.67 },  // 0
    { x: 46.67, y: 46.67 },  // 1
    { x: 40, y: 46.67 },     // 2
    { x: 33.33, y: 46.67 },  // 3
    { x: 26.67, y: 46.67 }   // 4
  ],
  blue: [
    { x: 33.33, y: 80 },     // 0
    { x: 33.33, y: 73.33 },  // 1
    { x: 33.33, y: 66.67 },  // 2
    { x: 33.33, y: 60 },     // 3
    { x: 33.33, y: 53.33 }   // 4
  ]
};

const START_POSITIONS = {
  red: 0,
  yellow: 13,
  green: 26,
  blue: 39
};

const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];
const STAR_SPOTS = [5, 18, 31, 44];

// Game State
let peer;
let connections = [];
let gameState = {
  players: [], // [{name, color, avatar, playerId, joined}]
  currentTurn: null,
  gameStarted: false,
  tokens: {},
  diceRoll: null,
  ableTokens: [],
  winner: null
};
let myPlayerId;
let myPlayerIndex = null;
let isAdmin = false;
let gameCode;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  createPathCells();
  checkIfJoining();
}

function setupEventListeners() {
  document.getElementById('adminPassword').addEventListener('input', checkAdminPassword);
  document.getElementById('addPlayer').addEventListener('click', addPlayerSetup);
  document.getElementById('copyLink').addEventListener('click', copyShareLink);
  document.getElementById('whatsappShare').addEventListener('click', shareOnWhatsApp);
  document.getElementById('startGameAdmin').addEventListener('click', startGameAsAdmin);
  document.getElementById('rollDice').addEventListener('click', rollDice);
  document.getElementById('newGame').addEventListener('click', () => location.reload());
}

function checkAdminPassword() {
  const password = document.getElementById('adminPassword').value;
  if (password === ADMIN_PASSWORD) {
    isAdmin = true;
    initializeAdmin();
  }
}

function initializeAdmin() {
  // Use a public PeerJS server with custom config
  peer = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  });
  
  peer.on('open', (id) => {
    myPlayerId = id;
    gameCode = id;
    
    console.log('Peer connected! ID:', id); // Debug
    
    const shareLink = `${window.location.origin}${window.location.pathname}?game=${gameCode}`;
    document.getElementById('shareLink').value = shareLink;
    document.getElementById('playerSetupSection').classList.remove('hidden');
    
    // Add 2 default players
    addPlayerSetup();
    addPlayerSetup();
  });
  
  peer.on('connection', (conn) => {
    console.log('New connection received'); // Debug
    setupConnection(conn);
  });
  
  peer.on('error', (err) => {
    console.error('PeerJS Error:', err);
    alert('Connection error: ' + err.type + '. Try refreshing the page.');
  });
}

let playerCounter = 0;

function addPlayerSetup() {
  if (gameState.players.length >= 4) {
    alert('Maximum 4 players');
    return;
  }
  
  const availableColors = COLORS.filter(c => 
    !gameState.players.find(p => p.color === c)
  );
  
  if (availableColors.length === 0) return;
  
  const playerIndex = playerCounter++;
  const defaultColor = availableColors[0];
  
  const player = {
    name: `Player ${playerIndex + 1}`,
    color: defaultColor,
    avatar: null,
    playerId: null,
    joined: false
  };
  
  gameState.players.push(player);
  renderPlayerSetup();
  updateStartButton();
}

function renderPlayerSetup() {
  const list = document.getElementById('playersSetupList');
  list.innerHTML = '';
  
  gameState.players.forEach((player, index) => {
    const div = document.createElement('div');
    div.className = 'player-setup-item';
    
    const availableColors = COLORS.filter(c => 
      c === player.color || !gameState.players.find(p => p.color === c)
    );
    
    div.innerHTML = `
      <label class="avatar-preview" onclick="document.getElementById('avatar-${index}').click()">
        ${player.avatar ? `<img src="${player.avatar}" alt="Avatar">` : '📷'}
      </label>
      <input type="file" id="avatar-${index}" accept="image/*" onchange="handleAvatarUpload(${index}, event)">
      <input type="text" value="${player.name}" onchange="updatePlayerName(${index}, this.value)" placeholder="Player Name">
      < class="color-" onchange="updatePlayerColor(${index}, this.value)">
        ${availableColors.map(c => `
          <option value="${c}" ${c === player.color ? 'ed' : ''} style="background: ${getColorHex(c)}; color: white;">
            ${c.toUpperCase()}
          </option>
        `).join('')}
      </>
      <button class="btn-remove" onclick="removePlayer(${index})">✕</button>
    `;
    
    if (player.joined) {
      div.style.opacity = '0.7';
      div.style.pointerEvents = 'none';
      const status = document.createElement('span');
      status.textContent = '✓ Joined';
      status.style.color = 'green';
      status.style.fontWeight = 'bold';
      div.appendChild(status);
    }
    
    list.appendChild(div);
  });
}

window.handleAvatarUpload = function(index, event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      gameState.players[index].avatar = e.target.result;
      renderPlayerSetup();
      broadcastGameState();
    };
    reader.readAsDataURL(file);
  }
};

window.updatePlayerName = function(index, name) {
    gameState.players[index].name = name;
    broadcastGameState();
  };
  
  window.updatePlayerColor = function(index, color) {
    gameState.players[index].color = color;
    renderPlayerSetup();
    broadcastGameState();
  };
  
  window.removePlayer = function(index) {
    if (gameState.players[index].joined) {
      alert('Cannot remove player who has already joined');
      return;
    }
    gameState.players.splice(index, 1);
    renderPlayerSetup();
    updateStartButton();
    broadcastGameState();
  };
  
  function updateStartButton() {
    const btn = document.getElementById('startGameAdmin');
    if (gameState.players.length >= 2 && gameState.players.length <= 4) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  }
  
  function startGameAsAdmin() {
    if (gameState.players.length < 2) {
      alert('Need at least 2 players');
      return;
    }
    
    // Initialize tokens for all players
    gameState.players.forEach(player => {
      gameState.tokens[player.color] = [];
      for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
        gameState.tokens[player.color].push({
          id: i,
          position: -1,
          inHomeStretch: false,
          finished: false
        });
      }
    });
    
    gameState.gameStarted = true;
    gameState.currentTurn = gameState.players[0].color;
    
    broadcast({
      type: 'gameStart',
      state: gameState
    });
    
    startGamePlay();
  }
  
  // Networking
  function checkIfJoining() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    
    if (gameParam) {
      joinAsPlayer(gameParam);
    }
  }
  
function joinAsPlayer(code) {
  peer = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  });
  
  peer.on('open', (id) => {
    myPlayerId = id;
    gameCode = code;
    
    console.log('Connecting to:', code); // Debug
    
    const conn = peer.connect(code);
    setupConnection(conn);
  });
  
  peer.on('error', (err) => {
    console.error('PeerJS Error:', err);
    alert('Could not connect: ' + err.type);
  });
}
  
  function setupConnection(conn) {
    conn.on('open', () => {
      connections.push(conn);
      
      if (!isAdmin) {
        conn.send({
          type: 'requestGameState',
          playerId: myPlayerId
        });
      }
    });
    
    conn.on('data', (data) => {
      handleMessage(data, conn);
    });
    
    conn.on('close', () => {
      connections = connections.filter(c => c !== conn);
    });
  }
  
  function handleMessage(data, conn) {
    switch (data.type) {
      case 'requestGameState':
        if (isAdmin) {
          conn.send({
            type: 'gameState',
            state: gameState
          });
        }
        break;
        
      case 'gameState':
        gameState = data.state;
        if (!gameState.gameStarted) {
          showPlayerion();
        } else {
          // Game already started, check if we're in it
          const myPlayer = gameState.players.find(p => p.playerId === myPlayerId);
          if (myPlayer) {
            myPlayerIndex = gameState.players.indexOf(myPlayer);
            startGamePlay();
          } else {
            alert('Game already started');
          }
        }
        break;
        
      case 'playerSelected':
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
        
      case 'gameStart':
        gameState = data.state;
        startGamePlay();
        break;
        
      case 'diceRolled':
        gameState.diceRoll = data.roll;
        gameState.selectableTokens = data.selectableTokens;
        updateDiceDisplay(data.roll);
        highlightSelectableTokens();
        break;
        
      case 'tokenMoved':
        gameState = data.state;
        renderBoard();
        updatePlayersInfo();
        break;
        
      case 'turnChanged':
        gameState.currentTurn = data.turn;
        gameState.selectableTokens = [];
        updateTurnDisplay();
        updatePlayersInfo();
        clearSelectableTokens();
        break;
        
      case 'gameOver':
        gameState.winner = data.winner;
        showWinner(data.winner);
        break;
    }
  }
  
  function showPlayerSelection() {
    showScreen('playerSelect');
    
    const selection = document.getElementById('playerSelection');
    selection.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
      const card = document.createElement('div');
      card.className = `player-card ${player.joined ? 'taken' : ''}`;
      
      card.innerHTML = `
        <div class="player-avatar" style="border-color: ${getColorHex(player.color)}">
          ${player.avatar ? `<img src="${player.avatar}" alt="${player.name}">` : '👤'}
        </div>
        <div class="player-name">${player.name}</div>
        <div class="player-status">${player.joined ? '✓ Taken' : 'Available'}</div>
      `;
      
      if (!player.joined) {
        card.addEventListener('click', () => selectPlayer(index));
      }
      
      selection.appendChild(card);
    });
  }
  
function selectPlayer(index) {
  const card = document.querySelectorAll('.player-card')[index];
  card.classList.add('selected');
  
  myPlayerIndex = index;
  
  broadcast({
    type: 'playerSelected',
    playerIndex: index,
    playerId: myPlayerId
  });
  
  // Disable all cards
  document.querySelectorAll('.player-card').forEach(c => {
    c.style.pointerEvents = 'none';
  });
  
  document.querySelector('.info').textContent = `You are ${gameState.players[index].name}. Waiting for game to start...`;
}
  
  function broadcastGameState() {
    broadcast({
      type: 'gameState',
      state: gameState
    });
  }
  
  function broadcast(data) {
    connections.forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }
  
  // UI Functions
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }
  
  function createPathCells() {
    const pathContainer = document.getElementById('pathContainer');
    
    PATH_POSITIONS.forEach((pos, index) => {
      const cell = document.createElement('div');
      cell.className = 'path-cell';
      cell.style.left = pos.x + '%';
      cell.style.top = pos.y + '%';
      cell.dataset.position = index;
      
      if (SAFE_SPOTS.includes(index)) cell.classList.add('safe');
      if (STAR_SPOTS.includes(index)) cell.classList.add('star');
      if (index === START_POSITIONS.red) cell.classList.add('start-red');
      if (index === START_POSITIONS.green) cell.classList.add('start-green');
      if (index === START_POSITIONS.yellow) cell.classList.add('start-yellow');
      if (index === START_POSITIONS.blue) cell.classList.add('start-blue');
      
      pathContainer.appendChild(cell);
    });
    
    Object.keys(HOME_STRETCH).forEach(color => {
      HOME_STRETCH[color].forEach((pos, index) => {
        const cell = document.createElement('div');
        cell.className = `path-cell home-stretch-${color}`;
        cell.style.left = pos.x + '%';
        cell.style.top = pos.y + '%';
        cell.dataset.homeStretch = color;
        cell.dataset.homePosition = index;
        pathContainer.appendChild(cell);
      });
    });
  }
  
  function startGamePlay() {
  showScreen('gameScreen');
  
  // Find my player index if not set
  if (myPlayerIndex === null) {
    const myPlayer = gameState.players.find(p => p.playerId === myPlayerId);
    if (myPlayer) {
      myPlayerIndex = gameState.players.indexOf(myPlayer);
    }
  }
  
  if (myPlayerIndex !== null) {
    document.getElementById('gameInfo').textContent = `Playing as: ${gameState.players[myPlayerIndex].name}`;
  }
  
  renderBoard();
  updateTurnDisplay();
  updatePlayersInfo();
  
  if (myPlayerIndex !== null) {
    const myColor = gameState.players[myPlayerIndex].color;
    if (gameState.currentTurn === myColor) {
      enableDiceRoll();
    }
  }
}
  
  // Game Logic (same as before)
  function rollDice() {
    const myColor = gameState.players[myPlayerIndex].color;
    if (gameState.currentTurn !== myColor) return;
    
    disableDiceRoll();
    
    const roll = Math.floor(Math.random() * 6) + 1;
    gameState.diceRoll = roll;
    
    updateDiceDisplay(roll);
    
    const selectableTokens = getSelectableTokens(myColor, roll);
    gameState.selectableTokens = selectableTokens;
    
    broadcast({
      type: 'diceRolled',
      roll: roll,
      selectableTokens: selectableTokens
    });
    
    if (selectableTokens.length === 0) {
      setTimeout(() => {
        nextTurn();
      }, 1500);
    } else {
      highlightSelectableTokens();
    }
  }
  
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
  
  function highlightSelectableTokens() {
    clearSelectableTokens();
    
    const myColor = gameState.players[myPlayerIndex].color;
    
    gameState.selectableTokens.forEach(tokenId => {
      const token = gameState.tokens[myColor][tokenId];
      
      if (token.position === -1) {
        const homeToken = document.querySelector(
          `.home-tokens[data-color="${myColor}"] .home-token[data-token="${tokenId}"]`
        );
        if (homeToken) {
          homeToken.classList.add('selectable');
          homeToken.addEventListener('click', () => moveTokenFromHome(tokenId));
        }
      } else {
        const tokenEl = document.querySelector(
          `.token.${myColor}[data-token="${tokenId}"]`
        );
        if (tokenEl) {
          tokenEl.classList.add('selectable');
          tokenEl.addEventListener('click', () => moveToken(tokenId));
        }
      }
    });
  }
  
  function clearSelectableTokens() {
    document.querySelectorAll('.selectable').forEach(el => {
      el.classList.remove('selectable');
      el.replaceWith(el.cloneNode(true));
    });
  }
  
  function moveTokenFromHome(tokenId) {
    const myColor = gameState.players[myPlayerIndex].color;
    if (gameState.currentTurn !== myColor) return;
    if (!gameState.selectableTokens.includes(tokenId)) return;
    
    const token = gameState.tokens[myColor][tokenId];
    const startPos = START_POSITIONS[myColor];
    
    const occupyingToken = findTokenAtPosition(myColor, startPos, false);
    if (occupyingToken !== null) {
      alert('Starting position blocked!');
      return;
    }
    
    const capturedToken = findOpponentTokenAtPosition(startPos, false);
    if (capturedToken) {
      captureToken(capturedToken.color, capturedToken.tokenId);
    }
    
    token.position = startPos;
    token.inHomeStretch = false;
    
    clearSelectableTokens();
    
    broadcast({
      type: 'tokenMoved',
      state: gameState
    });
    
    renderBoard();
    
    if (gameState.diceRoll === 6) {
      setTimeout(() => enableDiceRoll(), 500);
    } else {
      setTimeout(() => nextTurn(), 1000);
    }
  }
  
  function moveToken(tokenId) {
    const myColor = gameState.players[myPlayerIndex].color;
    if (gameState.currentTurn !== myColor) return;
    if (!gameState.selectableTokens.includes(tokenId)) return;
    
    const token = gameState.tokens[myColor][tokenId];
    const roll = gameState.diceRoll;
    
    if (token.inHomeStretch) {
      const newPos = token.position + roll;
      
      if (newPos === 6) {
        token.finished = true;
        token.position = 6;
        checkForWinner();
      } else if (newPos < 6) {
        token.position = newPos;
      } else {
        alert('Exact roll needed!');
        return;
      }
    } else {
      let newPos = token.position + roll;
      const homeStretchEntry = (START_POSITIONS[myColor] + 50) % 52;
      
      if (token.position < homeStretchEntry && newPos >= homeStretchEntry) {
        const overflow = newPos - homeStretchEntry;
        token.position = overflow;
        token.inHomeStretch = true;
      } else {
        newPos = newPos % 52;
        
        const occupyingToken = findTokenAtPosition(myColor, newPos, false);
        if (occupyingToken !== null && occupyingToken !== tokenId) {
          alert('Blocked by your token!');
          return;
        }
        
        token.position = newPos;
        
        if (!SAFE_SPOTS.includes(newPos)) {
          const capturedToken = findOpponentTokenAtPosition(newPos, false);
          if (capturedToken) {
            captureToken(capturedToken.color, capturedToken.tokenId);
          }
        }
      }
    }
    
    clearSelectableTokens();
    
    broadcast({
      type: 'tokenMoved',
      state: gameState
    });
    
    renderBoard();
    
    if (gameState.diceRoll === 6) {
      setTimeout(() => enableDiceRoll(), 500);
    } else {
      setTimeout(() => nextTurn(), 1000);
    }
  }
  
  function findTokenAtPosition(color, position, inHomeStretch) {
    const tokens = gameState.tokens[color];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].position === position && 
          tokens[i].inHomeStretch === inHomeStretch &&
          !tokens[i].finished) {
        return i;
      }
    }
    return null;
  }
  
  function findOpponentTokenAtPosition(position, inHomeStretch) {
    const myColor = gameState.players[myPlayerIndex].color;
    
    for (const color in gameState.tokens) {
      if (color === myColor) continue;
      
      const tokens = gameState.tokens[color];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].position === position && 
            tokens[i].inHomeStretch === inHomeStretch &&
            !tokens[i].finished) {
          return { color, tokenId: i };
        }
      }
    }
    return null;
  }
  
  function captureToken(color, tokenId) {
    gameState.tokens[color][tokenId].position = -1;
    gameState.tokens[color][tokenId].inHomeStretch = false;
  }
  
  function checkForWinner() {
    const myColor = gameState.players[myPlayerIndex].color;
    const tokens = gameState.tokens[myColor];
    const allFinished = tokens.every(t => t.finished);
    
    if (allFinished) {
      broadcast({
        type: 'gameOver',
        winner: myColor
      });
      showWinner(myColor);
    }
  }
  
  function nextTurn() {
    const currentIndex = gameState.players.findIndex(p => p.color === gameState.currentTurn);
    const nextIndex = (currentIndex + 1) % gameState.players.length;
    gameState.currentTurn = gameState.players[nextIndex].color;
    
    broadcast({
      type: 'turnChanged',
      turn: gameState.currentTurn
    });
    
    updateTurnDisplay();
    updatePlayersInfo();
    
    const myColor = gameState.players[myPlayerIndex].color;
    if (gameState.currentTurn === myColor) {
      enableDiceRoll();
    }
  }
  
  function renderBoard() {
    document.querySelectorAll('.token').forEach(t => t.remove());
    
    for (const color in gameState.tokens) {
      gameState.tokens[color].forEach((token, index) => {
        if (token.position === -1) {
          const homeToken = document.querySelector(
            `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
          );
          if (homeToken) homeToken.classList.add('has-token');
        } else {
          const homeToken = document.querySelector(
            `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
          );
          if (homeToken) homeToken.classList.remove('has-token');
        }
      });
    }
    
    for (const color in gameState.tokens) {
      gameState.tokens[color].forEach((token, index) => {
        if (token.position >= 0 && !token.finished) {
          const tokenEl = document.createElement('div');
          tokenEl.className = `token ${color}`;
          tokenEl.dataset.token = index;
          
          let targetCell;
          
          if (token.inHomeStretch) {
            targetCell = document.querySelector(
              `.path-cell[data-home-stretch="${color}"][data-home-position="${token.position}"]`
            );
          } else {
            targetCell = document.querySelector(
              `.path-cell[data-position="${token.position}"]`
            );
          }
          
          if (targetCell) {
            const existingTokens = targetCell.querySelectorAll('.token');
            if (existingTokens.length > 0) {
              tokenEl.style.transform = `translate(-50%, -50%) translate(${existingTokens.length * 3}px, ${existingTokens.length * 3}px)`;
              tokenEl.style.zIndex = 10 + existingTokens.length;
            }
            
            targetCell.appendChild(tokenEl);
          }
        }
      });
    }
  }
  
  function updateDiceDisplay(roll) {
    const diceDisplay = document.getElementById('diceDisplay');
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    diceDisplay.textContent = diceEmojis[roll - 1];
    diceDisplay.style.animation = 'none';
    setTimeout(() => {
      diceDisplay.style.animation = 'diceRoll 0.5s ease-in-out';
    }, 10);
  }
  
  function updateTurnDisplay() {
    const turnDisplay = document.getElementById('currentTurn');
    const player = gameState.players.find(p => p.color === gameState.currentTurn);
    
    if (player) {
      turnDisplay.textContent = `Current Turn: ${player.name}`;
      turnDisplay.style.color = getColorHex(player.color);
      turnDisplay.style.fontWeight = 'bold';
    }
  }
  
  function updatePlayersInfo() {
    const playersInfo = document.getElementById('playersInfo');
    playersInfo.innerHTML = '<h3>Players</h3>';
    
    gameState.players.forEach(player => {
      const tokens = gameState.tokens[player.color];
      const finishedCount = tokens.filter(t => t.finished).length;
      const onBoardCount = tokens.filter(t => t.position >= 0 && !t.finished).length;
      const inHomeCount = TOKENS_PER_PLAYER - onBoardCount - finishedCount;
      
      const div = document.createElement('div');
      div.className = 'player-info-item';
      if (player.color === gameState.currentTurn) {
        div.classList.add('active');
      }
      
      div.innerHTML = `
        <div class="player-info-name">
          ${player.avatar ? `<img src="${player.avatar}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` : ''}
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
    const rollBtn = document.getElementById('rollDice');
    rollBtn.disabled = false;
  }
  
  function disableDiceRoll() {
    const rollBtn = document.getElementById('rollDice');
    rollBtn.disabled = true;
  }
  
  function showWinner(winnerColor) {
    const player = gameState.players.find(p => p.color === winnerColor);
    
    const winnerInfo = document.getElementById('winnerInfo');
    winnerInfo.innerHTML = `
      <div style="font-size: 48px; margin: 20px 0;">
        ${player.avatar ? `<img src="${player.avatar}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 5px solid ${getColorHex(winnerColor)};">` : 
        `<div class="player-color-dot" style="background: ${getColorHex(winnerColor)}; width: 120px; height: 120px; margin: 0 auto 20px;"></div>`}
      </div>
      <h2>${player.name} Wins!</h2>
      <p style="color: ${getColorHex(winnerColor)}; font-size: 24px; margin-top: 10px;">
        ${winnerColor.toUpperCase()} Victory! 🎉
      </p>
    `;
    
    setTimeout(() => {
      showScreen('winnerScreen');
    }, 2000);
  }
  
  function getColorHex(color) {
    const colors = {
      red: '#c92a2a',
      green: '#2f9e44',
      yellow: '#f59f00',
      blue: '#1971c2'
    };
    return colors[color] || '#000';
  }
  
  function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // For mobile
    
    navigator.clipboard.writeText(shareLink.value).then(() => {
      const btn = document.getElementById('copyLink');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      document.execCommand('copy');
      const btn = document.getElementById('copyLink');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  }
  
  function shareOnWhatsApp() {
    const shareLink = document.getElementById('shareLink').value;
    const message = encodeURIComponent(`🎲 Join our Family Ludo game!\n\nClick here to play: ${shareLink}`);
    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `whatsapp://send?text=${message}`;
    } else {
      window.open(`https://web.whatsapp.com/send?text=${message}`, '_blank');
    }
  }
