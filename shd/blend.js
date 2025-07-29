// 線レイヤーブレンドエフェクト

let blendProgram = null;

const blendVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const blendFragmentShader = `
    precision mediump float;
    
    uniform sampler2D u_baseTexture;  // エフェクト適用中の塗り
    uniform sampler2D u_senTexture;   // 線テクスチャ（エフェクトなし）
    uniform float u_blendMode;        // 0: normal, 1: lighten, 2: screen
    
    varying vec2 v_texCoord;
    
    void main() {
        vec4 base = texture2D(u_baseTexture, v_texCoord);
        vec4 sen = texture2D(u_senTexture, v_texCoord);
        
        vec4 result;
        
        if (u_blendMode < 0.5) {
            // Normal (alpha blend)
            result = mix(base, sen, sen.a);
        } else if (u_blendMode < 1.5) {
            // Lighten (明るい方を採用)
            result = max(base, sen);
        } else {
            // Screen (スクリーン合成)
            result = vec4(1.0) - (vec4(1.0) - base) * (vec4(1.0) - sen);
        }
        
        gl_FragColor = result;
    }
`;

// ブレンドエフェクトの初期化
function initBlendEffect() {
    const vertShader = createShader(gl, gl.VERTEX_SHADER, blendVertexShader);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, blendFragmentShader);
    
    if (!vertShader || !fragShader) {
        console.error('Failed to create blend shaders');
        return false;
    }
    
    blendProgram = createProgram(gl, vertShader, fragShader);
    if (!blendProgram) {
        console.error('Failed to create blend program');
        return false;
    }
    
    return true;
}

// 頂点属性のセットアップ（共通関数）
function setupVertexAttributes(program, programName) {
    // 頂点属性の場所をキャッシュから取得
    let positionLocation = cachedPositionLocations.get(program);
    let texCoordLocation = cachedTexCoordLocations.get(program);
    
    if (positionLocation === undefined) {
        positionLocation = gl.getAttribLocation(program, 'a_position');
        cachedPositionLocations.set(program, positionLocation);
    }
    
    if (texCoordLocation === undefined) {
        texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
        cachedTexCoordLocations.set(program, texCoordLocation);
    }
    
    // 頂点バッファバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // テクスチャ座標バッファバインド
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
}

// uniform設定の共通化
function setBlendUniforms(program, baseTexture, blendMode) {
    const baseTextureLocation = gl.getUniformLocation(program, 'u_baseTexture');
    const senTextureLocation = gl.getUniformLocation(program, 'u_senTexture');
    const blendModeLocation = gl.getUniformLocation(program, 'u_blendMode');
    
    // ベーステクスチャ（塗り）
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, baseTexture);
    gl.uniform1i(baseTextureLocation, 0);
    
    // 線テクスチャ
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, senTexture);
    gl.uniform1i(senTextureLocation, 1);
    
    // ブレンドモード
    gl.uniform1f(blendModeLocation, blendMode);
}

// 画面への直接レンダリング
function renderBlendToScreen(baseTexture, blendMode = 1) {
    if (!blendProgram) return;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(blendProgram);
    setupVertexAttributes(blendProgram, 'blend');
    setBlendUniforms(blendProgram, baseTexture, blendMode);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// ブレンドエフェクトの適用（フレームバッファ用）
function applyBlendEffect(baseTexture, targetFramebuffer, targetTexture, blendMode = 1) {
    if (!blendProgram) return;
    
    gl.useProgram(blendProgram);
    setupVertexAttributes(blendProgram, 'blend');
    setBlendUniforms(blendProgram, baseTexture, blendMode);
    
    // ターゲットにレンダリング
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// 統一インターフェース
function applyBlendWithSen(sourceTexture, targetFramebuffer) {
    if (targetFramebuffer) {
        const targetTexture = targetFramebuffer === framebuffer ? 
            framebufferTexture : tempTexture;
        applyBlendEffect(sourceTexture, targetFramebuffer, targetTexture, 1);
    } else {
        renderBlendToScreen(sourceTexture, 1);
    }
}