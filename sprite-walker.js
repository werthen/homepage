// sprite-walker.js
// Multi-walker manager (ES5-style) with extendible state machine and a "sleep" state.

(function () {
    var canvas = document.getElementById('sprite-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var sheetSrc = './spritesheet.webp';
    var COLS = 4;
    var ROWS = 9;

    var sheet = new Image();
    sheet.src = sheetSrc;

    var sheetW = 0, sheetH = 0;
    var frameW = 0, frameH = 0;

    var cssWidth = 0, cssHeight = 0;
    var walkers = [];
    var FRAME_DURATION = 120;
    var lastTime = 0;

    // Extensible states registry
    var STATES = {
        rest: {
            getRow: function (w) { return (w.dir === 1 ? 1 : 3); },
            frames: [0]
        },
        walk: {
            getRow: function (w) { return (w.dir === 1 ? 1 : 3); },
            frames: (function () { var a = []; for (var i = 1; i < COLS; i++) a.push(i); return a; })()
        },
        sleep: {
            getRow: function () { return 7; },
            frames: [0, 1]
        }
    };

    function Walker(opts) {
        opts = opts || {};
        this.x = (typeof opts.x === 'number') ? opts.x : 40;
        this.vx = (typeof opts.vx === 'number') ? opts.vx : 60;
        this.dir = (Math.random() < 0.5) ? 1 : -1;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.state = 'rest';
        this.stateTimer = 800 + Math.random() * 1200;
        this.userScale = (typeof opts.scale === 'number') ? opts.scale : 0.6;
        this.offsetY = (typeof opts.offsetY === 'number') ? opts.offsetY : 0;
        this.margin = 12;
        this._frames = STATES.rest.frames.slice();
        this._scaledW = frameW; this._scaledH = frameH;
    }

    Walker.prototype.enterState = function (newState, durationMs) {
        this.state = newState;
        if (STATES[newState] && STATES[newState].frames) this._frames = STATES[newState].frames.slice();
        else this._frames = [0];
        this.frameIndex = this._frames[0] || 0;
        this.frameTimer = 0;
        if (typeof durationMs === 'number') this.stateTimer = durationMs;
        else {
            if (newState === 'rest') this.stateTimer = 800 + Math.random() * 2000;
            else if (newState === 'walk') this.stateTimer = 600 + Math.random() * 2000;
            else if (newState === 'sleep') this.stateTimer = 3000 + Math.random() * 5000;
            else this.stateTimer = 1000 + Math.random() * 2000;
        }
    };

    Walker.prototype.update = function (dt) {
        if (!frameH) return;
        var margin = this.margin;
        var rightLimit = cssWidth - this._scaledW - margin;

        if (this.state === 'rest') {
            this.frameIndex = this._frames[0] || 0;
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                if (this.dir === 1 && Math.random() < 0.25) {
                    this.enterState('sleep');
                    return;
                }
                this.dir = (Math.random() < 0.5) ? 1 : -1;
                var available = this.dir === 1 ? (rightLimit - this.x) : (this.x - margin);
                var minDist = 30;
                if (available < minDist) {
                    this.enterState('rest');
                } else {
                    var maxPossible = Math.max(minDist, Math.min(available, 600));
                    var fraction = 0.4 + Math.random() * 0.6;
                    var walkDist = Math.max(minDist, Math.floor(maxPossible * fraction));
                    var walkTime = (walkDist / this.vx) * 1000;
                    this.enterState('walk', walkTime);
                }
            }
        } else if (this.state === 'walk') {
            var dx = this.vx * (dt / 1000) * this.dir;
            this.x += dx;
            if (this.x > rightLimit) this.x = rightLimit;
            if (this.x < margin) this.x = margin;
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) this.enterState('rest');
            else {
                this.frameTimer += dt;
                if (this.frameTimer >= FRAME_DURATION) {
                    this.frameTimer = 0;
                    var idx = this._frames.indexOf(this.frameIndex);
                    var nextIdx = (idx === -1) ? 0 : ((idx + 1) % this._frames.length);
                    this.frameIndex = this._frames[nextIdx];
                }
            }
        } else if (this.state === 'sleep') {
            this.stateTimer -= dt;
            this.frameTimer += dt;
            if (this.frameTimer >= FRAME_DURATION * 6) {
                this.frameTimer = 0;
                var idx2 = this._frames.indexOf(this.frameIndex);
                var next2 = (idx2 === -1) ? 0 : ((idx2 + 1) % this._frames.length);
                this.frameIndex = this._frames[next2];
            }
            if (this.stateTimer <= 0) this.enterState('rest');
        } else {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) this.enterState('rest');
        }
    };

    Walker.prototype.render = function () {
        if (!sheetW || !sheetH) return;
        var row = (STATES[this.state] && STATES[this.state].getRow) ? STATES[this.state].getRow(this) : (this.dir === 1 ? 1 : 3);
        var sx = this.frameIndex * frameW;
        var sy = row * frameH;
        var dw = this._scaledW || frameW;
        var dh = this._scaledH || frameH;
        var destY = cssHeight - dh - this.offsetY;
        ctx.drawImage(sheet, sx, sy, frameW, frameH, this.x, destY, dw, dh);
    };

    function resizeCanvas() {
        var rect = canvas.getBoundingClientRect();
        cssWidth = rect.width; cssHeight = rect.height;
        var ratio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(cssWidth * ratio));
        canvas.height = Math.max(1, Math.floor(cssHeight * ratio));
        ctx.setTransform(ratio,0,0,ratio,0,0);
        walkers.forEach(function(w){
            var effectiveScale = Math.min(1, cssHeight / frameH) * w.userScale;
            w._scaledW = Math.floor(frameW * effectiveScale);
            w._scaledH = Math.floor(frameH * effectiveScale);
        });
    }

    sheet.onload = function () {
        sheetW = sheet.naturalWidth; sheetH = sheet.naturalHeight;
        frameW = Math.floor(sheetW / COLS); frameH = Math.floor(sheetH / ROWS);
        canvas.style.height = Math.min(160, frameH + 20) + 'px';
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        if (walkers.length === 0) {
            addWalker({ x: 40, scale: 0.6, offsetY: 0 });
            addWalker({ x: 220, scale: 0.6, offsetY: 0 });
        }
        lastTime = performance.now();
        requestAnimationFrame(loop);
    };

    function loop(now) {
        var dt = Math.min(50, now - lastTime);
        lastTime = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    function update(dt) { walkers.forEach(function(w){ w.update(dt); }); }
    function render() { ctx.clearRect(0,0,cssWidth, cssHeight); walkers.forEach(function(w){ w.render(); }); }

    function addWalker(opts) {
        var w = new Walker(opts);
        if (frameH) {
            var eff = Math.min(1, cssHeight / frameH) * w.userScale;
            w._scaledW = Math.floor(frameW * eff);
            w._scaledH = Math.floor(frameH * eff);
        } else { w._scaledW = frameW; w._scaledH = frameH; }
        walkers.push(w);
        return w;
    }

    window._spriteWalker = {
        addWalker: addWalker,
        list: walkers,
        states: STATES,
        setGlobalScale: function(s){ walkers.forEach(function(w){ w.userScale = Math.max(0.2, Math.min(2, s)); }); resizeCanvas(); },
        getWalkers: function(){ return walkers; }
    };

})();
