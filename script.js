const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let gameOn = false;

// LOAD
function load(src){
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

// GAME STATE
let px, py, pvx, pvy;
let ex, ey, evx;

let pHealth, eHealth;
let pDisplay, eDisplay;

let pState, eState;
let pFrame, eFrame;
let pTick, eTick;

let pCD, eCD, dashCD;
let timer;

let particles = [];
let shake = 0;
let bgX = 0;

// INPUT
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// START / REPLAY
document.getElementById('startBtn').onclick = () => startGame();
document.getElementById('restartBtn').onclick = () => startGame();

function startGame(){
    gameOn = true;

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    px = 150; py = 360; pvx = 0; pvy = 0;
    ex = 750; ey = 360; evx = 0;

    pHealth = eHealth = 200;
    pDisplay = eDisplay = 200;

    pState = eState = "idle";
    pFrame = eFrame = 0;
    pTick = eTick = 0;

    pCD = eCD = dashCD = 0;
    timer = 60;

    particles = [];
    shake = 0;
    bgX = 0;
}

// PARTICLES
function spawnParticles(x,y){
    for(let i=0;i<6;i++){
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
    if(pCD>0) return;

    pState="punch";
    pFrame=0;

    if(Math.abs(px-ex)<85){
        eHealth -= 10;
        shake=6;
        spawnParticles(ex,ey-50);
    }

    pCD=25;
}

// 🔥 BETTER AI
function enemyAI(){
    const dist = Math.abs(px-ex);

    // movement logic
    if(dist > 120){
        evx += px>ex ? 0.25 : -0.25;
        eState="walk";
    }
    else if(dist > 70){
        evx += px>ex ? 0.15 : -0.15;
        eState="walk";
    }
    else{
        evx *= 0.6;

        // attack timing (human-like delay)
        if(eCD<=0 && Math.random() < 0.04){
            eState="punch";
            eFrame=0;

            pHealth -= 8;
            shake=5;
            spawnParticles(px,py-50);

            eCD=50;
        }else{
            eState="idle";
        }
    }

    // slight retreat (feels smarter)
    if(pState==="punch" && dist<90){
        evx += px>ex ? -0.4 : 0.4;
    }
}

// UPDATE
function update(){
    if(!gameOn) return;

    let move=0;
    if(keys['arrowleft']) move=-1;
    if(keys['arrowright']) move=1;

    pvx += move*0.6;

    if(pState!=="punch"){
        pState = move!==0 ? "walk":"idle";
    }

    if(keys['arrowup'] && py>=360) pvy=14;

    if(keys['shift'] && dashCD<=0){
        pvx = move!==0 ? move*8 : (px<ex?8:-8);
        dashCD=40;
    }

    if(keys['f']) playerAttack();

    pvx *= 0.85;
    pvy -= 0.6;

    px += pvx;
    py -= pvy;

    if(py>=360){ py=360; pvy=0; }

    px = Math.max(60, Math.min(940, px));

    // ENEMY
    enemyAI();

    evx *= 0.85;
    ex += evx;
    ex = Math.max(60, Math.min(940, ex));

    // BG
    bgX -= move*1.2;

    // HEALTH SMOOTH
    pDisplay += (pHealth-pDisplay)*0.1;
    eDisplay += (eHealth-eDisplay)*0.1;

    document.getElementById('pHealth').style.width = (pDisplay/200)*100+"%";
    document.getElementById('eHealth').style.width = (eDisplay/200)*100+"%";

    document.getElementById('pHPText').innerText = Math.max(0,pHealth);
    document.getElementById('eHPText').innerText = Math.max(0,eHealth);

    document.getElementById('timer').innerText = Math.floor(timer);

    // ANIMATION
    animate();

    // PARTICLES
    particles.forEach(p=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;
    });
    particles = particles.filter(p=>p.life>0);

    // END
    if(pHealth<=0 || eHealth<=0 || timer<=0){
        gameOn=false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('result').innerText =
            pHealth>eHealth ? "YOU WIN":"YOU LOSE";
    }

    timer -= 1/60;

    pCD=Math.max(0,pCD-1);
    eCD=Math.max(0,eCD-1);
    dashCD=Math.max(0,dashCD-1);

    shake *= 0.9;
}

// ANIMATION FIX (less wonky)
function animate(){
    pTick++;
    if(pTick>8){
        pFrame++;
        pTick=0;
    }

    eTick++;
    if(eTick>10){
        eFrame++;
        eTick=0;
    }
}

// DRAW SPRITE (FIXED ALIGNMENT)
function drawSprite(img,frame,x,y,w,h,frames){
    const fw = img.width/frames;

    ctx.drawImage(
        img,
        fw*(frame%frames),0,
        fw,img.height,
        Math.round(x-w/2),
        Math.round(y-h+5), // small offset fix
        w,h
    );
}

// RENDER
function render(){
    ctx.save();

    ctx.translate(
        (Math.random()-0.5)*shake,
        (Math.random()-0.5)*shake
    );

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // BG
    ctx.drawImage(bgImg,bgX%1000,0,1000,500);
    ctx.drawImage(bgImg,(bgX%1000)+1000,0,1000,500);

    ctx.fillStyle="rgba(0,0,0,0.4)";
    ctx.fillRect(0,380,1000,120);

    // PLAYER
    let pImg=playerIdle, pFrames=4;
    if(pState==="walk"){pImg=playerWalk;pFrames=6;}
    if(pState==="punch"){pImg=playerPunch;pFrames=4;}

    drawSprite(pImg,pFrame,px,py,85,95,pFrames);

    // ENEMY
    ctx.save();
    ctx.translate(ex,0);
    ctx.scale(-1,1);

    let eImg=enemyIdle, eFrames=4;
    if(eState==="walk"){eImg=enemyWalk;eFrames=6;}
    if(eState==="punch"){eImg=enemyPunch;eFrames=4;}

    drawSprite(eImg,eFrame,0,ey,85,95,eFrames);

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
