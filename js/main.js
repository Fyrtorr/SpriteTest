import { clearPressedKeys } from './input.js';
import { Sprite } from './sprite.js';
import { Player } from './player.js';
import { createEnvironment, drawEnvironment } from './environment.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_DELTA = 100;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const sprite = new Sprite('./assets/character.png');
const player = new Player(
    (CANVAS_WIDTH - 64) / 2,
    (CANVAS_HEIGHT - 64) / 2,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
);
const objects = createEnvironment();

let lastTime = performance.now();

function gameLoop(now) {
    let deltaTime = now - lastTime;
    lastTime = now;
    if (deltaTime > MAX_DELTA) deltaTime = MAX_DELTA;

    player.update(deltaTime, objects);
    sprite.setAnimation(player.state);
    sprite.update(deltaTime);

    // Draw
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw environment behind player
    drawEnvironment(ctx, objects, player);

    // Draw player shadow on ground
    drawShadow(ctx, player);

    // Draw player sprite (at visual height)
    sprite.draw(ctx, player.x, player.drawY, player.direction);

    clearPressedKeys();
    requestAnimationFrame(gameLoop);
}

function drawShadow(ctx, player) {
    const shadowX = player.x + 32;
    const shadowY = player.y + 58;
    // Shadow shrinks as player gets higher
    const lift = player.z - player.groundLevel;
    const scale = Math.max(0.3, 1 - lift / 120);

    ctx.save();
    ctx.globalAlpha = 0.3 * scale;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

requestAnimationFrame(gameLoop);
