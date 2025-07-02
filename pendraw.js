// =============================================
// Pen Drawing Animation for Home Page
// =============================================

(function() {
    
    // すべてのページで実行
    

    // キャンバス作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // キャンバスの初期設定
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // クリックイベントを透過
    canvas.style.zIndex = '9999'; // 最前面に表示
    canvas.style.imageRendering = 'pixelated'; // アンチエイリアスを無効化
    
    // コンテキストの設定
    ctx.imageSmoothingEnabled = false;
    
    // 初期高さを計算
    function calculateCanvasHeight() {
        const pageHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );
        const maxHeight = window.innerHeight * 5;
        return Math.min(pageHeight, maxHeight);
    }
    
    let fixedHeight = calculateCanvasHeight();
    
    // 解像度設定
    function resizeCanvas() {
        // 描画内容を保存
        let imageData = null;
        if (canvas.width > 0 && canvas.height > 0) {
            try {
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } catch (e) {
                console.warn('Failed to get image data:', e);
            }
        }
        
        canvas.width = window.innerWidth;
        canvas.height = fixedHeight; // 固定高さを使用
        
        // CSSサイズも同期
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
        
        // 描画を復元
        if (imageData) {
            ctx.putImageData(imageData, 0, 0);
        }
        
        // コンテキストの設定を再適用
        ctx.imageSmoothingEnabled = false;
    }
    
    // ドットの位置（画面中央の真上からスタート）
    let dotY = 0;
    let dotX = 0;
    
    // 進行方向（角度）
    let angle = Math.PI / 2; // 初期値（後で上書きされる）
    let hasikkoangle = 0.04+Math.random()*0.08
    // 境界判定用のマージン（端に来た時に更新）
    let margin = 20 + Math.random() * 110;
    
    // 境界処理済みフラグ
    let boundaryProcessed = false;
    
    
    // 角度設定変数
    let is_angleset = true;
    let angleset = 0;
    let anglesetmag = Math.random() < 0.55 ? 0.52 : 0.1; // 66%の確率で0.5、34%の確率で0.1
    
    // 描画変数
    
    // ピンチズーム状態の管理
    let isPinching = false;
    let animationId = null;
    
    // 角度正規化関数
    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }
    
    // マージン更新関数
    function updateMargin() {
        if (!boundaryProcessed) {
            margin = 20 + Math.random() * 110;
            boundaryProcessed = true;
        }
    }
    
    // アニメーションループ（60fps）
    function animate() {
        // 線の性格変更
        // if (linePersonality && Math.random() < 0.0005) {
        //     linePersonality = false; // A → B
        // } else if (!linePersonality && Math.random() < 0.01) {
        
        //     linePersonality = true; // B → A
        // }
        
        // ランダムな方向変更（性格に応じて）
        if (Math.random() < 0.43) {
            if (Math.random()<0.005) anglesetmag = 0.52
            // if (linePersonality) {
                if (is_angleset) angleset = (Math.random() - 0.5) * anglesetmag;
                if (is_angleset && Math.random()<0.0006){
                    is_angleset = false
                } else if (!is_angleset && Math.random()<0.02){
                    is_angleset = true
                }
                angle += angleset;
            // } else {
            //     angle += (Math.random() - 0.5) * 0.1;
            // }
        }
        
        // 角度に基づいて移動
        dotX += Math.cos(angle) * 1;
        dotY += Math.sin(angle) * 1;
        
        // 境界判定
        const isAtBoundary = (dotY > canvas.height - margin) || 
                            (dotX < margin) || 
                            (dotX > canvas.width - margin) || 
                            (dotY < margin);
        
        // 境界から離れたらフラグをリセット
        if (!isAtBoundary && boundaryProcessed) {
            boundaryProcessed = false;
        }
        
        // 境界での方向転換
        if (dotY > canvas.height - margin) {
            // 下端にいる場合
            if (dotX < margin || dotX > canvas.width - margin) {
                // 左下隅または右下隅：真上のランダム位置からリスタート
                dotY = 0;
                dotX = canvas.width * (0.2 + Math.random() * 0.6);
                angle = Math.PI / 2 + (Math.random() - 0.5) * (77 * Math.PI / 180) * 2;
                updateMargin();
            } else {
                // 下端中央：真上へ柔らかく誘導
                angle += (-Math.PI / 2 - angle) * 0.3;
                updateMargin();
            }
        } else if (dotX < margin) {
            // 左端（下端でない）：右方向へ柔らかく誘導
            angle += (0 - angle) * hasikkoangle;
            updateMargin();
        } else if (dotX > canvas.width - margin) {
            // 右端（下端でない）：左方向へ柔らかく誘導
            angle += (Math.PI - angle) * hasikkoangle;
            updateMargin();
        } else if (dotY < margin) {
            // 上端：下方向へ柔らかく誘導
            angle += (Math.PI / 2 - angle) * 0.1;
            updateMargin();
        }
        if (Math.random()<0.001) hasikkoangle = 0.04+Math.random()*0.08
        // 境界を超えた場合の強制修正
        if (dotX < 0) dotX = 0;
        if (dotX > canvas.width) dotX = canvas.width;
        if (dotY < 0) dotY = 0;
        if (dotY > canvas.height) dotY = canvas.height;
        
        // 描画
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(dotX), Math.round(dotY), 1, 1);
        
        // 次フレーム
        animationId = requestAnimationFrame(animate);
    }
    
    // スクロール対応を削除
    
    // 初期化
    function init() {
        console.log('Initializing pendraw');
        resizeCanvas();
        // 初期X位置を画面の1/4から3/4の範囲でランダムに設定
        dotX = canvas.width * (0.2 + Math.random() * 0.6);
        // 初期角度をランダムに設定（下向き中心に±77度の範囲）
        angle = Math.PI / 2 + (Math.random() - 0.5) * (77 * Math.PI / 180) * 2;
        document.body.appendChild(canvas);
        console.log('Canvas added to body', canvas.width, canvas.height);
        
        // リサイズ対応（実際にサイズが変わった時のみ）
        let previousWidth = window.innerWidth;
        let previousHeight = window.innerHeight;
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            // デバウンス処理
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const widthChanged = window.innerWidth !== previousWidth;
                const heightChanged = window.innerHeight !== previousHeight;
                
                // モバイルでの高さだけの変更（URLバー）は無視
                const isMobile = window.innerWidth <= 768;
                const isOnlyHeightChange = heightChanged && !widthChanged;
                
                if (isMobile && isOnlyHeightChange) {
                    // モバイルで高さだけが変わった場合は何もしない
                    previousHeight = window.innerHeight; // 高さは更新しておく
                    return;
                }
                
                // ピンチ中はリサイズをスキップ
                if (isPinching) {
                    console.log('Skipping resize during pinch');
                    // サイズは更新しておく（ピンチ終了後の判定用）
                    previousWidth = window.innerWidth;
                    previousHeight = window.innerHeight;
                    return;
                }
                
                // 実際のリサイズ処理
                if (widthChanged || heightChanged) {
                    previousWidth = window.innerWidth;
                    previousHeight = window.innerHeight;
                    
                    // 高さを再計算
                    fixedHeight = calculateCanvasHeight();
                    canvas.style.height = fixedHeight + 'px';
                    
                    resizeCanvas();
                    
                    // リサイズ時も位置は保持（描画も保持しているため）
                    // dotY, dotX, angleはそのまま維持
                }
            }, 100); // 100ms待機
        });
        
        // スクロールイベントは削除
        
        // Visual Viewport APIでピンチズームを検出（モバイルのみ）
        if ('visualViewport' in window && window.innerWidth <= 768) {
            // ピンチ状態を管理する関数
            const updatePinchState = () => {
                const scale = window.visualViewport.scale;
                isPinching = (scale !== 1);
            };
            
            window.visualViewport.addEventListener('resize', updatePinchState);
            window.visualViewport.addEventListener('scroll', updatePinchState);
            
            // 初回チェック
            if (window.visualViewport.scale !== 1) {
                isPinching = true;
            }
        }
        
        // アニメーション開始
        console.log('Starting animation');
        animationId = requestAnimationFrame(animate);
    }
    
    // DOMロード後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();