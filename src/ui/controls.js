import * as THREE from 'three';
import { TOUR_STEPS } from './guidedTour.js';

/**
 * UI Controls and Interaction Handler
 * Binds UI inputs to the 3D model, wave simulation, audio generator, and annotations.
 */
export class UIController {
  constructor({ earModel, waveSim, soundGen, annotManager }) {
    this.earModel = earModel;
    this.waveSim = waveSim;
    this.soundGen = soundGen;
    this.annotManager = annotManager;

    this.tourActive = false;
    this.currentTourStep = 0;

    // Cache DOM Elements
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.playPauseIcon = document.getElementById('play-pause-icon');
    this.playPauseText = document.getElementById('play-pause-text');
    this.sliderSpeed = document.getElementById('slider-speed');
    this.speedBadge = document.getElementById('speed-badge');

    this.sliderFreq = document.getElementById('slider-freq');
    this.freqBadge = document.getElementById('freq-badge');
    this.freqPills = document.querySelectorAll('.pill-btn');

    this.btnToggleAudio = document.getElementById('btn-toggle-audio');
    this.audioBtnLabel = document.getElementById('audio-btn-label');
    this.audioStatusBadge = document.getElementById('audio-status-badge');
    this.sliderVolume = document.getElementById('slider-volume');

    this.sliderExploded = document.getElementById('slider-exploded');
    this.explodedBadge = document.getElementById('exploded-badge');
    this.sliderOpacity = document.getElementById('slider-opacity');
    this.opacityBadge = document.getElementById('opacity-badge');

    this.toggleWaves = document.getElementById('toggle-waves');
    this.toggleNerves = document.getElementById('toggle-nerves');
    this.togglePins = document.getElementById('toggle-pins');

    this.btnResetCam = document.getElementById('btn-reset-cam');
    this.regionTabs = document.querySelectorAll('.nav-tab-btn');

    this.btnStartTour = document.getElementById('btn-start-tour');
    this.tourHud = document.getElementById('tour-hud');
    this.btnExitTour = document.getElementById('btn-exit-tour');
    this.btnTourNext = document.getElementById('btn-tour-next');
    this.btnTourPrev = document.getElementById('btn-tour-prev');
    this.tourStepBadge = document.getElementById('tour-step-badge');
    this.tourRegionBadge = document.getElementById('tour-region-badge');
    this.tourTitle = document.getElementById('tour-title');
    this.tourDesc = document.getElementById('tour-desc');
    this.tourMechanics = document.getElementById('tour-mechanics');
    this.tourCounter = document.getElementById('tour-step-counter');

    this.inspectorCard = document.getElementById('inspector-card');
    this.inspName = document.getElementById('insp-name');
    this.inspLatin = document.getElementById('insp-latin');
    this.inspRegion = document.getElementById('insp-region');
    this.inspSummary = document.getElementById('insp-summary');
    this.inspAcoustics = document.getElementById('insp-acoustics');
    this.btnCloseInspector = document.getElementById('btn-close-inspector');

    // Oscilloscope canvas
    this.oscCanvas = document.getElementById('oscilloscope-canvas');
    if (this.oscCanvas) {
      this.oscCtx = this.oscCanvas.getContext('2d');
      this.waveformBuffer = new Uint8Array(256);
    }

    this.bindEvents();
    this.startOscilloscope();
  }

  bindEvents() {
    // 1. Play / Pause
    this.btnPlayPause.addEventListener('click', () => {
      const isPlaying = this.waveSim.togglePlay();
      this.playPauseIcon.textContent = isPlaying ? '⏸' : '▶';
      this.playPauseText.textContent = isPlaying ? 'Pause' : 'Play';
      this.btnPlayPause.classList.toggle('primary', isPlaying);
    });

    // 2. Simulation Speed Slider
    this.sliderSpeed.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.waveSim.setSpeed(val);
      this.speedBadge.textContent = `${val.toFixed(1)}x`;
    });

    // 3. Frequency Slider & Preset Pills
    this.sliderFreq.addEventListener('input', (e) => {
      const freq = parseInt(e.target.value, 10);
      this.updateFrequency(freq);
    });

    this.freqPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const freq = parseInt(pill.dataset.freq, 10);
        this.sliderFreq.value = freq;
        this.updateFrequency(freq);
      });
    });

    // 4. Web Audio Toggle & Volume
    this.btnToggleAudio.addEventListener('click', () => {
      const isAudioActive = this.soundGen.toggleMute();
      this.audioStatusBadge.textContent = isAudioActive ? 'Playing' : 'Muted';
      this.audioStatusBadge.style.color = isAudioActive ? 'var(--accent-cyan)' : 'var(--text-muted)';
      this.audioBtnLabel.textContent = isAudioActive ? 'Mute Tone' : 'Unmute Tone';
      this.btnToggleAudio.classList.toggle('primary', isAudioActive);
    });

    this.sliderVolume.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      this.soundGen.setVolume(vol);
      this.waveSim.setAmplitude(vol * 5.0 + 0.5);
    });

    // 5. Exploded View Slider
    this.sliderExploded.addEventListener('input', (e) => {
      const factor = parseFloat(e.target.value);
      this.earModel.setExplodedView(factor);
      this.explodedBadge.textContent = `${Math.round(factor * 100)}%`;
    });

    // 6. X-Ray / Translucency Slider
    this.sliderOpacity.addEventListener('input', (e) => {
      const op = parseFloat(e.target.value);
      this.earModel.setBoneTranslucency(op);
      this.opacityBadge.textContent = `${Math.round(op * 100)}%`;
    });

    // 7. Visual Layer Toggles
    this.toggleWaves.addEventListener('change', (e) => {
      this.waveSim.toggleWavefronts(e.target.checked);
    });

    this.toggleNerves.addEventListener('change', (e) => {
      this.waveSim.toggleNervePulses(e.target.checked);
    });

    this.togglePins.addEventListener('change', (e) => {
      this.annotManager.setPinsVisible(e.target.checked);
    });

    // 8. Reset View
    this.btnResetCam.addEventListener('click', () => {
      this.resetCameraToDefault();
    });

    // 9. Region Quick Jump Tabs
    this.regionTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.regionTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.switchRegionView(tab.dataset.region);
      });
    });

    // 10. Guided Tour Controls
    this.btnStartTour.addEventListener('click', () => {
      this.startGuidedTour();
    });

    this.btnExitTour.addEventListener('click', () => {
      this.exitGuidedTour();
    });

    this.btnTourNext.addEventListener('click', () => {
      this.nextTourStep();
    });

    this.btnTourPrev.addEventListener('click', () => {
      this.prevTourStep();
    });

    // 11. Anatomical Inspector Close Button
    this.btnCloseInspector.addEventListener('click', () => {
      this.hideInspector();
    });
  }

  updateFrequency(freq) {
    this.waveSim.setFrequency(freq);
    this.soundGen.setFrequency(freq);
    this.freqBadge.textContent = `${freq.toLocaleString()} Hz`;

    // Highlight matching preset button if exact match
    this.freqPills.forEach((p) => {
      if (parseInt(p.dataset.freq, 10) === freq) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  resetCameraToDefault() {
    this.annotManager.flyTo(
      new THREE.Vector3(2.5, 3.5, 9.5),
      new THREE.Vector3(-4.0, 0.0, -0.3),
      1.2
    );
  }

  switchRegionView(region) {
    if (this.tourActive) this.exitGuidedTour();

    switch (region) {
      case 'external':
        this.annotManager.flyTo(
          new THREE.Vector3(5.8, 0.4, 2.5),
          new THREE.Vector3(-0.4, 0.2, 0.15),
          1.2
        );
        break;
      case 'middle':
        this.annotManager.flyTo(
          new THREE.Vector3(-3.4, 0.6, 2.6),
          new THREE.Vector3(-5.5, 0.0, -0.35),
          1.2
        );
        break;
      case 'inner':
        this.annotManager.flyTo(
          new THREE.Vector3(-5.4, 0.8, 3.2),
          new THREE.Vector3(-7.4, -0.5, -0.4),
          1.2
        );
        break;
      case 'all':
      default:
        this.resetCameraToDefault();
        break;
    }
  }

  // ==========================================
  // GUIDED TOUR
  // ==========================================
  startGuidedTour() {
    this.tourActive = true;
    this.currentTourStep = 0;
    this.tourHud.classList.remove('hidden');
    this.hideInspector();
    this.renderTourStep();
  }

  exitGuidedTour() {
    this.tourActive = false;
    this.tourHud.classList.add('hidden');
    this.resetCameraToDefault();
  }

  renderTourStep() {
    const step = TOUR_STEPS[this.currentTourStep];
    this.tourStepBadge.textContent = `Stage ${step.stepNumber} of 4`;
    this.tourRegionBadge.textContent = step.badge;
    this.tourTitle.textContent = step.title;
    this.tourDesc.innerHTML = step.description;
    this.tourMechanics.innerHTML = `<strong>Acoustic Mechanism:</strong> ${step.mechanics}`;
    this.tourCounter.textContent = `Step ${this.currentTourStep + 1} of 4`;

    this.btnTourPrev.disabled = this.currentTourStep === 0;
    this.btnTourPrev.style.opacity = this.currentTourStep === 0 ? '0.4' : '1.0';
    this.btnTourNext.textContent =
      this.currentTourStep === TOUR_STEPS.length - 1 ? 'Finish Tour ✓' : 'Next Stage →';

    // Fly camera to step vantage
    this.annotManager.flyTo(step.cameraPos, step.targetPos, 1.4);

    // Set matching frequency
    this.sliderFreq.value = step.frequency;
    this.updateFrequency(step.frequency);

    // Highlight corresponding pin
    if (step.landmarkId) {
      this.annotManager.highlightPin(step.landmarkId);
    }
  }

  nextTourStep() {
    if (this.currentTourStep < TOUR_STEPS.length - 1) {
      this.currentTourStep++;
      this.renderTourStep();
    } else {
      this.exitGuidedTour();
    }
  }

  prevTourStep() {
    if (this.currentTourStep > 0) {
      this.currentTourStep--;
      this.renderTourStep();
    }
  }

  // ==========================================
  // ANATOMICAL INSPECTION
  // ==========================================
  showInspector(landmark) {
    if (this.tourActive) return; // Prioritize tour HUD if active

    this.inspName.textContent = landmark.name;
    this.inspLatin.textContent = `(${landmark.latin})`;
    this.inspRegion.textContent = landmark.region;
    this.inspSummary.textContent = landmark.summary;
    this.inspAcoustics.innerHTML = `<strong>Sound Transmission Role:</strong> ${landmark.acoustics}`;

    this.inspectorCard.classList.remove('hidden');
  }

  hideInspector() {
    this.inspectorCard.classList.add('hidden');
  }

  // ==========================================
  // LIVE OSCILLOSCOPE RENDERER
  // ==========================================
  startOscilloscope() {
    const draw = () => {
      requestAnimationFrame(draw);
      if (!this.oscCtx) return;

      const width = this.oscCanvas.width;
      const height = this.oscCanvas.height;

      this.oscCtx.fillStyle = '#04060a';
      this.oscCtx.fillRect(0, 0, width, height);

      // Subtle background grid lines
      this.oscCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      this.oscCtx.lineWidth = 1;
      this.oscCtx.beginPath();
      this.oscCtx.moveTo(0, height / 2);
      this.oscCtx.lineTo(width, height / 2);
      this.oscCtx.stroke();

      const hasAudio = this.soundGen.getWaveformData(this.waveformBuffer);

      this.oscCtx.lineWidth = 2;
      this.oscCtx.strokeStyle = '#00f7ff';
      this.oscCtx.shadowColor = '#00f7ff';
      this.oscCtx.shadowBlur = 8;
      this.oscCtx.beginPath();

      if (hasAudio) {
        const sliceWidth = width / this.waveformBuffer.length;
        let x = 0;
        for (let i = 0; i < this.waveformBuffer.length; i++) {
          const v = this.waveformBuffer[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) {
            this.oscCtx.moveTo(x, y);
          } else {
            this.oscCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
      } else {
        // Synthetic wave display when muted based on current simulated frequency & play state
        const numPoints = 120;
        const sliceWidth = width / numPoints;
        const time = performance.now() * 0.005;
        const freqCycles = Math.min(12, Math.max(2, Math.log10(this.waveSim.frequency) * 3));

        for (let i = 0; i < numPoints; i++) {
          const u = i / numPoints;
          const isPlaying = this.waveSim.isPlaying ? 1 : 0;
          const osc = Math.sin(u * Math.PI * 2 * freqCycles - time * isPlaying);
          const y = height / 2 + osc * 18 * this.waveSim.amplitude;
          const x = i * sliceWidth;

          if (i === 0) {
            this.oscCtx.moveTo(x, y);
          } else {
            this.oscCtx.lineTo(x, y);
          }
        }
      }

      this.oscCtx.stroke();
      this.oscCtx.shadowBlur = 0; // reset
    };

    draw();
  }
}
