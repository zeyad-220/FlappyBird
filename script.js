const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartButton = document.getElementById('restartButton');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const bird = {
    x: 100,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    gravity: 0.5,
    velocity: 0,
    jump: -10,
    image: new Image()
};

bird.image.src = 'bird.png'; // Image path

let pipes = [];
const pipeWidth = 80;
const pipeGap = 250;
const pipeSpeed = 5;

let score = 0;
let gameRunning = true;

function drawBird() {
    ctx.drawImage(bird.image, bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    ctx.fillStyle = 'green';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.upperHeight);
        ctx.fillRect(pipe.x, canvas.height - pipe.lowerHeight, pipeWidth, pipe.lowerHeight);
    });
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText(`Score: ${score}`, 20, 50);
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        endGame();
    }
}

function generatePipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - 100;
    const upperHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    const lowerHeight = canvas.height - upperHeight - pipeGap;

    pipes.push({
        x: canvas.width,
        upperHeight,
        lowerHeight,
        scored: false // عشان مانحسبش السكور مرتين
    });
}

function updatePipes() {
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 400) {
        generatePipe();
    }

    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        // Check collision
        const collisionX = bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth;
        const collisionY = bird.y < pipe.upperHeight || bird.y + bird.height > canvas.height - pipe.lowerHeight;

        if (collisionX && collisionY) {
            endGame();
        }

        // Update score
        if (!pipe.scored && bird.x > pipe.x + pipeWidth) {
            score++;
            pipe.scored = true;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function endGame() {
    gameRunning = false;
    gameOverScreen.classList.remove('hidden');
    document.removeEventListener('keydown', handleKey);
    document.removeEventListener('click', handleTap);
}

function restartGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    gameRunning = true;
    gameOverScreen.classList.add('hidden');
    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleTap);
}

function handleKey(event) {
    if (event.code === 'Space') {
        bird.velocity = bird.jump;
    }
}

function handleTap() {
    bird.velocity = bird.jump;
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBird();
    drawPipes();
    drawScore();
    updateBird();
    updatePipes();
}

document.addEventListener('keydown', handleKey);
document.addEventListener('click', handleTap);
restartButton.addEventListener('click', restartGame);

setInterval(gameLoop, 20);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
