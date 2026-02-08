const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const music = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');
const scoreEl = document.getElementById('score-display');
const highscoreEl = document.getElementById('high-score-display');

let currentInterface = 'desktop';
let currentGame = '';
let gameLoop;
let score = 0;
let isGameOver = false;

// Classifica Locale
function getHighScore(game) {
    return localStorage.getItem('highScore_' + game) || 0;
}

function saveHighScore(game, newScore) {
    const currentHigh = getHighScore(game);
    if (newScore > currentHigh) {
        localStorage.setItem('highScore_' + game, newScore);
    }
}

function setInterface(mode) {
    currentInterface = mode;
    document.getElementById('interface-menu').style.display = 'none';
    document.getElementById('game-selector').style.display = 'flex';
    if(musicToggle.checked) {
        music.volume = 0.3;
        music.play().catch(() => {});
    }
}

function selectGame(game) {
    currentGame = game;
    document.getElementById('game-selector').style.display = 'none';
    document.getElementById('game-wrapper').style.display = 'flex';
    document.getElementById('game-title').innerText = game.toUpperCase();
    highscoreEl.innerText = "BEST: " + getHighScore(game);
    
    if(currentInterface === 'mobile') {
        document.getElementById('mobile-controls').style.display = 'block';
        document.getElementById('btn-left').style.visibility = (game === 'pong') ? 'hidden' : 'visible';
        document.getElementById('btn-right').style.visibility = (game === 'pong') ? 'hidden' : 'visible';
    }
    initGame();
}

function initGame() {
    clearInterval(gameLoop);
    isGameOver = false;
    score = 0;
    scoreEl.innerText = "SCORE: 0";
    
    if(currentGame === 'snake') {
        snake = [{x: 10, y: 15}]; dx = 0; dy = -1;
        spawnFood();
        gameLoop = setInterval(updateSnake, 100);
    } else if(currentGame === 'pong') {
        ball = {x: 200, y: 300, dx: 4, dy: 4};
        p1 = 180; p2 = 180;
        gameLoop = setInterval(updatePong, 1000/60);
    } else if(currentGame === 'tetris') {
        tetrisBoard = Array(30).fill().map(() => Array(20).fill(0));
        spawnTetrisPiece();
        gameLoop = setInterval(updateTetris, 400);
    } else if(currentGame === 'invaders') {
        player = 180; bullets = []; enemies = [];
        for(let i=0; i<6; i++) for(let j=0; j<4; j++) enemies.push({x: 40+i*55, y: 50+j*35});
        gameLoop = setInterval(updateInvaders, 1000/60);
    }
}

// --- LOGICA SNAKE ---
let snake, food, dx, dy;
function updateSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 30 || snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) { score += 10; scoreEl.innerText = "SCORE: " + score; spawnFood(); } else snake.pop();
    drawSnake();
}
function drawSnake() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,600);
    ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 2;
    snake.forEach(s => { ctx.strokeRect(s.x*20, s.y*20, 18, 18); ctx.fillStyle = 'rgba(0,243,255,0.3)'; ctx.fillRect(s.x*20, s.y*20, 18, 18); });
    ctx.fillStyle = '#ff00ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x*20+4, food.y*20+4, 12, 12); ctx.shadowBlur = 0;
}
function spawnFood() { food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*30)}; }

// --- LOGICA PONG ---
let ball, p1, p2;
function updatePong() {
    ball.x += ball.dx; ball.y += ball.dy;
    if(ball.x < 0 || ball.x > 390) ball.dx *= -1;
    if(ball.y < 20 && ball.x > p1 && ball.x < p1+80) { ball.dy *= -1.1; score++; scoreEl.innerText = "SCORE: " + score; }
    if(ball.y > 570 && ball.x > p2 && ball.x < p2+80) ball.dy *= -1.1;
    if(ball.y < 0 || ball.y > 600) return gameOver();
    p2 += (ball.x - (p2+40)) * 0.12; // AI segue la palla
    drawPong();
}
function drawPong() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,600);
    ctx.fillStyle = '#00f3ff'; ctx.fillRect(p1, 10, 80, 10); ctx.fillRect(p2, 580, 80, 10);
    ctx.shadowBlur = 15; ctx.shadowColor = '#00f3ff'; ctx.fillRect(ball.x, ball.y, 10, 10); ctx.shadowBlur = 0;
}

// --- LOGICA TETRIS (Semplificata) ---
let tetrisBoard, currentPiece;
function spawnTetrisPiece() { currentPiece = {x: 8, y: 0}; }
function updateTetris() {
    currentPiece.y++;
    if(currentPiece.y > 28) { score += 5; scoreEl.innerText = "SCORE: " + score; spawnTetrisPiece(); }
    drawTetris();
}
function drawTetris() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,600);
    ctx.strokeStyle = '#00f3ff'; ctx.strokeRect(currentPiece.x*20, currentPiece.y*20, 40, 40);
}

// --- LOGICA INVADERS ---
let player, bullets, enemies;
function updateInvaders() {
    bullets.forEach((b, i) => { b.y -= 7; if(b.y < 0) bullets.splice(i,1); });
    enemies.forEach((e, ei) => {
        bullets.forEach((b, bi) => {
            if(b.x > e.x && b.x < e.x+30 && b.y > e.y && b.y < e.y+20) { enemies.splice(ei,1); bullets.splice(bi,1); score += 20; scoreEl.innerText = "SCORE: " + score; }
        });
    });
    if(enemies.length === 0) return gameOver();
    drawInvaders();
}
function drawInvaders() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,600);
    ctx.fillStyle = '#00f3ff'; ctx.fillRect(player, 560, 40, 15);
    ctx.fillStyle = '#ff00ff'; enemies.forEach(e => ctx.fillRect(e.x, e.y, 25, 15));
    ctx.fillStyle = 'white'; bullets.forEach(b => ctx.fillRect(b.x, b.y, 3, 10));
}

// --- CONTROLLI ---
window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if(currentGame === 'snake') {
        if(key === 'w' && dy === 0) { dx=0; dy=-1; }
        if(key === 's' && dy === 0) { dx=0; dy=1; }
        if(key === 'a' && dx === 0) { dx=-1; dy=0; }
        if(key === 'd' && dx === 0) { dx=1; dy=0; }
    }
    if(currentGame === 'pong') {
        if(key === 'a') p1 -= 25; if(key === 'd') p1 += 25;
    }
    if(currentGame === 'invaders') {
        if(key === 'a') player -= 20; if(key === 'd') player += 20;
        if(key === ' ') bullets.push({x: player+18, y: 560});
    }
});

// Mobile Buttons
document.getElementById('btn-up').onclick = () => { if(currentGame==='snake'){dx=0;dy=-1;} };
document.getElementById('btn-down').onclick = () => { if(currentGame==='snake'){dx=0;dy=1;} };
document.getElementById('btn-left').onclick = () => { if(currentGame==='snake'){dx=-1;dy=0;} if(currentGame==='pong')p1-=30; if(currentGame==='invaders')player-=25; };
document.getElementById('btn-right').onclick = () => { if(currentGame==='snake'){dx=1;dy=0;} if(currentGame==='pong')p1+=30; if(currentGame==='invaders')player+=25; };

function gameOver() {
    clearInterval(gameLoop);
    isGameOver = true;
    saveHighScore(currentGame, score);
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0,0,400,600);
    ctx.fillStyle = "#ff00ff"; ctx.font = "25px Orbitron"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", 200, 280);
    ctx.font = "18px Orbitron"; ctx.fillText("FINAL SCORE: " + score, 200, 320);
}

document.getElementById('retry-btn').onclick = initGame;
document.getElementById('exit-btn').onclick = () => {
    clearInterval(gameLoop);
    document.getElementById('game-wrapper').style.display = 'none';
    document.getElementById('game-selector').style.display = 'flex';
};

function backToInterface() {
    document.getElementById('game-selector').style.display = 'none';
    document.getElementById('interface-menu').style.display = 'flex';
}

musicToggle.onchange = () => {
    if(musicToggle.checked) music.play(); else music.pause();
    document.getElementById('music-status').innerText = musicToggle.checked ? "MUSIC: ON" : "MUSIC: OFF";
};
