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
const playerNameInput = document.getElementById('player-name-input');

let currentPlayerName = "PLAYER";
let currentGame = null; 
let currentMode = null; 
let gameInterval;
let isGameRunning = false;

// --- LOGICA CLASSIFICA LOCALE ---
function saveScoreLocal(game, score) {
    if (score <= 0) return;
    let scores = JSON.parse(localStorage.getItem('scores_' + game)) || [];
    scores.push({ name: currentPlayerName, score: score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5); // Tieni solo i primi 5
    localStorage.setItem('scores_' + game, JSON.stringify(scores));
}

function showLeaderboard(game) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + game).classList.add('active');
    
    const list = document.getElementById('leaderboard-list');
    let scores = JSON.parse(localStorage.getItem('scores_' + game)) || [];
    list.innerHTML = scores.length ? '' : '<p>NO SCORES YET</p>';
    scores.forEach((s, i) => {
        list.innerHTML += `<div class="score-entry"><span>${i+1}. ${s.name}</span><span>${s.score}</span></div>`;
    });
}

// --- NAVIGAZIONE ---
document.getElementById('btn-desktop').onclick = () => setInterface('desktop');
document.getElementById('btn-mobile').onclick = () => setInterface('mobile');

function setInterface(mode) {
    currentMode = mode;
    mainMenu.classList.add('hidden');
    gameSelector.classList.remove('hidden');
    document.getElementById('bg-music').play().catch(() => {});
}

document.getElementById('btn-pre-snake').onclick = () => {
    currentPlayerName = playerNameInput.value.trim().toUpperCase() || "PLAYER";
    gameSelector.classList.add('hidden');
    snakeDifficultyScreen.classList.remove('hidden');
};

document.getElementById('btn-play-pong').onclick = () => {
    currentPlayerName = playerNameInput.value.trim().toUpperCase() || "PLAYER";
    initGame('pong');
};

document.getElementById('btn-snake-normal').onclick = () => { snakeSpeed = 150; initGame('snake'); };
document.getElementById('btn-snake-hard').onclick = () => { snakeSpeed = 70; initGame('snake'); };

document.getElementById('btn-show-leaderboard-main').onclick = () => {
    mainMenu.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
    showLeaderboard('snake');
};

document.getElementById('tab-snake').onclick = () => showLeaderboard('snake');
document.getElementById('tab-pong').onclick = () => showLeaderboard('pong');
document.getElementById('back-from-leaderboard').onclick = () => {
    leaderboardScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
};

document.getElementById('exit-game-btn').onclick = () => {
    if (currentGame === 'snake') saveScoreLocal('snake', snakeScore);
    else saveScoreLocal('pong', pongScore);
    stopGame();
    gameWrapper.classList.add('hidden');
    gameSelector.classList.remove('hidden');
};

document.getElementById('retry-btn').onclick = () => initGame(currentGame);

// --- LOGICA GIOCHI (SNAKE & PONG) ---
let snake = [], food = {}, velocityX = 1, velocityY = 0, snakeScore = 0, snakeSpeed = 150;
let paddle1Y, paddle2Y, ballX, ballY, ballSpeedX, ballSpeedY, pongScore = 0;
const gridSize = 20, paddleHeight = 80, paddleWidth = 10;

function initGame(game) {
    currentGame = game;
    gameSelector.classList.add('hidden');
    snakeDifficultyScreen.classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    
    canvas.width = 400; canvas.height = 400;
    document.getElementById('mobile-controls').className = (currentMode === 'mobile') ? '' : 'hidden';
    
    if (game === 'snake') {
        snake = [{x: 10, y: 10}]; velocityX = 1; velocityY = 0; snakeScore = 0;
        food = {x: 15, y: 15};
    } else {
        pongScore = 0; ballX = 200; ballY = 200; ballSpeedX = 5; ballSpeedY = 5;
        paddle1Y = 160; paddle2Y = 160;
    }
    startGame();
}

function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    isGameRunning = true;
    gameInterval = setInterval(gameLoop, currentGame === 'snake' ? snakeSpeed : 30);
}

function stopGame() { isGameRunning = false; clearInterval(gameInterval); }

function gameLoop() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (currentGame === 'snake') {
        let head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.some(p => p.x === head.x && p.y === head.y)) return gameOver();
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) { snakeScore += 10; food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)}; }
        else snake.pop();
        ctx.fillStyle = '#00ffea'; snake.forEach(p => ctx.fillRect(p.x*20, p.y*20, 18, 18));
        ctx.fillStyle = '#ff0055'; ctx.fillRect(food.x*20, food.y*20, 18, 18);
        scoreElement.innerText = "SCORE: " + snakeScore;
    } else {
        ballX += ballSpeedX; ballY += ballSpeedY;
        if (ballY < 0 || ballY > 400) ballSpeedY *= -1;
        if (ballX < 20 && ballY > paddle1Y && ballY < paddle1Y + 80) ballSpeedX *= -1;
        if (ballX > 380 && ballY > paddle2Y && ballY < paddle2Y + 80) ballSpeedX *= -1;
        if (ballX < 0 || ballX > 400) return gameOver();
        paddle2Y += (ballY - (paddle2Y + 40)) * 0.1;
        ctx.fillStyle = '#00ffea'; ctx.fillRect(10, paddle1Y, 10, 80);
        ctx.fillStyle = '#ff0055'; ctx.fillRect(380, paddle2Y, 10, 80);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ballX, ballY, 8, 0, Math.PI*2); ctx.fill();
        scoreElement.innerText = "SCORE: " + pongScore;
    }
}

function gameOver() {
    stopGame();
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ff0055"; ctx.font = "30px Orbitron"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", 200, 200);
}

// CONTROLLI
window.onkeydown = (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') { velocityX = 0; velocityY = -1; paddle1Y -= 20; }
    if (e.key === 's' || e.key === 'ArrowDown') { velocityX = 0; velocityY = 1; paddle1Y += 20; }
    if (e.key === 'a' || e.key === 'ArrowLeft') { velocityX = -1; velocityY = 0; }
    if (e.key === 'd' || e.key === 'ArrowRight') { velocityX = 1; velocityY = 0; }
};

document.getElementById('btn-up').onclick = () => { velocityX = 0; velocityY = -1; paddle1Y -= 30; };
document.getElementById('btn-down').onclick = () => { velocityX = 0; velocityY = 1; paddle1Y += 30; };
document.getElementById('btn-left').onclick = () => { velocityX = -1; velocityY = 0; };
document.getElementById('btn-right').onclick = () => { velocityX = 1; velocityY = 0; };
