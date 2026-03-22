import './input.js';
import { Sprite } from './sprite.js';
import { Player } from './player.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_DELTA = 100; // cap deltaTime to prevent teleporting

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const sprite = new Sprite('./assets/character.png');
const player = new Player(
    (CANVAS_WIDTH - 64) / 2,
    (CANVAS_HEIGHT - 64) / 2,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
);

let lastTime = performance.now();

function gameLoop(now) {
    let deltaTime = now - lastTime;
    lastTime = now;

    // Cap deltaTime to prevent large jumps (e.g. tab refocus)
    if (deltaTime > MAX_DELTA) deltaTime = MAX_DELTA;

    player.update(deltaTime);
    sprite.update(deltaTime, player.isMoving);

    // Clear with grass green background
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    sprite.draw(ctx, player.x, player.y, player.direction);

    requestAnimationFrame(gameLoop);
}

// Start the game loop - works whether image is loaded or still loading
requestAnimationFrame(gameLoop);
