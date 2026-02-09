const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameTitleDisplay = document.getElementById('game-title-display');

// Schermate
const mainMenu = document.getElementById('main-menu');
const gameSelector = document.getElementById('game-selector');
const snakeDifficultyScreen = document.getElementById('snake-difficulty');
const gameWrapper = document.getElementById('game-wrapper');
const leaderboardScreen = document.getElementById('leaderboard-screen');

// Input Nome
const playerNameInput = document.getElementById('player-name-input');
let currentPlayerName = "PLAYER";

// Pulsanti Navigazione
const btnDesktop = document.getElementById('btn-desktop');
const btnMobile = document.getElementById('btn-mobile');

// Pulsanti Selezione Gioco
const btnPreSnake = document.getElementById('btn-pre-snake');
const btnPlayPong = document.getElementById('btn-play-pong');
const btnPlayTetris = document.getElementById('btn-play-tetris');
const btnPlayInvaders = document.getElementById('btn-play-invaders');

// Leaderboard
const btnShowLeaderboardMain = document.getElementById('btn-show-leaderboard-main');
const btnBackFromLeaderboard = document.getElementById('back-from-leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const tabSnake = document.getElementById('tab-snake');
const tabPong = document.getElementById('tab-pong');
const tabTetris = document.getElementById('tab-tetris');
const tabInvaders = document.getElementById('tab-invaders');

// Pulsanti Difficoltà Snake
const btnSnakeNormal = document.getElementById('btn-snake-normal');
const btnSnakeHard = document.getElementById('btn-snake-hard');
const btnBackToGames = document.getElementById('back-to-games');

const btnBackToMain = document.getElementById('back-to-main');
const btnExitGame = document.getElementById('exit-game-btn');
const btnRetry = document.getElementById('retry-btn');

// Audio
const btnMusicToggle = document.getElementById('btn-music-toggle');
const bgMusic = document.getElementById('bg-music');
let isMusicOn = true;

// UI Gioco
const mobileControls = document.getElementById('mobile-controls');
const desktopHint = document.getElementById('desktop-hint');

// Pulsanti Mobile
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

// STATO DEL SISTEMA
let currentGame = null; 
let currentMode = null; 
let gameInterval;
let isGameRunning = false;

// --- VARIABILI SNAKE ---
let gridSize = 20;
let tileCountX = 20; 
let tileCountY = 20;
let snake = [];
let food = {x: 15, y: 15};
let velocityX = 0;
let velocityY = 0;
let snakeScore = 0;
let snakeSpeed = 150;

// --- VARIABILI PONG ---
let paddleHeight = 80;
let paddleWidth = 10;
let paddle1Y = 150; 
let paddle2Y = 150; 
let ballX = 200;
let ballY = 200;
let ballSpeedX = 5;
let ballSpeedY = 5;
let pongScore = 0;

// --- VARIABILI TETRIS ---
const tetrisRow = 21.5; // Test correzione (def 24)
const tetrisCol = 12;
let tetrisArena = [];
let tetrisPlayer = { pos: {x: 0, y: 0}, matrix: null };
let dropCounter = 0;
let dropInterval = 600; 
let lastTime = 0;
let tetrisScore = 0;
const TETRIS_COLORS = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

// --- VARIABILI INVADERS ---
let invPlayer = { x: 0, y: 0, w: 30, h: 20, speed: 5 };
let invBullets = [];
let invEnemies = [];
let invEnemyRows = 4;
let invEnemyCols = 8;
let invEnemyDir = 1; 
let invEnemySpeed = 1; 
let invEnemyDrop = 10; 
let invScore = 0;

// ====
// GESTIONE MENU E NAVIGAZIONE
// ====

btnDesktop.addEventListener('click', () => setInterface('desktop'));
btnMobile.addEventListener('click', () => setInterface('mobile'));

function setInterface(mode) {
    currentMode = mode;
    mainMenu.classList.add('hidden');
    gameSelector.classList.remove('hidden'); 
    
    if (isMusicOn) {
        bgMusic.volume = 0.5;
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => { console.log("Musica avviata."); })
            .catch(error => {
                console.log("Audio bloccato:", error);
                document.addEventListener('click', forceAudioStart, { once: true });
            });
        }
    }
}

function forceAudioStart() {
    if (isMusicOn && bgMusic.paused) { bgMusic.play(); }
}

// Controllo Nome
function checkName() {
    const name = playerNameInput.value.trim();
    if (name === "") {
        alert("INSERISCI UN NOME PER GIOCARE!");
        return false;
    }
    currentPlayerName = name.toUpperCase();
    return true;
}

// Navigazione
btnPreSnake.addEventListener('click', () => {
    if(!checkName()) return;
    gameSelector.classList.add('hidden');
    snakeDifficultyScreen.classList.remove('hidden');
});

btnSnakeNormal.addEventListener('click', () => { snakeSpeed = 150; initGame('snake'); });
btnSnakeHard.addEventListener('click', () => { snakeSpeed = 70; initGame('snake'); });

btnBackToGames.addEventListener('click', () => {
    snakeDifficultyScreen.classList.add('hidden');
    gameSelector.classList.remove('hidden');
});

btnPlayPong.addEventListener('click', () => { if(checkName()) initGame('pong'); });
btnPlayTetris.addEventListener('click', () => { if(checkName()) initGame('tetris'); });
btnPlayInvaders.addEventListener('click', () => { if(checkName()) initGame('invaders'); });

btnBackToMain.addEventListener('click', () => {
    gameSelector.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// MODIFICA: Salvataggio punteggio all'uscita
btnExitGame.addEventListener('click', () => {
    saveCurrentGameScore(); // Salva il punteggio corrente
    stopGame();
    gameWrapper.classList.add('hidden');
    gameSelector.classList.remove('hidden');
});

btnRetry.addEventListener('click', () => {
    scoreElement.innerText = 'SCORE: 0';
    if (currentGame === 'snake') {
        snake = [{x: 10, y: 10}];
        velocityX = 1; velocityY = 0;
        snakeScore = 0;
        placeFood();
    } else if (currentGame === 'pong') {
        pongScore = 0;
        resetBall();
        paddle1Y = canvas.height / 2 - paddleHeight / 2;
        paddle2Y = canvas.height / 2 - paddleHeight / 2;
    } else if (currentGame === 'tetris') {
        tetrisArena = createMatrix(tetrisCol, tetrisRow);
        tetrisScore = 0;
        playerReset();
    } else if (currentGame === 'invaders') {
        initInvaders(true); // Reset completo per retry
    }
    startGame();
});

// ====
// LEADERBOARD LOGIC
// ====
btnShowLeaderboardMain.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
    showLeaderboard('snake');
});

btnBackFromLeaderboard.addEventListener('click', () => {
    leaderboardScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

tabSnake.addEventListener('click', () => showLeaderboard('snake'));
tabPong.addEventListener('click', () => showLeaderboard('pong'));
tabTetris.addEventListener('click', () => showLeaderboard('tetris'));
tabInvaders.addEventListener('click', () => showLeaderboard('invaders'));

function saveScore(game, score) {
    if (score === 0) return;
    
    let key = 'cyber_scores_' + game;
    let scores = JSON.parse(localStorage.getItem(key) || '[]');
    
    let existingUserIndex = scores.findIndex(entry => entry.name === currentPlayerName);

    if (existingUserIndex !== -1) {
        if (score > scores[existingUserIndex].score) {
            scores[existingUserIndex].score = score;
        }
    } else {
        scores.push({ name: currentPlayerName, score: score });
    }
    
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
    localStorage.setItem(key, JSON.stringify(scores));
}

// NUOVA FUNZIONE HELPER PER SALVARE IL PUNTEGGIO CORRENTE
function saveCurrentGameScore() {
    let finalScore = 0;
    if (currentGame === 'snake') finalScore = snakeScore;
    else if (currentGame === 'pong') finalScore = pongScore;
    else if (currentGame === 'tetris') finalScore = tetrisScore;
    else if (currentGame === 'invaders') finalScore = invScore;
    
    if (finalScore > 0) {
        saveScore(currentGame, finalScore);
    }
}

function showLeaderboard(game) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if(game === 'snake') tabSnake.classList.add('active');
    if(game === 'pong') tabPong.classList.add('active');
    if(game === 'tetris') tabTetris.classList.add('active');
    if(game === 'invaders') tabInvaders.classList.add('active');

    let key = 'cyber_scores_' + game;
    let scores = JSON.parse(localStorage.getItem(key) || '[]');
    
    leaderboardList.innerHTML = '';
    
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<div style="text-align:center; color:#555;">NO SCORES YET</div>';
    } else {
        scores.forEach((entry, index) => {
            let div = document.createElement('div');
            div.className = 'score-entry';
            div.innerHTML = `<span>${index + 1}. ${entry.name}</span> <span>${entry.score}</span>`;
            leaderboardList.appendChild(div);
        });
    }
}

// ====
// INIT GIOCO
// ====

function initGame(gameName) {
    currentGame = gameName;
    gameSelector.classList.add('hidden');
    snakeDifficultyScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');

    // CONFIGURAZIONE DIMENSIONI CANVAS
    if (currentMode === 'mobile') {
        canvas.width = 300; 
        canvas.height = 540; 
    } else {
        if (currentGame === 'tetris') {
            canvas.width = 300; canvas.height = 600;
        } else {
            canvas.width = 400; canvas.height = 400;
        }
    }

    // Gestione controlli mobile
    if (currentMode === 'mobile') {
        mobileControls.classList.remove('hidden');
        desktopHint.classList.add('hidden');
        if (currentGame === 'pong') {
            btnLeft.style.display = 'none'; btnRight.style.display = 'none'; btnUp.style.display = 'flex'; btnDown.style.display = 'flex';
        } else if (currentGame === 'invaders') {
            btnLeft.style.display = 'flex'; btnRight.style.display = 'flex'; 
            btnUp.style.display = 'flex'; btnDown.style.display = 'none'; 
        } else {
            btnLeft.style.display = 'flex'; btnRight.style.display = 'flex'; btnUp.style.display = 'flex'; btnDown.style.display = 'flex';
        }
    } else {
        mobileControls.classList.add('hidden');
        desktopHint.classList.remove('hidden');
    }

    scoreElement.innerText = 'SCORE: 0';

    if (currentGame === 'snake') {
        gameTitleDisplay.innerText = (snakeSpeed < 100) ? "SNAKE HARDCORE" : "SNAKE 2.0";
        tileCountX = Math.floor(canvas.width / gridSize);
        tileCountY = Math.floor(canvas.height / gridSize);
        
        snakeScore = 0;
        snake = [{x: 10, y: 10}];
        velocityX = 1; velocityY = 0;
        placeFood();
    } else if (currentGame === 'pong') {
        gameTitleDisplay.innerText = "NEON PONG";
        pongScore = 0;
        resetBall();
        paddle1Y = canvas.height / 2 - paddleHeight / 2;
        paddle2Y = canvas.height / 2 - paddleHeight / 2;
    } else if (currentGame === 'tetris') {
        gameTitleDisplay.innerText = "CYBER TETRIS";
        tetrisArena = createMatrix(tetrisCol, tetrisRow);
        tetrisScore = 0;
        playerReset();
    } else if (currentGame === 'invaders') {
        gameTitleDisplay.innerText = "CYBER INVADERS";
        initInvaders(true); // Reset completo per nuova partita
    }

    startGame();
}

// ====
// LOOP DI GIOCO
// ====

function startGame() {
    stopGame();
    isGameRunning = true;
    
    if (currentGame === 'tetris') {
        lastTime = 0;
        dropCounter = 0;
        updateTetris();
    } else {
        const speed = (currentGame === 'snake') ? snakeSpeed : 30; 
        gameInterval = setInterval(gameLoop, speed);
    }
    
    if (isMusicOn && bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Audio ancora bloccato"));
    }
}

function stopGame() {
    isGameRunning = false;
    if (gameInterval) clearInterval(gameInterval);
}

function gameLoop() {
    if (currentGame === 'snake') {
        updateSnake();
        drawSnake();
    } else if (currentGame === 'pong') {
        updatePong();
        drawPong();
    } else if (currentGame === 'invaders') {
        updateInvaders();
        drawInvaders();
    }
}

// ====
// LOGICA INVADERS
// ====
function initInvaders(resetScore = true) {
    if (resetScore) {
        invScore = 0;
        invEnemySpeed = 1; // Reset velocità solo se nuova partita
        scoreElement.innerText = 'SCORE: 0';
    }
    
    invBullets = [];
    invEnemies = [];
    invPlayer.x = canvas.width / 2 - invPlayer.w / 2;
    invPlayer.y = canvas.height - 40;
    invEnemyDir = 1;
    
    let startX = 20;
    let startY = 20;
    let enemyW = 25;
    let enemyH = 20;
    let gap = 10;
    
    let cols = (canvas.width < 350) ? 6 : 8;

    for(let r=0; r<invEnemyRows; r++) {
        for(let c=0; c<cols; c++) {
            invEnemies.push({
                x: startX + c * (enemyW + gap),
                y: startY + r * (enemyH + gap),
                w: enemyW, h: enemyH,
                alive: true
            });
        }
    }
}

function updateInvaders() {
    // Proiettili
    for(let i = invBullets.length - 1; i >= 0; i--) {
        invBullets[i].y -= 7;
        if(invBullets[i].y < 0) invBullets.splice(i, 1);
    }

    // Calcolo bordi attuali del gruppo nemici
    let minX = canvas.width;
    let maxX = 0;
    let lowestEnemy = 0;

    invEnemies.forEach(e => {
        if(!e.alive) return;
        if(e.x < minX) minX = e.x;
        if(e.x + e.w > maxX) maxX = e.x + e.w;
        if(e.y + e.h > lowestEnemy) lowestEnemy = e.y + e.h;
    });

    // CAMBIO DIREZIONE CASUALE (Jitter)
    if (minX > 10 && maxX < canvas.width - 10) {
        if (Math.random() < 0.02) { 
            invEnemyDir *= -1;
        }
    }

    // Movimento
    invEnemies.forEach(e => {
        if(!e.alive) return;
        e.x += invEnemySpeed * invEnemyDir;
    });

    // Controllo Bordi
    let hitEdge = false;
    invEnemies.forEach(e => {
        if(!e.alive) return;
        if(e.x <= 0 || e.x + e.w >= canvas.width) hitEdge = true;
    });

    if(hitEdge) {
        invEnemyDir *= -1; 
        invEnemies.forEach(e => {
            e.x += invEnemySpeed * invEnemyDir; 
            e.y += invEnemyDrop; 
        });
    }

    // Collisioni Proiettili
    invBullets.forEach((b, bIdx) => {
        invEnemies.forEach(e => {
            if(e.alive && b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                e.alive = false;
                invBullets.splice(bIdx, 1);
                invScore += 10;
                scoreElement.innerText = 'SCORE: ' + invScore;
            }
        });
    });

    // Game Over o Livello Successivo
    if(lowestEnemy >= invPlayer.y) gameOver();
    
    if(invEnemies.filter(e => e.alive).length === 0) {
        // LIVELLO COMPLETATO
        invEnemySpeed += 0.5; // Aumenta difficoltà
        initInvaders(false); // NON resettare il punteggio
    }
}

function drawInvaders() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#39ff14';
    ctx.shadowBlur = 15; ctx.shadowColor = '#39ff14';
    ctx.beginPath();
    ctx.moveTo(invPlayer.x + invPlayer.w/2, invPlayer.y);
    ctx.lineTo(invPlayer.x + invPlayer.w, invPlayer.y + invPlayer.h);
    ctx.lineTo(invPlayer.x, invPlayer.y + invPlayer.h);
    ctx.fill();
    ctx.shadowBlur = 0;

    invEnemies.forEach(e => {
        if(e.alive) {
            ctx.fillStyle = '#ff0055';
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff0055';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
            ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
            ctx.fillRect(e.x + e.w - 10, e.y + 5, 5, 5);
        }
    });

    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffff00';
    invBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 4, 10);
    });
    ctx.shadowBlur = 0;
}

// ====
// LOGICA TETRIS (Invariata)
// ====
function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}
function createPiece(type) {
    if (type === 'I') return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
    if (type === 'L') return [[0, 2, 0], [0, 2, 0], [0, 2, 2]];
    if (type === 'J') return [[0, 3, 0], [0, 3, 0], [3, 3, 0]];
    if (type === 'O') return [[4, 4], [4, 4]];
    if (type === 'Z') return [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
    if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === 'T') return [[0, 7, 0], [7, 7, 7], [0, 0, 0]];
}
function drawTetrisMatrix(matrix, offset) {
    const blockSize = canvas.width / tetrisCol; 
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = TETRIS_COLORS[value];
                ctx.shadowBlur = 10; ctx.shadowColor = TETRIS_COLORS[value];
                ctx.fillRect((x + offset.x) * blockSize, (y + offset.y) * blockSize, blockSize - 1, blockSize - 1);
                ctx.shadowBlur = 0;
            }
        });
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<=tetrisCol; i++) {
        ctx.beginPath(); ctx.moveTo(i*blockSize, 0); ctx.lineTo(i*blockSize, canvas.height); ctx.stroke();
    }
}
function drawTetris() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTetrisMatrix(tetrisArena, {x: 0, y: 0});
    drawTetrisMatrix(tetrisPlayer.matrix, tetrisPlayer.pos);
}
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}
function playerReset() {
    const pieces = 'ILJOTSZ';
    tetrisPlayer.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    tetrisPlayer.pos.y = 0;
    tetrisPlayer.pos.x = (tetrisArena[0].length / 2 | 0) - (tetrisPlayer.matrix[0].length / 2 | 0);
    if (collide(tetrisArena, tetrisPlayer)) { gameOver(); }
}
function playerDrop() {
    tetrisPlayer.pos.y++;
    if (collide(tetrisArena, tetrisPlayer)) {
        tetrisPlayer.pos.y--;
        merge(tetrisArena, tetrisPlayer);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}
function playerHardDrop() {
    while (!collide(tetrisArena, tetrisPlayer)) {
        tetrisPlayer.pos.y++;
    }
    tetrisPlayer.pos.y--; 
    merge(tetrisArena, tetrisPlayer);
    playerReset();
    arenaSweep();
    dropCounter = 0;
}
function playerMove(dir) {
    tetrisPlayer.pos.x += dir;
    if (collide(tetrisArena, tetrisPlayer)) tetrisPlayer.pos.x -= dir;
}
function playerRotate(dir) {
    const pos = tetrisPlayer.pos.x;
    let offset = 1;
    rotate(tetrisPlayer.matrix, dir);
    while (collide(tetrisArena, tetrisPlayer)) {
        tetrisPlayer.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > tetrisPlayer.matrix[0].length) {
            rotate(tetrisPlayer.matrix, -dir);
            tetrisPlayer.pos.x = pos;
            return;
        }
    }
}
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = tetrisArena.length - 1; y > 0; --y) {
        for (let x = 0; x < tetrisArena[y].length; ++x) {
            if (tetrisArena[y][x] === 0) continue outer;
        }
        const row = tetrisArena.splice(y, 1)[0].fill(0);
        tetrisArena.unshift(row);
        ++y;
        tetrisScore += rowCount * 10;
        rowCount *= 2;
        scoreElement.innerText = 'SCORE: ' + tetrisScore;
    }
}
function updateTetris(time = 0) {
    if (!isGameRunning || currentGame !== 'tetris') return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();
    drawTetris();
    requestAnimationFrame(updateTetris);
}

// ====
// LOGICA SNAKE & PONG
// ====

function updateSnake() {
    const head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
    
    if (head.x < 0) head.x = tileCountX - 1;
    if (head.x >= tileCountX) head.x = 0;
    if (head.y < 0) head.y = tileCountY - 1;
    if (head.y >= tileCountY) head.y = 0;

    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        snakeScore += 10;
        scoreElement.innerText = 'SCORE: ' + snakeScore;
        placeFood();
    } else {
        snake.pop();
    }
}

function drawSnake() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    
    for(let i=0; i<tileCountX; i++) {
        ctx.beginPath(); ctx.moveTo(i*gridSize, 0); ctx.lineTo(i*gridSize, canvas.height); ctx.stroke();
    }
    for(let i=0; i<tileCountY; i++) {
        ctx.beginPath(); ctx.moveTo(0, i*gridSize); ctx.lineTo(canvas.width, i*gridSize); ctx.stroke();
    }

    snake.forEach((part, index) => {
        if (index === 0) { 
            ctx.fillStyle = (snakeSpeed < 100) ? '#ff0055' : '#00ffea'; 
            ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle; 
        } else { 
            ctx.fillStyle = (snakeSpeed < 100) ? 'rgba(255, 0, 85, 0.5)' : 'rgba(0, 255, 234, 0.5)'; 
            ctx.shadowBlur = 0; 
        }
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0055'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff0055';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
}

function placeFood() {
    food.x = Math.floor(Math.random() * tileCountX);
    food.y = Math.floor(Math.random() * tileCountY);
}

function updatePong() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    if (ballY < 0 || ballY > canvas.height) ballSpeedY = -ballSpeedY;

    let aiCenter = paddle2Y + paddleHeight / 2;
    if (aiCenter < ballY - 35) paddle2Y += 4;
    else if (aiCenter > ballY + 35) paddle2Y -= 4;
    if (paddle2Y < 0) paddle2Y = 0;
    if (paddle2Y > canvas.height - paddleHeight) paddle2Y = canvas.height - paddleHeight;

    if (ballX < paddleWidth + 10) {
        if (ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            let deltaY = ballY - (paddle1Y + paddleHeight / 2);
            ballSpeedY = deltaY * 0.35;
        } else if (ballX < 0) gameOver(); 
    }
    if (ballX > canvas.width - paddleWidth - 10) {
        if (ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else if (ballX > canvas.width) {
            pongScore += 1;
            scoreElement.innerText = 'SCORE: ' + pongScore;
            resetBall();
        }
    }
}

function drawPong() {
    // Sfondo
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Linea centrale
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddle 1 (Giocatore)
    ctx.fillStyle = '#00ffea';
    ctx.shadowBlur = 15; ctx.shadowColor = '#00ffea';
    ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);
    
    // Paddle 2 (AI)
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15; ctx.shadowColor = '#ff0055';
    ctx.fillRect(canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);
    
    // Palla
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function resetBall() {
    ballX = canvas.width / 2; ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX; ballSpeedY = 3;
}

function gameOver() {
    stopGame();
    saveCurrentGameScore(); // Salva il punteggio

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0055'; ctx.font = '30px Orbitron'; ctx.textAlign = 'center';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff0055';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#00ffea'; ctx.font = '14px Orbitron'; ctx.shadowColor = '#00ffea';
    ctx.fillText('Premi RETRY o EXIT', canvas.width / 2, canvas.height / 2 + 30);
}

// ====
// INPUT CONTROLLER
// ====
function inputUp() {
    if (currentGame === 'snake' && velocityY !== 1) { velocityX = 0; velocityY = -1; }
    if (currentGame === 'pong' && paddle1Y > 0) { paddle1Y -= 20; }
    if (currentGame === 'tetris') { playerRotate(1); }
    if (currentGame === 'invaders') { 
        invBullets.push({x: invPlayer.x + invPlayer.w/2 - 2, y: invPlayer.y});
    }
}
function inputDown() {
    if (currentGame === 'snake' && velocityY !== -1) { velocityX = 0; velocityY = 1; }
    if (currentGame === 'pong' && paddle1Y < canvas.height - paddleHeight) { paddle1Y += 20; }
    if (currentGame === 'tetris') { playerDrop(); }
}
function inputLeft() { 
    if (currentGame === 'snake' && velocityX !== 1) { velocityX = -1; velocityY = 0; } 
    if (currentGame === 'tetris') { playerMove(-1); }
    if (currentGame === 'invaders') { 
        invPlayer.x -= invPlayer.speed; 
        if(invPlayer.x < 0) invPlayer.x = 0;
    }
}
function inputRight() { 
    if (currentGame === 'snake' && velocityX !== -1) { velocityX = 1; velocityY = 0; } 
    if (currentGame === 'tetris') { playerMove(1); }
    if (currentGame === 'invaders') { 
        invPlayer.x += invPlayer.speed; 
        if(invPlayer.x + invPlayer.w > canvas.width) invPlayer.x = canvas.width - invPlayer.w;
    }
}

btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); inputUp(); });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); inputDown(); });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); inputLeft(); });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); inputRight(); });

btnUp.addEventListener('click', inputUp);
btnDown.addEventListener('click', inputDown);
btnLeft.addEventListener('click', inputLeft);
btnRight.addEventListener('click', inputRight);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!isGameRunning && !gameWrapper.classList.contains('hidden')) {
            btnRetry.click();
            return;
        }
        if (isGameRunning && currentGame === 'tetris') {
            e.preventDefault(); 
            playerHardDrop();
            return;
        }
        if (isGameRunning && currentGame === 'invaders') {
            e.preventDefault();
            inputUp(); // Spara
            return;
        }
    }

    if (currentGame === 'pong') {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') paddle1Y -= 20;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') paddle1Y += 20;
        if (paddle1Y < 0) paddle1Y = 0;
        if (paddle1Y > canvas.height - paddleHeight) paddle1Y = canvas.height - paddleHeight;
    } else if (currentGame === 'snake') {
        switch (e.code) {
            case 'KeyA': case 'ArrowLeft': inputLeft(); break;
            case 'KeyW': case 'ArrowUp': inputUp(); break;
            case 'KeyD': case 'ArrowRight': inputRight(); break;
            case 'KeyS': case 'ArrowDown': inputDown(); break;
        }
    } else if (currentGame === 'tetris') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') playerMove(-1);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') playerMove(1);
        if (e.code === 'ArrowDown' || e.code === 'KeyS') playerDrop();
        if (e.code === 'ArrowUp' || e.code === 'KeyW') playerRotate(1);
    } else if (currentGame === 'invaders') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputLeft();
        if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRight();
        if (e.code === 'ArrowUp' || e.code === 'KeyW') inputUp(); // Spara
    }
});

// GESTIONE PULSANTE MUSIC
btnMusicToggle.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    if (isMusicOn) {
        bgMusic.volume = 0.5; 
        bgMusic.play().catch(e => console.log("Audio bloccato"));
        btnMusicToggle.innerText = "MUSIC: ON";
        btnMusicToggle.classList.remove('music-off');
    } else {
        bgMusic.pause(); 
        btnMusicToggle.innerText = "MUSIC: OFF";
        btnMusicToggle.classList.add('music-off');
    }
});
