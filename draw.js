let frameCount = 0;

// ランダム円の設定
let randomCircle = {
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    color: '',
    alpha: 0
};

// 2つ目のランダム円
let randomCircle2 = {
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    color: '',
    alpha: 0
};

// 画像の変形パラメータ
let senImageTransform = {
    rotation: 0,      // 回転角度（ラジアン）
    scaleX: 1,        // 横スケール
    scaleY: 1,        // 縦スケール
    offsetX: 0,       // X位置オフセット
    offsetY: 0        // Y位置オフセット
};

let currentBackgroundColor = '#212121';
let backgroundColorIndex = 0;
// let currentBackgroundColor = '#212121';

// 塗りレイヤーを描画する関数
function drawNuriLayer() {
    // 背景色を毎フレーム塗りつぶし
    nuriCtx.fillStyle = currentBackgroundColor;
    nuriCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const currentNuriImg = getCurrentNuriImage();
    if (currentNuriImg) {
        const scaledWidth = currentNuriImg.width * 0.55;
        const scaledHeight = currentNuriImg.height * 0.55;
        const centerX = Math.floor((CANVAS_WIDTH - scaledWidth) / 2)+20;
        const centerY = Math.floor((CANVAS_HEIGHT - scaledHeight) / 2);
        
        // currentRotationが設定されている場合は回転を適用
        if (currentRotation !== 0) {
            nuriCtx.save();
            nuriCtx.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
            nuriCtx.rotate(currentRotation * Math.PI / 180); // 度をラジアンに変換
            nuriCtx.translate(-CANVAS_WIDTH/2, -CANVAS_HEIGHT/2);
        }
        
        // 変形適用（線画像と同じ変形を使用）
        const transform = senImageTransform;
        if (transform.rotation !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || 
            transform.offsetX !== 0 || transform.offsetY !== 0) {
            nuriCtx.save();
            // 画像の中心を基準に変形
            const finalCenterX = centerX + transform.offsetX;
            const finalCenterY = centerY + transform.offsetY;
            nuriCtx.translate(finalCenterX + scaledWidth/2, finalCenterY + scaledHeight/2);
            nuriCtx.rotate(transform.rotation);
            nuriCtx.scale(transform.scaleX, transform.scaleY);
            nuriCtx.drawImage(currentNuriImg, -scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);
            nuriCtx.restore();
        } else {
            nuriCtx.drawImage(currentNuriImg, centerX, centerY, scaledWidth, scaledHeight);
        }
        
        // 回転をリセット
        if (currentRotation !== 0) {
            nuriCtx.restore();
        }
    }
    
    // ランダム円を描画
    if (randomCircle.active) {
        nuriCtx.save();
        nuriCtx.globalAlpha = randomCircle.alpha;
        nuriCtx.fillStyle = randomCircle.color;
        nuriCtx.beginPath();
        nuriCtx.arc(randomCircle.x, randomCircle.y, randomCircle.radius, 0, Math.PI * 2);
        nuriCtx.fill();
        nuriCtx.restore();
    }
    
    // 2つ目のランダム円を描画
    if (randomCircle2.active) {
        nuriCtx.save();
        nuriCtx.globalAlpha = randomCircle2.alpha;
        nuriCtx.fillStyle = randomCircle2.color;
        nuriCtx.beginPath();
        nuriCtx.arc(randomCircle2.x, randomCircle2.y, randomCircle2.radius, 0, Math.PI * 2);
        nuriCtx.fill();
        nuriCtx.restore();
    }
}

// 線レイヤーを描画する関数
function drawSenLayer() {
    // 線Canvasをクリア
    senCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const currentSenImg = getCurrentSenImage();
    if (currentSenImg) {
        const scaledWidth = currentSenImg.width * 0.55;
        const scaledHeight = currentSenImg.height * 0.55;
        const centerX = Math.floor((CANVAS_WIDTH - scaledWidth) / 2)+20;
        const centerY = Math.floor((CANVAS_HEIGHT - scaledHeight) / 2);
        
        // currentRotationが設定されている場合は回転を適用
        if (currentRotation !== 0) {
            senCtx.save();
            senCtx.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
            senCtx.rotate(currentRotation * Math.PI / 180); // 度をラジアンに変換
            senCtx.translate(-CANVAS_WIDTH/2, -CANVAS_HEIGHT/2);
        }
        
        // 変形適用
        const transform = senImageTransform;
        if (transform.rotation !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || 
            transform.offsetX !== 0 || transform.offsetY !== 0) {
            senCtx.save();
            // 画像の中心を基準に変形
            const finalCenterX = centerX + transform.offsetX;
            const finalCenterY = centerY + transform.offsetY;
            senCtx.translate(finalCenterX + scaledWidth/2, finalCenterY + scaledHeight/2);
            senCtx.rotate(transform.rotation);
            senCtx.scale(transform.scaleX, transform.scaleY);
            senCtx.drawImage(currentSenImg, -scaledWidth/2, -scaledHeight/2, scaledWidth, scaledHeight);
            senCtx.restore();
        } else {
            senCtx.drawImage(currentSenImg, centerX, centerY, scaledWidth, scaledHeight);
        }
        
        // 回転をリセット
        if (currentRotation !== 0) {
            senCtx.restore();
        }
    }
    
}

// 中央画像を描画する関数
function drawCenterImage() {
    // 各レイヤーを別々のCanvasに描画
    drawNuriLayer();
    drawSenLayer();
}

// 画像にランダムな変形を適用
function applyRandomImageTransform() {
    senImageTransform.rotation += rndm(-25, 25) * Math.PI / 180;  // -15度から15度
    senImageTransform.scaleX  += rndm(-0.03, .06);                   // 0.9倍から1.1倍
    senImageTransform.scaleY  += rndm(-0.03, .06);                   // 0.9倍から1.1倍
    senImageTransform.offsetX  += rndm(-9, 9);                   // -20pxから20px
    senImageTransform.offsetY  += rndm(-9, 9);                   // -20pxから20px
}

// 画像変形をリセット
function applyRandomImageTransformReset() {
    senImageTransform.rotation = 0;
    senImageTransform.scaleX = 1;
    senImageTransform.scaleY = 1;
    senImageTransform.offsetX = 0;
    senImageTransform.offsetY = 0;
}

// ランダム円を生成する関数
function createRandomCircles() {
    // 余白設定
    const marginX = 30;
    const marginY = 40;
    
    // 1つ目の円
    randomCircle.active = true;
    randomCircle.x = marginX + Math.random() * (CANVAS_WIDTH - marginX * 2);
    randomCircle.y = marginY + Math.random() * (CANVAS_HEIGHT - marginY * 2);
    randomCircle.radius = 2 + Math.random() * 110; // 10px〜110px
    // ランダムな色
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    randomCircle.color = `rgb(${r}, ${g}, ${b})`;
    randomCircle.alpha = rndm(.02,.77); // 0〜1のランダムな透明度
    
    // 2つ目の円
    randomCircle2.active = true;
    randomCircle2.x = marginX + Math.random() * (CANVAS_WIDTH - marginX * 2);
    randomCircle2.y = marginY + Math.random() * (CANVAS_HEIGHT - marginY * 2);
    randomCircle2.radius = 2 + Math.random() * 110; // 10px〜110px
    // ランダムな色
    const r2 = Math.floor(Math.random() * 256);
    const g2 = Math.floor(Math.random() * 256);
    const b2 = Math.floor(Math.random() * 256);
    randomCircle2.color = `rgb(${r2}, ${g2}, ${b2})`;
    randomCircle2.alpha = rndm(.02,.77); // 0〜1のランダムな透明度
}

function draw() {
    // アニメーションを更新
    updateAnimation();
    
    // 各レイヤーに描画
    drawCenterImage();
    
    frameCount++;
}

function setRandomBackgroundColor() {
    // 背景色の配列
    const backgroundColors = [
        '#222'];
        // '#222','#4f1511','#222','#006'];
        // '#222', '#005', '#511',  "#000",'#003a00'];
    
    // 順番に選択（最後まで行ったら最初に戻る）
    currentBackgroundColor = backgroundColors[backgroundColorIndex];
    backgroundColorIndex = (backgroundColorIndex + 1) % backgroundColors.length;
    
    // 背景色変更後に画像を再描画（背景はdrawNuriLayerで描画される）
    drawCenterImage();
}

function setRandomDotColors() {
}

// リサイズ時に呼び出される関数
function updateDotPositions() {
}

// anime.jsから呼ばれる統一トリガー関数
function triggerRandomCircles() {
    // 円生成のみ実行（画像変形はマウスダウン時に実行）
    createRandomCircles();
}

// 円を非表示にする関数
function hideRandomCircles() {
    // 円のactiveフラグをfalseにして非表示化
    randomCircle.active = false;
    randomCircle2.active = false;
    // 即座に再描画して円を物理的に消去
    drawNuriLayer();
}