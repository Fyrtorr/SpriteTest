import { clearPressedKeys } from './input.js';
import { Sprite } from './sprite.js';
import { Player } from './player.js';
import { createEnvironment, drawEnvironment } from './environment.js';
import { EffectsManager } from './effects.js';

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
const effects = new EffectsManager(CANVAS_WIDTH, CANVAS_HEIGHT);

// Toggle buttons
const DODGEBALL_LABELS = ['Dodgeball: Off', 'Dodgeball: Low', 'Dodgeball: Med', 'Dodgeball: High'];
const dodgeballBtn = document.getElementById('toggle-dodgeball');
dodgeballBtn.addEventListener('click', () => {
    const level = effects.cycleDodgeballIntensity();
    dodgeballBtn.textContent = DODGEBALL_LABELS[level];
    dodgeballBtn.classList.toggle('active', level > 0);
    if (level >= 2) dodgeballBtn.classList.add('intense');
    else dodgeballBtn.classList.remove('intense');
});

let lastTime = performance.now();

function gameLoop(now) {
    let deltaTime = now - lastTime;
    lastTime = now;
    if (deltaTime > MAX_DELTA) deltaTime = MAX_DELTA;

    player.update(deltaTime, objects);
    effects.update(deltaTime, player);
    sprite.setAnimation(player.state);
    sprite.update(deltaTime);

    // Draw
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawEnvironment(ctx, objects);
    drawShadow(ctx, player);
    effects.draw(ctx);
    sprite.draw(ctx, player.x, player.drawY, player.direction);

    clearPressedKeys();
    requestAnimationFrame(gameLoop);
}

function drawShadow(ctx, player) {
    const shadowX = player.x + 32;
    const shadowY = player.y + 58;
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
