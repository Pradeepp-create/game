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

// UPDATE
function update() {
    if (!gameOn) return;

    // MOVEMENT
    if (keys['a']) pvx -= 0.5;
    if (keys['d']) pvx += 0.5;

    if (keys['shift'] && dashCD <= 0) {
        pvx = px < ex ? 6 : -6;
        dashCD = 40;
    }

    if (keys['f']) attack();

    pvx *= 0.85;
    pvx = Math.max(-6, Math.min(6, pvx));

    px += pvx;

    evx *= 0.85;
    ex += evx;

    enemyAI();

    // COMBO RESET
    comboTimer--;
    if (comboTimer <= 0) combo = 0;

    // TIMER
    timer -= 1/60;

    // UI UPDATE
    document.getElementById('pHealth').style.width = (pHealth/200)*100 + '%';
    document.getElementById('eHealth').style.width = (eHealth/200)*100 + '%';

    document.getElementById('pHPText').innerText = pHealth;
    document.getElementById('eHPText').innerText = eHealth;

    document.getElementById('comboText').innerText = combo ? "COMBO x"+combo : "FIGHT!";
    document.getElementById('timer').innerText = Math.floor(timer);

    // COOLDOWNS
    pCD--;
    eCD--;
    dashCD--;

    // END
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
