// 色相回転＆コントラスト調整エフェクト

let colorProgram = null;
let colorUniforms = {
    u_texture: null,
    u_hueRotation: 0.0,
    u_contrast: 1.0
};

const colorVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const colorFragmentShader = `
    precision mediump float;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform float u_hueRotation;
    uniform float u_contrast;
    
    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        // 色相回転
        vec3 hsv = rgb2hsv(color.rgb);
        hsv.x = fract(hsv.x + u_hueRotation);
        vec3 rotated = hsv2rgb(hsv);
        
        // コントラスト調整
        vec3 final = (rotated - 0.5) * u_contrast + 0.5;
        
        gl_FragColor = vec4(clamp(final, 0.0, 1.0), color.a);
    }
`;

function initColorEffect() {
    if (!gl) return false;
    
    // シェーダープログラム作成
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, colorVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, colorFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create color shaders');
        return false;
    }
    
    colorProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if (!colorProgram) {
        console.error('Failed to create color program');
        return false;
    }
    
    // ユニフォームの場所を取得
    colorUniforms.u_texture = gl.getUniformLocation(colorProgram, 'u_texture');
    colorUniforms.u_hueRotation = gl.getUniformLocation(colorProgram, 'u_hueRotation');
    colorUniforms.u_contrast = gl.getUniformLocation(colorProgram, 'u_contrast');
    
    console.log('Color effect initialized successfully');
    return true;
}

function applyColorEffect(inputTexture, outputFramebuffer) {
    if (!colorProgram) return;
    
    gl.useProgram(colorProgram);
    
    // フレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // テクスチャバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(colorUniforms.u_texture, 0);
    
    // パラメータ設定
    gl.uniform1f(colorUniforms.u_hueRotation, color_hueRotation);
    gl.uniform1f(colorUniforms.u_contrast, color_contrast);
    
    // 描画
    drawQuad(colorProgram, inputTexture);
}

// パラメータ設定関数
function setColorHueRotation(rotation) {
    color_hueRotation = rotation % 1.0;
}

function setColorContrast(contrast) {
    color_contrast = Math.max(0.0, contrast);
}