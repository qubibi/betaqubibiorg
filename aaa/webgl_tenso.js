// WebGL初期化と転送機能

let shaderProgram = null;
let texture = null;
let nuriTexture = null;  // 塗り用テクスチャ
let senTexture = null;   // 線用テクスチャ
let vertexBuffer = null;
let textureCoordBuffer = null;
let framebuffer = null;
let framebufferTexture = null;

// 頂点シェーダー
const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

// フラグメントシェーダー（基本）
const fragmentShaderSource = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    varying vec2 v_texCoord;
    
    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }
`;

// シェーダーを作成
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// プログラムを作成
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    
    return program;
}

// WebGL初期化
function initWebGL() {
    // シェーダー作成
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create shaders');
        return false;
    }
    
    // プログラム作成
    shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if (!shaderProgram) {
        console.error('Failed to create program');
        return false;
    }
    
    // 頂点バッファ作成（全画面四角形）
    const vertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0
    ]);
    
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    // テクスチャ座標バッファ作成（Y座標を反転）
    const textureCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ]);
    
    textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
    
    // テクスチャ作成（互換性のため残す）
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // テクスチャパラメータ設定
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // 塗り用テクスチャ作成
    nuriTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, nuriTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // 線用テクスチャ作成
    senTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, senTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // WebGLとCanvas2Dの座標系の違いを解決
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    // フレームバッファとテクスチャを作成（ポストエフェクト用）
    framebuffer = gl.createFramebuffer();
    framebufferTexture = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS_WIDTH, CANVAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebufferTexture, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    // ビューポート設定
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    console.log('WebGL initialized successfully');
    return true;
}

// Canvas2D → WebGLテクスチャ転送
function transferCanvasToWebGL() {
    // 塗りと線を別々のテクスチャに転送
    transferNuriToWebGL();
    transferSenToWebGL();
    
    // メインテクスチャは塗りテクスチャを使用（エフェクトチェーンの開始点）
    texture = nuriTexture;
}

// 塗りCanvas → WebGLテクスチャ転送
function transferNuriToWebGL() {
    if (!nuriTexture) return;
    
    gl.bindTexture(gl.TEXTURE_2D, nuriTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nuriCanvas);
}

// 線Canvas → WebGLテクスチャ転送
function transferSenToWebGL() {
    if (!senTexture) return;
    
    gl.bindTexture(gl.TEXTURE_2D, senTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, senCanvas);
}

// WebGL描画
function renderWebGL() {
    if (!shaderProgram) return;
    
    // プログラム使用
    gl.useProgram(shaderProgram);
    
    // 頂点属性設定
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const texCoordLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');
    
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
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // ユニフォーム設定
    const textureLocation = gl.getUniformLocation(shaderProgram, 'u_texture');
    gl.uniform1i(textureLocation, 0);
    
    // 描画
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}