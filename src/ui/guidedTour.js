import * as THREE from 'three';

/**
 * Step-by-Step Guided Tour for Sound Wave Transmission
 */
export const TOUR_STEPS = [
  {
    stepNumber: 1,
    title: 'Stage 1: Acoustic Air Conduction (External Ear)',
    badge: 'Outer Ear',
    cameraPos: new THREE.Vector3(5.4, 0.8, 3.2),
    targetPos: new THREE.Vector3(-0.8, 0.2, 0.15),
    frequency: 1000,
    landmarkId: 'canal',
    description: `
      Sound begins as oscillating atmospheric pressure waves. The <strong>Pinna (Auricle)</strong> funnels these waves into the 
      <strong>External Auditory Meatus (Ear Canal)</strong>. Due to its ~2.5 cm length, the canal acts as an acoustic quarter-wave 
      resonator, delivering a natural 10–15 dB amplification between <strong>2,500 Hz and 3,500 Hz</strong>—the exact acoustic range 
      required for human speech intelligibility and consonant distinction.
    `,
    mechanics: 'Acoustic air pressure fluctuations funneled into canal -> quarter-wave resonance enhancement.',
  },
  {
    stepNumber: 2,
    title: 'Stage 2: Mechanical Impedance Matching (Middle Ear)',
    badge: 'Middle Ear',
    cameraPos: new THREE.Vector3(-3.2, 0.8, 2.5),
    targetPos: new THREE.Vector3(-5.5, 0.0, -0.35),
    frequency: 1000,
    landmarkId: 'malleus',
    description: `
      Air has very low acoustic impedance, while cochlear fluid has high impedance. If sound waves struck fluid directly, 
      <strong>99.9% of sound energy would bounce off</strong> (a 30 dB loss).<br><br>
      The Middle Ear solves this via mechanical impedance matching:
      <ul style="margin: 6px 0 0 16px; padding: 0;">
        <li><strong>Hydraulic Area Ratio:</strong> Eardrum area (~55 mm²) is ~17x larger than the stapes footplate (~3.2 mm²).</li>
        <li><strong>Ossicular Lever Ratio:</strong> Malleus and Incus provide a 1.3:1 mechanical lever advantage.</li>
        <li><strong>Total Pressure Multiplication:</strong> Multiplies acoustic pressure by ~22x into the Oval Window!</li>
      </ul>
    `,
    mechanics: 'Eardrum vibration -> Malleus rocking -> Incus lever -> Stapes piston drive into Oval Window.',
  },
  {
    stepNumber: 3,
    title: 'Stage 3: Hydraulic Traveling Wave (Inner Ear / Cochlea)',
    badge: 'Inner Ear',
    cameraPos: new THREE.Vector3(-5.2, 0.5, 3.0),
    targetPos: new THREE.Vector3(-7.2, -0.6, -0.5),
    frequency: 1000,
    landmarkId: 'cochlea',
    description: `
      As the <strong>Stapes footplate</strong> pushes into the <strong>Oval Window</strong>, it creates hydraulic pressure waves 
      in the incompressible perilymph fluid of the <em>Scala Vestibuli</em>. The wave travels along the 2.75 spiral turns of the 
      snail-shaped <strong>Cochlea</strong>.<br><br>
      Because fluid cannot be compressed inside a rigid bony chamber, the <strong>Round Window (Fenestra Cochleae)</strong> 
      simultaneously bulges outward in opposite phase, relieving pressure and enabling fluid displacement.
    `,
    mechanics: 'Piston stroke into Oval Window -> Perilymph wave through cochlea -> Round Window compensatory outward bulge.',
  },
  {
    stepNumber: 4,
    title: 'Stage 4: Tonotopic Transduction & Action Potentials (CN VIII)',
    badge: 'Sensory / Neural',
    cameraPos: new THREE.Vector3(-6.5, -0.2, 2.2),
    targetPos: new THREE.Vector3(-7.8, -0.6, -0.5),
    frequency: 4000,
    landmarkId: 'auditory_nerve',
    description: `
      The <strong>Basilar Membrane</strong> undergoes tonotopic resonance (Nobel Prize winner Georg von Békésy):
      <ul style="margin: 6px 0 0 16px; padding: 0;">
        <li><strong>High Frequencies (4,000–20,000 Hz):</strong> Resonate near the narrow, stiff <strong>Base</strong>.</li>
        <li><strong>Low Frequencies (20–500 Hz):</strong> Travel all the way to the wide, flexible <strong>Apex</strong>.</li>
      </ul>
      At the resonant peak, shearing forces deflect stereocilia on hair cells, opening MET potassium channels. This generates 
      electrical receptor potentials, firing <strong>action potential spike trains</strong> down the 
      <strong>Vestibulocochlear Nerve (Cranial Nerve VIII)</strong> into the brain for conscious perception!
    `,
    mechanics: 'Tonotopic resonance peak -> Hair cell stereocilia shearing -> Ion influx -> Action potentials down CN VIII.',
  },
];
