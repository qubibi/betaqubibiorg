// シンプルなボックスブラー

let boxblurProgram;
let boxblurUniforms = {
    u_texture: null,
    u_resolution: null,
    u_blurSize: 1.0,
    u_mixAmount: 1.0
};

// 属性位置のキャッシュ
let boxblurCachedPositionLocation = null;
let boxblurCachedTexCoordLocation = null;

const boxblurVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const boxblurFragmentShader = `
    precision mediump float;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_blurSize;
    uniform float u_mixAmount;
    
    void main() {
        vec4 originalColor = texture2D(u_texture, v_texCoord);
        
        vec2 texelSize = 1.0 / u_resolution;
        vec4 blurredColor = vec4(0.0);
        float totalWeight = 0.0;
        
        // 3x3のボックスブラー
        for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
                vec2 offset = vec2(float(x), float(y)) * texelSize * u_blurSize;
                blurredColor += texture2D(u_texture, v_texCoord + offset);
                totalWeight += 1.0;
            }
        }
        
        blurredColor = blurredColor / totalWeight;
        
        // 元の画像とブラーをミックス
        gl_FragColor = mix(originalColor, blurredColor, u_mixAmount);
    }
`;

function initBoxBlurEffect() {
    if (!gl) return false;
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, boxblurVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, boxblurFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create box blur shaders');
        return false;
    }
    
    boxblurProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if (!boxblurProgram) {
        console.error('Failed to create box blur program');
        return false;
    }
    
    boxblurUniforms.u_texture = gl.getUniformLocation(boxblurProgram, 'u_texture');
    boxblurUniforms.u_resolution = gl.getUniformLocation(boxblurProgram, 'u_resolution');
    boxblurUniforms.u_blurSize = gl.getUniformLocation(boxblurProgram, 'u_blurSize');
    boxblurUniforms.u_mixAmount = gl.getUniformLocation(boxblurProgram, 'u_mixAmount');
    
    // 属性位置をキャッシュ
    boxblurCachedPositionLocation = gl.getAttribLocation(boxblurProgram, 'a_position');
    boxblurCachedTexCoordLocation = gl.getAttribLocation(boxblurProgram, 'a_texCoord');
    
    console.log('Box blur effect initialized successfully');
    return true;
}

function applyBoxBlurEffect(inputTexture, outputFramebuffer) {
    if (!boxblurProgram) return;
    
    gl.useProgram(boxblurProgram);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (outputFramebuffer) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(boxblurUniforms.u_texture, 0);
    
    gl.uniform2f(boxblurUniforms.u_resolution, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.uniform1f(boxblurUniforms.u_blurSize, boxblur_size);
    gl.uniform1f(boxblurUniforms.u_mixAmount, boxblur_mixAmount);
    
    const positionLocation = boxblurCachedPositionLocation;
    const texCoordLocation = boxblurCachedTexCoordLocation;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}