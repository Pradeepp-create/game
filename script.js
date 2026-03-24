// Game setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 600;

const startMenu = document.getElementById('startMenu');
const endScreen = document.getElementById('endScreen');
const pauseScreen = document.getElementById('pauseScreen');
const ui = document.getElementById('ui');

// Game state
let gameState = 'start'; // start, playing, paused, end
let difficulty = 'med';
let shakeTime = 0;
let comboCount = 0;
let comboTimer = 0;
let specialCooldown = 0;

// Player and Enemy objects
const player = {
    x: 100, y: 400, width: 80, height: 150,
    velX: 0, velY: 0, speed: 5, jump: -18,
    health: 100, maxHealth: 100,
    facing: 1, // 1 right, -1 left
    state: 'idle', // idle, walk, jump, attack, hit, special
    lastAttack: 0
};

const enemy = {
    x: 1000, y: 400, width: 80, height: 150,
    velX: 0, velY: 0, speed: 3, jump: -16,
    health: 100, maxHealth: 100,
    facing: -1,
    state: 'idle',
    lastAttack: 0,
    aiTimer: 0
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Event listeners
document.getElementById('startBtn').onclick = () => {
    difficulty = document.getElementById('difficulty').value;
    startGame();
};
document.getElementById('restartBtn').onclick = startGame;
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && gameState === 'playing') togglePause();
});

// Game functions
function startGame() {
    player.health = player.maxHealth;
    enemy.health = enemy.maxHealth;
    comboCount = 0;
    gameState = 'playing';
    startMenu.classList.add('hidden');
    endScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    ui.classList.remove('hidden');
    gameLoop();
}

function togglePause() {
    gameState = gameState === 'playing' ? 'paused' : 'playing';
    pauseScreen.classList.toggle('hidden');
}

function updateHealthBars() {
    document.getElementById('healthFillPlayer').style.width = (player.health / player.maxHealth * 100) + '%';
    document.getElementById('healthFillEnemy').style.width = (enemy.health / enemy.maxHealth * 100) + '%';
}

function checkGameOver() {
    if (player.health <= 0 || enemy.health <= 0) {
        gameState = 'end';
        document.getElementById('endMessage').textContent = player.health > 0 ? 'You Win!' : 'You Lose!';
        endScreen.classList.remove('hidden');
        ui.classList.add('hidden');
    }
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// Collision detection - simple rect [web:5]
function rectCollide(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Player update
function updatePlayer() {
    // Input
    if (keys['arrowleft']) { player.velX = -player.speed; player.facing = -1; player.state = 'walk'; }
    else if (keys['arrowright']) { player.velX = player.speed; player.facing = 1; player.state = 'walk'; }
    else { player.velX *= 0.8; player.state = 'idle'; }
    if (keys['arrowup'] && player.velY === 0) player.velY = player.jump;

    // Attacks
    if (keys['f'] && Date.now() - player.lastAttack > 500) { player.state = 'attack'; player.lastAttack = Date.now(); attack(player, enemy, 10); }
    if (keys['g'] && Date.now() - player.lastAttack > 500) { player.state = 'attack'; player.lastAttack = Date.now(); attack(player, enemy, 15); }
    if (keys['q'] && specialCooldown <= 0) { player.state = 'special'; specialCooldown = 3000; attack(player, enemy, 30); }

    // Physics
    player.velY += 0.8; // gravity
    player.x += player.velX;
    player.y += player.velY;
    if (player.y >= 400) { player.y = 400; player.velY = 0; }
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Cooldown
    if (specialCooldown > 0) specialCooldown -= 16;
    document.getElementById('cooldownSpecial').textContent = specialCooldown > 0 ? 'Cooldown...' : 'Special Ready';

    // State reset
    if (player.state === 'attack' || player.state === 'special') setTimeout(() => player.state = 'idle', 300);
}

// Enemy AI [web:1]
function updateEnemy() {
    enemy.aiTimer++;
    const dist = distance(player, enemy);
    let aiSpeed = {easy: 2, med: 3.5, hard: 5}[difficulty];

    // Chase
    if (dist > 100) {
        enemy.velX = player.x < enemy.x ? -aiSpeed : aiSpeed;
        enemy.facing = player.x < enemy.x ? 1 : -1;
        enemy.state = 'walk';
    } else {
        enemy.velX *= 0.8;
        enemy.state = 'idle';
        // Attack when close
        if (enemy.aiTimer > (difficulty === 'hard' ? 30 : 60)) {
            enemy.state = 'attack';
            attack(enemy, player, 12 + Math.random() * 10);
            enemy.lastAttack = Date.now();
            enemy.aiTimer = 0;
        }
    }

    // Jump sometimes
    if (Math.random() < 0.01 && enemy.velY === 0) enemy.velY = enemy.jump;

    // Physics
    enemy.velY += 0.8;
    enemy.x += enemy.velX;
    enemy.y += enemy.velY;
    if (enemy.y >= 400) { enemy.y = 400; enemy.velY = 0; }
    enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, enemy.x));
}

function attack(attacker, defender, dmg) {
    if (rectCollide(attacker, defender)) {
        defender.health -= dmg;
        comboCount++;
        comboTimer = 60;
        shakeTime = 10;
        // Combo logic
        if (comboCount >= 3) document.getElementById('comboCounter').textContent = `${comboCount} HIT COMBO!`;
        else document.getElementById('comboCounter').textContent = `${comboCount} HIT`;
        updateHealthBars();
        checkGameOver();
    }
}

// Render
function render() {
    // Shake
    ctx.save();
    if (shakeTime > 0) {
        ctx.translate(Math.random() * 10, Math.random() * 10);
        shakeTime--;
    }
    canvas.classList.toggle('shake', shakeTime > 0);

    // Background (simple gradient, add image later)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#98FB98');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fighters (colored rects + animations, replace with sprites)
    ctx.fillStyle = player.health > 0 ? '#4ecdc4' : '#666';
    ctx.fillRect(player.x, player.y, player.width * player.facing, player.height);
    if (player.state === 'attack') ctx.fillStyle = '#ff6b6b'; ctx.fillRect(player.x + player.width * player.facing * 0.8, player.y + 20, 40, 20);

    ctx.fillStyle = enemy.health > 0 ? '#ff6b6b' : '#666';
    ctx.fillRect(enemy.x, enemy.y, enemy.width * enemy.facing, enemy.height);
    if (enemy.state === 'attack') ctx.fillStyle = '#ffeb3b'; ctx.fillRect(enemy.x + enemy.width * enemy.facing * -0.8, enemy.y + 20, 40, 20);

    // Special flash
    if (player.state === 'special' || enemy.state === 'special') {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
}

// Game loop [web:4]
function gameLoop() {
    if (gameState !== 'playing') return requestAnimationFrame(gameLoop);

    updatePlayer();
    updateEnemy();
    updateHealthBars();

    // Combo fade
    if (comboTimer > 0) comboTimer--; else {
        comboCount = 0;
        document.getElementById('comboCounter').textContent = '0 HIT';
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Init
updateHealthBars();