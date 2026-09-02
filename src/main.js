import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EarModel } from './anatomy/earModel.js';
import { WaveSimulation } from './simulation/waveSimulation.js';
import { SoundGenerator } from './audio/soundGenerator.js';
import { AnnotationManager } from './ui/annotations.js';
import { UIController } from './ui/controls.js';

class EarApplication {
  constructor() {
    this.container = document.getElementById('canvas-container');

    this.clock = new THREE.Clock();
    this.initThree();
    this.initLights();
    this.initModel();
    this.initSimulation();
    this.initInteraction();
    this.initEvents();

    this.animate();
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080b11);
    // Subtle anatomical mist / depth fog
    this.scene.fog = new THREE.FogExp2(0x080b11, 0.035);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(2.5, 3.5, 9.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(-4.0, 0.0, -0.3); // Centered between outer & inner ear
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 25.0;
    this.controls.maxPolarAngle = Math.PI * 0.95;
  }

  initLights() {
    // Ambient light: soft, prevents pure shadows
    const ambientLight = new THREE.AmbientLight(0x1a2236, 1.8);
    this.scene.add(ambientLight);

    // Main Key Light: Warm directional light for anatomical depth
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    keyLight.position.set(8, 12, 10);
    this.scene.add(keyLight);

    // Rim / Fill Light: Cool cyan/blue for high-tech medical contrast
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-10, -5, -8);
    this.scene.add(rimLight);

    // Back Light: Highlights cartilaginous edges
    const backLight = new THREE.DirectionalLight(0xc084fc, 1.2);
    backLight.position.set(-6, 8, -6);
    this.scene.add(backLight);

    // Middle Ear cavity accent point light (illuminates tiny ossicles)
    const tympLight = new THREE.PointLight(0xfff0dd, 1.4, 6.0);
    tympLight.position.set(-5.5, 0.5, -0.2);
    this.scene.add(tympLight);

    // Inner Ear cochlea accent point light (illuminates internal spiral & basilar membrane)
    const cochleaLight = new THREE.PointLight(0x00f7ff, 1.6, 5.0);
    cochleaLight.position.set(-7.5, -0.5, -0.3);
    this.scene.add(cochleaLight);
  }

  initModel() {
    this.earModel = new EarModel(this.scene);
  }

  initSimulation() {
    this.waveSim = new WaveSimulation(this.scene, this.earModel);
    this.soundGen = new SoundGenerator();
  }

  initInteraction() {
    const landmarks = this.earModel.getAnatomicalLandmarks();

    this.annotManager = new AnnotationManager(
      this.scene,
      this.camera,
      this.controls,
      landmarks,
      (landmark) => {
        if (this.uiCtrl) {
          this.uiCtrl.showInspector(landmark);
        }
      }
    );

    this.uiCtrl = new UIController({
      earModel: this.earModel,
      waveSim: this.waveSim,
      soundGen: this.soundGen,
      annotManager: this.annotManager,
    });
  }

  initEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Raycast on Pointer Move / Click for 3D Pins
    const domEl = this.renderer.domElement;
    domEl.addEventListener('pointerdown', (e) => {
      this.annotManager.handlePointerDown(e);
    });

    domEl.addEventListener('pointermove', (e) => {
      this.annotManager.handlePointerMove(e, domEl);
    });

    domEl.addEventListener('click', (e) => {
      this.annotManager.handlePointerClick(e, domEl);
    });
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Camera Orbit Controls
    this.controls.update();

    // 2. Update Sound Wave Simulation
    this.waveSim.update(delta);

    // 3. Update 3D Annotations & Camera Transitions
    this.annotManager.update(delta, elapsedTime);

    // 4. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new EarApplication();
});
