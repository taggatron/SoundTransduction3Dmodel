/**
 * Web Audio API Acoustic Tone Generator & Oscilloscope Analyzer
 * Synthesizes pure/harmonic tones linked in real time to the 3D ear wave simulation.
 */
export class SoundGenerator {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.analyser = null;

    this.frequency = 1000;
    this.volume = 0.15; // Safe default volume
    this.isAudioEnabled = false;
    this.isMuted = true;
  }

  initAudio() {
    if (this.audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    // Gain node (master volume)
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);

    // Analyser node for oscilloscope UI visualizer
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;

    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // Start oscillator
    this.startOscillator();
    this.isAudioEnabled = true;
  }

  startOscillator() {
    if (!this.audioCtx) return;
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // ignore
      }
    }

    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);

    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
  }

  setFrequency(freq) {
    this.frequency = freq;
    if (this.oscillator && this.audioCtx) {
      this.oscillator.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.05);
    }
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.gainNode && this.audioCtx && !this.isMuted) {
      this.gainNode.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (!this.audioCtx) {
      this.initAudio();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.gainNode && this.audioCtx) {
      const targetGain = this.isMuted ? 0.0 : this.volume;
      this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    }
    return !this.isMuted; // returns audio active state
  }

  getWaveformData(outputArray) {
    if (this.analyser && !this.isMuted) {
      this.analyser.getByteTimeDomainData(outputArray);
      return true;
    }
    return false;
  }
}
