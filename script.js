alert('JS LOADED!'); // Proof no 404

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let playerX = 100;
let enemyX = 1000;
let playerHealth = 100;
let enemyHealth = 100;

document.addEventListener('keydown', (e) => {
    console.log('Key:', e.key); // Console proof
    
    if (e.key === 'ArrowRight') playerX = Math.min(1100, playerX + 15);
    if (e.key === 'ArrowLeft') playerX = Math.max(0, playerX - 15);
    if (e.key === 'f' && Math.abs(playerX - enemyX) < 100) {
        enemyHealth -= 20;
        console.log('PUNCH! Enemy HP:', enemyHealth);
    }
});

function updateHealth() {
    document.getElementById('healthFillPlayer').style.width = playerHealth + '%';
    document.getElementById('healthFillEnemy').style.width = enemyHealth + '%';
}

function gameLoop() {
    ctx.clearRect(0, 0, 1200, 600);
    
    // Sky
    const grad = ctx.createLinearGradient(0,0,0,600);
    grad.addColorStop(0,'#1e3c72');
    grad.addColorStop(1,'#2a5298');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,1200,450);
    
    // Ground
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0,450,1200,150);
    
    // Player (BLUE)
    ctx.fillStyle = playerHealth > 0 ? '#00bfff' : '#666';
    ctx.fillRect(playerX, 380, 60, 120);
    
    // Enemy (RED)
    ctx.fillStyle = enemyHealth > 0 ? '#ff4500' : '#666';
    ctx.fillRect(enemyX, 380, 60, 120);
    
    updateHealth();
    requestAnimationFrame(gameLoop);
}

gameLoop();
document.getElementById('startBtn').onclick = () => {
    document.getElementById('startMenu').style.display = 'none';
};
