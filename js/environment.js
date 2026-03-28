// Background and world setup

const BG_SRC = './assets/NES - River City Ransom - Backgrounds - Cross Town High.png';

// Orange wall bottom edge as fraction of image height (where sidewalk begins)
const WALL_BOTTOM_RATIO = 0.47;

export const world = {
    width: 800,       // default to canvas size, updated when bg loads
    walkableMinY: 0,  // updated when bg loads
    ready: false,
};

const bgImage = new Image();
bgImage.onload = () => {
    const scale = 600 / bgImage.naturalHeight;
    world.width = Math.floor(bgImage.naturalWidth * scale);
    // Player feet (hitbox top at y+48) must stay below the orange wall
    world.walkableMinY = Math.floor(WALL_BOTTOM_RATIO * 600) - 16;
    world.ready = true;
};
bgImage.src = BG_SRC;

export function drawBackground(ctx, cameraX, canvasWidth, canvasHeight) {
    if (!world.ready) {
        ctx.fillStyle = '#4a8c3f';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        return;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        bgImage,
        0, 0, bgImage.naturalWidth, bgImage.naturalHeight,
        -cameraX, 0, world.width, canvasHeight
    );
}

// Legacy exports — no box objects with the new scrolling background
export function createEnvironment() {
    return [];
}

export function drawEnvironment() {}
