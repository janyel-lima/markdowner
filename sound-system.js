/* ═══════════════════════════════════════════════════════
   16.5 SOUND SYSTEM (Web Audio API)
═══════════════════════════════════════════════════════ */

let _audioCtx = null;
let soundEnabled = true;
let _prevPeerCount = 0;

function getAudioCtx() {
    if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
}

function playTone({
    freq = 660,
    freq2 = null,
    type = 'sine',
    gain = 0.14,
    attack = 0.006,
    duration = 0.20,
} = {}) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();

        osc.connect(amp);
        amp.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (freq2 !== null) {
            osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + duration * 0.55);
        }

        amp.gain.setValueAtTime(0, ctx.currentTime);
        amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
        amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.05);
    } catch { /* noop */ }
}

/** Soft ding — mensagem recebida no canal de sessão */
function soundMessageReceived() {
    playTone({ freq: 880, gain: 0.11, duration: 0.22 });
}

/** Dois pings ascendentes — DM recebida */
function soundDmReceived() {
    playTone({ freq: 1047, gain: 0.13, duration: 0.14 });
    setTimeout(() => playTone({ freq: 1319, gain: 0.11, duration: 0.18 }), 115);
}

/** Dois tons ascendentes suaves — participante entrou */
function soundUserJoined() {
    playTone({ freq: 528, gain: 0.09, duration: 0.16 });
    setTimeout(() => playTone({ freq: 660, gain: 0.08, duration: 0.20 }), 130);
}

/** Click sutil — mensagem enviada */
function soundMessageSent() {
    playTone({ freq: 700, type: 'sine', gain: 0.06, duration: 0.09 });
}

/** Toggle mute */
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = $('sound-btn');
    btn.title = soundEnabled ? 'Silenciar sons' : 'Ativar sons';
    btn.classList.toggle('muted', !soundEnabled);
    showToast(soundEnabled ? '🔔 Sons ativados' : '🔕 Sons silenciados');
}

window.toggleSound = toggleSound;