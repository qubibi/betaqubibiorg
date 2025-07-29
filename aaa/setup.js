const is_canvas_whfix = false; // true: 固定比率, false: ウィンドウ比率
const canvas_fix_w = 16; // 固定比率の幅 (is_canvas_whfix=trueの時のみ使用)
const canvas_fix_h = 9;  // 固定比率の高さ (is_canvas_whfix=trueの時のみ使用)
const is_windowfill = true; // true: ウィンドウサイズに拡大, false: 実サイズ表示
const TOTAL_PIXELS = 465000; 
// const TOTAL_PIXELS = 455000; 
const is_fpsfix = false; // true: 固定フレームレート, false: requestAnimationFrame依存
const target_fps = 1; // 固定フレームレート値 (is_fpsfix=trueの時のみ使用)
const use_noise = true; // true: RGBノイズエフェクト使用, false: 通常表示
const is_invert = true; // true: 色反転エフェクト, false: エフェクトなし
const use_boxblur = true; // true: Box Blurエフェクト使用, false: 通常表示

// プリセット管理（将来8つまで拡張可能）
const patternPresets = {
    1: { pattern: 'a', hueRotation: 0.0, rotation: 0 },  // プリセット1
    2: { pattern: 'b', hueRotation: 0.0, rotation: 0 },  // プリセット2
    3: { pattern: 'c', hueRotation: 0.0, rotation: 70 },  // プリセット3（80度回転）
    4: { pattern: 'd', hueRotation: 0.0, rotation: 0 },  // プリセット4
    // 将来の拡張例:
    // 5: { pattern: 'a', hueRotation: 0.3, rotation: 0 },  // プリセット5（パターンaの色相違い）
    // 6: { pattern: 'b', hueRotation: 0.5, rotation: 0 },  // プリセット6（パターンbの色相違い）
    // 7: { pattern: 'c', hueRotation: 0.7, rotation: 0 },  // プリセット7（パターンcの色相違い）
    // 8: { pattern: 'd', hueRotation: 0.9, rotation: 0 },  // プリセット8（パターンdの色相違い）
};

let currentPreset = 1;

// 現在選択されているパターン（プリセットから導出）
let currentPattern = patternPresets[currentPreset].pattern;

// 現在の回転角度（度）
let currentRotation = patternPresets[currentPreset].rotation;

// フレームレート制御用変数
const frameDelay = is_fpsfix ? 1000 / target_fps : 0;
let lastFrameTime = 0;

// マウス押下遅延システム用変数
let mouseDownDelayCounter = 0;
let isWaitingForMouseDown = false;
const MOUSE_DOWN_DELAY_FRAMES = 2; // 何フレーム待つか

const aspectRatio = is_canvas_whfix ? 
    (canvas_fix_w / canvas_fix_h) : 
    (window.innerWidth / window.innerHeight);
const canvasHeight = Math.floor(Math.sqrt(TOTAL_PIXELS / aspectRatio));
const canvasWidth = Math.floor(TOTAL_PIXELS / canvasHeight);

// letにして後で更新可能に
let CANVAS_WIDTH = canvasWidth;
let CANVAS_HEIGHT = canvasHeight;

// 塗り用Canvas（非表示）
const nuriCanvas = document.getElementById('nuri-canvas');
const nuriCtx = nuriCanvas.getContext('2d');

nuriCanvas.width = CANVAS_WIDTH;
nuriCanvas.height = CANVAS_HEIGHT;
nuriCanvas.style.display = 'none';

// 線用Canvas（非表示）
const senCanvas = document.getElementById('sen-canvas');
const senCtx = senCanvas.getContext('2d');

senCanvas.width = CANVAS_WIDTH;
senCanvas.height = CANVAS_HEIGHT;
senCanvas.style.display = 'none';

// WebGL Canvas（表示用）
const webglCanvas = document.getElementById('webgl-canvas');
const gl = webglCanvas.getContext('webgl');

webglCanvas.width = CANVAS_WIDTH;
webglCanvas.height = CANVAS_HEIGHT;

// 外部リソース管理システム
const resources = {
    images: {
        'a1s': 'imgseq/a1s.png',
        'a2s': 'imgseq/999.png',
        'a3s': 'imgseq/a3s.png',
        'a4s': 'imgseq/a4s.png',
        'a5s': 'imgseq/a5s.png',
        'a6s': 'imgseq/a6s.png',
        'a7s': 'imgseq/a7s.png',
        'a8s': 'imgseq/a8s.png',
        'a9s': 'imgseq/a9s.png',
        'a1f': 'imgseq/a1f.png',
        'a2f': 'imgseq/a2f.png',
        'a3f': 'imgseq/a3f.png',
        'a4f': 'imgseq/a4f.png',
        'a5f': 'imgseq/a5f.png',
        'a6f': 'imgseq/a6f.png',
        'a7f': 'imgseq/a7f.png',
        'a8f': 'imgseq/a8f.png',
        'a9f': 'imgseq/a9f.png',
        'b1s': 'imgseq/b1s.png',
        'b2s': 'imgseq/999.png',
        'b3s': 'imgseq/b3s.png',
        'b4s': 'imgseq/b4s.png',
        'b5s': 'imgseq/b5s.png',
        'b6s': 'imgseq/b6s.png',
        'b7s': 'imgseq/b7s.png',
        'b8s': 'imgseq/b8s.png',
        'b9s': 'imgseq/b9s.png',
        'b1f': 'imgseq/b1f.png',
        'b2f': 'imgseq/b2f.png',
        'b3f': 'imgseq/b3f.png',
        'b4f': 'imgseq/b4f.png',
        'b5f': 'imgseq/b5f.png',
        'b6f': 'imgseq/b6f.png',
        'b7f': 'imgseq/b7f.png',
        'b8f': 'imgseq/b8f.png',
        'b9f': 'imgseq/b9f.png',
        // cパターン用画像（暫定的にaパターンの画像を流用）
        'c1s': 'imgseq/c1s.png',
        'c2s': 'imgseq/999.png',
        'c3s': 'imgseq/c3s.png',
        'c4s': 'imgseq/c4s.png',
        'c5s': 'imgseq/c5s.png',
        'c6s': 'imgseq/c6s.png',
        'c7s': 'imgseq/c7s.png',
        'c8s': 'imgseq/c8s.png',
        'c9s': 'imgseq/c9s.png',
        'c10s': 'imgseq/c10s.png',
        'c11s': 'imgseq/c11s.png',
        'c1f': 'imgseq/c1f.png',
        'c2f': 'imgseq/c2f.png',
        'c3f': 'imgseq/c3f.png',
        'c4f': 'imgseq/c4f.png',
        'c5f': 'imgseq/c5f.png',
        'c6f': 'imgseq/c6f.png',
        'c7f': 'imgseq/c7f.png',
        'c8f': 'imgseq/c8f.png',
        'c9f': 'imgseq/999.png',
        'c10f': 'imgseq/999.png',
        'c11f': 'imgseq/999.png',
        // dパターン用画像（暫定的にaパターンの画像を流用）
        'd1s': 'imgseq/d1s.png',
        'd2s': 'imgseq/999.png',
        'd3s': 'imgseq/d3s.png',
        'd4s': 'imgseq/d4s.png',
        'd5s': 'imgseq/d5s.png',
        'd6s': 'imgseq/d6s.png',
        'd7s': 'imgseq/d7s.png',
        'd8s': 'imgseq/d8s.png',
        'd9s': 'imgseq/d9s.png',
        'd1f': 'imgseq/d1f.png',
        'd2f': 'imgseq/d2f.png',
        'd3f': 'imgseq/d3f.png',
        'd4f': 'imgseq/d4f.png',
        'd5f': 'imgseq/d5f.png',
        'd6f': 'imgseq/d6f.png',
        'd7f': 'imgseq/d7f.png',
        'd8f': 'imgseq/d8f.png',
        'd9f': 'imgseq/d9f.png',
        '999': 'imgseq/999.png'
        // その他の画像
    },
    audio: {
        'snap': 'assets/snap.mp3'
    }
};

// 読み込み済みリソースを格納
const loaded = {
    images: {},
    audio: {}
};

// 読み込み状態管理
let allImagesLoaded = false;
let centerImage = null; // 互換性のため残す
let imageLoaded = false; // 互換性のため残す

function rndm(min, max) {
    return Math.random() * (max - min) + min;
}

// 画像を名前で取得
function getImage(name) {
    return loaded.images[name];
}

// 音声を名前で取得
function getAudio(name) {
    return loaded.audio[name];
}

// すべての画像を事前読み込み
function preloadImages() {
    const imageNames = Object.keys(resources.images);
    let loadedCount = 0;
    const totalImages = imageNames.length;
    
    imageNames.forEach(name => {
        const img = new Image();
        img.onload = () => {
            loaded.images[name] = img;
            loadedCount++;
            
            // 互換性のためのcenterImage変数を更新
            if (name === 'centerImage') {
                centerImage = img;
                imageLoaded = true;
            }
            
            if (loadedCount === totalImages) {
                allImagesLoaded = true;
                console.log('All images loaded');
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${name} (${resources.images[name]})`);
        };
        img.src = resources.images[name];
    });
}

function setup() {
    console.log('Canvas initialized:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
    
    // 初期プリセットのcolor_hueRotationを設定
    if (patternPresets[currentPreset]) {
        color_hueRotation = patternPresets[currentPreset].hueRotation;
        console.log(`Initial preset ${currentPreset}: hueRotation = ${color_hueRotation}`);
    }
    
    // すべての画像を読み込み
    preloadImages();
    
    if (is_windowfill) {
        if (is_canvas_whfix) {
            // 固定比率でウィンドウに収まるサイズを計算
            const windowAspect = window.innerWidth / window.innerHeight;
            const canvasAspect = canvas_fix_w / canvas_fix_h;
            
            if (windowAspect > canvasAspect) {
                // ウィンドウの方が横長：高さを基準
                webglCanvas.style.height = window.innerHeight + 'px';
                webglCanvas.style.width = (window.innerHeight * canvasAspect) + 'px';
            } else {
                // ウィンドウの方が縦長：幅を基準
                webglCanvas.style.width = window.innerWidth + 'px';
                webglCanvas.style.height = (window.innerWidth / canvasAspect) + 'px';
            }
        } else {
            // ウィンドウ全体に拡大
            webglCanvas.style.width = window.innerWidth + 'px';
            webglCanvas.style.height = window.innerHeight + 'px';
        }
    } else {
        // 実サイズで表示
        webglCanvas.style.width = CANVAS_WIDTH + 'px';
        webglCanvas.style.height = CANVAS_HEIGHT + 'px';
    }
    
    // 背景色をnuriCanvasに設定
    nuriCtx.fillStyle = '#000';
    nuriCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // senCanvasは透明に初期化
    senCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function resizeCanvas() {
    // リサイズ前に現在の点の位置を比率として保存
    if (typeof updateDotPositions === 'function') {
        // 古いサイズでの比率を保存
        if (typeof dotX !== 'undefined' && typeof dotX2 !== 'undefined') {
            dotXRatio = dotX / CANVAS_WIDTH;
            dotYRatio = dotY / CANVAS_HEIGHT;
            dotX2Ratio = dotX2 / CANVAS_WIDTH;
            dotY2Ratio = dotY2 / CANVAS_HEIGHT;
        }
    }
    
    const aspectRatio = is_canvas_whfix ? 
        (canvas_fix_w / canvas_fix_h) : 
        (window.innerWidth / window.innerHeight);
    const canvasHeight = Math.floor(Math.sqrt(TOTAL_PIXELS / aspectRatio));
    const canvasWidth = Math.floor(TOTAL_PIXELS / canvasHeight);
    
    CANVAS_WIDTH = canvasWidth;
    CANVAS_HEIGHT = canvasHeight;
    nuriCanvas.width = CANVAS_WIDTH;
    nuriCanvas.height = CANVAS_HEIGHT;
    senCanvas.width = CANVAS_WIDTH;
    senCanvas.height = CANVAS_HEIGHT;
    webglCanvas.width = CANVAS_WIDTH;
    webglCanvas.height = CANVAS_HEIGHT;
    
    if (is_windowfill) {
        if (is_canvas_whfix) {
            // 固定比率でウィンドウに収まるサイズを計算
            const windowAspect = window.innerWidth / window.innerHeight;
            const canvasAspect = canvas_fix_w / canvas_fix_h;
            
            if (windowAspect > canvasAspect) {
                // ウィンドウの方が横長：高さを基準
                webglCanvas.style.height = window.innerHeight + 'px';
                webglCanvas.style.width = (window.innerHeight * canvasAspect) + 'px';
            } else {
                // ウィンドウの方が縦長：幅を基準
                webglCanvas.style.width = window.innerWidth + 'px';
                webglCanvas.style.height = (window.innerWidth / canvasAspect) + 'px';
            }
        } else {
            // ウィンドウ全体に拡大
            webglCanvas.style.width = window.innerWidth + 'px';
            webglCanvas.style.height = window.innerHeight + 'px';
        }
    } else {
        // 実サイズで表示
        webglCanvas.style.width = CANVAS_WIDTH + 'px';
        webglCanvas.style.height = CANVAS_HEIGHT + 'px';
    }
    
    // 背景をnuriCanvasに設定（リサイズ時は描画内容が消える）
    nuriCtx.fillStyle = '#000';
    nuriCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // senCanvasは透明にクリア
    senCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // リサイズ後に背景画像を再描画
    if (typeof drawBackgroundImage === 'function') {
        drawBackgroundImage();
    }
    
    // WebGLビューポートも更新
    if (gl) {
        gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // フレームバッファテクスチャを再作成
        if (framebufferTexture) {
            gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_WIDTH, CANVAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        
        // tempTextureも再作成（エフェクトチェーン用）
        if (typeof tempTexture !== 'undefined' && tempTexture) {
            gl.bindTexture(gl.TEXTURE_2D, tempTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_WIDTH, CANVAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    }
    
    // 新しいサイズで点の位置を更新
    if (typeof dotXRatio !== 'undefined' && typeof dotX2Ratio !== 'undefined') {
        dotX = CANVAS_WIDTH * dotXRatio;
        dotY = CANVAS_HEIGHT * dotYRatio;
        dotX2 = CANVAS_WIDTH * dotX2Ratio;
        dotY2 = CANVAS_HEIGHT * dotY2Ratio;
    }
    
    console.log('Canvas resized:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
}

