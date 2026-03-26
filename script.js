const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameOn = false;

// LOAD IMAGES
function load(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const playerIdle = load("assets/player_idle.png");
const playerWalk = load("assets/player_walk.png");
const playerPunch = load("assets/player_punch.png");

const enemyIdle = load("assets/enemy_idle.png");
const enemyWalk = load("assets/enemy_walk.png");
const enemyPunch = load("assets/enemy_punch.png");

const bgImg = load("assets/bg.png");

// POSITIONS
let px, py, pvx, pvy;
let ex, ey, evx;

// BG
let bgX = 0;

// STATS
let pHealth, eHealth;
let pDisplayHealth, eDisplayHealth;
let combo, comboTimer;
let timer;

// EFFECTS
let shake;
let particles = [];

// ANIMATION
let pState, pFrame, pTick;
let eState, eFrame, eTick;

// COOLDOWNS
let pCD, eCD, dashCD;

// INPUT
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// START
document.getElementById('startBtn').onclick = () => {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('hud').classList.remove('hidden');
    startGame();
};

document.getElementById('restartBtn').onclick = () => {
    document.getElementById('gameOver').classList.add('hidden');
    startGame();
};

function startGame() {
    gameOn = true;

    px = 150; py = 360; pvx = 0; pvy = 0;
    ex = 750; ey = 360; evx = 0;

    pHealth = 200;
    eHealth = 200;

    pDisplayHealth = 200;
    eDisplayHealth = 200;

    combo = 0;
    comboTimer = 0;

    timer = 60;

    shake = 0;
    particles = [];

    pCD = 0;
    eCD = 0;
    dashCD = 0;

    bgX = 0;

    pState = "idle";
    pFrame = 0;
    pTick = 0;

    eState = "idle";
    eFrame = 0;
    eTick = 0;
}

// PARTICLES
function spawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 20
        });
    }
}

// PLAYER ATTACK
function attack() {
    if (pCD > 0) return;

    pState = "punch";
    pFrame = 0;

    if (Math.abs(px - ex) < 90) {
        eHealth -= 10;
        combo++;
        comboTimer = 120;
        shake = 8;

        spawnParticles(ex, ey - 60);
    }

    pCD = 25;
}

// ENEMY AI
function enemyAI() {
    if (Math.abs(px - ex) > 70) {
        evx += px > ex ? 0.2 : -0.2;
        eState = "walk";
    } else {
        if (eCD <= 0) {
            eState = "punch";
            eFrame = 0;

            pHealth -= 8;
            shake = 6;

            spawnParticles(px, py - 60);

            eCD = 50;
        } else {
            eState = "idle";
        }
    }
}

function update() {
    if (!gameOn) return;

    let move = 0;
    if (keys['arrowleft']) move = -1;
    if (keys['arrowright']) move = 1;

    pvx += move * 0.6;

    // PLAYER STATE
    if (pState !== "punch") {
        pState = move !== 0 ? "walk" : "idle";
    }

    if (keys['arrowup'] && py >= 360) pvy = 14;

    if (keys['shift'] && dashCD <= 0) {
        pvx = move !== 0 ? move * 8 : (px < ex ? 8 : -8);
        dashCD = 40;
    }

    if (keys['f']) attack();

    pvx *= 0.85;
    pvy -= 0.6;

    px += pvx;
    py -= pvy;

    if (py >= 360) {
        py = 360;
        pvy = 0;
    }

    px = Math.max(40, Math.min(960, px));

    // ENEMY
    evx *= 0.85;
    ex += evx;
    ex = Math.max(40, Math.min(960, ex));

    enemyAI();

    // BG SCROLL
    bgX -= move * 1.5;

    // HEALTH SMOOTH
    pDisplayHealth += (pHealth - pDisplayHealth) * 0.1;
    eDisplayHealth += (eHealth - eDisplayHealth) * 0.1;

    document.getElementById('pHealth').style.width = (pDisplayHealth/200)*100 + '%';
    document.getElementById('eHealth').style.width = (eDisplayHealth/200)*100 + '%';

    document.getElementById('pHPText').innerText = Math.max(0, pHealth);
    document.getElementById('eHPText').innerText = Math.max(0, eHealth);

    document.getElementById('comboText').innerText = combo ? "COMBO x"+combo : "FIGHT!";
    document.getElementById('timer').innerText = Math.floor(timer);

    // ANIMATION
    animate();

    // PARTICLES
    particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    particles = particles.filter(p=>p.life>0);

    // COMBO RESET
    comboTimer--;
    if (comboTimer <= 0) combo = 0;

    // GAME OVER
    if (pHealth <= 0 || eHealth <= 0 || timer <= 0) {
        gameOn = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('result').innerText =
            pHealth > eHealth ? "YOU WIN" : "YOU LOSE";
    }

    timer -= 1/60;

    pCD = Math.max(0, pCD - 1);
    eCD = Math.max(0, eCD - 1);
    dashCD = Math.max(0, dashCD - 1);

    shake *= 0.9;
}

// ANIMATION LOGIC
function animate() {
    pTick++;
    if (pTick > 6) {
        pFrame++;
        pTick = 0;
    }

    eTick++;
    if (eTick > 8) {
        eFrame++;
        eTick = 0;
    }
}

// DRAW SPRITE
function drawSprite(img, frame, x, y, w, h, frames) {
    const fw = img.width / frames;

    ctx.drawImage(
        img,
        fw * (frame % frames), 0,
        fw, img.height,
        x - w/2, y - h,
        w, h
    );
}

// RENDER
function render() {
    ctx.save();

    ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
    );

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // BG
    ctx.drawImage(bgImg, bgX % 1000, 0, 1000, 500);
    ctx.drawImage(bgImg, (bgX % 1000) + 1000, 0, 1000, 500);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0,380,1000,120);

    // PLAYER
    let pImg = playerIdle, pFrames = 4;
    if (pState === "walk") { pImg = playerWalk; pFrames = 6; }
    if (pState === "punch") { pImg = playerPunch; pFrames = 4; }

    drawSprite(pImg, pFrame, px, py, 80, 90, pFrames);

    // ENEMY
    ctx.save();
    ctx.translate(ex, 0);
    ctx.scale(-1, 1);

    let eImg = enemyIdle, eFrames = 4;
    if (eState === "walk") { eImg = enemyWalk; eFrames = 6; }
    if (eState === "punch") { eImg = enemyPunch; eFrames = 4; }

    drawSprite(eImg, eFrame, 0, ey, 80, 90, eFrames);

    ctx.restore();

    // PARTICLES
    particles.forEach(p=>{
        ctx.fillStyle = "orange";
        ctx.fillRect(p.x, p.y, 4, 4);
    });

    ctx.restore();
}

// LOOP
function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

loop();
