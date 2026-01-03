// Game Configuration
const COLORS = ['red', 'green', 'yellow', 'blue'];
const TOKENS_PER_PLAYER = 4;
const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47]; // Starting positions for each color
const STAR_SPOTS = [5, 18, 31, 44];

// Path coordinates for the board (52 cells around the board)
const PATH_POSITIONS = [
  // Red starting column (bottom-left going up)
  { x: 13.33, y: 86.67 }, { x: 13.33, y: 80 }, { x: 13.33, y: 73.33 },
  { x: 13.33, y: 66.67 }, { x: 13.33, y: 60 },
  // Turn to horizontal (going left)
  { x: 6.67, y: 60 }, { x: 0, y: 60 },
  // Top-left corner (going right)
  { x: 0, y: 53.33 }, { x: 0, y: 46.67 }, { x: 0, y: 40 },
  // Yellow starting row (going right)
  { x: 6.67, y: 40 }, { x: 13.33, y: 40 }, { x: 13.33, y: 33.33 },
  { x: 13.33, y: 26.67 }, { x: 13.33, y: 20 }, { x: 13.33, y: 13.33 },
  { x: 13.33, y: 6.67 }, { x: 13.33, y: 0 },
  // Top middle (going right)
  { x: 20, y: 0 }, { x: 26.67, y: 0 }, { x: 33.33, y: 0 },
  // Green starting column (going down)
  { x: 40, y: 0 }, { x: 40, y: 6.67 }, { x: 40, y: 13.33 },
  { x: 40, y: 20 }, { x: 40, y: 26.67 },
  // Turn to horizontal (going right)
  { x: 46.67, y: 26.67 }, { x: 53.33, y: 26.67 },
  // Top-right corner (going down)
  { x: 60, y: 26.67 }, { x: 60, y: 33.33 }, { x: 60, y: 40 },
  // Blue starting row (going down)
  { x: 53.33, y: 40 }, { x: 46.67, y: 40 }, { x: 46.67, y: 46.67 },
  { x: 46.67, y: 53.33 }, { x: 46.67, y: 60 }, { x: 46.67, y: 66.67 },
  { x: 46.67, y: 73.33 }, { x: 46.67, y: 80 },
  // Bottom middle (going left)
  { x: 40, y: 86.67 }, { x: 33.33, y: 86.67 }, { x: 26.67, y: 86.67 },
  // Red starting row (going up)
  { x: 20, y: 86.67 }, { x: 20, y: 80 }, { x: 20, y: 73.33 },
  { x: 20, y: 66.67 }, { x: 20, y: 60 },
  // Turn to home stretch
  { x: 26.67, y: 60 }, { x: 33.33, y: 60 }
];

// Home stretch positions (5 cells leading to center for each color)
const HOME_STRETCH = {
  red: [
    { x: 26.67, y: 80 }, { x: 26.67, y: 73.33 }, { x: 26.67, y: 66.67 },
    { x: 26.67, y: 60 }, { x: 26.67, y: 53.33 }
  ],
  green: [
    { x: 26.67, y: 6.67 }, { x: 26.67, y: 13.33 }, { x: 26.67, y: 20 },
    { x: 26.67, y: 26.67 }, { x: 26.67, y: 33.33 }
  ],
  yellow: [
    { x: 6.67, y: 33.33 }, { x: 13.33, y: 33.33 }, { x: 20, y: 33.33 },
    { x: 26.67, y: 33.33 }, { x: 33.33, y: 33.33 }
  ],
  blue: [
    { x: 53.33, y: 53.33 }, { x: 46.67, y: 53.33 }, { x: 40, y: 53.33 },
    { x: 33.33, y: 53.33 }, { x: 26.67, y: 53.33 }
  ]
};

// Starting positions on main path for each color
const START_POSITIONS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Game State
let peer;
let connections = [];
let gameState = {
  players: {},
  currentTurn: null,
  gameStarted: false,
  tokens: {},
  diceRoll: null,
  selectableTokens: [],
  winner: null
};
let myPlayerId;
let myColor;
let isHost = false;
let gameCode;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupEventListeners();
  createPathCells();
}

function setupEventListeners() {
  document.getElementById('createGame').addEventListener('click', createGame);
  document.getElementById('joinGame').addEventListener('click', joinGame);
  document.getElementById('copyLink').addEventListener('click', copyShareLink);
  document.getElementById('whatsappShare').addEventListener('click', shareOnWhatsApp);
  document.getElementById('startGame').addEventListener('click', startGame);
  document.getElementById('rollDice').addEventListener('click', rollDice);
  document.getElementById('newGame').addEventListener('click', () => location.reload());

  // Color selection
  const colorSelection = document.getElementById('colorSelection');
  COLORS.forEach(color => {
    const div = document.createElement('div');
    div.className = `color-option ${color}`;
    div.style.background = getColorHex(color);
    div.dataset.color = color;
    div.addEventListener('click', () => selectColor(color));
    colorSelection.appendChild(div);
  });
}

function createPathCells() {
  const pathContainer = document.getElementById('pathContainer');
  
  // Create main path cells
  PATH_POSITIONS.forEach((pos, index) => {
    const cell = document.createElement('div');
    cell.className = 'path-cell';
    cell.style.left = pos.x + '%';
    cell.style.top = pos.y + '%';
    cell.dataset.position = index;
    
    // Mark safe spots
    if (SAFE_SPOTS.includes(index)) {
      cell.classList.add('safe');
    }
    
    // Mark star spots
    if (STAR_SPOTS.includes(index)) {
      cell.classList.add('star');
    }
    
    // Mark starting positions
    if (index === START_POSITIONS.red) cell.classList.add('start-red');
    if (index === START_POSITIONS.green) cell.classList.add('start-green');
    if (index === START_POSITIONS.yellow) cell.classList.add('start-yellow');
    if (index === START_POSITIONS.blue) cell.classList.add('start-blue');
    
    pathContainer.appendChild(cell);
  });
  
  // Create home stretch cells
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

// Networking Functions
function createGame() {
  peer = new Peer();
  
  peer.on('open', (id) => {
    myPlayerId = id;
    gameCode = id.substring(0, 8);
    isHost = true;
    
    const shareLink = `${window.location.origin}${window.location.pathname}?game=${gameCode}`;
    document.getElementById('shareLink').value = shareLink;
    document.getElementById('shareSection').classList.remove('hidden');
    
    showScreen('setup');
    document.getElementById('gameCode-display').textContent = `Game Code: ${gameCode}`;
  });
  
  peer.on('connection', (conn) => {
    setupConnection(conn);
  });
  
  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    alert('Connection error. Please try again.');
  });
}

function joinGame() {
  const code = document.getElementById('gameCode').value.trim();
  if (!code) {
    alert('Please enter a game code');
    return;
  }
  
  peer = new Peer();
  
  peer.on('open', (id) => {
    myPlayerId = id;
    gameCode = code;
    
    // Connect to host
    const conn = peer.connect(code);
    setupConnection(conn);
    
    showScreen('setup');
  });
  
  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    alert('Could not connect to game. Please check the code and try again.');
  });
}

function setupConnection(conn) {
  conn.on('open', () => {
    connections.push(conn);
    
    // Send initial player info
    if (!isHost) {
      conn.send({
        type: 'join',
        playerId: myPlayerId
      });
    }
  });
  
  conn.on('data', (data) => {
    handleMessage(data, conn);
  });
  
  conn.on('close', () => {
    connections = connections.filter(c => c !== conn);
    handlePlayerDisconnect(conn.peer);
  });
}

function handleMessage(data, conn) {
  switch (data.type) {
    case 'join':
      if (isHost) {
        // Send current game state to new player
        conn.send({
          type: 'gameState',
          state: gameState
        });
        
        // Broadcast new player to others
        broadcastToOthers({
          type: 'playerJoined',
          playerId: data.playerId
        }, conn);
      }
      break;
      
    case 'gameState':
      gameState = data.state;
      updatePlayersDisplay();
      updateColorSelection();
      break;
      
    case 'playerJoined':
      updatePlayersDisplay();
      break;
      
    case 'colorSelected':
      if (isHost) {
        if (!gameState.players[data.playerId]) {
          gameState.players[data.playerId] = {
            id: data.playerId,
            name: data.name,
            color: data.color
          };
          
          // Initialize tokens for this player
          gameState.tokens[data.color] = [];
          for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
            gameState.tokens[data.color].push({
              id: i,
              position: -1, // -1 means in home
              inHomeStretch: false,
              finished: false
            });
          }
          
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

function broadcastToOthers(data, excludeConn) {
  connections.forEach(conn => {
    if (conn !== excludeConn && conn.open) {
      conn.send(data);
    }
  });
}

// UI Functions
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function selectColor(color) {
  const option = document.querySelector(`.color-option[data-color="${color}"]`);
  if (option.classList.contains('disabled')) return;
  
  // Clear previous selection
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  option.classList.add('selected');
  myColor = color;
  
  const name = document.getElementById('playerName').value.trim() || 'Player';
  
  if (isHost) {
    gameState.players[myPlayerId] = {
      id: myPlayerId,
      name: name,
      color: color
    };
    
    // Initialize tokens
    gameState.tokens[color] = [];
    for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
      gameState.tokens[color].push({
        id: i,
        position: -1,
        inHomeStretch: false,
        finished: false
      });
    }
    
    broadcastGameState();
  } else {
    broadcast({
      type: 'colorSelected',
      playerId: myPlayerId,
      name: name,
      color: color
    });
  }
  
  updatePlayersDisplay();
  updateStartButton();
}

function updateColorSelection() {
  const takenColors = Object.values(gameState.players).map(p => p.color);
  
  document.querySelectorAll('.color-option').forEach(opt => {
    const color = opt.dataset.color;
    if (takenColors.includes(color) && color !== myColor) {
      opt.classList.add('disabled');
    } else {
      opt.classList.remove('disabled');
    }
  });
}

function updatePlayersDisplay() {
  const playersList = document.getElementById('playersList');
  playersList.innerHTML = '';
  
  Object.values(gameState.players).forEach(player => {
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `
      <div class="player-color-dot" style="background: ${getColorHex(player.color)}"></div>
      <span>${player.name}</span>
    `;
    playersList.appendChild(div);
  });
  
  updateColorSelection();
  updateStartButton();
}

function updateStartButton() {
    const playerCount = Object.keys(gameState.players).length;
    const startBtn = document.getElementById('startGame');
    
    if (isHost && playerCount >= 2 && playerCount <= 4 && myColor) {
      startBtn.disabled = false;
    } else {
      startBtn.disabled = true;
    }
  }
  
  function startGame() {
    if (!isHost) return;
    
    const playerCount = Object.keys(gameState.players).length;
    if (playerCount < 2 || playerCount > 4) {
      alert('Need 2-4 players to start');
      return;
    }
    
    gameState.gameStarted = true;
    
    // Set turn order based on colors
    const playerColors = Object.values(gameState.players).map(p => p.color);
    const turnOrder = COLORS.filter(c => playerColors.includes(c));
    gameState.currentTurn = turnOrder[0];
    
    broadcast({
      type: 'gameStart',
      state: gameState
    });
    
    startGamePlay();
  }
  
  function startGamePlay() {
    showScreen('gameScreen');
    document.getElementById('gameCode-display').textContent = `Game Code: ${gameCode}`;
    renderBoard();
    updateTurnDisplay();
    updatePlayersInfo();
    
    if (gameState.currentTurn === myColor) {
      enableDiceRoll();
    }
  }
  
  // Game Logic Functions
  function rollDice() {
    if (gameState.currentTurn !== myColor) return;
    
    disableDiceRoll();
    
    const roll = Math.floor(Math.random() * 6) + 1;
    gameState.diceRoll = roll;
    
    updateDiceDisplay(roll);
    
    // Determine which tokens can move
    const selectableTokens = getSelectableTokens(myColor, roll);
    gameState.selectableTokens = selectableTokens;
    
    if (isHost) {
      broadcast({
        type: 'diceRolled',
        roll: roll,
        selectableTokens: selectableTokens
      });
    } else {
      broadcast({
        type: 'diceRolled',
        roll: roll,
        selectableTokens: selectableTokens
      });
    }
    
    if (selectableTokens.length === 0) {
      // No valid moves, pass turn
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
      
      // Token in home
      if (token.position === -1) {
        if (roll === 6) {
          selectable.push(index);
        }
      } else if (token.inHomeStretch) {
        // Token in home stretch
        const newPos = token.position + roll;
        if (newPos <= 5) { // 5 cells in home stretch + center
          selectable.push(index);
        }
      } else {
        // Token on main path
        selectable.push(index);
      }
    });
    
    return selectable;
  }
  
  function highlightSelectableTokens() {
    clearSelectableTokens();
    
    gameState.selectableTokens.forEach(tokenId => {
      const token = gameState.tokens[myColor][tokenId];
      
      if (token.position === -1) {
        // Highlight home token
        const homeToken = document.querySelector(
          `.home-tokens[data-color="${myColor}"] .home-token[data-token="${tokenId}"]`
        );
        if (homeToken) {
          homeToken.classList.add('selectable');
          homeToken.addEventListener('click', () => moveTokenFromHome(tokenId));
        }
      } else {
        // Highlight token on board
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
      el.replaceWith(el.cloneNode(true)); // Remove event listeners
    });
  }
  
  function moveTokenFromHome(tokenId) {
    if (gameState.currentTurn !== myColor) return;
    if (!gameState.selectableTokens.includes(tokenId)) return;
    
    const token = gameState.tokens[myColor][tokenId];
    const startPos = START_POSITIONS[myColor];
    
    // Check if starting position is occupied by own token
    const occupyingToken = findTokenAtPosition(myColor, startPos, false);
    if (occupyingToken !== null) {
      alert('Starting position is blocked by your own token!');
      return;
    }
    
    // Check if opponent token is at starting position
    const capturedToken = findOpponentTokenAtPosition(startPos, false);
    if (capturedToken) {
      captureToken(capturedToken.color, capturedToken.tokenId);
    }
    
    token.position = startPos;
    token.inHomeStretch = false;
    
    clearSelectableTokens();
    
    if (isHost) {
      broadcastGameState();
    } else {
      broadcast({
        type: 'tokenMoved',
        state: gameState
      });
    }
    
    renderBoard();
    
    // Check for extra turn (rolled 6)
    if (gameState.diceRoll === 6) {
      setTimeout(() => {
        enableDiceRoll();
      }, 500);
    } else {
      setTimeout(() => {
        nextTurn();
      }, 1000);
    }
  }
  
  function moveToken(tokenId) {
    if (gameState.currentTurn !== myColor) return;
    if (!gameState.selectableTokens.includes(tokenId)) return;
    
    const token = gameState.tokens[myColor][tokenId];
    const roll = gameState.diceRoll;
    
    if (token.inHomeStretch) {
      // Move in home stretch
      const newPos = token.position + roll;
      
      if (newPos === 6) {
        // Token reaches center (finished)
        token.finished = true;
        token.position = 6;
        
        checkForWinner();
      } else if (newPos < 6) {
        token.position = newPos;
      } else {
        alert('Exact roll needed to finish!');
        return;
      }
    } else {
      // Move on main path
      let newPos = token.position + roll;
      
      // Check if token should enter home stretch
      const homeStretchEntry = (START_POSITIONS[myColor] + 50) % 52;
      
      if (token.position < homeStretchEntry && newPos >= homeStretchEntry) {
        // Enter home stretch
        const overflow = newPos - homeStretchEntry;
        token.position = overflow;
        token.inHomeStretch = true;
      } else {
        newPos = newPos % 52;
        
        // Check if position is occupied by own token
        const occupyingToken = findTokenAtPosition(myColor, newPos, false);
        if (occupyingToken !== null && occupyingToken !== tokenId) {
          alert('Position is blocked by your own token!');
          return;
        }
        
        token.position = newPos;
        
        // Check for capture (only if not on safe spot)
        if (!SAFE_SPOTS.includes(newPos)) {
          const capturedToken = findOpponentTokenAtPosition(newPos, false);
          if (capturedToken) {
            captureToken(capturedToken.color, capturedToken.tokenId);
          }
        }
      }
    }
    
    clearSelectableTokens();
    
    if (isHost) {
      broadcastGameState();
    } else {
      broadcast({
        type: 'tokenMoved',
        state: gameState
      });
    }
    
    renderBoard();
    
    // Check for extra turn (rolled 6 or captured)
    if (gameState.diceRoll === 6) {
      setTimeout(() => {
        enableDiceRoll();
      }, 500);
    } else {
      setTimeout(() => {
        nextTurn();
      }, 1000);
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
    const tokens = gameState.tokens[myColor];
    const allFinished = tokens.every(t => t.finished);
    
    if (allFinished) {
      if (isHost) {
        broadcast({
          type: 'gameOver',
          winner: myColor
        });
      } else {
        broadcast({
          type: 'gameOver',
          winner: myColor
        });
      }
      
      showWinner(myColor);
    }
  }
  
  function nextTurn() {
    const playerColors = Object.values(gameState.players).map(p => p.color);
    const turnOrder = COLORS.filter(c => playerColors.includes(c));
    
    const currentIndex = turnOrder.indexOf(gameState.currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    gameState.currentTurn = turnOrder[nextIndex];
    
    if (isHost) {
      broadcast({
        type: 'turnChanged',
        turn: gameState.currentTurn
      });
    } else {
      broadcast({
        type: 'turnChanged',
        turn: gameState.currentTurn
      });
    }
    
    updateTurnDisplay();
    updatePlayersInfo();
    
    if (gameState.currentTurn === myColor) {
      enableDiceRoll();
    }
  }
  
  // Rendering Functions
  function renderBoard() {
    // Clear existing tokens on board
    document.querySelectorAll('.token').forEach(t => t.remove());
    
    // Update home tokens
    for (const color in gameState.tokens) {
      gameState.tokens[color].forEach((token, index) => {
        if (token.position === -1) {
          // Token in home
          const homeToken = document.querySelector(
            `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
          );
          if (homeToken) {
            homeToken.classList.add('has-token');
          }
        } else {
          // Remove from home display
          const homeToken = document.querySelector(
            `.home-tokens[data-color="${color}"] .home-token[data-token="${index}"]`
          );
          if (homeToken) {
            homeToken.classList.remove('has-token');
          }
        }
      });
    }
    
    // Render tokens on board
    for (const color in gameState.tokens) {
      gameState.tokens[color].forEach((token, index) => {
        if (token.position >= 0 && !token.finished) {
          const tokenEl = document.createElement('div');
          tokenEl.className = `token ${color}`;
          tokenEl.dataset.token = index;
          
          let targetCell;
          
          if (token.inHomeStretch) {
            // Token in home stretch
            targetCell = document.querySelector(
              `.path-cell[data-home-stretch="${color}"][data-home-position="${token.position}"]`
            );
          } else {
            // Token on main path
            targetCell = document.querySelector(
              `.path-cell[data-position="${token.position}"]`
            );
          }
          
          if (targetCell) {
            // Check if multiple tokens at same position
            const existingTokens = targetCell.querySelectorAll('.token');
            if (existingTokens.length > 0) {
              // Stack tokens slightly offset
              tokenEl.style.transform = `translate(-50%, -50%) translate(${existingTokens.length * 3}px, ${existingTokens.length * 3}px)`;
              tokenEl.style.zIndex = 10 + existingTokens.length;
            }
            
            targetCell.appendChild(tokenEl);
          }
        } else if (token.finished && token.position === 6) {
          // Token finished - show in center
          // You can add visual representation in center if desired
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
    const player = Object.values(gameState.players).find(p => p.color === gameState.currentTurn);
    
    if (player) {
      turnDisplay.textContent = `Current Turn: ${player.name} (${player.color})`;
      turnDisplay.style.color = getColorHex(player.color);
    }
  }
  
  function updatePlayersInfo() {
    const playersInfo = document.getElementById('playersInfo');
    playersInfo.innerHTML = '<h3>Players</h3>';
    
    Object.values(gameState.players).forEach(player => {
      const tokens = gameState.tokens[player.color];
      const finishedCount = tokens.filter(t => t.finished).length;
      const onBoardCount = tokens.filter(t => t.position >= 0 && !t.finished).length;
      
      const div = document.createElement('div');
      div.className = 'player-info-item';
      if (player.color === gameState.currentTurn) {
        div.classList.add('active');
      }
      
      div.innerHTML = `
        <div class="player-info-name">
          <div class="player-color-dot" style="background: ${getColorHex(player.color)}"></div>
          <span>${player.name}</span>
        </div>
        <div class="player-info-tokens">
          🏠 ${TOKENS_PER_PLAYER - onBoardCount - finishedCount} | 
          🎯 ${onBoardCount} | 
          ✅ ${finishedCount}
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
    const player = Object.values(gameState.players).find(p => p.color === winnerColor);
    
    const winnerInfo = document.getElementById('winnerInfo');
    winnerInfo.innerHTML = `
      <div style="font-size: 48px; margin: 20px 0;">
        <div class="player-color-dot" style="background: ${getColorHex(winnerColor)}; width: 60px; height: 60px; margin: 0 auto 20px;"></div>
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
  
  // Helper Functions
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
    document.execCommand('copy');
    
    const btn = document.getElementById('copyLink');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  }
  
  function shareOnWhatsApp() {
    const shareLink = document.getElementById('shareLink').value;
    const message = encodeURIComponent(`Join my Ludo game! ${shareLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }
  
  function handlePlayerDisconnect(playerId) {
    if (gameState.players[playerId]) {
      delete gameState.players[playerId];
      updatePlayersDisplay();
      
      if (gameState.gameStarted) {
        alert('A player has disconnected. Game may be affected.');
      }
    }
  }
  
  // Handle URL parameters for joining via link
  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    
    if (gameParam) {
      document.getElementById('gameCode').value = gameParam;
    }
  });
