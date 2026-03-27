const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// LOAD
function load(src){ const i=new Image(); i.src=src; return i; }

const pIdle=load("assets/player_idle.png");
const pWalk=load("assets/player_walk.png");
const pPunch=load("assets/player_punch.png");

const eIdle=load("assets/enemy_idle.png");
const eWalk=load("assets/enemy_walk.png");
const ePunch=load("assets/enemy_punch.png");

const bg=load("assets/bg.png");

// STATE
let px,py,pvx,pvy;
let ex,ey,evx;

let pHP,eHP;
let pState="idle",eState="idle";

let pAtk=0,eAtk=0;
let pStun=0,eStun=0;

let pBlock=false,eBlock=false;

let gameOn=false;
let timer=60;

const keys={};
document.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

// START
document.getElementById('startBtn').onclick=startGame;
document.getElementById('restartBtn').onclick=startGame;

function startGame(){
    gameOn=true;

    document.getElementById('startScreen').style.display='none';
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    px=150;py=360;pvx=0;pvy=0;
    ex=750;ey=360;evx=0;

    pHP=eHP=200;

    pAtk=eAtk=0;
    pStun=eStun=0;

    timer=60;
}

// PLAYER ATTACK
function playerAttack(){
    if(pAtk>0||pStun>0) return;
    pAtk=18;
    pState="punch";
}

// ENEMY ATTACK
function enemyAttack(){
    if(eAtk>0||eStun>0) return;
    eAtk=20;
    eState="punch";
}

// 🔥 SMART AI (CLEAN + RELIABLE)
function enemyAI(){
    const dist=Math.abs(px-ex);
    const dir = px>ex ? 1 : -1;

    if(eStun>0) return;

    // ALWAYS COME TO PLAYER
    if(dist>90){
        evx = 2 * dir;
        eState="walk";
        return;
    }

    // CLOSE RANGE LOGIC
    evx = 0;

    // BLOCK when player attacking
    if(pAtk>8){
        eBlock=true;
        eState="idle";
        return;
    }else{
        eBlock=false;
    }

    // punish missed attack
    if(pAtk>0 && pAtk<6 && eAtk===0){
        enemyAttack();
        return;
    }

    // normal attack
    if(eAtk===0 && dist<80){
        enemyAttack();
        return;
    }

    eState="idle";
}

// HIT CHECK
function hitCheck(){
    const dist=Math.abs(px-ex);

    if(pAtk===10 && dist<80){
        if(!eBlock){
            eHP-=12;
            eStun=10;
            evx += px<ex?4:-4;
        }else{
            eHP-=3;
        }
    }

    if(eAtk===12 && dist<80){
        if(!pBlock){
            pHP-=10;
            pStun=8;
            pvx += ex<px?4:-4;
        }else{
            pHP-=3;
        }
    }
}

function update(){
    if(!gameOn) return;

    let move=0;
    if(keys['arrowleft']) move=-1;
    if(keys['arrowright']) move=1;

    pBlock = keys['s'];

    if(pStun<=0){
        pvx = move * 3;

        if(move!==0) pState="walk";
        else pState="idle";

        if(keys['arrowup'] && py>=360) pvy=12;
        if(keys['f']) playerAttack();
    }

    pvy-=0.6;
    py-=pvy;
    if(py>=360){py=360;pvy=0;}

    px+=pvx;
    px=Math.max(50,Math.min(950,px));

    // ENEMY
    enemyAI();
    ex+=evx;
    ex=Math.max(50,Math.min(950,ex));

    // HIT
    hitCheck();

    if(pAtk>0)pAtk--;
    if(eAtk>0)eAtk--;

    if(pStun>0)pStun--;
    if(eStun>0)eStun--;

    // END
    if(pHP<=0||eHP<=0||timer<=0){
        gameOn=false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('result').innerText=
            pHP>eHP?"YOU WIN":"YOU LOSE";
    }

    timer-=1/60;
    document.getElementById('timer').innerText=Math.floor(timer);

    document.getElementById('pHealth').style.width=(pHP/200)*100+"%";
    document.getElementById('eHealth').style.width=(eHP/200)*100+"%";

    document.getElementById('pHPText').innerText=pHP;
    document.getElementById('eHPText').innerText=eHP;
}

// DRAW
function draw(img,x,y,scale,frames,frame,flip=false){
    if(!img.complete)return;

    const fw=img.width/frames;

    ctx.save();
    if(flip){
        ctx.translate(x,0);
        ctx.scale(-1,1);
        x=0;
    }

    ctx.drawImage(
        img,
        fw*(frame%frames),0,fw,img.height,
        x-fw*scale/2,y-img.height*scale,
        fw*scale,img.height*scale
    );

    ctx.restore();
}

let frame=0;
function render(){
    ctx.clearRect(0,0,1000,500);

    ctx.drawImage(bg,0,0,1000,500);

    // ground
    ctx.fillStyle="#111";
    ctx.fillRect(0,380,1000,120);

    frame++;

    // PLAYER
    let pi=pIdle,pf=4;
    if(pState==="walk"){pi=pWalk;pf=6;}
    if(pState==="punch"){pi=pPunch;pf=4;}

    draw(pi,px,py,1.2,pf,frame);

    // ENEMY
    let ei=eIdle,ef=4;
    if(eState==="walk"){ei=eWalk;ef=6;}
    if(eState==="punch"){ei=ePunch;ef=4;}

    draw(ei,ex,ey,1.2,ef,frame,true);
}

// LOOP
function loop(){
    update();
    render();
    requestAnimationFrame(loop);
}
loop();
