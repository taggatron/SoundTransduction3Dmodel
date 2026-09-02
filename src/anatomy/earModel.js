import * as THREE from 'three';
import { createEarMaterials } from './materials.js';
import {
  createPinnaGeometry,
  createEarCanalPath,
  createEarCanalGeometry,
  createTympanicMembraneGeometry,
  createMalleusGeometries,
  createIncusGeometries,
  createStapesGeometries,
  createCochleaGeometry,
  createSemicircularCanalsGeometries,
  createNerveGeometries,
  createTemporalBoneCutawayGeometry,
} from './geometries.js';

/**
 * Master Ear Model Orchestrator
 * Connects External, Middle, and Inner Ear components with anatomical precision.
 */
export class EarModel {
  constructor(scene) {
    this.scene = scene;
    this.materials = createEarMaterials();

    // Master container
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'Human_Ear_Assembly';

    // Sub-regions for exploded view
    this.externalEarGroup = new THREE.Group();
    this.externalEarGroup.name = 'External_Ear_Region';

    this.middleEarGroup = new THREE.Group();
    this.middleEarGroup.name = 'Middle_Ear_Region';

    this.innerEarGroup = new THREE.Group();
    this.innerEarGroup.name = 'Inner_Ear_Region';

    this.temporalBoneGroup = new THREE.Group();
    this.temporalBoneGroup.name = 'Temporal_Bone_Housing';

    this.rootGroup.add(this.temporalBoneGroup);
    this.rootGroup.add(this.externalEarGroup);
    this.rootGroup.add(this.middleEarGroup);
    this.rootGroup.add(this.innerEarGroup);

    this.scene.add(this.rootGroup);

    // Dynamic articulated components for physics simulation
    this.tympanicMembrane = null;
    this.malleusGroup = null;
    this.incusGroup = null;
    this.stapesGroup = null;
    this.ovalWindow = null;
    this.roundWindow = null;
    this.basilarMembrane = null;
    this.cochleaCurve = null;
    this.canalPath = null;
    this.nerveGroup = null;

    // Exploded view base positions
    this.extBasePos = new THREE.Vector3(0, 0, 0);
    this.midBasePos = new THREE.Vector3(0, 0, 0);
    this.innBasePos = new THREE.Vector3(0, 0, 0);

    this.initModel();
  }

  initModel() {
    this.buildExternalEar();
    this.buildMiddleEar();
    this.buildInnerEar();
    this.buildTemporalBone();
  }

  buildExternalEar() {
    // 1. Unified Seamless Pinna / Auricle
    const pinnaGeo = createPinnaGeometry();
    this.pinnaMesh = new THREE.Mesh(pinnaGeo, this.materials.pinna);
    this.pinnaMesh.name = 'Pinna_Auricle';
    // Perfectly aligned with the ear canal opening at (-0.4, 0.2, 0.15)
    this.pinnaMesh.position.set(0, 0, 0);
    this.externalEarGroup.add(this.pinnaMesh);

    // 2. Ear Canal (External Auditory Meatus)
    this.canalPath = createEarCanalPath();
    const canalGeo = createEarCanalGeometry(this.canalPath);
    this.canalMesh = new THREE.Mesh(canalGeo, this.materials.canal);
    this.canalMesh.name = 'External_Auditory_Canal';
    this.externalEarGroup.add(this.canalMesh);

    // 3. Tympanic Membrane (Eardrum) - boundary between outer & middle ear
    const tympGeo = createTympanicMembraneGeometry();
    this.tympanicMembrane = new THREE.Mesh(tympGeo, this.materials.tympanic);
    this.tympanicMembrane.name = 'Tympanic_Membrane';
    // Positioned at terminus of canal
    this.tympanicMembrane.position.set(-4.9, -0.05, -0.35);
    this.externalEarGroup.add(this.tympanicMembrane);
  }

  buildMiddleEar() {
    // Coordinate origin of Middle Ear is centered around the tympanic cavity (-5.5, 0, -0.3)
    const midCenter = new THREE.Vector3(-5.2, 0.0, -0.35);

    // 1. Malleus (Hammer)
    this.malleusGroup = new THREE.Group();
    this.malleusGroup.name = 'Malleus';
    const mGeos = createMalleusGeometries();
    this.malleusGroup.add(new THREE.Mesh(mGeos.headGeo, this.materials.bone));
    this.malleusGroup.add(new THREE.Mesh(mGeos.neckGeo, this.materials.bone));
    this.malleusGroup.add(new THREE.Mesh(mGeos.lateralProcessGeo, this.materials.bone));
    this.malleusGroup.add(new THREE.Mesh(mGeos.handleGeo, this.materials.bone));

    // Position malleus so handle embeds in tympanic membrane umbo
    this.malleusGroup.position.copy(midCenter).add(new THREE.Vector3(0.05, 0.75, 0.0));
    this.middleEarGroup.add(this.malleusGroup);

    // 2. Incus (Anvil)
    this.incusGroup = new THREE.Group();
    this.incusGroup.name = 'Incus';
    const iGeos = createIncusGeometries();
    this.incusGroup.add(new THREE.Mesh(iGeos.bodyGeo, this.materials.bone));
    this.incusGroup.add(new THREE.Mesh(iGeos.shortCrusGeo, this.materials.bone));
    this.incusGroup.add(new THREE.Mesh(iGeos.longCrusGeo, this.materials.bone));
    this.incusGroup.add(new THREE.Mesh(iGeos.lenticularGeo, this.materials.joint));

    // Articulates with malleus head via incudomalleolar saddle joint
    this.incusGroup.position.copy(this.malleusGroup.position).add(new THREE.Vector3(-0.45, -0.05, 0.08));
    this.middleEarGroup.add(this.incusGroup);

    // 3. Stapes (Stirrup)
    this.stapesGroup = new THREE.Group();
    this.stapesGroup.name = 'Stapes';
    const sGeos = createStapesGeometries();
    this.stapesGroup.add(new THREE.Mesh(sGeos.headGeo, this.materials.joint));
    this.stapesGroup.add(new THREE.Mesh(sGeos.antCrusGeo, this.materials.bone));
    this.stapesGroup.add(new THREE.Mesh(sGeos.postCrusGeo, this.materials.bone));
    this.stapesGroup.add(new THREE.Mesh(sGeos.footplateGeo, this.materials.bone));

    // Stapes head articulates with incus lenticular process (-0.35, -1.15, -0.25 relative to incus)
    const incusLenticularWorld = new THREE.Vector3(-0.35, -1.15, -0.25).add(this.incusGroup.position);
    this.stapesGroup.position.copy(incusLenticularWorld).add(new THREE.Vector3(-0.08, 0.0, 0.0));
    this.middleEarGroup.add(this.stapesGroup);

    // 4. Oval Window (Fenestra Vestibuli)
    const ovalWindowGeo = new THREE.RingGeometry(0.18, 0.38, 24);
    ovalWindowGeo.rotateY(Math.PI / 2);
    this.ovalWindow = new THREE.Mesh(ovalWindowGeo, this.materials.window);
    this.ovalWindow.name = 'Oval_Window';
    // Positioned right at stapes footplate insertion into vestibule
    this.ovalWindow.position.copy(this.stapesGroup.position).add(new THREE.Vector3(-0.75, 0, 0));
    this.middleEarGroup.add(this.ovalWindow);

    // 5. Round Window (Fenestra Cochleae)
    const roundWindowGeo = new THREE.CircleGeometry(0.24, 24);
    roundWindowGeo.rotateY(Math.PI / 2);
    this.roundWindow = new THREE.Mesh(roundWindowGeo, this.materials.window);
    this.roundWindow.name = 'Round_Window';
    this.roundWindow.position.copy(this.ovalWindow.position).add(new THREE.Vector3(0.1, -0.6, -0.4));
    this.middleEarGroup.add(this.roundWindow);

    // 6. Muscles & Tendons:
    // Tensor Tympani Muscle (attaches to upper handle of malleus)
    const tensorTympPts = [
      new THREE.Vector3(-6.2, 0.4, 0.2),
      new THREE.Vector3(-5.6, 0.3, 0.1),
      this.malleusGroup.position.clone().add(new THREE.Vector3(0.05, -0.4, 0.02)),
    ];
    const tensorCurve = new THREE.CatmullRomCurve3(tensorTympPts);
    const tensorGeo = new THREE.TubeGeometry(tensorCurve, 12, 0.07, 8, false);
    const tensorMesh = new THREE.Mesh(tensorGeo, this.materials.muscle);
    tensorMesh.name = 'Tensor_Tympani';
    this.middleEarGroup.add(tensorMesh);

    // Stapedius Muscle & Tendon (attaches to neck of stapes)
    const stapediusPts = [
      this.stapesGroup.position.clone().add(new THREE.Vector3(0.2, -0.6, -0.3)),
      this.stapesGroup.position.clone().add(new THREE.Vector3(-0.05, 0.0, 0.0)),
    ];
    const stapediusCurve = new THREE.CatmullRomCurve3(stapediusPts);
    const stapediusGeo = new THREE.TubeGeometry(stapediusCurve, 8, 0.05, 8, false);
    const stapediusMesh = new THREE.Mesh(stapediusGeo, this.materials.tendon);
    stapediusMesh.name = 'Stapedius_Tendon';
    this.middleEarGroup.add(stapediusMesh);

    // 7. Eustachian (Pharyngotympanic) Tube
    const eustachianPts = [
      midCenter.clone().add(new THREE.Vector3(0.3, -0.8, -0.1)),
      midCenter.clone().add(new THREE.Vector3(0.6, -1.8, 0.4)),
      midCenter.clone().add(new THREE.Vector3(1.2, -3.0, 1.0)),
    ];
    const eustachianCurve = new THREE.CatmullRomCurve3(eustachianPts);
    const eustachianGeo = new THREE.TubeGeometry(eustachianCurve, 20, 0.28, 12, false);
    const eustachianMesh = new THREE.Mesh(eustachianGeo, this.materials.eustachian);
    eustachianMesh.name = 'Eustachian_Tube';
    this.middleEarGroup.add(eustachianMesh);
  }

  buildInnerEar() {
    // The Inner Ear sits medially (-X direction) starting from the oval window
    const innerCenter = new THREE.Vector3(-7.2, -0.3, -0.4);
    const innerLabyrinth = new THREE.Group();
    innerLabyrinth.name = 'Bony_Labyrinth';
    innerLabyrinth.position.copy(innerCenter);

    // 1. Semicircular Canals & Vestibule
    const scGeos = createSemicircularCanalsGeometries();
    innerLabyrinth.add(new THREE.Mesh(scGeos.superiorGeo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.posteriorGeo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.lateralGeo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.vestibuleGeo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.ampulla1Geo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.ampulla2Geo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.ampulla3Geo, this.materials.labyrinth));
    innerLabyrinth.add(new THREE.Mesh(scGeos.crusCommuneGeo, this.materials.labyrinth));

    // 2. Cochlea (Spiral Organ of Hearing)
    const cochleaData = createCochleaGeometry();
    this.cochleaCurve = cochleaData.cochleaCurve;

    const cochleaGroup = new THREE.Group();
    cochleaGroup.name = 'Cochlea';
    // Orient cochlea antero-inferiorly from vestibule
    cochleaGroup.position.set(-0.2, -0.8, -0.3);
    cochleaGroup.rotation.set(0.3, -0.4, 0.8);

    // Outer Bony Shell
    this.cochleaShell = new THREE.Mesh(cochleaData.outerShellGeo, this.materials.labyrinth);
    this.cochleaShell.name = 'Cochlea_Bony_Shell';
    cochleaGroup.add(this.cochleaShell);

    // Basilar Membrane (Resonant organ inside spiral)
    this.basilarMembrane = new THREE.Mesh(cochleaData.basilarGeo, this.materials.basilar);
    this.basilarMembrane.name = 'Basilar_Membrane';
    cochleaGroup.add(this.basilarMembrane);

    // Modiolus central bony core
    const modiolusMesh = new THREE.Mesh(cochleaData.modiolusGeo, this.materials.bone);
    modiolusMesh.name = 'Modiolus';
    cochleaGroup.add(modiolusMesh);

    innerLabyrinth.add(cochleaGroup);
    this.cochleaGroupRef = cochleaGroup;

    // 3. Vestibulocochlear Nerve (CN VIII)
    this.nerveGroup = new THREE.Group();
    this.nerveGroup.name = 'Cranial_Nerve_VIII';
    const nGeos = createNerveGeometries();
    this.nerveGroup.add(new THREE.Mesh(nGeos.trunkGeo, this.materials.nerve));
    nGeos.cochlearBranchGeos.forEach((geo, i) => {
      const bMesh = new THREE.Mesh(geo, this.materials.nerve);
      bMesh.name = `Cochlear_Nerve_Branch_${i + 1}`;
      this.nerveGroup.add(bMesh);
    });
    nGeos.vestibularBranchGeos.forEach((geo, i) => {
      const vMesh = new THREE.Mesh(geo, this.materials.nerve);
      vMesh.name = `Vestibular_Nerve_Branch_${i + 1}`;
      this.nerveGroup.add(vMesh);
    });

    this.nerveGroup.position.set(-0.6, -0.2, 0.2);
    innerLabyrinth.add(this.nerveGroup);

    this.innerEarGroup.add(innerLabyrinth);
  }

  buildTemporalBone() {
    // Surrounding temporal bone housing (provides realistic skull context)
    const boneGeo = createTemporalBoneCutawayGeometry();
    this.temporalBoneMesh = new THREE.Mesh(boneGeo, this.materials.temporalBone);
    this.temporalBoneMesh.name = 'Temporal_Bone_Cutaway';
    this.temporalBoneMesh.position.set(-2.5, 0, 0);
    this.temporalBoneGroup.add(this.temporalBoneMesh);
  }

  /**
   * Exploded view separation along lateral-medial axis
   * @param {number} factor 0.0 (assembled) to 1.0 (fully separated)
   */
  setExplodedView(factor) {
    // External ear slides laterally (+X)
    this.externalEarGroup.position.x = factor * 2.8;

    // Middle ear stays near center or slight shift
    this.middleEarGroup.position.x = factor * 0.4;

    // Inner ear slides medially (-X)
    this.innerEarGroup.position.x = -factor * 3.2;

    // Temporal bone fades out smoothly as exploded view expands
    if (this.temporalBoneMesh) {
      this.temporalBoneMesh.material.opacity = Math.max(0, 0.25 * (1 - factor * 1.5));
    }

    if (typeof this.onExplodedViewChange === 'function') {
      this.onExplodedViewChange(factor);
    }
  }

  /**
   * Sets transparency / X-ray mode for surrounding bone & tissue
   * @param {number} opacity 0.0 (fully transparent) to 1.0 (opaque)
   */
  setBoneTranslucency(opacity) {
    if (this.temporalBoneMesh) {
      this.temporalBoneMesh.material.opacity = opacity * 0.25;
      this.temporalBoneMesh.visible = opacity > 0.02;
    }
    if (this.canalMesh) {
      this.canalMesh.material.opacity = 0.3 + opacity * 0.6;
    }
    if (this.cochleaShell) {
      // Allow peering inside the cochlea spiral to see the basilar membrane
      this.cochleaShell.material.transparent = opacity < 0.95;
      this.cochleaShell.material.opacity = 0.25 + opacity * 0.75;
    }
  }

  /**
   * Anatomical Landmarks / Pins for Interactive Inspection
   */
  getAnatomicalLandmarks() {
    return [
      {
        id: 'pinna',
        name: 'Pinna / Auricle',
        latin: 'Auricula',
        region: 'External Ear',
        position: new THREE.Vector3(0.5, 0.4, 0.3),
        summary: 'The visible outer cartilage with distinct ridges (helix, antihelix, tragus, concha).',
        acoustics: 'Funnels sound pressure waves into the auditory canal. Its asymmetric shape creates direction-dependent spectral notches, aiding in sound localization (azimuth & elevation).',
      },
      {
        id: 'canal',
        name: 'External Auditory Meatus',
        latin: 'Meatus Acusticus Externus',
        region: 'External Ear',
        position: new THREE.Vector3(-2.2, 0.2, 0.0),
        summary: 'An S-shaped 2.5 cm cartilaginous and bony tube leading from the concha to the eardrum.',
        acoustics: 'Acts as an acoustic quarter-wave resonator, providing a natural ~10-15 dB gain boost around 2.5 - 3.5 kHz (the critical frequency range for human speech intelligibility).',
      },
      {
        id: 'tympanic',
        name: 'Tympanic Membrane (Eardrum)',
        latin: 'Membrana Tympanica',
        region: 'Boundary: Outer / Middle Ear',
        position: new THREE.Vector3(-4.9, 0.0, -0.35),
        summary: 'A thin, semi-translucent, cone-shaped fibrous membrane with an effective vibrating area of ~55 mm².',
        acoustics: 'Transverts incoming acoustic air pressure fluctuations into physical mechanical vibrations, transferring force directly to the attached handle (manubrium) of the malleus.',
      },
      {
        id: 'malleus',
        name: 'Malleus (Hammer)',
        latin: 'Malleus',
        region: 'Middle Ear',
        position: new THREE.Vector3(-5.15, 0.75, -0.35),
        summary: 'The largest auditory ossicle. Its handle is embedded in the eardrum and its head articulates with the incus.',
        acoustics: 'Pivots along a rotational axis, initiating the ossicular lever system that couples low-impedance air to high-impedance cochlear fluid.',
      },
      {
        id: 'incus',
        name: 'Incus (Anvil)',
        latin: 'Incus',
        region: 'Middle Ear',
        position: new THREE.Vector3(-5.6, 0.7, -0.27),
        summary: 'Intermediate ossicle with a body, short crus anchored in the fossa incudis, and a long crus ending at the lenticular process.',
        acoustics: 'Acts as the mechanical lever arm (~1.3:1 ratio), trading motion amplitude for increased mechanical force delivered to the stapes.',
      },
      {
        id: 'stapes',
        name: 'Stapes (Stirrup)',
        latin: 'Stapes',
        region: 'Middle Ear',
        position: new THREE.Vector3(-6.15, -0.4, -0.55),
        summary: 'The smallest bone in the human body (~3 mm). Features delicate crura and an oval footplate.',
        acoustics: 'Piston-like motion into the oval window. Concentrates forces from the 55 mm² eardrum onto its tiny 3.2 mm² footplate (~17x hydraulic area ratio, ~22x total pressure amplification).',
      },
      {
        id: 'eustachian',
        name: 'Eustachian (Auditory) Tube',
        latin: 'Tuba Auditiva',
        region: 'Middle Ear',
        position: new THREE.Vector3(-4.8, -1.8, 0.3),
        summary: 'Mucous membrane canal connecting the middle ear cavity with the nasopharynx.',
        acoustics: 'Ventilates and equalizes barometric air pressure between the middle ear cavity and external atmosphere, ensuring the eardrum remains compliant.',
      },
      {
        id: 'oval_window',
        name: 'Oval Window',
        latin: 'Fenestra Vestibuli',
        region: 'Boundary: Middle / Inner Ear',
        position: new THREE.Vector3(-6.9, -0.4, -0.55),
        summary: 'Reniform aperture in the medial tympanic wall leading into the vestibule, covered by the annular ligament.',
        acoustics: 'Input portal for hydraulic energy into the perilymph-filled Scala Vestibuli of the cochlea.',
      },
      {
        id: 'round_window',
        name: 'Round Window',
        latin: 'Fenestra Cochleae',
        region: 'Boundary: Middle / Inner Ear',
        position: new THREE.Vector3(-6.8, -1.0, -0.95),
        summary: 'A circular aperture covered by the flexible secondary tympanic membrane.',
        acoustics: 'Acts as a mechanical pressure release valve. Because inner ear fluid is incompressible, round window bulges outward when stapes presses inward.',
      },
      {
        id: 'semicircular_canals',
        name: 'Semicircular Canals',
        latin: 'Canales Semicirculares',
        region: 'Inner Ear (Vestibular System)',
        position: new THREE.Vector3(-7.2, 0.8, -0.4),
        summary: 'Three mutually perpendicular fluid-filled tori (Superior, Posterior, Lateral) with dilated ampullae.',
        acoustics: 'Dedicated to dynamic balance, detecting angular and rotational head acceleration via endolymph cupula deflection.',
      },
      {
        id: 'cochlea',
        name: 'Cochlea (Spiral Organ)',
        latin: 'Cochlea',
        region: 'Inner Ear (Auditory System)',
        position: new THREE.Vector3(-7.4, -1.1, -0.7),
        summary: 'A 2.75-turn spiral shell housing three parallel fluid ducts: Scala Vestibuli, Scala Media, and Scala Tympani.',
        acoustics: 'Performs Fourier acoustic decomposition via traveling waves. High frequencies resonate at the stiff base; low frequencies travel to the compliant apex (tonotopy).',
      },
      {
        id: 'basilar_membrane',
        name: 'Basilar Membrane & Organ of Corti',
        latin: 'Membrana Basilaris',
        region: 'Inner Ear (Cochlear Duct)',
        position: new THREE.Vector3(-7.5, -0.7, -0.5),
        summary: 'Sensory partition supporting ~16,000 hair cells with stereocilia bathed in potassium-rich endolymph.',
        acoustics: 'Fluid displacement creates shearing forces that deflect stereocilia, opening mechanosensitive MET ion channels and depolarizing hair cells.',
      },
      {
        id: 'auditory_nerve',
        name: 'Vestibulocochlear Nerve (CN VIII)',
        latin: 'Nervus Vestibulocochlearis',
        region: 'Neural Pathway',
        position: new THREE.Vector3(-8.8, -0.5, -0.8),
        summary: 'Cranial nerve VIII combining cochlear nerve fibers (spiral ganglion) and vestibular nerve fibers.',
        acoustics: 'Transmits phase-locked electrical action potential spike trains to the cochlear nuclei in the brainstem and up to the auditory cortex for perception.',
      },
    ];
  }
}
