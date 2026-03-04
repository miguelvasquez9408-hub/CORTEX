export class SoundManager {
    private static instance: SoundManager;
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = false;

    private constructor() {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default volume
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.error("AudioContext not supported", e);
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private resumeContext() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playHover() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.resumeContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    public playClick() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.resumeContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    public playSuccess() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.resumeContext();

        // Arpeggio
        const notes = [440, 554, 659, 880];
        const now = this.ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    public playScan() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.resumeContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.value = 20;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(gain);
        gain.connect(this.masterGain);

        lfo.start();
        osc.start();
        lfo.stop(this.ctx.currentTime + 0.5);
        osc.stop(this.ctx.currentTime + 0.5);
    }
}
