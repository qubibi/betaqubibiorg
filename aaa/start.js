function animate(currentTime) {
    // フレームレート制御（is_fpsfix=trueの時のみ）
    if (is_fpsfix && currentTime - lastFrameTime < frameDelay) {
        requestAnimationFrame(animate);
        return;
    }
    lastFrameTime = currentTime;
    
    draw();
    
    // ポストエフェクトのパラメータを更新
    updatePostEffects();
    
    // Canvas2DからWebGLに転送
    transferCanvasToWebGL();
             
    // エフェクト適用して描画
    renderWithEffects();
    
    requestAnimationFrame(animate);
}

setup();

// WebGL初期化
if (!initWebGL()) {
    console.error('WebGL initialization failed');
} else {
    // エフェクトプログラム作成
    if (!createEffectProgram()) {
        console.error('Effect program creation failed');
    } else {
        // エフェクトチェーンの初期化
        initEffectChain();
        animate();
    }
}

let audioInitialized = false;

// マウスダウン/タッチプレス時の処理
function handleMouseDown() {
    if (!audioInitialized) {
        initializeAudioSystem();
        audioInitialized = true;
        // 音の初期化を待ってからスナップ音を再生
        setTimeout(() => {
            // playSnapSound();
        }, 100);
    } else {
        // playSnapSound();
    }
    // setRandomBackgroundColor();
    // setRandomDotColors();
    
    // アニメーションをマウスダウン状態に切り替え
    setMouseState(true);
}

// マウスアップ/タッチリリース時の処理
function handleMouseUp() {
    // アニメーションをマウスアップ状態に切り替え
    setMouseState(false);
}

// マウスダウン・タッチプレス（WebGL Canvasにイベントリスナーを追加）
webglCanvas.addEventListener('mousedown', handleMouseDown);
webglCanvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    handleMouseDown();
});

// マウスアップ・タッチリリース
webglCanvas.addEventListener('mouseup', handleMouseUp);
webglCanvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    handleMouseUp();
});

// マウス移動イベント
webglCanvas.addEventListener('mousemove', function(e) {
    const rect = webglCanvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// アプリ切り替えから戻った時の音声復旧
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && audioInitialized) {
        initializeAudioSystem();
    }
});

// debounce付きリサイズイベント
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        resizeCanvas();
    }, 300); // 300ms後に実行
});

// キーボードイベント（プリセット切り替え）
document.addEventListener('keydown', function(e) {
    const presetNum = parseInt(e.key);
    if (presetNum >= 1 && presetNum <= 8 && patternPresets[presetNum]) {
        // プリセット番号を更新
        currentPreset = presetNum;
        // 対応するパターンに切り替え
        const newPattern = patternPresets[presetNum].pattern;
        currentPattern = newPattern;
        switchPattern(newPattern);
        // color_hueRotationを更新
        color_hueRotation = patternPresets[presetNum].hueRotation;
        // currentRotationを更新
        currentRotation = patternPresets[presetNum].rotation;
        console.log(`Preset ${presetNum}: pattern=${newPattern}, hueRotation=${color_hueRotation}, rotation=${currentRotation}`);
    }
});

// プリセット切り替えボタンのクリックイベント
document.querySelectorAll('#preset-switcher a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const presetNum = parseInt(this.getAttribute('data-preset'));
        if (patternPresets[presetNum]) {
            // プリセット番号を更新
            currentPreset = presetNum;
            // 対応するパターンに切り替え
            const newPattern = patternPresets[presetNum].pattern;
            currentPattern = newPattern;
            switchPattern(newPattern);
            // color_hueRotationを更新
            color_hueRotation = patternPresets[presetNum].hueRotation;
            // currentRotationを更新
            currentRotation = patternPresets[presetNum].rotation;
            console.log(`Preset ${presetNum}: pattern=${newPattern}, hueRotation=${color_hueRotation}, rotation=${currentRotation}`);
            
            // アクティブクラスを更新
            document.querySelectorAll('#preset-switcher a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// 初期状態でプリセット1をアクティブに
document.querySelector('#preset-switcher a[data-preset="1"]').classList.add('active');