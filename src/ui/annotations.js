import * as THREE from 'three';

/**
 * 3D Anatomical Pin Annotations & Camera Controller
 * Manages interactive markers in 3D space, raycasting, camera glide transitions, and guided tour.
 */
export class AnnotationManager {
  constructor(scene, camera, controls, landmarks, onSelectLandmark) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.landmarks = landmarks;
    this.onSelectLandmark = onSelectLandmark;

    this.pinsGroup = new THREE.Group();
    this.pinsGroup.name = 'Anatomical_Pins';
    this.scene.add(this.pinsGroup);

    this.pinMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredPin = null;

    // Camera animation state
    this.isCameraAnimating = false;
    this.cameraStartPos = new THREE.Vector3();
    this.cameraEndPos = new THREE.Vector3();
    this.targetStartPos = new THREE.Vector3();
    this.targetEndPos = new THREE.Vector3();
    this.cameraAnimProgress = 0;
    this.cameraAnimDuration = 1.2;

    this.initPins();
  }

  initPins() {
    // Create billboard pins
    const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.24, 0.32, 24);

    this.landmarks.forEach((landmark, index) => {
      const pinContainer = new THREE.Group();
      pinContainer.position.copy(landmark.position);
      pinContainer.userData = { landmark, index };

      // Inner glowing sphere
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x00f7ff,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      pinContainer.add(sphere);

      // Outer pulse ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f7ff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'pulse_ring';
      pinContainer.add(ring);

      this.pinsGroup.add(pinContainer);
      this.pinMeshes.push({
        container: pinContainer,
        sphere,
        ring,
        landmark,
        basePosition: landmark.position.clone(),
      });
    });
  }

  getLandmarkOffset(landmark, factor) {
    const id = landmark.id;
    const region = landmark.region || '';

    // External ear structures slide laterally (+X by factor * 2.8)
    if (
      id === 'pinna' ||
      id === 'canal' ||
      id === 'tympanic' ||
      region.includes('External') ||
      region.includes('Outer')
    ) {
      return factor * 2.8;
    }

    // Middle ear structures (ossicles, windows, muscles, tube) shift by factor * 0.4
    if (
      id === 'malleus' ||
      id === 'incus' ||
      id === 'stapes' ||
      id === 'eustachian' ||
      id === 'oval_window' ||
      id === 'round_window' ||
      id === 'tensor_tympani' ||
      region.includes('Middle')
    ) {
      return factor * 0.4;
    }

    // Inner ear structures (cochlea, canals, basilar membrane, CN VIII) slide medially (-X by factor * 3.2)
    if (
      id === 'cochlea' ||
      id === 'semicircular_canals' ||
      id === 'basilar_membrane' ||
      id === 'auditory_nerve' ||
      region.includes('Inner') ||
      region.includes('Neural')
    ) {
      return -factor * 3.2;
    }

    return 0;
  }

  /**
   * Smoothly updates 3D pin locations to match their moving anatomical parts in exploded view
   * @param {number} factor 0.0 (assembled) to 1.0 (fully exploded)
   */
  updateExplodedFactor(factor) {
    this.currentExplodedFactor = factor;
    this.pinMeshes.forEach((pin) => {
      const offsetX = this.getLandmarkOffset(pin.landmark, factor);
      pin.container.position.x = pin.basePosition.x + offsetX;
    });
  }

  setPinsVisible(visible) {
    this.pinsGroup.visible = visible;
  }

  update(delta, time) {
    // 1. Orient rings to face camera (billboard effect)
    this.pinMeshes.forEach((pin, i) => {
      pin.container.lookAt(this.camera.position);

      // Gentle pulsing animation on outer ring
      const pulse = 1.0 + 0.25 * Math.sin(time * 3.5 + i * 0.5);
      pin.ring.scale.set(pulse, pulse, pulse);
      pin.ring.material.opacity = Math.max(0.2, 0.75 - 0.3 * (pulse - 1.0));
    });

    // 2. Camera glide transition
    if (this.isCameraAnimating) {
      this.cameraAnimProgress += delta / this.cameraAnimDuration;
      const t = Math.min(1.0, this.cameraAnimProgress);
      // Smooth cubic ease-in-out
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.cameraStartPos, this.cameraEndPos, ease);
      this.controls.target.lerpVectors(this.targetStartPos, this.targetEndPos, ease);
      this.controls.update();

      if (t >= 1.0) {
        this.isCameraAnimating = false;
      }
    }
  }

  flyTo(cameraPos, targetPos, duration = 1.2) {
    this.cameraStartPos.copy(this.camera.position);
    this.cameraEndPos.copy(cameraPos);
    this.targetStartPos.copy(this.controls.target);
    this.targetEndPos.copy(targetPos);

    this.cameraAnimProgress = 0;
    this.cameraAnimDuration = duration;
    this.isCameraAnimating = true;
  }

  focusOnLandmark(landmark) {
    // Position camera offset from landmark's current 3D position (including exploded offset)
    const pin = this.pinMeshes.find((p) => p.landmark.id === landmark.id);
    const targetPos = pin ? pin.container.position.clone() : landmark.position.clone();
    const offset = new THREE.Vector3(2.5, 1.2, 3.2);
    const camPos = targetPos.clone().add(offset);
    this.flyTo(camPos, targetPos, 1.2);
    this.highlightPin(landmark.id);
  }

  highlightPin(landmarkId) {
    this.pinMeshes.forEach(p => {
      const isSelected = p.landmark.id === landmarkId;
      p.sphere.material.color.setHex(isSelected ? 0xffea00 : 0x00f7ff);
      p.ring.material.color.setHex(isSelected ? 0xffea00 : 0x00f7ff);
      p.sphere.scale.setScalar(isSelected ? 1.4 : 1.0);
    });
  }

  handlePointerMove(event, domElement) {
    if (!this.pinsGroup.visible) return;

    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.pinMeshes.map(p => p.sphere)
    );

    if (intersects.length > 0) {
      const hitSphere = intersects[0].object;
      const hitPin = this.pinMeshes.find(p => p.sphere === hitSphere);
      if (hitPin && this.hoveredPin !== hitPin) {
        domElement.style.cursor = 'pointer';
        this.hoveredPin = hitPin;
      }
    } else {
      if (this.hoveredPin) {
        domElement.style.cursor = 'default';
        this.hoveredPin = null;
      }
    }
  }

  handlePointerDown(event) {
    this.pointerDownX = event.clientX;
    this.pointerDownY = event.clientY;
  }

  handlePointerClick(event, domElement) {
    if (!this.pinsGroup.visible) return;

    // If mouse moved more than 5px, the user was rotating/panning the view, not clicking a pin
    if (this.pointerDownX !== undefined && this.pointerDownY !== undefined) {
      const dist = Math.hypot(event.clientX - this.pointerDownX, event.clientY - this.pointerDownY);
      if (dist > 5) return;
    }

    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.pinMeshes.map(p => p.sphere)
    );

    if (intersects.length > 0) {
      const hitSphere = intersects[0].object;
      const hitPin = this.pinMeshes.find(p => p.sphere === hitSphere);
      if (hitPin) {
        this.focusOnLandmark(hitPin.landmark);
        if (this.onSelectLandmark) {
          this.onSelectLandmark(hitPin.landmark);
        }
      }
    }
  }
}
