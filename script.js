const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 🔥 FIX PIXEL LOOK
ctx.imageSmoothingEnabled = false;

// LOAD
function load(src){
    const img = new Image();
    img.src = src;
    return img;
}

const pIdle = load("assets/player_idle.png");
const pWalk = load("assets/player_walk.png");
const pPunch = load("assets/player_punch.png");

const eIdle = load("assets/enemy_idle.png");
const eWalk = load("assets/enemy_walk.png");
const ePunch = load("assets/enemy_punch.png");

const bg = load("assets/bg.png");

// STATE
let px, py, pvx, pvy;
let ex, ey, evx;

let pHP, eHP, pDisp, eDisp;

let pState, eState;
let pFrame, eFrame, pTick, eTick;

let pAtk = 0, eAtk = 0;
let pStun = 0, eStun = 0;

let pBlocking = false;
let eBlocking = false;

let timer = 60;
let gameOn = false;

let particles = [];
let shake = 0;
let bgX = 0;

const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// START / REPLAY
document.getElementById('startBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;

function startGame(){
    gameOn = true;

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    px = 150; py = 360; pvx = 0; pvy = 0;
    ex = 750; ey = 360; evx = 0;

    pHP = eHP = 200;
    pDisp = eDisp = 200;

    pState = eState = "idle";
    pFrame = eFrame = 0;
    pTick = eTick = 0;

    pAtk = eAtk = 0;
    pStun = eStun = 0;

    timer = 60;
    particles = [];
    shake = 0;
    bgX = 0;
}

// PARTICLES
function spawn(x,y){
    for(let i=0;i<5;i++){
        particles.push({
            x,y,
            vx:(Math.random()-0.5)*4,
            vy:(Math.random()-0.5)*4,
            life:15
        });
    }
}

// PLAYER ATTACK
function playerAttack(){
    if(pAtk>0 || pStun>0) return;
    pAtk = 18;
    pState = "punch";
    pFrame = 0;
}

// ENEMY ATTACK
function enemyAttack(){
    if(eAtk>0 || eStun>0) return;
    eAtk = 20;
    eState = "punch";
    eFrame = 0;
}

// HIT SYSTEM
function hitCheck(){
    const dist = Math.abs(px - ex);

    if(pAtk === 10 && dist < 85){
        if(!eBlocking){
            eHP -= 12;
            eStun = 12;
            evx += px < ex ? 5 : -5;
            spawn(ex, ey-50);
            shake = 7;
        } else {
            eHP -= 3;
        }
    }

    if(eAtk === 12 && dist < 85){
        if(!pBlocking){
            pHP -= 10;
            pStun = 10;
            pvx += ex < px ? 5 : -5;
            spawn(px, py-50);
            shake = 6;
        } else {
            pHP -= 3;
        }
    }
}

// AI
function enemyAI(){
    const dist = Math.abs(px - ex);

    if(eStun>0) return;

    if(dist > 100){
        evx += px > ex ? 0.3 : -0.3;
        eState = "walk";
    } else {
        evx *= 0.7;

        // BLOCK SOMETIMES
        if(pAtk > 10 && Math.random() < 0.6){
            eBlocking = true;
        } else {
            eBlocking = false;
        }

        // ATTACK
        if(eAtk <= 0 && Math.random() < 0.05){
            enemyAttack();
        } else if(!eBlocking){
            eState = "idle";
        }
    }

    // RETREAT IF TOO CLOSE
    if(dist < 60){
        evx += px > ex ? -0.3 : 0.3;
    }
}

// UPDATE
function update(){
    if(!gameOn) return;

    let move = 0;
    if(keys['arrowleft']) move = -1;
    if(keys['arrowright']) move = 1;

    pBlocking = keys['s'];

    if(pStun <= 0){
        pvx += move * 0.6;

        if(pState !== "punch"){
            pState = move !== 0 ? "walk" : "idle";
        }

        if(keys['arrowup'] && py >= 360) pvy = 14;
        if(keys['f']) playerAttack();
    }

    pvx *= 0.85;
    pvy -= 0.6;

    px += pvx;
    py -= pvy;

    if(py >= 360){ py = 360; pvy = 0; }
    px = Math.max(60, Math.min(940, px));

    // ENEMY
    enemyAI();

    evx *= 0.85;
    ex += evx;
    ex = Math.max(60, Math.min(940, ex));

    // HIT CHECK
    hitCheck();

    // TIMERS
    if(pAtk>0) pAtk--;
    if(eAtk>0) eAtk--;

    if(pStun>0) pStun--;
    if(eStun>0) eStun--;

    // HEALTH SMOOTH
    pDisp += (pHP - pDisp) * 0.1;
    eDisp += (eHP - eDisp) * 0.1;

    document.getElementById('pHealth').style.width = (pDisp/200)*100 + "%";
    document.getElementById('eHealth').style.width = (eDisp/200)*100 + "%";

    document.getElementById('pHPText').innerText = Math.max(0,pHP);
    document.getElementById('eHPText').innerText = Math.max(0,eHP);
    document.getElementById('timer').innerText = Math.floor(timer);

    // PARTICLES
    particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    particles = particles.filter(p=>p.life>0);

    // END
    if(pHP<=0 || eHP<=0 || timer<=0){
        gameOn = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('result').innerText =
            pHP > eHP ? "YOU WIN" : "YOU LOSE";
    }

    timer -= 1/60;

    animate();
}

// ANIMATION
function animate(){
    pTick++; if(pTick>6){pFrame++;pTick=0;}
    eTick++; if(eTick>8){eFrame++;eTick=0;}
}

// 🔥 AUTO-CROP DRAW (NO BOX LOOK)
function draw(img, frame, x, y, w, h, frames){
    if (!img.complete) return;

    const fw = img.width / frames;

    const temp = document.createElement("canvas");
    const tctx = temp.getContext("2d");

    temp.width = fw;
    temp.height = img.height;

    tctx.drawImage(img, fw*(frame%frames),0,fw,img.height,0,0,fw,img.height);

    const data = tctx.getImageData(0,0,fw,img.height).data;

    let minX=fw, maxX=0, minY=img.height, maxY=0;

    for(let y1=0;y1<img.height;y1++){
        for(let x1=0;x1<fw;x1++){
            if(data[(y1*fw+x1)*4+3]>0){
                if(x1<minX) minX=x1;
                if(x1>maxX) maxX=x1;
                if(y1<minY) minY=y1;
                if(y1>maxY) maxY=y1;
            }
        }
    }

    const cw = maxX-minX;
    const ch = maxY-minY;

    ctx.drawImage(
        img,
        fw*(frame%frames)+minX, minY,
        cw, ch,
        Math.round(x-w/2),
        Math.round(y-h+5),
        w, h
    );
}

// RENDER
function render(){
    ctx.save();

    ctx.translate(
        (Math.random()-0.5)*shake,
        (Math.random()-0.5)*shake
    );

    ctx.clearRect(0,0,1000,500);

    // BG
    ctx.drawImage(bg,bgX%1000,0,1000,500);
    ctx.drawImage(bg,(bgX%1000)+1000,0,1000,500);

    // SHADOW PLAYER
    ctx.fillStyle="rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(px,370,25,8,0,0,Math.PI*2);
    ctx.fill();

    // PLAYER
    let pi=pIdle,pf=4;
    if(pState==="walk"){pi=pWalk;pf=6;}
    if(pState==="punch"){pi=pPunch;pf=4;}

    draw(pi,pFrame,px,py,70,90,pf);

    // ENEMY
    ctx.save();
    ctx.translate(ex,0);
    ctx.scale(-1,1);

    ctx.beginPath();
    ctx.ellipse(0,370,25,8,0,0,Math.PI*2);
    ctx.fill();

    let ei=eIdle,ef=4;
    if(eState==="walk"){ei=eWalk;ef=6;}
    if(eState==="punch"){ei=ePunch;ef=4;}

    draw(ei,eFrame,0,ey,70,90,ef);

    ctx.restore();

    // PARTICLES
    particles.forEach(p=>{
        ctx.fillStyle="orange";
        ctx.fillRect(p.x,p.y,3,3);
    });

    ctx.restore();
}

// LOOP
function loop(){
    update();
    render();
    requestAnimationFrame(loop);
}
loop();
