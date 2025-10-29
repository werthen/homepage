// sprite-walker.js
// Animates a dog walking left and right on the bottom canvas using a spritesheet.
// Assumptions from user's message:
// - spritesheet is at ./spritesheet.png
// - sheet has 4 columns, 9 rows
// - second row (index 1) contains right-walking animation
// - fourth row (index 3) contains left-walking animation

(function(){
    const canvas = document.getElementById('sprite-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sheetSrc = './spritesheet.webp';
    const COLS = 4;
    const ROWS = 9;

    let sheet = new Image();
    sheet.src = sheetSrc;

    let sheetW = 0, sheetH = 0;
    let frameW = 0, frameH = 0;
    // user-adjustable scale multiplier (final size = computedScale * USER_SCALE)
    let USER_SCALE = 0.6; // default: 80% of computed size
    let scale = 1;
    let scaledFrameW = 0, scaledFrameH = 0;
    let cssWidth = 0, cssHeight = 0;

    // animation state
    let x = 50; // starting x
    let y = 0; // computed
    let vx = 60; // pixels per second
    let dir = 1; // 1 = right, -1 = left
    let frameIndex = 0;
    let frameTimer = 0;
    const FRAME_DURATION = 120; // ms per frame

    // behavior state
    let state = 'rest'; // 'rest' or 'walk'
    let stateTimer = 0; // ms remaining in current state

    function resizeCanvas() {
        // full width, fixed height of 140 (CSS sets height)
        const rect = canvas.getBoundingClientRect();
        cssWidth = rect.width;
        cssHeight = rect.height;
        const ratio = devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(cssWidth * ratio));
        canvas.height = Math.max(1, Math.floor(cssHeight * ratio));
        ctx.setTransform(ratio,0,0,ratio,0,0);
        // recompute scale and scaled frame sizes (frameH may be 0 until sheet loads)
        if (frameH > 0) {
            scale = Math.min(1, cssHeight / frameH) * USER_SCALE;
            scaledFrameW = Math.floor(frameW * scale);
            scaledFrameH = Math.floor(frameH * scale);
            // recompute y as bottom aligned
            y = cssHeight - scaledFrameH;
        }
    }

    sheet.onload = function() {
        sheetW = sheet.naturalWidth;
        sheetH = sheet.naturalHeight;
        frameW = Math.floor(sheetW / COLS);
        frameH = Math.floor(sheetH / ROWS);

        // set initial canvas height based on frameH
        canvas.style.height = Math.min(160, frameH + 20) + 'px';
        // initial resize
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // place dog near left
        x = 40;
        // start in rest state for a short random time
        state = 'rest';
        stateTimer = 800 + Math.random() * 1200;
        // start loop
        lastTime = performance.now();
        requestAnimationFrame(loop);
    };

    let lastTime = 0;

    function loop(now) {
        const dt = Math.min(50, now - lastTime);
        lastTime = now;

        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    function update(dt) {
        const margin = 12;
        const rightLimit = cssWidth - (scaledFrameW || frameW) - margin;

        // State machine: rest or walk
        if (state === 'rest') {
            // remain in rest frame (first column)
            frameIndex = 0;
            stateTimer -= dt;
            if (stateTimer <= 0) {
                // pick a random direction and walk distance without leaving viewport
                // choose direction randomly
                dir = Math.random() < 0.5 ? 1 : -1;

                // compute available distance in that direction
                let available = dir === 1 ? (rightLimit - x) : (x - margin);
                // ensure minimal travel distance
                const minDist = 30;
                if (available < minDist) {
                    // not enough room to walk, just rest again for a bit
                    state = 'rest';
                    stateTimer = 800 + Math.random() * 2000;
                } else {
                    // pick a random walk distance biased toward longer walks
                    // allow up to 600px or available space, whichever is smaller
                    const maxPossible = Math.max(minDist, Math.min(available, 600));
                    // choose between ~40% and 100% of available (bias toward longer walks)
                    const fraction = 0.4 + Math.random() * 0.6;
                    const walkDist = Math.max(minDist, Math.floor(maxPossible * fraction));
                    // compute time to walk that distance
                    const walkTime = (walkDist / vx) * 1000; // ms
                    state = 'walk';
                    stateTimer = walkTime;
                    // start walking from frame 1
                    frameIndex = 1;
                    frameTimer = 0;
                }
            }
        } else if (state === 'walk') {
            // advance position
            const dx = vx * (dt/1000) * dir;
            x += dx;

            // clamp to viewport edges
            if (x > rightLimit) x = rightLimit;
            if (x < margin) x = margin;

            // decrement timer and stop when done
            stateTimer -= dt;
            if (stateTimer <= 0) {
                // enter rest
                state = 'rest';
                stateTimer = 1200 + Math.random() * 2800; // rest 1.2-4s
                frameIndex = 0;
                frameTimer = 0;
            } else {
                // animate walking frames (columns 1..COLS-1)
                frameTimer += dt;
                if (frameTimer >= FRAME_DURATION) {
                    frameTimer = 0;
                    // cycle across columns but keep column 0 reserved for rest
                    frameIndex = 1 + ((frameIndex - 1 + 1) % (COLS - 1));
                }
            }
        }
    }

    function render() {
        // clear canvas
        // clear using CSS pixels (ctx is scaled)
        ctx.clearRect(0,0,cssWidth, cssHeight);
        if (!sheetW || !sheetH) return;

        // choose row based on dir: right => row 1, left => row 3 (0-indexed)
        const row = dir === 1 ? 1 : 3;
        const sx = frameIndex * frameW;
        const sy = row * frameH;

        // destination (use scaled sizes)
        const destY = cssHeight - (scaledFrameH || frameH);
        const dw = scaledFrameW || frameW;
        const dh = scaledFrameH || frameH;
        ctx.drawImage(sheet, sx, sy, frameW, frameH, x, destY, dw, dh);
    }
    // expose runtime control for scale
    window._spriteWalker = {
        setScale: (s) => { USER_SCALE = Math.max(0.2, Math.min(2, s)); resizeCanvas(); },
        getScale: () => USER_SCALE
    };

})();
