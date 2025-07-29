// RGBノイズエフェクト

let noiseProgram;
let noiseUniforms = {
    u_texture: null,
    u_resolution: null,
    u_seed: 0.0,
    u_intensity: 0.5
};

const noiseVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const noiseFragmentShader = `
    precision mediump float;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_seed;
    uniform float u_intensity;
    
    // 擬似乱数生成
    float random(vec2 st) {
        return fract(sin(dot(st.xy + u_seed, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
        vec4 originalColor = texture2D(u_texture, v_texCoord);
        
        vec2 pixelCoord = v_texCoord * u_resolution;
        
        // 各チャンネルに異なるシード値でノイズ生成
        float noiseR = random(pixelCoord) * 2.0 - 1.0;
        float noiseG = random(pixelCoord + vec2(100.0, 0.0)) * 2.0 - 1.0;
        float noiseB = random(pixelCoord + vec2(0.0, 100.0)) * 2.0 - 1.0;
        
        vec3 noise = vec3(noiseR, noiseG, noiseB) * u_intensity;
        
        vec3 finalColor = originalColor.rgb + noise;
        finalColor = clamp(finalColor, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, originalColor.a);
    }
`;

function initNoiseEffect() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, noiseVertexShader);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Noise vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
        return false;
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, noiseFragmentShader);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Noise fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
        return false;
    }
    
    noiseProgram = gl.createProgram();
    gl.attachShader(noiseProgram, vertexShader);
    gl.attachShader(noiseProgram, fragmentShader);
    gl.linkProgram(noiseProgram);
    
    if (!gl.getProgramParameter(noiseProgram, gl.LINK_STATUS)) {
        console.error('Noise program linking error:', gl.getProgramInfoLog(noiseProgram));
        return false;
    }
    
    noiseUniforms.u_texture = gl.getUniformLocation(noiseProgram, 'u_texture');
    noiseUniforms.u_resolution = gl.getUniformLocation(noiseProgram, 'u_resolution');
    noiseUniforms.u_seed = gl.getUniformLocation(noiseProgram, 'u_seed');
    noiseUniforms.u_intensity = gl.getUniformLocation(noiseProgram, 'u_intensity');
    
    return true;
}

function applyNoiseEffect(sourceTexture, targetFramebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
    
    if (targetFramebuffer === null) {
        gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(noiseProgram);
    
    gl.uniform2f(noiseUniforms.u_resolution, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.uniform1f(noiseUniforms.u_seed, noise_seed);
    gl.uniform1f(noiseUniforms.u_intensity, noise_intensity);
    
    drawQuad(noiseProgram, sourceTexture);
}