// Kuwaharaフィルター - WebGL実装
// 4つの象限の平均と分散を計算し、最も分散が小さい象限の色を選択

let kuwaharaProgram;
let kuwaharaUniforms = {
    u_texture: null,
    u_time: 0.0,
    u_threshold: 0.5,
    u_noiserange: 0.1,
    u_mixfade: 0.8,
    u_fade: 0.0,
    u_blur1x: 101.0,
    u_blur1y: 101.0,
    u_radius: 4.0,
    u_randomRange: 0.2
};

// 属性位置のキャッシュ
let kuwaharaCachedPositionLocation = null;
let kuwaharaCachedTexCoordLocation = null;

const kuwaharaVertexShader = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

const kuwaharaFragmentShader = `
    precision highp float;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_threshold;
    uniform float u_noiserange;
    uniform float u_mixfade;
    uniform float u_fade;
    uniform float u_blur1x;
    uniform float u_blur1y;
    uniform float u_radius;
    uniform float u_randomRange;
    
    const vec3 RGB_ADJUST = vec3(1.03, 0.99, 0.94);
    const vec3 SHADOW_COLOR = vec3(0.0, 0.2, 0.25);
    const float SHADOW_INTENSITY = 0.23;
    const float BRIGHTNESS_ADJUST = 0.88;
    
    float blendOverlay(float base, float blend) {
        return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
    }
    
    vec3 blendOverlay(vec3 base, vec3 blend) {
        return vec3(blendOverlay(base.r, blend.r),
                    blendOverlay(base.g, blend.g),
                    blendOverlay(base.b, blend.b));
    }
    
    float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    mat2 rotate2d(float angle) {
        return mat2(
            cos(angle), -sin(angle),
            sin(angle), cos(angle)
        );
    }
    
    vec3 applyFilterA(vec3 color, vec2 uv) {
        float noise = rand(uv * u_time) * u_noiserange - u_noiserange * 0.5;
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        float s = step(lum, u_threshold + noise);
        vec3 noiseEffect = mix(vec3(1.0), vec3(0.0), s);
        vec3 blendedColor = blendOverlay(color, noiseEffect);
        
        color = mix(color, blendedColor, u_mixfade);
        color *= RGB_ADJUST * BRIGHTNESS_ADJUST;
        
        float shadowMask = smoothstep(0.0, 0.4, 1.0 - lum);
        color += SHADOW_COLOR * SHADOW_INTENSITY * shadowMask;
        
        return color;
    }
    
    void main() {
        vec2 uv = v_texCoord;
        vec2 src_size = vec2(1.0 / u_blur1x, 1.0 / u_blur1y);
        float n = float((u_radius + 1.0) * (u_radius + 1.0));
        
        vec3 m0 = vec3(0.0), m1 = vec3(0.0), m2 = vec3(0.0), m3 = vec3(0.0);
        vec3 s0 = vec3(0.0), s1 = vec3(0.0), s2 = vec3(0.0), s3 = vec3(0.0);
        vec3 c;
        
        vec3 baseColor = texture2D(u_texture, uv).rgb;
        
        // 左上領域（ランダム回転を適用）
        for (int j = -4; j <= 0; ++j) {
            for (int i = -4; i <= 0; ++i) {
                float rand_angle = rand(vec2(float(i), float(j)) + uv + u_time) * u_randomRange;
                vec2 offset = vec2(float(i), float(j)) * src_size;
                offset = rotate2d(rand_angle) * offset;
                c = texture2D(u_texture, uv + offset).rgb;
                m0 += c;
                s0 += c * c;
            }
        }
        
        // 右上領域
        for (int j = -6; j <= 0; ++j) {
            for (int i = 0; i <= 6; ++i) {
                vec2 offset = vec2(float(i), float(j)) * src_size;
                c = texture2D(u_texture, uv + offset).rgb;
                m1 += c;
                s1 += c * c;
            }
        }
        
        // 右下領域
        for (int j = 0; j <= 4; ++j) {
            for (int i = 0; i <= 4; ++i) {
                float rand_angle = rand(vec2(float(i), float(j)) + uv + u_time) * u_randomRange;
                vec2 offset = vec2(float(i), float(j)) * src_size;
                offset = rotate2d(rand_angle) * offset;
                c = texture2D(u_texture, uv + offset).rgb;
                m2 += c;
                s2 += c * c;
            }
        }
        
        // 左下領域
        for (int j = 0; j <= 6; ++j) {
            for (int i = -6; i <= 0; ++i) {
                vec2 offset = vec2(float(i), float(j)) * src_size;
                c = texture2D(u_texture, uv + offset).rgb;
                m3 += c;
                s3 += c * c;
            }
        }
        
        float min_sigma2 = 1e+2;
        vec3 finalColor = baseColor;
        
        // 各領域の分散を計算して最適な領域を選択
        m0 /= n;
        s0 = abs(s0 / n - m0 * m0);
        float sigma2 = s0.r + s0.g + s0.b;
        if (sigma2 < min_sigma2) {
            min_sigma2 = sigma2;
            finalColor = m0;
        }
        
        m1 /= n;
        s1 = abs(s1 / n - m1 * m1);
        sigma2 = s1.r + s1.g + s1.b;
        if (sigma2 < min_sigma2) {
            min_sigma2 = sigma2;
            finalColor = m1;
        }
        
        m2 /= n;
        s2 = abs(s2 / n - m2 * m2);
        sigma2 = s2.r + s2.g + s2.b;
        if (sigma2 < min_sigma2) {
            min_sigma2 = sigma2;
            finalColor = m2;
        }
        
        m3 /= n;
        s3 = abs(s3 / n - m3 * m3);
        sigma2 = s3.r + s3.g + s3.b;
        if (sigma2 < min_sigma2) {
            min_sigma2 = sigma2;
            finalColor = m3;
        }
        
        finalColor = mix(baseColor, finalColor, u_fade);
        finalColor = applyFilterA(finalColor, uv);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function initKuwaharaFilter() {
    if (!gl) return false;
    
    // 頂点シェーダーとフラグメントシェーダーを作成
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, kuwaharaVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, kuwaharaFragmentShader);
    
    if (!vertexShader || !fragmentShader) {
        console.error('Failed to create kuwahara shaders');
        return false;
    }
    
    kuwaharaProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if (!kuwaharaProgram) {
        console.error('Failed to create kuwahara program');
        return false;
    }
    
    // ユニフォームの場所を取得
    kuwaharaUniforms.u_texture = gl.getUniformLocation(kuwaharaProgram, 'u_texture');
    kuwaharaUniforms.u_resolution = gl.getUniformLocation(kuwaharaProgram, 'u_resolution');
    kuwaharaUniforms.u_time = gl.getUniformLocation(kuwaharaProgram, 'u_time');
    kuwaharaUniforms.u_threshold = gl.getUniformLocation(kuwaharaProgram, 'u_threshold');
    kuwaharaUniforms.u_noiserange = gl.getUniformLocation(kuwaharaProgram, 'u_noiserange');
    kuwaharaUniforms.u_mixfade = gl.getUniformLocation(kuwaharaProgram, 'u_mixfade');
    kuwaharaUniforms.u_fade = gl.getUniformLocation(kuwaharaProgram, 'u_fade');
    kuwaharaUniforms.u_blur1x = gl.getUniformLocation(kuwaharaProgram, 'u_blur1x');
    kuwaharaUniforms.u_blur1y = gl.getUniformLocation(kuwaharaProgram, 'u_blur1y');
    kuwaharaUniforms.u_radius = gl.getUniformLocation(kuwaharaProgram, 'u_radius');
    kuwaharaUniforms.u_randomRange = gl.getUniformLocation(kuwaharaProgram, 'u_randomRange');
    
    // 属性位置をキャッシュ
    kuwaharaCachedPositionLocation = gl.getAttribLocation(kuwaharaProgram, 'a_position');
    kuwaharaCachedTexCoordLocation = gl.getAttribLocation(kuwaharaProgram, 'a_texCoord');
    
    console.log('Kuwahara effect initialized successfully');
    return true;
}

function applyKuwaharaFilter(inputTexture, outputFramebuffer, fade = 0.5) {
    if (!kuwaharaProgram) return;
    
    gl.useProgram(kuwaharaProgram);
    
    // フレームバッファをバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
    gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // テクスチャをバインド
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    gl.uniform1i(kuwaharaUniforms.u_texture, 0);
    
    // ユニフォームを設定
    gl.uniform2f(kuwaharaUniforms.u_resolution, CANVAS_WIDTH, CANVAS_HEIGHT);
    gl.uniform1f(kuwaharaUniforms.u_time, kuwahara_time);
    gl.uniform1f(kuwaharaUniforms.u_threshold, kuwahara_threshold);
    gl.uniform1f(kuwaharaUniforms.u_noiserange, kuwahara_noiserange);
    gl.uniform1f(kuwaharaUniforms.u_mixfade, kuwahara_mixfade);
    gl.uniform1f(kuwaharaUniforms.u_fade, fade);
    gl.uniform1f(kuwaharaUniforms.u_blur1x, kuwahara_blur1x);
    gl.uniform1f(kuwaharaUniforms.u_blur1y, kuwahara_blur1y);
    gl.uniform1f(kuwaharaUniforms.u_radius, kuwahara_radius);
    gl.uniform1f(kuwaharaUniforms.u_randomRange, kuwahara_randomRange);
    
    // 頂点属性設定（キャッシュを使用）
    const positionLocation = kuwaharaCachedPositionLocation;
    const texCoordLocation = kuwaharaCachedTexCoordLocation;
    
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
}

// パラメータ設定関数
function setKuwaharaFade(fade) {
    kuwaharaUniforms.fadeValue = fade;
}

function setKuwaharaRadius(radius) {
    kuwaharaUniforms.radiusValue = radius;
}