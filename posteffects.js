// ポストエフェクト処理

// ========== ユーザー設定エリア ==========

// エフェクトの順序（簡単に変更可能）
const effectOrder = ['kuwahara', 'blend', 'noise', 'trail', 'boxblur', 'color'];
// const effectOrder = ['kuwahara', 'blend', 'trail', 'noise', 'boxblur'];
// const effectOrder = ['kuwahara', 'blend', 'boxblur', 'noise', 'invert'];

// エフェクトパラメータ
let noise_seed = 0.0;
let noise_intensity = 0.19;

let boxblur_size = 0.51;
let boxblur_mixAmount = 0.88;

// Kuwaharaパラメータ
let kuwahara_blur1x = 220;
let kuwahara_blur1y = 221;
let kuwahara_radius = .9;
let kuwahara_fade = 0.69;  // 100%エフェクト適用で変化を最大化
let kuwahara_time = 0.0;
let kuwahara_threshold = 0.975;
let kuwahara_noiserange = 0.1;
let kuwahara_mixfade = 0.82;
// let kuwahara_mixfade = 0.83;
let kuwahara_randomRange = 0.3;
let kuwahara_for_time = 0.0;
let use_kuwahara = true;

// Trail（残像）パラメータ
let trail_decay = 0.3;
let trail_intensity = 1.05;
let use_trail = true;

// Color（色相・コントラスト）パラメータ
let color_hueRotation = 0.0;
let color_contrast = 1.0;
let use_color = true;

// モバイル判定
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ========== システム内部変数 ==========

let mouseX = 0;
let mouseY = 0;

let tempFramebuffer = null;
let tempTexture = null;

// 頂点属性の場所をキャッシュ（最適化）
let cachedPositionLocations = new Map();
let cachedTexCoordLocations = new Map();
let cachedTextureLocations = new Map();

// エフェクト初期化関数のマッピング
const effectInitializers = {
    'trail': initTrailEffect,
    'noise': initNoiseEffect,
    'invert': initInvertEffect,
    'boxblur': initBoxBlurEffect,
    'kuwahara': initKuwaharaFilter,
    'blend': initBlendEffect,
    'color': initColorEffect
};

function createEffectProgram() {
    let success = true;
    
    // 全てのエフェクトを初期化
    Object.entries(effectInitializers).forEach(([name, initFunc]) => {
        if (!initFunc()) {
            console.error(`Failed to initialize ${name} effect`);
            success = false;
        }
    });
    
    // 初期化成功時にエフェクトチェーンを構築
    if (success) {
        rebuildEffectChain();
    }
    
    return success;
}

// エフェクトチェーンの初期化
function initEffectChain() {
    // 一時フレームバッファとテクスチャを作成
    tempFramebuffer = gl.createFramebuffer();
    tempTexture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, tempTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_WIDTH, CANVAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, tempFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tempTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


// 最適化された汎用描画関数
function drawQuad(program, sourceTexture) {
    gl.useProgram(program);
    
    // 頂点属性の場所をキャッシュから取得
    let positionLocation = cachedPositionLocations.get(program);
    let texCoordLocation = cachedTexCoordLocations.get(program);
    let textureLocation = cachedTextureLocations.get(program);
    
    if (positionLocation === undefined) {
        positionLocation = gl.getAttribLocation(program, 'a_position');
        cachedPositionLocations.set(program, positionLocation);
    }
    
    if (texCoordLocation === undefined) {
        texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
        cachedTexCoordLocations.set(program, texCoordLocation);
    }
    
    if (textureLocation === undefined) {
        textureLocation = gl.getUniformLocation(program, 'u_texture');
        cachedTextureLocations.set(program, textureLocation);
    }
    
    // 頂点バッファバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // テクスチャ座標バッファバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // テクスチャバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.uniform1i(textureLocation, 0);
    
    // 描画
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// エフェクト定義（柔軟な順序管理）
const effectDefinitions = {
    'trail': {
        condition: () => use_trail && trailProgram,
        apply: (src, fb) => applyTrailWithFallback(src, fb)
    },
    'kuwahara': {
        condition: () => use_kuwahara && kuwaharaProgram,
        apply: (src, fb) => applyKuwaharaFilter(src, fb, kuwahara_fade)
    },
    'boxblur': {
        condition: () => use_boxblur && boxblurProgram,
        apply: (src, fb) => applyBoxBlurEffect(src, fb)
    },
    'blend': {
        condition: () => blendProgram,
        apply: (src, fb) => applyBlendWithSen(src, fb)
    },
    'noise': {
        condition: () => use_noise && noiseProgram,
        apply: (src, fb) => applyNoiseEffect(src, fb)
    },
    'invert': {
        condition: () => is_invert && invertProgram,
        apply: (src, fb) => applyInvertEffect(src, fb)
    },
    'color': {
        condition: () => use_color && colorProgram,
        apply: (src, fb) => applyColorEffect(src, fb)
    }
};

// エフェクトチェーンを事前に構築（最適化）
let prebuiltEffectChain = [];

function rebuildEffectChain() {
    prebuiltEffectChain = [];
    effectOrder.forEach(name => {
        const effect = effectDefinitions[name];
        if (effect.condition()) {
            prebuiltEffectChain.push({
                name: name,
                apply: effect.apply
            });
        }
    });
}

// エフェクト適用描画（最適化版）
function renderWithEffects() {
    let sourceTexture = texture;
    let targetFramebuffer = framebuffer;
    let targetTexture = framebufferTexture;
    
    // 事前構築されたエフェクトチェーンを実行
    for (let i = 0; i < prebuiltEffectChain.length; i++) {
        const isLast = i === prebuiltEffectChain.length - 1;
        const effect = prebuiltEffectChain[i];
        
        // 最後のエフェクトは画面に、それ以外は交互にフレームバッファに描画
        if (isLast) {
            effect.apply(sourceTexture, null);
        } else {
            effect.apply(sourceTexture, targetFramebuffer);
            // 次のエフェクトのソースとして使用
            sourceTexture = targetTexture;
            // フレームバッファを交換（正しく交換）
            if (targetFramebuffer === framebuffer) {
                targetFramebuffer = tempFramebuffer;
                targetTexture = tempTexture;
            } else {
                targetFramebuffer = framebuffer;
                targetTexture = framebufferTexture;
            }
        }
    }
    
    // エフェクトがない場合は通常描画
    if (prebuiltEffectChain.length === 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawQuad(shaderProgram, sourceTexture);
    }
}
let ccc  = 0
function updatePostEffects() {
    ccc ++
    ccc %= 4
    
    
    if (use_noise) {
        noise_seed = Math.random() * 1000.0;
    }
    
    
    // noise_intensity = mouseX / window.innerWidth;
}

// インデックス到達時に呼ばれるエフェクト更新関数
function updatePostEffectsOnce() {
    // gamen.jsのパラメータ範囲を参考に調整
    // gamen.jsスタイルの時間制御
    kuwahara_for_time += Math.random() * 0.5;
    kuwahara_for_time %= 360;
    kuwahara_time = kuwahara_for_time / 10;

    kuwahara_threshold = -0.05+rndm(0.44, 0.51);
    kuwahara_randomRange = 0.9 + rndm(-0.55, 0.55);
    // kuwahara_radius = 1.87
    kuwahara_radius = 1.87 + rndm(-0.05, 0.05);
    kuwahara_noiserange = rndm(0.19, 0.20);
    
    // ブラー値の動的調整
    kuwahara_blur1x = 50 + rndm(-40, 40);
    kuwahara_blur1y = 50 + rndm(-40, 40);
    color_contrast = 1.2
    // color_hueRotation = 0.6  // 0.0〜1.0の範囲（0.3 = 108度回転）
}