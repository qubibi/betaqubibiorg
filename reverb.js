let convolver = null;
let reverbWet = null;
let reverbDry = null;

function createReverbIR() {
    const length = audioContext.sampleRate * 0.88; // 0.88秒のリバーブ
    const impulse = audioContext.createBuffer(1, length, audioContext.sampleRate);
    
    const channelData = impulse.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 0.5);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.1 * Math.exp(-i / length * 3);
    }
    
    convolver.buffer = impulse;
    console.log('Reverb IR created');
}

function createReverb() {
    convolver = audioContext.createConvolver();
    reverbWet = audioContext.createGain();
    reverbDry = audioContext.createGain();
    
    reverbWet.gain.setValueAtTime(0.1, audioContext.currentTime);  // 10%ウェット
    reverbDry.gain.setValueAtTime(0.9, audioContext.currentTime);  // 90%ドライ
    
    return {
        input: function(source) {
            source.connect(reverbDry);
            source.connect(convolver);
            convolver.connect(reverbWet);
        },
        output: function(destination) {
            reverbDry.connect(destination);
            reverbWet.connect(destination);
        }
    };
}