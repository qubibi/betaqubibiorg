// リアルタイム残像エフェクト - WebGL実装
// 前フレームとの減衰ブレンドによる滑らかな残像効果

let trailProgram = null;
let trailFramebuffer = null;
let trailTexture = null;
let trailUniforms = {
    u_currentTexture: null,
    u_trailTexture: null,
    u_decay: 0.92,
    u_intensity: 1.0
};

// 属性位置のキャッシュ
let trailCachedPositionLocation = null;
let trailCachedTexCoordLocation = null;

const trailVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const trailFragmentShader = `
    precision mediump float;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_currentTexture;
    uniform sampler2D u_trailTexture;
    uniform float u_decay;
    uniform float u_intensity;
    
    void main() {
        vec4 current = texture2D(u_currentTexture, v_texCoord);
        vec4 trail = texture2D(u_trailTexture, v_texCoord);
        
        // 前フレームを減衰させて現フレームとブレンド
        vec4 result = mix(current, trail, u_decay);
        
        // 強度調整
        result.rgb *= u_intensity;
        result.a = current.a;
        
        gl_FragColor = result;
    }
`;

function initTrailEffect() {
    if (!gl) return false;
    
    // シェーダープログラム作成
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, trailVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, trailFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create trail shaders');
        return false;
    }
    
    trailProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if (!trailProgram) {
        console.error('Failed to create trail program');
        return false;
    }
    
    // ユニフォームの場所を取得
    trailUniforms.u_currentTexture = gl.getUniformLocation(trailProgram, 'u_currentTexture');
    trailUniforms.u_trailTexture = gl.getUniformLocation(trailProgram, 'u_trailTexture');
    trailUniforms.u_decay = gl.getUniformLocation(trailProgram, 'u_decay');
    trailUniforms.u_intensity = gl.getUniformLocation(trailProgram, 'u_intensity');
    
    // 残像用フレームバッファとテクスチャを作成
    trailFramebuffer = gl.createFramebuffer();
    trailTexture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_WIDTH, CANVAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, trailFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, trailTexture, 0);
    
    // 初期化時は黒でクリア
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // 属性位置をキャッシュ
    trailCachedPositionLocation = gl.getAttribLocation(trailProgram, 'a_position');
    trailCachedTexCoordLocation = gl.getAttribLocation(trailProgram, 'a_texCoord');
    
    console.log('Trail effect initialized successfully');
    return true;
}

function applyTrailEffect(inputTexture, outputFramebuffer) {
    if (!trailProgram || !trailTexture) return;
    
    gl.useProgram(trailProgram);
    
    // フレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 現在のテクスチャ（input）
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(trailUniforms.u_currentTexture, 0);
    
    // 残像テクスチャ（前フレーム）
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);
    gl.uniform1i(trailUniforms.u_trailTexture, 1);
    
    // パラメータ設定
    gl.uniform1f(trailUniforms.u_decay, trail_decay);
    gl.uniform1f(trailUniforms.u_intensity, trail_intensity);
    
    // 頂点属性設定（キャッシュを使用）
    const positionLocation = trailCachedPositionLocation;
    const texCoordLocation = trailCachedTexCoordLocation;
    
    // 頂点バッファバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // テクスチャ座標バッファバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // 描画
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // 残像テクスチャを更新（現在の結果を次フレーム用に保存）
    const targetTexture = outputFramebuffer === framebuffer ? framebufferTexture : tempTexture;
    updateTrailTexture(targetTexture);
}

function updateTrailTexture(sourceTexture) {
    if (!sourceTexture) return;
    
    // 現在の結果を残像テクスチャにコピー
    gl.bindFramebuffer(gl.FRAMEBUFFER, trailFramebuffer);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // シンプルなテクスチャコピー（WebGL 1.0対応）
    gl.useProgram(shaderProgram);
    
    // ソーステクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'u_texture'), 0);
    
    // 頂点属性設定
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const texCoordLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // 描画
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// 画面への直接レンダリング用
function renderTrailToScreen(inputTexture) {
    if (!trailProgram) return;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(trailProgram);
    
    // テクスチャ設定
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(trailUniforms.u_currentTexture, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);
    gl.uniform1i(trailUniforms.u_trailTexture, 1);
    
    // パラメータ設定
    gl.uniform1f(trailUniforms.u_decay, trail_decay);
    gl.uniform1f(trailUniforms.u_intensity, trail_intensity);
    
    // 頂点属性設定（キャッシュを使用）
    const positionLocation = trailCachedPositionLocation;
    const texCoordLocation = trailCachedTexCoordLocation;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // 残像テクスチャを更新（画面描画後なので直接テクスチャは取得できない）
    // 次フレームで適切に更新される
}

// 統一インターフェース
function applyTrailWithFallback(sourceTexture, targetFramebuffer) {
    if (targetFramebuffer) {
        applyTrailEffect(sourceTexture, targetFramebuffer);
    } else {
        renderTrailToScreen(sourceTexture);
    }
}

// パラメータ設定関数
function setTrailDecay(decay) {
    trail_decay = Math.max(0.0, Math.min(1.0, decay));
}

function setTrailIntensity(intensity) {
    trail_intensity = Math.max(0.0, intensity);
}