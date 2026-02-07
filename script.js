// ELEMENTI UI
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameTitleDisplay = document.getElementById('game-title-display');

const mainMenu = document.getElementById('main-menu');
const gameSelector = document.getElementById('game-selector');
const snakeDifficultyScreen = document.getElementById('snake-difficulty');
const gameWrapper = document.getElementById('game-wrapper');
const leaderboardScreen = document.getElementById('leaderboard-screen');

const playerNameInput = document.getElementById('player-name-input');

const btnPlayMain = document.getElementById('btn-play-main');
const btnMusicToggle = document.getElementById('btn-music-toggle');
const btnShowLeaderboardMain = document.getElementById('btn-show-leaderboard-main');

const btnPreSnake = document.getElementById('btn-pre-snake');
const btnPlayPong = document.getElementById('btn-play-pong');
const btnBackToMain = document.getElementById('back-to-main');

const btnSnakeNormal = document.getElementById('btn-snake-normal');
const btnSnakeHard = document.getElementById('btn-snake-hard');
const btnBackToGames = document.getElementById('back-to-games');

const tabSnake = document.getElementById('tab-snake');
const tabPong = document.getElementById('tab-pong');
const leaderboardList = document.getElementById('leaderboard-list');
const btnBackFromLeaderboard = document.getElementById('back-from-leaderboard');

const mobileControls = document.getElementById('mobile-controls');
const desktopHint = document.getElementById('desktop-hint');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

const btnRetry = document.getElementById('retry-btn');
const btnExitGame = document.getElementById('exit-game-btn');

const bgMusic = document.getElementById('bg-music');

// STATO
let currentPlayerName = "PLAYER";
let currentMode = 'desktop'; // 'desktop' o 'mobile'
let currentGame = null; // 'snake' o 'pong'
let gameInterval = null;
let isGameRunning = false;
let isMusicOn = true;

// SNAKE VARS
let snake = [], food = {}, velocityX = 1, velocityY = 0, snakeScore = 0, snakeSpeed = 150;
let tileCountX = 20, tileCountY = 20, gridSize = 20;

// PONG VARS
let paddle1Y = 150, paddle2Y = 150, paddleHeight = 80, paddleWidth = 10;
let ballX = 200, ballY = 200, ballSpeedX = 5, ballSpeedY = 5, pongScore = 0;

// UTILITY: rilevamento dispositivo automatico
function detectDevice() {
    const ua = navigator.userAgent || '';
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const smallScreen = window.innerWidth <= 800;
    return (mobileUA || smallScreen) ? 'mobile' : 'desktop';
}

// SALVATAGGIO LOCALE
function saveScoreLocal(game, score) {
    if (score <= 0) return;
    const key = 'scores_' + game;
    const scores = JSON.parse(localStorage.getItem(key) || '[]');
    scores.push({ name: currentPlayerName, score: score });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(key, JSON.stringify(scores.slice(0, 5)));
}

function showLeaderboard(game) {
    tabSnake.classList.remove('active'); tabPong.classList.remove('active');
    if (game === 'snake') tabSnake.classList.add('active'); else tabPong.classList.add('active');
    const key = 'scores_' + game;
    const scores = JSON.parse(localStorage.getItem(key) || '[]');
    leaderboardList.innerHTML = scores.length ? '' : '<div style="text-align:center;color:#888">NO SCORES YET</div>';
    scores.forEach((s,i) => {
        const div = document.createElement('div'); div.className = 'score-entry';
        div.innerHTML = `<span>${i+1}. ${s.name}</span><span>${s.score}</span>`;
        leaderboardList.appendChild(div);
    });
}

// NAVIGAZIONE & CONTROLLI MENU
btnPlayMain.addEventListener('click', () => {
    currentMode = detectDevice();
    currentPlayerName = (playerNameInput.value || '').trim().toUpperCase() || "PLAYER";
    localStorage.setItem('cyberarcade_player', currentPlayerName);
    mainMenu.classList.add('hidden');
    gameSelector.classList.remove('hidden');

    // play musica (user gesture)
    if (isMusicOn) {
        bgMusic.volume = 0.4;
        bgMusic.play().catch(()=>{});
    }
});

btnShowLeaderboardMain.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
    showLeaderboard('snake');
});
btnBackFromLeaderboard.addEventListener('click', () => {
    leaderboardScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

btnPreSnake.addEventListener('click', () => { gameSelector.classList.add('hidden'); snakeDifficultyScreen.classList.remove('hidden'); });
btnBackToMain.addEventListener('click', () => { gameSelector.classList.add('hidden'); mainMenu.classList.remove('hidden'); });

btnSnakeNormal.addEventListener('click', () => { snakeSpeed = 150; initGame('snake'); });
btnSnakeHard.addEventListener('click', () => { snakeSpeed = 70; initGame('snake'); });

btnPlayPong.addEventListener('click', () => initGame('pong'));
btnBackToGames.addEventListener('click', () => { snakeDifficultyScreen.classList.add('hidden'); gameSelector.classList.remove('hidden'); });

// TAB CLASSIFICA
tabSnake.addEventListener('click', () => showLeaderboard('snake'));
tabPong.addEventListener('click', () => showLeaderboard('pong'));

// MUSIC TOGGLE
btnMusicToggle.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    if (isMusicOn) {
        btnMusicToggle.innerText = "MUSIC: ON";
        btnMusicToggle.classList.remove('music-off');
        bgMusic.volume = 0.4;
        bgMusic.play().catch(()=>{});
    } else {
        btnMusicToggle.innerText = "MUSIC: OFF";
        btnMusicToggle.classList.add('music-off');
        bgMusic.pause();
    }
});

// AVVIO GIOCO
function initGame(gameName) {
    currentGame = gameName;
    gameSelector.classList.add('hidden'); snakeDifficultyScreen.classList.add('hidden'); leaderboardScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');

    // dimensioni canvas e controlli in base al dispositivo rilevato
    if (currentMode === 'mobile') {
        const maxW = Math.floor(window.innerWidth * 0.92);
        canvas.width = maxW;
        canvas.height = Math.floor(maxW * 0.9);
        mobileControls.classList.remove('hidden');
        desktopHint.classList.add('hidden');
    } else {
        canvas.width = 460;
        canvas.height = 400;
        mobileControls.classList.add('hidden');
        desktopHint.classList.remove('hidden');
    }

    // inizializza stato specifico gioco
    if (currentGame === 'snake') {
        gameTitleDisplay.innerText = snakeSpeed < 100 ? 'SNAKE HARDCORE' : 'SNAKE 2.0';
        tileCountX = 20;
        gridSize = Math.floor(canvas.width / tileCountX);
        tileCountY = Math.floor(canvas.height / gridSize);
        snake = [{x:10,y:10}];
        velocityX = 1; velocityY = 0; snakeScore = 0;
        placeFood();
        scoreElement.innerText = 'SCORE: 0';
    } else if (currentGame === 'pong') {
        gameTitleDisplay.innerText = 'NEON PONG';
        pongScore = 0;
        paddleWidth = Math.max(8, Math.floor(canvas.width * 0.03));
        paddleHeight = Math.max(50, Math.floor(canvas.height * 0.16));
        paddle1Y = canvas.height/2 - paddleHeight/2;
        paddle2Y = canvas.height/2 - paddleHeight/2;
        resetBall();
        scoreElement.innerText = 'SCORE: 0';
    }

    startGame();
}

function startGame() {
    stopGame();
    isGameRunning = true;
    if (currentGame === 'snake') {
        gameInterval = setInterval(gameLoop, snakeSpeed);
    } else {
        gameInterval = setInterval(gameLoop, 30);
    }
    if (isMusicOn) bgMusic.play().catch(()=>{});
}
function stopGame() { isGameRunning = false; if (gameInterval) clearInterval(gameInterval); }

// GAME LOOP & LOGIC
function gameLoop() {
    if (currentGame === 'snake') { updateSnake(); drawSnake(); }
    else if (currentGame === 'pong') { updatePong(); drawPong(); }
}

// SNAKE
function placeFood() {
    food.x = Math.floor(Math.random() * tileCountX);
    food.y = Math.floor(Math.random() * tileCountY);
}
function updateSnake() {
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    if (head.x < 0) head.x = tileCountX - 1;
    if (head.x >= tileCountX) head.x = 0;
    if (head.y < 0) head.y = tileCountY - 1;
    if (head.y >= tileCountY) head.y = 0;
    for (let i=0;i<snake.length;i++) if (head.x===snake[i].x && head.y===snake[i].y) { gameOver(); return; }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) { snakeScore += 10; scoreElement.innerText = 'SCORE: ' + snakeScore; placeFood(); }
    else snake.pop();
}
function drawSnake() {
    ctx.fillStyle = '#050505'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // griglia leggera
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
    for (let i=0;i<tileCountX;i++) { ctx.beginPath(); ctx.moveTo(i*gridSize,0); ctx.lineTo(i*gridSize,canvas.height); ctx.stroke(); }
    for (let i=0;i<tileCountY;i++) { ctx.beginPath(); ctx.moveTo(0,i*gridSize); ctx.lineTo(canvas.width,i*gridSize); ctx.stroke(); }

    snake.forEach((p,i) => {
        ctx.fillStyle = i===0 ? '#00ffea' : 'rgba(0,255,234,0.5)';
        ctx.shadowBlur = i===0 ? 14 : 0; ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(p.x*gridSize+1, p.y*gridSize+1, gridSize-2, gridSize-2);
        ctx.shadowBlur = 0;
    });
    ctx.fillStyle = '#ff0055'; ctx.shadowBlur = 12; ctx.shadowColor = '#ff0055';
    ctx.fillRect(food.x*gridSize+1, food.y*gridSize+1, gridSize-2, gridSize-2);
    ctx.shadowBlur = 0;
}

// PONG
function resetBall() {
    ballX = canvas.width/2; ballY = canvas.height/2;
    ballSpeedX = (Math.random()>0.5?1:-1)*5; ballSpeedY = 3;
}
function updatePong() {
    ballX += ballSpeedX; ballY += ballSpeedY;
    if (ballY < 0 || ballY > canvas.height) ballSpeedY = -ballSpeedY;
    // collisione con player
    if (ballX < paddleWidth + 10) {
        if (ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX; let delta = ballY - (paddle1Y + paddleHeight/2); ballSpeedY = delta * 0.12;
        } else if (ballX < 0) { gameOver(); return; }
    }
    // collisione con AI
    if (ballX > canvas.width - paddleWidth - 10) {
        if (ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        } else if (ballX > canvas.width) {
            pongScore += 1; scoreElement.innerText = 'SCORE: ' + pongScore; resetBall();
        }
    }
    // semplice AI
    const aiCenter = paddle2Y + paddleHeight/2;
    if (aiCenter < ballY - 20) paddle2Y += 4;
    if (aiCenter > ballY + 20) paddle2Y -= 4;
    paddle2Y = Math.max(0, Math.min(canvas.height - paddleHeight, paddle2Y));
}
function drawPong() {
    ctx.fillStyle = '#050505'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setLineDash([10,10]); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath();
    ctx.moveTo(canvas.width/2,0); ctx.lineTo(canvas.width/2,canvas.height); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#00ffea'; ctx.shadowBlur = 14; ctx.shadowColor = '#00ffea'; ctx.fillRect(10, paddle1Y, paddleWidth, paddleHeight);
    ctx.fillStyle = '#ff0055'; ctx.shadowBlur = 14; ctx.shadowColor = '#ff0055'; ctx.fillRect(canvas.width - paddleWidth - 10, paddle2Y, paddleWidth, paddleHeight);
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff'; ctx.beginPath(); ctx.arc(ballX, ballY, Math.max(6, canvas.width*0.02), 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    scoreElement.innerText = 'SCORE: ' + pongScore;
}

// GAME OVER
function gameOver() {
    stopGame();
    // salva punteggio
    if (currentGame === 'snake') saveScoreLocal('snake', snakeScore);
    else if (currentGame === 'pong') saveScoreLocal('pong', pongScore);

    ctx.fillStyle = 'rgba(0,0,0,0.76)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff0055'; ctx.font = '28px Orbitron'; ctx.textAlign = 'center'; ctx.shadowBlur = 12; ctx.shadowColor = '#ff0055';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
    ctx.fillStyle = '#00ffea'; ctx.font = '14px Orbitron'; ctx.shadowColor = '#00ffea';
    ctx.fillText('RETRY or EXIT', canvas.width/2, canvas.height/2 + 22);
    ctx.shadowBlur = 0;
}

// CONTROLLI (TASTIERA E BOTTONI)
function inputUp() {
    if (currentGame === 'snake' && velocityY !== 1) { velocityX = 0; velocityY = -1; }
    if (currentGame === 'pong') { paddle1Y = Math.max(0, paddle1Y - 30); }
}
function inputDown() {
    if (currentGame === 'snake' && velocityY !== -1) { velocityX = 0; velocityY = 1; }
    if (currentGame === 'pong') { paddle1Y = Math.min(canvas.height - paddleHeight, paddle1Y + 30); }
}
function inputLeft() { if (currentGame === 'snake' && velocityX !== 1) { velocityX = -1; velocityY = 0; } }
function inputRight() { if (currentGame === 'snake' && velocityX !== -1) { velocityX = 1; velocityY = 0; } }

btnUp.addEventListener('touchstart', (e)=>{ e.preventDefault(); inputUp(); });
btnDown.addEventListener('touchstart', (e)=>{ e.preventDefault(); inputDown(); });
btnLeft.addEventListener('touchstart', (e)=>{ e.preventDefault(); inputLeft(); });
btnRight.addEventListener('touchstart', (e)=>{ e.preventDefault(); inputRight(); });

btnUp.addEventListener('click', inputUp); btnDown.addEventListener('click', inputDown);
btnLeft.addEventListener('click', inputLeft); btnRight.addEventListener('click', inputRight);

window.addEventListener('keydown', (e) => {
    if (!isGameRunning) {
        if (e.code === 'Space') { btnRetry.click(); }
        return;
    }
    if (currentGame === 'snake') {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') inputUp();
        if (e.code === 'KeyS' || e.code === 'ArrowDown') inputDown();
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputLeft();
        if (e.code === 'KeyD' || e.code === 'ArrowRight') inputRight();
    } else if (currentGame === 'pong') {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') paddle1Y = Math.max(0, paddle1Y - 30);
        if (e.code === 'KeyS' || e.code === 'ArrowDown') paddle1Y = Math.min(canvas.height - paddleHeight, paddle1Y + 30);
    }
});

// RETRY & EXIT
btnRetry.addEventListener('click', () => {
    if (!currentGame) return;
    if (currentGame === 'snake') {
        snake = [{x:10,y:10}]; velocityX = 1; velocityY = 0; snakeScore = 0; placeFood();
    } else if (currentGame === 'pong') {
        pongScore = 0; resetBall(); paddle1Y = canvas.height/2 - paddleHeight/2; paddle2Y = canvas.height/2 - paddleHeight/2;
    }
    startGame();
});
btnExitGame.addEventListener('click', () => {
    if (currentGame === 'snake') saveScoreLocal('snake', snakeScore);
    if (currentGame === 'pong') saveScoreLocal('pong', pongScore);
    stopGame();
    gameWrapper.classList.add('hidden');
    gameSelector.classList.remove('hidden');
});

// Fallback: se chiudi o ricarichi, non perdere il nome
window.addEventListener('beforeunload', () => {
    localStorage.setItem('cyberarcade_player', currentPlayerName);
});
const storedName = localStorage.getItem('cyberarcade_player'); if (storedName) playerNameInput.value = storedName;

// Resize canvas on orientation change (mobile)
window.addEventListener('resize', () => {
    if (gameWrapper.classList.contains('hidden')) return;
    if (currentMode === 'mobile') {
        const maxW = Math.floor(window.innerWidth * 0.92);
        canvas.width = maxW; canvas.height = Math.floor(maxW * 0.9);
    }
});
