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

// Survival timer
let survivalTime = 0;
let bestTime = parseFloat(localStorage.getItem('dodgeball-best') || '0');
let wasHurt = false;

let lastTime = performance.now();

function gameLoop(now) {
    let deltaTime = now - lastTime;
    lastTime = now;
    if (deltaTime > MAX_DELTA) deltaTime = MAX_DELTA;

    player.update(deltaTime, objects);
    effects.update(deltaTime, player);
    sprite.setAnimation(player.state);
    sprite.update(deltaTime);

    // Update survival timer when dodgeball is active
    if (effects.isActive('dodgeball')) {
        if (player.state === 'hurt' && !wasHurt) {
            // Just got hit — save best and reset
            if (survivalTime > bestTime) {
                bestTime = survivalTime;
                localStorage.setItem('dodgeball-best', bestTime.toString());
            }
            survivalTime = 0;
        } else if (player.state !== 'hurt') {
            survivalTime += deltaTime;
        }
        wasHurt = player.state === 'hurt';
    }

    // Draw
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawEnvironment(ctx, objects);
    drawShadow(ctx, player);
    effects.draw(ctx);
    sprite.draw(ctx, player.x, player.drawY, player.direction);

    if (effects.isActive('dodgeball')) {
        drawTimer(ctx);
    }

    clearPressedKeys();
    requestAnimationFrame(gameLoop);
}

function drawTimer(ctx) {
    const current = formatTime(survivalTime);
    const best = formatTime(bestTime);

    ctx.save();

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 32);

    // Current time
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Time: ${current}`, 12, 16);

    // Best time
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Best: ${best}`, CANVAS_WIDTH - 160, 16);

    ctx.restore();
}

function formatTime(ms) {
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    const dec = Math.floor((totalSec % 1) * 10);
    if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}.${dec}`;
    return `${sec}.${dec}s`;
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
