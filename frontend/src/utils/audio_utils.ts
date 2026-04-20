/**
 * CallAudioEngine
 * Synthesizes clean dial tones and ringtones using the Web Audio API.
 * This avoids the need for external assets and prevents unwanted "vibration" sounds
 * from low-quality MP3 files.
 */
class CallAudioEngine {
    private ctx: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private timer: any = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    /**
     * Plays a standard dial tone (Ringback) - 425Hz
     * Pattern: 1 second on, 4 seconds off
     */
    public playDialtone() {
        this.stopAll();
        this.init();
        if (!this.ctx) return;

        const play = () => {
            if (!this.ctx) return;
            this.oscillator = this.ctx.createOscillator();
            this.gainNode = this.ctx.createGain();

            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(425, this.ctx.currentTime);

            this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1); // Fade in

            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);

            this.oscillator.start();

            // Beep duration: 1 second
            this.timer = setTimeout(() => {
                this.stopCurrentOsc();
                // Pause duration: 4 seconds
                this.timer = setTimeout(play, 3000);
            }, 1000);
        };

        play();
    }

    /**
     * Plays an incoming ringtone pattern - 425Hz + 600Hz
     * Pattern: 1 second on, 1 second off
     */
    public playRingtone() {
        this.stopAll();
        this.init();
        if (!this.ctx) return;

        const play = () => {
            if (!this.ctx) return;
            this.oscillator = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            this.gainNode = this.ctx.createGain();

            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(425, this.ctx.currentTime);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(600, this.ctx.currentTime);

            this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);

            this.oscillator.connect(this.gainNode);
            osc2.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);

            this.oscillator.start();
            osc2.start();

            this.timer = setTimeout(() => {
                this.stopCurrentOsc();
                if (osc2) { try { osc2.stop(); } catch(e) {} }
                this.timer = setTimeout(play, 1000);
            }, 1000);
        };

        play();
    }

    private stopCurrentOsc() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
            } catch(e) {}
            this.oscillator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }

    public stopAll() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.stopCurrentOsc();
    }
}

export const callAudio = new CallAudioEngine();
