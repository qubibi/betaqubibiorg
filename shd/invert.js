// 色反転エフェクト

let invertProgram;
let invertUniforms = {
    u_texture: null
};

// 属性位置のキャッシュ
let invertCachedPositionLocation = null;
let invertCachedTexCoordLocation = null;

const invertVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const invertFragmentShader = `
    precision mediump float;
    
    uniform sampler2D u_texture;
    varying vec2 v_texCoord;
    
    void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        gl_FragColor = vec4(1.0 - color.rgb, color.a);
    }
`;

function initInvertEffect() {
    if (!gl) return false;
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, invertVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, invertFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create invert shaders');
        return false;
    }
    
    invertProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if (!invertProgram) {
        console.error('Failed to create invert program');
        return false;
    }
    
    invertUniforms.u_texture = gl.getUniformLocation(invertProgram, 'u_texture');
    
    // 属性位置をキャッシュ
    invertCachedPositionLocation = gl.getAttribLocation(invertProgram, 'a_position');
    invertCachedTexCoordLocation = gl.getAttribLocation(invertProgram, 'a_texCoord');
    
    console.log('Invert effect initialized successfully');
    return true;
}

function applyInvertEffect(inputTexture, outputFramebuffer) {
    if (!invertProgram) return;
    
    gl.useProgram(invertProgram);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (outputFramebuffer) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(invertUniforms.u_texture, 0);
    
    const positionLocation = invertCachedPositionLocation;
    const texCoordLocation = invertCachedTexCoordLocation;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}