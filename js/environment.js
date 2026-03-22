export function createEnvironment() {
    return [
        // Wooden crate
        {
            type: 'box',
            x: 300, y: 320, w: 64, h: 48,
            height: 40,
            solid: true,
            standable: true,
            color: '#8B6914',
            topColor: '#A0822A',
            label: 'Crate',
        },
        // Second crate stacked area
        {
            type: 'box',
            x: 180, y: 380, w: 64, h: 48,
            height: 40,
            solid: true,
            standable: true,
            color: '#8B6914',
            topColor: '#A0822A',
            label: 'Crate',
        },
        // Stone platform (raised)
        {
            type: 'box',
            x: 520, y: 280, w: 128, h: 80,
            height: 50,
            solid: true,
            standable: true,
            color: '#666',
            topColor: '#888',
            label: 'Platform',
        },
        // Steps leading to platform (small box as a step)
        {
            type: 'box',
            x: 490, y: 360, w: 48, h: 32,
            height: 24,
            solid: true,
            standable: true,
            color: '#777',
            topColor: '#999',
            label: 'Step',
        },
    ];
}

export function drawEnvironment(ctx, objects) {
    // Sort by Y so objects further back draw first
    const sorted = [...objects].sort((a, b) => a.y - b.y);

    for (const obj of sorted) {
        drawBox(ctx, obj);
    }
}

function drawBox(ctx, obj) {
    const elev = obj.height;

    // Side face (visible depth)
    ctx.fillStyle = darken(obj.color, 0.7);
    ctx.fillRect(obj.x, obj.y + obj.h - elev, obj.w, elev);

    // Front face
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x, obj.y - elev, obj.w, obj.h);

    // Top face
    ctx.fillStyle = obj.topColor;
    ctx.fillRect(obj.x, obj.y - elev, obj.w, 10);

    // Borders
    ctx.strokeStyle = '#00000033';
    ctx.lineWidth = 1;
    ctx.strokeRect(obj.x, obj.y - elev, obj.w, obj.h);
    ctx.strokeRect(obj.x, obj.y - elev, obj.w, 10);
    ctx.strokeRect(obj.x, obj.y + obj.h - elev, obj.w, elev);

    // Crate wood grain detail
    if (obj.label === 'Crate') {
        ctx.strokeStyle = '#6B4F10';
        ctx.beginPath();
        const faceTop = obj.y - elev + 10;
        const faceH = obj.h - 10;
        for (let i = 1; i < 3; i++) {
            const ly = faceTop + (faceH / 3) * i;
            ctx.moveTo(obj.x + 2, ly);
            ctx.lineTo(obj.x + obj.w - 2, ly);
        }
        ctx.moveTo(obj.x + obj.w / 2, faceTop + 2);
        ctx.lineTo(obj.x + obj.w / 2, faceTop + faceH - 2);
        ctx.stroke();
    }
}

function darken(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
}
