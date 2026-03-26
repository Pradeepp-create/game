const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameOn = false;

// POSITIONS
let px = 100, py = 360, pvx = 0, pvy = 0;
let ex = 800, ey = 360, evx = 0;

// STATS
let pHealth = 200, eHealth = 200;
let combo = 0, comboTimer = 0;
let timer = 60;

// EFFECTS
let shake = 0;

// COOLDOWNS
let pCD = 0, eCD = 0, dashCD = 0;

// INPUT
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// START
document.getElementById('startBtn').onclick = () => {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('hud').classList.remove('hidden');
    gameOn = true;
};

// RESTART
document.getElementById('restartBtn').onclick = () => location.reload();

// ATTACK
function attack() {
    if (pCD > 0) return;

    if (Math.abs(px - ex) < 80) {
        eHealth -= 10;
        combo++;
        comboTimer = 120;
        shake = 8; // screen shake
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
            shake = 6;
            eCD = 40;
        }
    }
}

function update() {
    if (!gameOn) return;

    let move = 0;
    if (keys['arrowleft']) move = -1;
    if (keys['arrowright']) move = 1;

    pvx += move * 0.6;

    if (keys['arrowup'] && py >= 360) {
        pvy = 14;
    }

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

    px = Math.max(20, Math.min(980, px));

    evx *= 0.85;
    ex += evx;
    ex = Math.max(20, Math.min(980, ex));

    enemyAI();

    comboTimer--;
    if (comboTimer <= 0) combo = 0;

    timer -= 1/60;

    // UI
    document.getElementById('pHealth').style.width = (pHealth/200)*100 + '%';
    document.getElementById('eHealth').style.width = (eHealth/200)*100 + '%';

    document.getElementById('pHPText').innerText = Math.max(0, pHealth);
    document.getElementById('eHPText').innerText = Math.max(0, eHealth);

    document.getElementById('comboText').innerText = combo ? "COMBO x" + combo : "FIGHT!";
    document.getElementById('timer').innerText = Math.floor(timer);

    pCD = Math.max(0, pCD - 1);
    eCD = Math.max(0, eCD - 1);
    dashCD = Math.max(0, dashCD - 1);

    if (pHealth <= 0 || eHealth <= 0 || timer <= 0) {
        gameOn = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('result').innerText =
            pHealth > eHealth ? "YOU WIN" : "YOU LOSE";
    }

    shake *= 0.9;
}

// RENDER
function render() {
    ctx.save();

    // SCREEN SHAKE
    ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
    );

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // BACKGROUND
    let gradient = ctx.createLinearGradient(0,0,0,500);
    gradient.addColorStop(0,"#1e293b");
    gradient.addColorStop(1,"#020617");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,1000,500);

    // GROUND
    ctx.fillStyle = "#111";
    ctx.fillRect(0,380,1000,120);

    // PLAYER (with glow)
    ctx.shadowColor = "#3b82f6";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(px-20, py-60, 40, 60);

    // ENEMY
    ctx.shadowColor = "#ef4444";
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(ex-20, ey-60, 40, 60);

    ctx.restore();
}

// LOOP
function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

loop();
