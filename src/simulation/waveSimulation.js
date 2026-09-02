import * as THREE from 'three';

/**
 * Sound Wave Transmission & Physiological Simulation Engine
 * Simulates:
 * 1. Air Conduction: Traveling acoustic pressure waves through the ear canal
 * 2. Mechanical Impedance Matching: Tympanic membrane vibration and ossicular chain kinematics
 * 3. Hydraulic Traveling Wave: Tonotopic cochlear perilymph wave (von Békésy's principle)
 * 4. Neural Transduction: Action potential impulses traveling down Cranial Nerve VIII
 */
export class WaveSimulation {
  constructor(scene, earModel) {
    this.scene = scene;
    this.earModel = earModel;

    // Simulation Parameters
    this.frequency = 1000; // Hz
    this.amplitude = 1.0;  // 0.0 to 2.0
    this.speed = 0.5;      // Animation time scale
    this.isPlaying = true;
    this.showWaves = true;
    this.showNervePulses = true;
    this.time = 0;

    // Base transform caches for mechanical parts
    this.cacheBaseTransforms();

    // 1. Acoustic Wavefronts in Ear Canal
    this.wavefrontsGroup = new THREE.Group();
    this.wavefrontsGroup.name = 'Canal_Acoustic_Wavefronts';
    this.earModel.externalEarGroup.add(this.wavefrontsGroup);
    this.initAcousticWavefronts();

    // 2. Cochlear Fluid Traveling Wave Particles
    this.fluidWaveGroup = new THREE.Group();
    this.fluidWaveGroup.name = 'Cochlear_Fluid_Waves';
    this.earModel.innerEarGroup.add(this.fluidWaveGroup);
    this.initFluidTravelingWaves();

    // 3. Neural Action Potential Particles (CN VIII)
    this.neuralPulsesGroup = new THREE.Group();
    this.neuralPulsesGroup.name = 'Neural_Action_Potentials';
    this.earModel.innerEarGroup.add(this.neuralPulsesGroup);
    this.initNeuralPulses();
  }

  cacheBaseTransforms() {
    this.baseTympPos = this.earModel.tympanicMembrane.position.clone();
    this.baseMalleusRot = this.earModel.malleusGroup.rotation.clone();
    this.baseIncusRot = this.earModel.incusGroup.rotation.clone();
    this.baseStapesPos = this.earModel.stapesGroup.position.clone();
    this.baseRoundWinPos = this.earModel.roundWindow.position.clone();
  }

  // ==========================================
  // 1. ACOUSTIC PRESSURE WAVEFRONTS (CANAL)
  // ==========================================
  initAcousticWavefronts() {
    this.numWavefronts = 18;
    this.wavefrontRings = [];

    const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < this.numWavefronts; i++) {
      const ring = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
      ring.visible = this.showWaves;
      this.wavefrontsGroup.add(ring);
      this.wavefrontRings.push({
        mesh: ring,
        progress: i / this.numWavefronts,
      });
    }

    // Additional acoustic wave entering pinna (spherical pressure arcs)
    this.pinnaWaveArcs = [];
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const arcGeo = new THREE.RingGeometry(0.6 + i * 0.4, 0.7 + i * 0.4, 32, 1, -Math.PI / 3, Math.PI * 0.66);
      arcGeo.rotateY(Math.PI / 2);
      const arcMesh = new THREE.Mesh(arcGeo, arcMat.clone());
      arcMesh.position.set(1.6 + i * 0.6, 0.2, 0.3);
      this.wavefrontsGroup.add(arcMesh);
      this.pinnaWaveArcs.push(arcMesh);
    }
  }

  // ==========================================
  // 2. COCHLEAR FLUID TRAVELING WAVES
  // ==========================================
  initFluidTravelingWaves() {
    this.numFluidParticles = 70;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numFluidParticles * 3);
    const colors = new Float32Array(this.numFluidParticles * 3);

    for (let i = 0; i < this.numFluidParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Cyan to purple gradient
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1.0;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.fluidPoints = new THREE.Points(pGeo, pMat);
    if (this.earModel.cochleaGroupRef) {
      this.earModel.cochleaGroupRef.add(this.fluidPoints);
    }
  }

  // ==========================================
  // 3. NEURAL ACTION POTENTIAL PULSES
  // ==========================================
  initNeuralPulses() {
    this.numNervePulses = 45;
    const npGeo = new THREE.BufferGeometry();
    const npPositions = new Float32Array(this.numNervePulses * 3);
    const npColors = new Float32Array(this.numNervePulses * 3);

    for (let i = 0; i < this.numNervePulses; i++) {
      npPositions[i * 3] = 0;
      npPositions[i * 3 + 1] = 0;
      npPositions[i * 3 + 2] = 0;

      // Bright golden electrical glow
      npColors[i * 3] = 1.0;
      npColors[i * 3 + 1] = 0.9;
      npColors[i * 3 + 2] = 0.2;
    }

    npGeo.setAttribute('position', new THREE.BufferAttribute(npPositions, 3));
    npGeo.setAttribute('color', new THREE.BufferAttribute(npColors, 3));

    const npMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    this.nervePulses = new THREE.Points(npGeo, npMat);
    if (this.earModel.nerveGroup) {
      this.earModel.nerveGroup.add(this.nervePulses);
    }
  }

  /**
   * Greenwood function mapping frequency (Hz) to cochlear resonant position (0.0 = base, 1.0 = apex)
   * High freq -> base; Low freq -> apex
   */
  getTonotopicPosition(freq) {
    // Human cochlea frequency range ~20 Hz to 20,000 Hz
    const fClamped = Math.max(100, Math.min(10000, freq));
    // Logarithmic distribution: 10,000 Hz ~ 0.05 (base), 1000 Hz ~ 0.55, 100 Hz ~ 0.95 (apex)
    const logMin = Math.log10(100);
    const logMax = Math.log10(10000);
    const logVal = Math.log10(fClamped);
    const normalized = (logMax - logVal) / (logMax - logMin);
    return Math.max(0.08, Math.min(0.92, normalized));
  }

  // ==========================================
  // MAIN UPDATE LOOP
  // ==========================================
  update(delta) {
    if (!this.isPlaying) return;

    // Visual wave frequency cycle
    const visualFreq = Math.log10(this.frequency) * 2.2;
    this.time += delta * this.speed * visualFreq;
    const phase = this.time * Math.PI * 2;

    // 1. Animate Acoustic Air Wavefronts in Ear Canal
    if (this.showWaves && this.earModel.canalPath) {
      this.wavefrontsGroup.visible = true;
      const path = this.earModel.canalPath;

      this.wavefrontRings.forEach((wf, index) => {
        // Move progress along canal path
        const speedFactor = 0.45;
        const prog = (wf.progress + this.time * speedFactor) % 1.0;
        const pt = path.getPointAt(prog);
        const tangent = path.getTangentAt(prog);

        wf.mesh.position.copy(pt);
        wf.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

        // Wave compression density & opacity modulation
        const waveOsc = Math.sin(prog * 12.0 - phase);
        const opacity = (0.3 + 0.6 * (0.5 + 0.5 * waveOsc)) * (1.0 - prog * 0.2);
        wf.mesh.material.opacity = opacity;

        // Radius taper matching canal
        const scale = 0.8 + 0.2 * Math.sin(prog * Math.PI);
        wf.mesh.scale.set(scale, scale, scale);
      });

      // Pinna incoming wavefront pulsation
      this.pinnaWaveArcs.forEach((arc, i) => {
        const pulse = Math.sin(phase - i * 0.8);
        arc.material.opacity = Math.max(0.1, 0.7 * (0.5 + 0.5 * pulse));
        arc.scale.setScalar(1.0 + 0.05 * pulse);
      });
    } else {
      this.wavefrontsGroup.visible = false;
    }

    // 2. Animate Middle Ear Mechanical Impedance Matching Kinematics
    const mechAmp = this.amplitude * 0.08;
    const osc = Math.sin(phase);

    // Tympanic membrane vibration
    this.earModel.tympanicMembrane.position.x = this.baseTympPos.x + osc * mechAmp * 0.7;

    // Malleus rocking motion around ligament axis
    this.earModel.malleusGroup.rotation.z = this.baseMalleusRot.z + osc * mechAmp * 0.9;
    this.earModel.malleusGroup.rotation.y = this.baseMalleusRot.y + osc * mechAmp * 0.3;

    // Incus pivot (lever reduction in amplitude, multiplication of force)
    this.earModel.incusGroup.rotation.z = this.baseIncusRot.z - osc * mechAmp * 0.7;
    this.earModel.incusGroup.rotation.y = this.baseIncusRot.y - osc * mechAmp * 0.25;

    // Stapes piston action into oval window
    this.earModel.stapesGroup.position.x = this.baseStapesPos.x + osc * mechAmp * 0.5;

    // Round window counter-phase bulging (incompressible perilymph displacement)
    this.earModel.roundWindow.position.x = this.baseRoundWinPos.x - osc * mechAmp * 0.5;
    this.earModel.roundWindow.scale.setScalar(1.0 + osc * 0.08);

    // 3. Animate Inner Ear Cochlear Hydraulic Traveling Wave & Tonotopic Resonance
    const tonotopicPos = this.getTonotopicPosition(this.frequency);

    if (this.earModel.cochleaCurve && this.earModel.basilarMembrane) {
      // Dynamic traveling wave ripple on the basilar membrane
      const basilarPosAttr = this.earModel.basilarMembrane.geometry.attributes.position;
      const vertexCount = basilarPosAttr.count;

      for (let i = 0; i < vertexCount; i += 2) {
        const u = i / vertexCount; // 0.0 at base to 1.0 at apex
        // Distance from resonant peak
        const distFromPeak = Math.abs(u - tonotopicPos);
        const envelope = Math.exp(-Math.pow(distFromPeak / 0.15, 2));

        // Traveling wave equation: envelope * sin(k*u - phase)
        const waveDisp = envelope * Math.sin(u * 18.0 - phase) * mechAmp * 0.6;

        basilarPosAttr.setZ(i, basilarPosAttr.getZ(i) + waveDisp * 0.08);
        basilarPosAttr.setZ(i + 1, basilarPosAttr.getZ(i + 1) + waveDisp * 0.08);
      }
      basilarPosAttr.needsUpdate = true;

      // Glow the basilar membrane resonant hotspot
      this.earModel.materials.basilar.emissiveIntensity = 0.3 + 0.6 * Math.abs(osc);

      // Fluid particles flowing in spiral
      if (this.fluidPoints) {
        const posAttr = this.fluidPoints.geometry.attributes.position;
        const colAttr = this.fluidPoints.geometry.attributes.color;
        const curve = this.earModel.cochleaCurve;

        for (let i = 0; i < this.numFluidParticles; i++) {
          // Particles travel toward and swirl near resonant point
          const prog = (i / this.numFluidParticles + this.time * 0.15) % Math.min(1.0, tonotopicPos + 0.1);
          const pt = curve.getPointAt(prog);

          // Add radial perturbation proportional to wave
          const waveJitter = Math.sin(prog * 20.0 - phase) * 0.06;
          posAttr.setXYZ(i, pt.x + waveJitter, pt.y + waveJitter, pt.z);

          // Highlight particles at resonant peak
          const dist = Math.abs(prog - tonotopicPos);
          if (dist < 0.12) {
            colAttr.setXYZ(i, 0.0, 1.0, 1.0); // Bright cyan hotspot
          } else {
            colAttr.setXYZ(i, 0.2, 0.5, 0.8);
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }
    }

    // 4. Animate Neural Action Potentials along Cranial Nerve VIII
    if (this.showNervePulses && this.nervePulses) {
      this.nervePulses.visible = true;
      const npPosAttr = this.nervePulses.geometry.attributes.position;
      const npColAttr = this.nervePulses.geometry.attributes.color;

      for (let i = 0; i < this.numNervePulses; i++) {
        // Pulses fire rapidly down the nerve trunk (-X direction)
        const pulseProg = (i / this.numNervePulses + this.time * 0.7) % 1.0;
        const x = -0.6 - pulseProg * 1.6;
        const y = -0.2 - pulseProg * 0.3 + Math.sin(i * 3.0) * 0.08;
        const z = 0.2 - pulseProg * 0.5 + Math.cos(i * 4.0) * 0.08;

        npPosAttr.setXYZ(i, x, y, z);

        // Flash action potentials synchronously with mechanical peak
        const pulseBright = Math.max(0.2, Math.sin(pulseProg * Math.PI * 4 - phase));
        npColAttr.setXYZ(i, 1.0 * pulseBright, 0.85 * pulseBright, 0.2 * pulseBright);
      }
      npPosAttr.needsUpdate = true;
      npColAttr.needsUpdate = true;
    } else if (this.nervePulses) {
      this.nervePulses.visible = false;
    }
  }

  setFrequency(freq) {
    this.frequency = freq;
  }

  setAmplitude(amp) {
    this.amplitude = amp;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  toggleWavefronts(show) {
    this.showWaves = show;
  }

  toggleNervePulses(show) {
    this.showNervePulses = show;
  }
}
