const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const music = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');

let currentInterface = 'desktop';
let currentGame = '';
let gameLoop;
let score = 0;
let isGameOver = false;

// Configurazione Giochi
const grid = 20;
let snake, food, dx, dy; // Snake
let ball, p1, p2; // Pong
let tetrisBoard, currentPiece; // Tetris
let player, bullets, enemies; // Invaders

function setInterface(mode) {
    currentInterface = mode;
    document.getElementById('interface-menu').style.display = 'none';
    document.getElementById('game-selector').style.display = 'block';
    if(musicToggle.checked) {
        music.volume = 0.3;
        music.play().catch(() => console.log("Interazione richiesta per audio"));
    }
}

function selectGame(game) {
    currentGame = game;
    document.getElementById('game-selector').style.display = 'none';
    document.getElementById('game-wrapper').style.display = 'block';
    document.getElementById('game-title').innerText = game.toUpperCase();
    
    if(currentInterface === 'mobile') {
        document.getElementById('mobile-controls').style.display = 'block';
        // Nascondi frecce laterali per Pong
        document.getElementById('btn-left').style.visibility = (game === 'pong') ? 'hidden' : 'visible';
        document.getElementById('btn-right').style.visibility = (game === 'pong') ? 'hidden' : 'visible';
    }
    
    initGame();
}

function initGame() {
    clearInterval(gameLoop);
    isGameOver = false;
    score = 0;
    canvas.width = 400;
    canvas.height = 400;

    if(currentGame === 'snake') {
        snake = [{x: 10, y: 10}];
        dx = 1; dy = 0;
        spawnFood();
        gameLoop = setInterval(updateSnake, 100);
    } else if(currentGame === 'pong') {
        ball = {x: 200, y: 200, dx: 4, dy: 4};
        p1 = 160; p2 = 160;
        gameLoop = setInterval(updatePong, 1000/60);
    } else if(currentGame === 'tetris') {
        tetrisBoard = Array(20).fill().map(() => Array(10).fill(0));
        spawnTetrisPiece();
        gameLoop = setInterval(updateTetris, 500);
    } else if(currentGame === 'invaders') {
        player = 180;
        bullets = [];
        enemies = [];
        for(let i=0; i<5; i++) for(let j=0; j<3; j++) enemies.push({x: 50+i*60, y: 30+j*40});
        gameLoop = setInterval(updateInvaders, 1000/60);
    }
}

// --- LOGICA SNAKE ---
function updateSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();
    snake.unshift(head);
    if(head.x === food.x && head.y === food.y) spawnFood(); else snake.pop();
    drawSnake();
}
function drawSnake() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = '#00f3ff'; snake.forEach(s => ctx.fillRect(s.x*20, s.y*20, 18, 18));
    ctx.fillStyle = '#ff00ff'; ctx.fillRect(food.x*20, food.y*20, 18, 18);
}
function spawnFood() { food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)}; }

// --- LOGICA PONG ---
function updatePong() {
    ball.x += ball.dx; ball.y += ball.dy;
    if(ball.y < 0 || ball.y > 390) ball.dy *= -1;
    if(ball.x < 20 && ball.y > p1 && ball.y < p1+80) ball.dx *= -1.1;
    if(ball.x > 370 && ball.y > p2 && ball.y < p2+80) ball.dx *= -1.1;
    if(ball.x < 0 || ball.x > 400) return gameOver();
    p2 += (ball.y - (p2+40)) * 0.1; // AI semplice
    drawPong();
}
function drawPong() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = '#00f3ff'; ctx.fillRect(10, p1, 10, 80); ctx.fillRect(380, p2, 10, 80);
    ctx.fillRect(ball.x, ball.y, 10, 10);
}

// --- LOGICA TETRIS (Semplificata) ---
function spawnTetrisPiece() { currentPiece = {x: 4, y: 0, shape: [[1,1,1,1]]}; }
function updateTetris() {
    currentPiece.y++;
    if(currentPiece.y > 19) { currentPiece.y--; lockPiece(); spawnTetrisPiece(); }
    drawTetris();
}
function lockPiece() { /* Logica blocco omessa per brevità */ }
function drawTetris() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = '#00f3ff'; ctx.fillRect(currentPiece.x*40, currentPiece.y*20, 80, 20);
}

// --- LOGICA INVADERS ---
function updateInvaders() {
    bullets.forEach((b, i) => { b.y -= 5; if(b.y < 0) bullets.splice(i,1); });
    enemies.forEach((e, ei) => {
        bullets.forEach((b, bi) => {
            if(b.x > e.x && b.x < e.x+40 && b.y > e.y && b.y < e.y+20) { enemies.splice(ei,1); bullets.splice(bi,1); }
        });
    });
    if(enemies.length === 0) return gameOver();
    drawInvaders();
}
function drawInvaders() {
    ctx.fillStyle = 'black'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = '#00f3ff'; ctx.fillRect(player, 370, 40, 20);
    ctx.fillStyle = '#ff00ff'; enemies.forEach(e => ctx.fillRect(e.x, e.y, 30, 20));
    ctx.fillStyle = 'white'; bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));
}

// --- CONTROLLI ---
window.addEventListener('keydown', e => {
    if(currentGame === 'snake') {
        if(e.key === 'w' && dy === 0) { dx=0; dy=-1; }
        if(e.key === 's' && dy === 0) { dx=0; dy=1; }
        if(e.key === 'a' && dx === 0) { dx=-1; dy=0; }
        if(e.key === 'd' && dx === 0) { dx=1; dy=0; }
    }
    if(currentGame === 'pong') {
        if(e.key === 'w') p1 -= 20; if(e.key === 's') p1 += 20;
    }
    if(currentGame === 'invaders') {
        if(e.key === 'a') player -= 15; if(e.key === 'd') player += 15;
        if(e.key === ' ') bullets.push({x: player+18, y: 370});
    }
});

// Mobile Buttons
document.getElementById('btn-up').onclick = () => { if(currentGame==='snake'){dx=0;dy=-1;} if(currentGame==='pong')p1-=30; };
document.getElementById('btn-down').onclick = () => { if(currentGame==='snake'){dx=0;dy=1;} if(currentGame==='pong')p1+=30; };
document.getElementById('btn-left').onclick = () => { if(currentGame==='snake'){dx=-1;dy=0;} if(currentGame==='invaders')player-=20; };
document.getElementById('btn-right').onclick = () => { if(currentGame==='snake'){dx=1;dy=0;} if(currentGame==='invaders')player+=20; };

function gameOver() {
    clearInterval(gameLoop);
    isGameOver = true;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,400,400);
    ctx.fillStyle = "#ff00ff"; ctx.font = "30px Orbitron"; ctx.fillText("GAME OVER", 100, 200);
}

document.getElementById('retry-btn').onclick = initGame;
document.getElementById('exit-btn').onclick = () => {
    clearInterval(gameLoop);
    document.getElementById('game-wrapper').style.display = 'none';
    document.getElementById('game-selector').style.display = 'block';
};

function backToInterface() {
    document.getElementById('game-selector').style.display = 'none';
    document.getElementById('interface-menu').style.display = 'block';
}

musicToggle.onchange = () => {
    if(musicToggle.checked) music.play(); else music.pause();
    document.getElementById('music-status').innerText = musicToggle.checked ? "MUSIC: ON" : "MUSIC: OFF";
};
