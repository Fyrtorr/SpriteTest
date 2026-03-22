// Environment objects that the player can interact with

export function createEnvironment() {
    return [
        // Wooden crate - player can jump on top
        {
            type: 'box',
            x: 300, y: 320, w: 64, h: 48,
            height: 40,    // how tall it is (for jumping onto)
            solid: true,
            standable: true,
            color: '#8B6914',
            topColor: '#A0822A',
            label: 'Crate',
        },
        // Stone stairs - gradual elevation
        {
            type: 'stairs',
            x: 520, y: 280, w: 96, h: 128,
            height: 60,    // max elevation at the top
            solid: false,
            standable: true,
            color: '#777',
            topColor: '#999',
            label: 'Stairs',
        },
        // Platform at top of stairs
        {
            type: 'box',
            x: 520, y: 220, w: 96, h: 64,
            height: 60,
            solid: false,
            standable: true,
            color: '#666',
            topColor: '#888',
            label: 'Platform',
        },
    ];
}

export function drawEnvironment(ctx, objects, player) {
    for (const obj of objects) {
        if (obj.type === 'box') {
            drawBox(ctx, obj);
        } else if (obj.type === 'stairs') {
            drawStairs(ctx, obj);
        }
    }
}

function drawBox(ctx, obj) {
    const elevation = obj.height;

    // Front face (shifted up by elevation)
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x, obj.y - elevation, obj.w, obj.h);

    // Top face
    ctx.fillStyle = obj.topColor;
    ctx.fillRect(obj.x, obj.y - elevation, obj.w, 12);

    // Border
    ctx.strokeStyle = '#00000044';
    ctx.lineWidth = 1;
    ctx.strokeRect(obj.x, obj.y - elevation, obj.w, obj.h);
    ctx.strokeRect(obj.x, obj.y - elevation, obj.w, 12);

    // Wood grain / detail lines on crate
    if (obj.type === 'box' && obj.label === 'Crate') {
        ctx.strokeStyle = '#6B4F10';
        ctx.beginPath();
        // Horizontal plank lines
        const faceTop = obj.y - elevation + 12;
        const faceH = obj.h - 12;
        for (let i = 1; i < 3; i++) {
            const ly = faceTop + (faceH / 3) * i;
            ctx.moveTo(obj.x + 2, ly);
            ctx.lineTo(obj.x + obj.w - 2, ly);
        }
        // Cross brace
        ctx.moveTo(obj.x + obj.w / 2, faceTop + 2);
        ctx.lineTo(obj.x + obj.w / 2, faceTop + faceH - 2);
        ctx.stroke();
    }
}

function drawStairs(ctx, obj) {
    const steps = 5;
    const stepW = obj.w;
    const stepH = obj.h / steps;
    const maxElev = obj.height;

    for (let i = 0; i < steps; i++) {
        const progress = (steps - i) / steps;
        const elevation = progress * maxElev;
        const sy = obj.y + i * stepH;

        // Step surface
        const shade = 100 + Math.floor(progress * 60);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(obj.x, sy - elevation, stepW, stepH);

        // Step edge
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(obj.x, sy - elevation, stepW, stepH);
    }
}
