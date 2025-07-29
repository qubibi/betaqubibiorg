let audioContext;
let noiseBuffer = null;
let noiseSource = null;
let masterBus = null;
let compressor = null;
let snapBuffer = null;
let noiseGainNode = null;
let reverb = null;

const MASTER_VOLUME = 2.5; // 0.0〜5.0くらいが適切

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createMasterBus();
        createNoiseBuffer();
        loadSnapSound();
        startBackgroundNoise();
        console.log('Audio context initialized');
    } catch (error) {
        console.error('Audio initialization failed:', error);
    }
}

// リバーブ+コンプレッサー付きマスターバス
function createMasterBus() {
    masterBus = audioContext.createGain();
    masterBus.gain.setValueAtTime(MASTER_VOLUME, audioContext.currentTime);
    
    reverb = createReverb();
    createReverbIR();
    
    compressor = audioContext.createDynamicsCompressor();
    
    // コンプレッサー設定 (強めにかける)
    compressor.threshold.setValueAtTime(-29, audioContext.currentTime);
    compressor.knee.setValueAtTime(1, audioContext.currentTime);
    compressor.ratio.setValueAtTime(13, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.0007, audioContext.currentTime);
    compressor.release.setValueAtTime(0.4, audioContext.currentTime);
    
    // masterBus → reverb → compressor → destination
    reverb.input(masterBus);
    reverb.output(compressor);
    compressor.connect(audioContext.destination);
}


// ノイズバッファを作成
function createNoiseBuffer() {
    const bufferSize = audioContext.sampleRate * 3;
    noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = ((Math.random()) * 2 - 1) * 0.15;
    }
}

function startBackgroundNoise() {
    if (!audioContext || !noiseBuffer) return;
    
    noiseSource = audioContext.createBufferSource();
    noiseGainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseGainNode.gain.setValueAtTime(0.024, audioContext.currentTime);
    
    // 柔らかいホワイトノイズにするためのローパス
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, audioContext.currentTime);
    filter.Q.setValueAtTime(0.15, audioContext.currentTime);
    
    noiseSource.connect(filter);
    filter.connect(noiseGainNode);
    noiseGainNode.connect(masterBus);
    noiseSource.start();
}

async function loadSnapSound() {
    try {
        const response = await fetch('./assets/snap.mp3');
        const arrayBuffer = await response.arrayBuffer();
        snapBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Snap sound loaded');
    } catch (error) {
        console.error('Failed to load snap sound:', error);
    }
}

function playSnapSound() {
    if (!audioContext || !snapBuffer) return;
    
    // AudioContextが停止状態なら先に再開
    if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') {
        audioContext.resume().then(() => {
            playSnapSoundInternal();
        }).catch((error) => {
            console.error('Resume failed in playSnapSound:', error);
        });
        return;
    }
    
    if (audioContext.state !== 'running') return;
    
    playSnapSoundInternal();
}

function playSnapSoundInternal() {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = snapBuffer;
    source.playbackRate.value = rndm(0.95,1.05); // 微妙に音程を変える
    gainNode.gain.setValueAtTime(rndm(0.0,0.33), audioContext.currentTime);
    
    // クリック時にノイズ音量もランダム変更
    if (noiseGainNode) {
        const newNoiseVolume = rndm(0.0, 1.0) * 0.024;
        noiseGainNode.gain.setValueAtTime(newNoiseVolume, audioContext.currentTime);
    }
    
    source.connect(gainNode);
    gainNode.connect(masterBus);
    source.start();
}


// 初回・アプリ復帰時の音声システム初期化
function initializeAudioSystem() {
    if (!audioContext) {
        initAudio();
    } else if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') {
        audioContext.resume().then(() => {
            // ノイズを再開 (アプリ復帰時に停止している可能性)
            if (noiseSource) {
                noiseSource.stop();
                noiseSource = null;
            }
            startBackgroundNoise();
        }).catch((error) => {
            console.error('Resume failed:', error);
        });
    } else {
        if (!noiseSource) {
            startBackgroundNoise();
        }
    }
}