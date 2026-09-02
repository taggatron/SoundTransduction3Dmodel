import * as THREE from 'three';

/**
 * Anatomical PBR Materials for Human Ear Model
 * Designed for lifelike biological rendering with organic translucency,
 * bone sheen, membrane tension, and neural glow.
 */
export function createEarMaterials() {
  // 1. Skin & Auricle Cartilage (Pinna & outer canal)
  const pinnaMaterial = new THREE.MeshStandardMaterial({
    color: 0xdeb89e,
    roughness: 0.55,
    metalness: 0.05,
    bumpScale: 0.02,
    side: THREE.DoubleSide,
  });

  // 2. Ear Canal Epithelium
  const canalMaterial = new THREE.MeshStandardMaterial({
    color: 0xdca690,
    roughness: 0.45,
    metalness: 0.08,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });

  // 3. Tympanic Membrane (Eardrum) - Translucent, pearly gray/pink with radial sheen
  const tympanicMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0c8be,
    transmission: 0.45,
    opacity: 0.75,
    transparent: true,
    roughness: 0.25,
    metalness: 0.05,
    ior: 1.38,
    side: THREE.DoubleSide,
  });

  // 4. Auditory Ossicles (Malleus, Incus, Stapes) - Dense ivory bone
  const boneMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3e8d2,
    roughness: 0.38,
    metalness: 0.12,
  });

  const ossicleJointMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9c5b2,
    roughness: 0.3,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  // 5. Tendons & Ligaments (Tensor Tympani, Stapedius tendon, Annular ligament)
  const tendonMaterial = new THREE.MeshStandardMaterial({
    color: 0xedd6c4,
    roughness: 0.6,
    metalness: 0.05,
  });

  // Muscle belly (Tensor tympani, Stapedius)
  const muscleMaterial = new THREE.MeshStandardMaterial({
    color: 0xa84242,
    roughness: 0.65,
    metalness: 0.05,
  });

  // 6. Bony Labyrinth (Cochlea, Vestibule, Semicircular Canals)
  const labyrinthMaterial = new THREE.MeshStandardMaterial({
    color: 0xeae0cc,
    roughness: 0.32,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  // 7. Membranous Labyrinth / Cochlear Fluid (Endolymph/Perilymph)
  const fluidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4fc3f7,
    transmission: 0.85,
    opacity: 0.75,
    transparent: true,
    roughness: 0.1,
    ior: 1.33,
    side: THREE.DoubleSide,
  });

  // 8. Basilar Membrane & Organ of Corti
  const basilarMaterial = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x006064,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  });

  // 9. Vestibulocochlear Nerve (Cranial Nerve VIII)
  const nerveMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5c542,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x7c5a00,
    emissiveIntensity: 0.25,
  });

  // 10. Temporal Bone Cutaway Housing (Surrounding Skull Base)
  const temporalBoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xd0c4b0,
    roughness: 0.7,
    metalness: 0.05,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 11. Oval & Round Windows
  const windowMembraneMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8b8b8,
    transmission: 0.6,
    opacity: 0.8,
    transparent: true,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  // 12. Eustachian Tube
  const eustachianMaterial = new THREE.MeshStandardMaterial({
    color: 0xcf9588,
    roughness: 0.5,
    metalness: 0.05,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  return {
    pinna: pinnaMaterial,
    canal: canalMaterial,
    tympanic: tympanicMaterial,
    bone: boneMaterial,
    joint: ossicleJointMaterial,
    tendon: tendonMaterial,
    muscle: muscleMaterial,
    labyrinth: labyrinthMaterial,
    fluid: fluidMaterial,
    basilar: basilarMaterial,
    nerve: nerveMaterial,
    temporalBone: temporalBoneMaterial,
    window: windowMembraneMaterial,
    eustachian: eustachianMaterial,
  };
}
