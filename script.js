const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameOn = false;

// PLAYER
let px = 150, py = 360;
let pvx = 0, pvy = 0;

// ENEMY
let ex = 750, ey = 360;
let evx = 0;

// STATS
let pHealth = 200;
let eHealth = 200;

// INPUT
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// START
document.getElementById('startBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;

function startGame(){
    gameOn = true;

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    px = 150; py = 360; pvx = 0; pvy = 0;
    ex = 750; ey = 360; evx = 0;

    pHealth = 200;
    eHealth = 200;
}

// ATTACK
let attackCooldown = 0;

function attack(){
    if(attackCooldown > 0) return;

    if(Math.abs(px - ex) < 80){
        eHealth -= 10;
    }

    attackCooldown = 25;
}

// SIMPLE AI
function enemyAI(){
    let dist = Math.abs(px - ex);

    // move towards player
    if(dist > 60){
        evx = px > ex ? 2 : -2;
    }else{
        evx = 0;

        // attack when close
        if(Math.random() < 0.03){
            pHealth -= 8;
        }
    }
}

// UPDATE
function update(){
    if(!gameOn) return;

    let move = 0;
    if(keys['arrowleft']) move = -1;
    if(keys['arrowright']) move = 1;

    pvx = move * 3;

    // jump
    if(keys['arrowup'] && py >= 360){
        pvy = 12;
    }

    // gravity
    pvy -= 0.6;
    py -= pvy;

    if(py >= 360){
        py = 360;
        pvy = 0;
    }

    px += pvx;
    px = Math.max(20, Math.min(980, px));

    // attack
    if(keys['f']) attack();

    // enemy
    enemyAI();
    ex += evx;
    ex = Math.max(20, Math.min(980, ex));

    // cooldown
    if(attackCooldown > 0) attackCooldown--;

    // UI
    document.getElementById('pHealth').style.width = (pHealth/200)*100 + '%';
    document.getElementById('eHealth').style.width = (eHealth/200)*100 + '%';

    document.getElementById('pHPText').innerText = pHealth;
    document.getElementById('eHPText').innerText = eHealth;

    // GAME OVER
    if(pHealth <= 0 || eHealth <= 0){
        gameOn = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('result').innerText =
            pHealth > eHealth ? "YOU WIN" : "YOU LOSE";
    }
}

// RENDER (simple boxes)
function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // ground
    ctx.fillStyle = "#111";
    ctx.fillRect(0,380,1000,120);

    // player
    ctx.fillStyle = "blue";
    ctx.fillRect(px-20, py-60, 40, 60);

    // enemy
    ctx.fillStyle = "red";
    ctx.fillRect(ex-20, ey-60, 40, 60);
}

// LOOP
function loop(){
    update();
    render();
    requestAnimationFrame(loop);
}

loop();
