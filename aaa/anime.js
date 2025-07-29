// パターン定義（複数パターン対応）
const patterns = {
    a: {
        sen_imgseqUp:   ['a1s','a2s','a2s','a3s','a4s','a5s','a5s',999,999,999,999,'a6s','a6s','a7s','a7s','a8s','a8s','a8s','a8s','a8s',999],
        sen_imgseqDown: ['a8s','a6s','a9s','a4s','a1s'],
        nuri_imgseqUp:   ['a1f','a2f','a2f','a3f','a4f','a5f','a5f',999,999,999,999,'a6f','a6f','a7f','a7f','a8f','a8f','a8f','a8f','a8f','a8f'],
        nuri_imgseqDown: ['a8f','a6f','a9f','a4f','a1f']
    },
    b: {
        sen_imgseqUp:   ['b1s','b2s','b2s','b3s','b4s','b5s','b5s',999,999,999,'b6s','b6s','b7s','b7s','b8s','b8s','b8s','b8s','b8s',999],
        sen_imgseqDown: ['b8s','b7s','b6s','b9s','b1s'],
        nuri_imgseqUp:  ['b1f','b2f','b2f','b3f','b4f','b5f','b5f',999,999,999,'b6f','b6f','b7f','b7f','b8f','b8f','b8f','b8f','b8f','b8f'],
        nuri_imgseqDown:['b8f','b7f','b6f','b9f','b1f']
    },
    c: {
        sen_imgseqUp:   ['c1s','c2s','c2s','c3s','c4s','c5s','c5s',999,999,999,'c6s','c6s','c7s','c7s','c8s','c8s','c8s','c8s','c8s',999],
        sen_imgseqDown: ['c8s','c9s','c10s','c11s','c1s'],
        nuri_imgseqUp:  ['c1f','c2f','c2f','c3f','c4f','c5f','c5f',999,999,999,'c6f','c6f','c7f','c7f','c8f','c8f','c8f','c8f','c8f','c8f'],
        nuri_imgseqDown: ['c8f',999,999,999,'c1f']
    },
    d: {
        sen_imgseqUp:   ['d1s','d2s','d2s','d3s','d4s','d5s','d5s',999,999,999,'d6s','d6s','d7s','d7s','d8s','d8s','d8s','d8s','d8s',999],
        sen_imgseqDown: ['d8s','d6s','d9s','d3s','d1s'],
        nuri_imgseqUp:  ['d1f','d2f','d2f','d3f','d4f','d5f','d5f',999,999,999,'d6f','d6f','d7f','d7f','d8f','d8f','d8f','d8f','d8f','d8f'],
        nuri_imgseqDown: ['d8f','d7f','d6f','d9f','d1f']
    }
};

// 現在使用中のシーケンス（動的に参照）
let currentSenSequence = patterns[currentPattern].sen_imgseqUp;
let currentNuriSequence = patterns[currentPattern].nuri_imgseqUp;
let isMouseDown = false;

// アニメーションコントロール
let currentImageIndex = 0;
let frameCounter = 0;
let animationInterval =   2; // 何フレームごとにアニメーションを進めるか
let animationDirection = 1; // 1: forward, -1: backward

// 円生成のON/OFF制御
let is_circleonoff = false;

// マウスダウン前の状態を保存するための変数
let beforeMouseDownSenSequence = null;
let beforeMouseDownNuriSequence = null;
let beforeMouseDownImageIndex = 0;
let beforeMouseDownDirection = 1;

const REVERSE_TRIGGER_INDEX = 2;
// ベースフレームアクション（aパターン）
const baseFrameActions = {
    mouseDown: {
        immediate: () => {
            // applyRandomImageTransform();
            // 10%の確率で円生成をONにする
            is_circleonoff = Math.random() < 0.26;
        }
    },
    mouseUp: {
        immediate: () => {
            // マウスアップ時の即座の処理（現在なし）
        }
    },
    sen_imgseqDown: {

        0: () => {
            trail_decay = 0.9;
            if (Math.random() < 0.33) {
                applyRandomImageTransformReset();
            } else {
                applyRandomImageTransform();
            }

        },
        1: () => {
            trail_decay = 0.2;
            // 最初のフレームで11%の確率で変形リセット
        },
    },
    sen_imgseqUp: {
        1: () => {
            // 最初のフレームで11%の確率で変形リセット
            if (Math.random() < 0.33) {
                // applyRandomImageTransformReset();
            }
        },
        5: () => {
            playSnapSound();
            setRandomBackgroundColor()
        },
        15: () => {
            trail_decay = 0.89;
            // trail_decay = 0.89;
        }
    },
    effectsFrameUp: [0, 1,  5, 7, 11, 13, 15],
    // effectsFrameUp: [0,1, 3, 4, 5, 7, 10, 12, 14],
    effectsFrameDown: [0, 1, 2, 3, 4],

    circleFrameUp: [0,5,11,16],
    circleFrameDown: [0, 2, 3, 4],
    // circleFrameUp: [0,5,15],
    // circleFrameDown: [0, 1, 2, 3, 4],
    circlehiddenFrameUp: [1,2],
    circlehiddenFrameDown: [0,1]
};

// パターン別オーバーライド定義（差分のみ）
const frameActionOverrides = {
    // 現時点では全パターンがaと同じなので空
    // 今後パターン別の違いが必要になったらここに追加
    // 例: b: { sen_imgseqUp: { 4: () => { /* 違う処理 */ } } }
};

// 現在のパターンのフレームアクションを取得（ベース+オーバーライド）
function getCurrentFrameActions() {
    // 全パターンでbaseFrameActionsをそのまま使用
    // JSON.parse/stringifyは関数を失うため使わない
    return baseFrameActions;
}

// エフェクト更新の重複防止用
let lastEffectUpdateIndex = -1;
// 円生成の重複防止用
let lastCircleUpdateIndex = -1;
// 円削除の重複防止用
let lastCircleHiddenIndex = -1;

// パターン切り替え関数
function switchPattern(patternKey) {
    if (!patterns[patternKey]) {
        console.warn(`Pattern ${patternKey} not found`);
        return;
    }
    
    console.log(`Switching to pattern: ${patternKey}`);
    currentPattern = patternKey;
    
    // 現在のマウス状態に応じてシーケンスを設定
    if (isMouseDown) {
        currentSenSequence = patterns[currentPattern].sen_imgseqDown;
        currentNuriSequence = patterns[currentPattern].nuri_imgseqDown;
    } else {
        currentSenSequence = patterns[currentPattern].sen_imgseqUp;
        currentNuriSequence = patterns[currentPattern].nuri_imgseqUp;
    }
    
    // アニメーションをリセット
    currentImageIndex = 0;
    animationDirection = 1;
    frameCounter = 0;
    lastEffectUpdateIndex = -1;
    lastCircleUpdateIndex = -1;
    lastCircleHiddenIndex = -1;
    
    // 注: color_hueRotationの更新はstart.jsで行うため、ここでは行わない
    // （プリセット番号からの制御に統一）
}

// 統一されたアクション実行システム
function executeFrameActions(sequenceName, frameIndex) {
    const currentFrameActions = getCurrentFrameActions();
    
    // シーケンス別のフレームアクション実行
    const sequenceActions = currentFrameActions[sequenceName];
    if (sequenceActions && sequenceActions[frameIndex]) {
        sequenceActions[frameIndex]();
    }
    
    // エフェクト更新チェック
    const effectsFrameArray = sequenceName === 'sen_imgseqUp' ? 
        currentFrameActions.effectsFrameUp : currentFrameActions.effectsFrameDown;
    
    if (effectsFrameArray && effectsFrameArray.includes(frameIndex) && frameIndex !== lastEffectUpdateIndex) {
        updatePostEffectsOnce();
        lastEffectUpdateIndex = frameIndex;
    }
    
    // 円生成チェック（circleFrameUp/circleFrameDown）
    const circleFrameArray = sequenceName === 'sen_imgseqUp' ? 
        currentFrameActions.circleFrameUp : currentFrameActions.circleFrameDown;
    
    if (circleFrameArray && circleFrameArray.includes(frameIndex) && frameIndex !== lastCircleUpdateIndex) {
        // is_circleonoffがtrueの時のみ円生成
        if (is_circleonoff) {
            triggerRandomCircles();
        }
        lastCircleUpdateIndex = frameIndex;
    }
    
    // 円削除チェック（circlehiddenFrameUp/circlehiddenFrameDown）
    const circleHiddenArray = sequenceName === 'sen_imgseqUp' ? 
        currentFrameActions.circlehiddenFrameUp : currentFrameActions.circlehiddenFrameDown;
    
    if (circleHiddenArray && circleHiddenArray.includes(frameIndex) && frameIndex !== lastCircleHiddenIndex) {
        hideRandomCircles();
        lastCircleHiddenIndex = frameIndex;
    }
}

function executeMouseAction(action) {
    const currentFrameActions = getCurrentFrameActions();
    if (currentFrameActions[action] && currentFrameActions[action].immediate) {
        currentFrameActions[action].immediate();
    }
}

// 現在のフレームの線画像を取得
function getCurrentSenImage() {
    if (!allImagesLoaded) {
        return null;
    }
    const imageName = currentSenSequence[currentImageIndex];
    return getImage(imageName);
}

// 現在のフレームの塗り画像を取得
function getCurrentNuriImage() {
    if (!allImagesLoaded) {
        return null;
    }
    const imageName = currentNuriSequence[currentImageIndex];
    return getImage(imageName);
}

// 次のフレームに進む
function nextFrame() {
    if (!allImagesLoaded) return;
    
    // 待機中でない場合のみインデックスを進める
    if (!isWaitingForMouseDown) {
        if (animationDirection === 1) {
            // 順再生：最後のフレームに到達していない場合のみ進める
            if (currentImageIndex < currentSenSequence.length - 1) {
                currentImageIndex++;
            }
        } else {
            // 逆再生：最初のフレームに到達していない場合のみ戻る
            if (currentImageIndex > 0) {
                currentImageIndex--;
            }
        }
    }
    
    // 順再生時のみアクション実行（待機中でも実行する）
    if (animationDirection === 1) {
        const sequenceName = currentSenSequence === patterns[currentPattern].sen_imgseqUp ? 'sen_imgseqUp' : 'sen_imgseqDown';
        executeFrameActions(sequenceName, currentImageIndex);
    }
}

// マウス状態を設定
function setMouseState(isDown) {
    const wasMouseDown = isMouseDown;
    
    // 待機中のマウスアップの場合は早期リターン
    if (!isDown && isWaitingForMouseDown) {
        // 待機をキャンセルして完全に元の状態に戻す
        isWaitingForMouseDown = false;
        mouseDownDelayCounter = 0;
        isMouseDown = false;
        // マウスダウン前の状態に完全復元
        currentSenSequence = beforeMouseDownSenSequence;
        currentNuriSequence = beforeMouseDownNuriSequence;
        currentImageIndex = beforeMouseDownImageIndex;
        animationDirection = beforeMouseDownDirection;
        return; // 早期リターンで以降の処理をスキップ
    }
    
    isMouseDown = isDown;
    
    // 状態が変わった時の処理
    if (wasMouseDown !== isDown) {
        if (isDown) {
            // マウスダウン前の状態を保存
            beforeMouseDownSenSequence = currentSenSequence;
            beforeMouseDownNuriSequence = currentNuriSequence;
            beforeMouseDownImageIndex = currentImageIndex;
            beforeMouseDownDirection = animationDirection;
            
            // マウスダウン時のアクション実行
            executeMouseAction('mouseDown');
            
            // 最初のフレームでのインデックス進行を抑制するフラグを設定
            mouseDownDelayCounter = 0;
            isWaitingForMouseDown = true;
            
            if (currentSenSequence === patterns[currentPattern].sen_imgseqUp && currentImageIndex < REVERSE_TRIGGER_INDEX && currentImageIndex > 0) {
                // sen_imgseqUpの指定インデックスより前なら逆再生
                animationDirection = -1;
            } else {
                // 通常の切り替え
                currentSenSequence = patterns[currentPattern].sen_imgseqDown;
                currentNuriSequence = patterns[currentPattern].nuri_imgseqDown;
                currentImageIndex = 0;
                animationDirection = 1;
                lastEffectUpdateIndex = -1;  // リセット
                lastCircleUpdateIndex = -1;   // リセット
                lastCircleHiddenIndex = -1;   // リセット
            }
        } else {
            // 通常のマウスアップ処理
            executeMouseAction('mouseUp');
            
            // 通常の切り替え（戻り動作をオフ）
            currentSenSequence = patterns[currentPattern].sen_imgseqUp;
            currentNuriSequence = patterns[currentPattern].nuri_imgseqUp;
            currentImageIndex = 0;
            animationDirection = 1;
            
            // lastEffectUpdateIndex は維持
            // lastCircleUpdateIndex も維持
        }
    }
}


// アニメーション更新（draw()から毎フレーム呼ばれる）
function updateAnimation() {
    
    frameCounter++;
    frameCounter %= animationInterval;
    
    // カウンターが0の時だけアニメーションを進める
    if (frameCounter === 0) {
        // 待機中の場合はカウンターを進める
        if (isWaitingForMouseDown) {
            mouseDownDelayCounter++;
            if (mouseDownDelayCounter >= MOUSE_DOWN_DELAY_FRAMES) {
                isWaitingForMouseDown = false;
            }
        }
        // 常にnextFrame()を呼ぶ（待機中かどうかの判定はnextFrame()内で行う）
        nextFrame();
    }
}