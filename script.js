const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameOn = false;

// POSITIONS
let px = 100, py = 360, pvx = 0, pvy = 0;
let ex = 800, ey = 360, evx = 0;

// STATS
let pHealth = 200, eHealth = 200;
let combo = 0, comboTimer = 0;
let timer = 99;

// COOLDOWNS
let pCD = 0, eCD = 0, dashCD = 0;

// INPUT
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// START
document.getElementById('startBtn').onclick = () => {
    document.getElementById('startScreen').style.display = 'none';
    gameOn = true;
};

// ATTACK
function attack() {
    if (pCD > 0) return;

    if (Math.abs(px - ex) < 80) {
        eHealth -= 10;
        combo++;
        comboTimer = 120;
    }

    pCD = 20;
}

// ENEMY AI
function enemyAI() {
    if (Math.abs(px - ex) > 60) {
        evx += px > ex ? 0.2 : -0.2;
    } else {
        if (eCD <= 0) {
            pHealth -= 8;
            eCD = 40;
        }
    }
}

function update() {
    if (!gameOn) return;

    // MOVEMENT INPUT (ARROW KEYS)
    let move = 0;

    if (keys['arrowleft']) move = -1;
    if (keys['arrowright']) move = 1;

    pvx += move * 0.6;

    // JUMP (only if on ground)
    if (keys['arrowup'] && py >= 360) {
        pvy = 14;
    }

    // DASH
    if (keys['shift'] && dashCD <= 0) {
        pvx = (move !== 0 ? move * 6 : (px < ex ? 6 : -6));
        dashCD = 40;
    }

    // ATTACK
    if (keys['f']) attack();

    // APPLY PHYSICS
    pvx *= 0.85;
    pvy -= 0.6; // gravity

    // LIMIT SPEED (fix flying bug)
    pvx = Math.max(-6, Math.min(6, pvx));
    pvy = Math.max(-15, Math.min(15, pvy));

    px += pvx;
    py -= pvy;

    // GROUND COLLISION
    if (py >= 360) {
        py = 360;
        pvy = 0;
    }

    // SCREEN LIMIT
    px = Math.max(20, Math.min(980, px));

    // ENEMY
    evx *= 0.85;
    ex += evx;
    ex = Math.max(20, Math.min(980, ex));

    enemyAI();

    // COMBO
    comboTimer--;
    if (comboTimer <= 0) combo = 0;

    // TIMER
    timer -= 1/60;

    // UI UPDATE
    document.getElementById('pHealth').style.width = (pHealth/200)*100 + '%';
    document.getElementById('eHealth').style.width = (eHealth/200)*100 + '%';

    document.getElementById('pHPText').innerText = Math.max(0, pHealth);
    document.getElementById('eHPText').innerText = Math.max(0, eHealth);

    document.getElementById('comboText').innerText = combo ? "COMBO x" + combo : "FIGHT!";
    document.getElementById('timer').innerText = Math.floor(timer);

    // COOLDOWNS
    pCD = Math.max(0, pCD - 1);
    eCD = Math.max(0, eCD - 1);
    dashCD = Math.max(0, dashCD - 1);

    // GAME OVER
    if (pHealth <= 0 || eHealth <= 0 || timer <= 0) {
        gameOn = false;
        alert(pHealth > eHealth ? "YOU WIN" : "YOU LOSE");
    }
}
// RENDER
function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // GROUND
    ctx.fillStyle = "#111";
    ctx.fillRect(0,380,1000,120);

    // PLAYER
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(px-20, py-60, 40, 60);

    // ENEMY
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(ex-20, ey-60, 40, 60);
}

// LOOP
function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

loop();
