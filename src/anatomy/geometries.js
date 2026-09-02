import * as THREE from 'three';

/**
 * Procedural Anatomical Geometry Generators for the Human Ear
 * Produces anatomically faithful 3D models of External, Middle, and Inner Ear.
 */

// ==========================================
// 1. EXTERNAL EAR: PINNA / AURICLE
// ==========================================
// ==========================================
// 1. EXTERNAL EAR: PINNA / AURICLE (UNIFIED SEAMLESS MESH)
// ==========================================
export function createPinnaGeometry() {
  /**
   * Generates a unified, seamless, water-tight solid 3D mesh of the human auricle (pinna).
   * Joins the helix, antihelix, triangular fossa, scaphoid fossa, concha, tragus,
   * antitragus, and lobule into a single continuous organic surface with smooth normals
   * and realistic cartilage thickness.
   */
  const numTheta = 64; // Angular slices around perimeter
  const numR = 32;     // Concentric radial rings from meatus to outer helix

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  // Helper to compute outer auricular boundary in (Y = vertical, Z = anterior-posterior)
  function getOuterBoundary(theta) {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    // Vertical elongation: ~3.5 superior (+Y), ~-3.2 inferior (-Y)
    const rY = sin >= 0 ? 3.55 * sin : 3.25 * sin;

    // Horizontal width: ~1.25 anterior (+Z), ~2.45 posterior (-Z)
    let rZ = cos >= 0 ? 1.25 * cos : 2.45 * cos;

    // Posterosuperior flare (Darwin's tubercle curve)
    if (sin > 0.15 && cos < -0.1) {
      rZ -= 0.3 * Math.sin(theta);
    }
    // Fleshy lobule flare at inferior pole
    if (sin < -0.2) {
      rZ += 0.35 * Math.sin(theta + 0.4);
    }

    return { y: rY, z: rZ };
  }

  // Inner meatus boundary (junction with ear canal)
  function getInnerBoundary(theta) {
    return {
      y: 0.2 + 0.42 * Math.sin(theta),
      z: 0.15 + 0.36 * Math.cos(theta),
    };
  }

  // Evaluates front skin surface point (X = lateral-medial, Y = superior-inferior, Z = anterior-posterior)
  function evaluateEarSurface(theta, v) {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    const inner = getInnerBoundary(theta);
    const outer = getOuterBoundary(theta);

    // Interpolate base planar coordinates
    let y = (1 - v) * inner.y + v * outer.y;
    let z = (1 - v) * inner.z + v * outer.z;

    // 1. Base auriculocephalic flare (ear tilts outward away from skull posteriorly)
    let x = -0.38 + v * (0.35 - 0.52 * cos);

    // 2. Concha Bowl (deep cavity funneling into meatus)
    if (v < 0.42) {
      const conchaFactor = Math.pow(1 - v / 0.42, 2);
      x -= 0.52 * conchaFactor;
    }

    // 3. Tragus (anterior flap guarding canal: theta ~ 0, v ~ 0.15 to 0.48)
    const dThetaTragus = theta / 0.35;
    const dvTragus = (v - 0.32) / 0.14;
    const tragusIntensity = Math.exp(-dThetaTragus * dThetaTragus - dvTragus * dvTragus);
    x += 0.52 * tragusIntensity;
    z -= 0.32 * tragusIntensity; // project slightly backward over meatus

    // 4. Antitragus (tubercle opposite tragus: theta ~ -1.0, v ~ 0.25 to 0.48)
    const normTheta = theta > Math.PI ? theta - Math.PI * 2 : theta;
    const dThetaAntitragus = (normTheta + 1.0) / 0.28;
    const dvAntitragus = (v - 0.36) / 0.13;
    const antitragusIntensity = Math.exp(-dThetaAntitragus * dThetaAntitragus - dvAntitragus * dvAntitragus);
    x += 0.42 * antitragusIntensity;

    // 5. Antihelix Y-shaped Ridge (v ~ 0.50 to 0.74, theta ~ -0.6 to 2.5)
    if (normTheta > -0.6 && normTheta < 2.5) {
      let antihelixV = 0.58 + 0.08 * sin;
      let antihelixAmp = 0.42;

      // Bifurcation into superior & inferior crura
      if (normTheta > 1.0 && normTheta < 2.2) {
        // Superior crus
        const dSup = Math.abs(v - (0.68 + 0.04 * cos));
        // Inferior crus
        const dInf = Math.abs(v - (0.48 - 0.05 * sin));
        const supPeak = Math.exp(-Math.pow(dSup / 0.08, 2));
        const infPeak = Math.exp(-Math.pow(dInf / 0.07, 2));

        // Triangular fossa between crura (slight depression)
        const fossaDist = Math.abs(v - 0.58);
        const fossaDip = -0.15 * Math.exp(-Math.pow(fossaDist / 0.06, 2));

        x += (supPeak * 0.38 + infPeak * 0.34 + fossaDip);
      } else {
        const dvAnti = Math.abs(v - antihelixV);
        x += antihelixAmp * Math.exp(-Math.pow(dvAnti / 0.10, 2));
      }
    }

    // 6. Scaphoid Fossa (trough between antihelix and outer helix)
    if (v > 0.70 && v < 0.88 && normTheta > 0.1 && normTheta < 2.7) {
      const dvScaphoid = Math.abs(v - 0.79);
      x -= 0.14 * Math.exp(-Math.pow(dvScaphoid / 0.07, 2));
    }

    // 7. Outer Helix (rolled cartilaginous rim: v ~ 0.86 to 1.0)
    if (v > 0.84 && (normTheta > -0.3 || normTheta < -1.8)) {
      const uHelix = (v - 0.84) / 0.16; // 0 to 1
      const roll = Math.sin(uHelix * Math.PI);
      const helixHeight = 0.46 * roll;
      x += helixHeight;
    }

    // 8. Lobule (earlobe: soft fleshy pad without cartilage ridges)
    if (normTheta < -1.3 && normTheta > -2.4) {
      const lobeDist = Math.hypot(normTheta + 1.8, v - 0.65);
      const lobePillow = Math.max(0, 0.32 * (1 - lobeDist / 0.6));
      x += lobePillow;
    }

    return { x, y, z };
  }

  // Build Front Surface Vertices
  for (let i = 0; i <= numTheta; i++) {
    const theta = (i / numTheta) * Math.PI * 2;
    for (let j = 0; j <= numR; j++) {
      const v = j / numR;
      const pt = evaluateEarSurface(theta, v);
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(i / numTheta, v);
    }
  }

  // Build Back Surface Vertices (offset by realistic cartilage thickness)
  const frontVertexCount = (numTheta + 1) * (numR + 1);
  for (let i = 0; i <= numTheta; i++) {
    const theta = (i / numTheta) * Math.PI * 2;
    for (let j = 0; j <= numR; j++) {
      const v = j / numR;
      const pt = evaluateEarSurface(theta, v);

      // Cartilage thickness: ~0.15 at thin helix edge, ~0.42 at dense concha base
      const thickness = (0.16 + 0.28 * (1 - v * 0.8));
      const backX = pt.x - thickness;

      positions.push(backX, pt.y, pt.z);
      uvs.push(i / numTheta, v);
    }
  }

  // Generate Triangles for Front Surface
  for (let i = 0; i < numTheta; i++) {
    for (let j = 0; j < numR; j++) {
      const row1 = i * (numR + 1);
      const row2 = (i + 1) * (numR + 1);

      const a = row1 + j;
      const b = row1 + j + 1;
      const c = row2 + j + 1;
      const d = row2 + j;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Generate Triangles for Back Surface (reversed winding)
  for (let i = 0; i < numTheta; i++) {
    for (let j = 0; j < numR; j++) {
      const row1 = frontVertexCount + i * (numR + 1);
      const row2 = frontVertexCount + (i + 1) * (numR + 1);

      const a = row1 + j;
      const b = row1 + j + 1;
      const c = row2 + j + 1;
      const d = row2 + j;

      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  // Stitch Outer Rim Boundary (v = 1.0) between Front and Back Surfaces
  for (let i = 0; i < numTheta; i++) {
    const fA = i * (numR + 1) + numR;
    const fB = (i + 1) * (numR + 1) + numR;

    const bA = frontVertexCount + i * (numR + 1) + numR;
    const bB = frontVertexCount + (i + 1) * (numR + 1) + numR;

    indices.push(fA, fB, bA);
    indices.push(fB, bB, bA);
  }

  // Stitch Inner Meatus Boundary (v = 0.0) between Front and Back Surfaces
  for (let i = 0; i < numTheta; i++) {
    const fA = i * (numR + 1);
    const fB = (i + 1) * (numR + 1);

    const bA = frontVertexCount + i * (numR + 1);
    const bB = frontVertexCount + (i + 1) * (numR + 1);

    indices.push(fA, bA, fB);
    indices.push(fB, bA, bB);
  }

  const seamlessPinnaGeo = new THREE.BufferGeometry();
  seamlessPinnaGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  seamlessPinnaGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  seamlessPinnaGeo.setIndex(indices);
  seamlessPinnaGeo.computeVertexNormals();

  return seamlessPinnaGeo;
}

// ==========================================
// 2. EXTERNAL AUDITORY MEATUS (EAR CANAL)
// ==========================================
export function createEarCanalPath() {
  // S-shaped trajectory from Concha opening (x = -0.5, y = 0.2, z = 0.2)
  // heading medially (-X direction) into the temporal bone towards eardrum at (x = -5.0, y = 0.0, z = -0.3)
  const canalControlPoints = [
    new THREE.Vector3(-0.4, 0.2, 0.15),   // Concha meatus entrance
    new THREE.Vector3(-1.3, 0.3, 0.25),   // Outer cartilaginous canal (slight anterior-superior curve)
    new THREE.Vector3(-2.6, 0.15, -0.05), // Isthmus (narrowest point)
    new THREE.Vector3(-3.8, 0.05, -0.2),  // Bony canal sloping downward
    new THREE.Vector3(-4.9, -0.05, -0.35), // Tympanic sulcus (eardrum attachment)
  ];
  return new THREE.CatmullRomCurve3(canalControlPoints);
}

export function createEarCanalGeometry(curve) {
  // Create hollow canal tube
  const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.72, 24, false);
  return tubeGeo;
}

// ==========================================
// 3. TYMPANIC MEMBRANE (EARDRUM)
// ==========================================
export function createTympanicMembraneGeometry() {
  // Tilted circular/elliptical cone with apex at the umbo depressed inward
  const radius = 0.85;
  const segments = 36;
  const coneGeo = new THREE.ConeGeometry(radius, 0.35, segments, 4, true);
  // Reorient so cone points inward (medially) toward malleus attachment
  coneGeo.rotateZ(Math.PI / 2);
  coneGeo.rotateY(0.25); // ~55° anatomical tilt relative to canal axis
  return coneGeo;
}

// ==========================================
// 4. AUDITORY OSSICLES (MALLEUS, INCUS, STAPES)
// ==========================================

export function createMalleusGeometries() {
  // Malleus (Hammer): Head, Neck, Lateral Process, and Manubrium (Handle)
  const headGeo = new THREE.SphereGeometry(0.38, 16, 14);
  headGeo.scale(1.2, 1.0, 0.9);

  // Neck
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, -0.3, 0.02),
    new THREE.Vector3(0.1, -0.6, 0.05),
  ]);
  const neckGeo = new THREE.TubeGeometry(neckCurve, 10, 0.2, 10, false);

  // Lateral Process (small tubercle at top of handle)
  const lateralProcessGeo = new THREE.ConeGeometry(0.12, 0.25, 8);
  lateralProcessGeo.rotateZ(-Math.PI / 2);
  lateralProcessGeo.translate(0.2, -0.6, 0.05);

  // Manubrium (Handle) attached to tympanic membrane
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, -0.6, 0.05),
    new THREE.Vector3(0.2, -1.0, 0.02),
    new THREE.Vector3(0.3, -1.45, -0.05), // Umbo tip
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 14, 0.15, 10, false);

  return { headGeo, neckGeo, lateralProcessGeo, handleGeo };
}

export function createIncusGeometries() {
  // Incus (Anvil): Body, Short Crus, Long Crus, Lenticular Process
  const bodyGeo = new THREE.SphereGeometry(0.36, 16, 14);
  bodyGeo.scale(1.1, 1.1, 1.2);

  // Short Crus (anchors posteriorly to fossa incudis)
  const shortCrusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(-0.35, 0.25, 0.3),
    new THREE.Vector3(-0.65, 0.35, 0.55),
  ]);
  const shortCrusGeo = new THREE.TubeGeometry(shortCrusCurve, 10, 0.16, 10, false);

  // Long Crus (descends vertically parallel to manubrium)
  const longCrusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(-0.1, -0.6, -0.1),
    new THREE.Vector3(-0.25, -1.1, -0.2),
  ]);
  const longCrusGeo = new THREE.TubeGeometry(longCrusCurve, 12, 0.14, 10, false);

  // Lenticular Process (knob articulating with stapes head)
  const lenticularGeo = new THREE.SphereGeometry(0.12, 10, 8);
  lenticularGeo.translate(-0.35, -1.15, -0.25);

  return { bodyGeo, shortCrusGeo, longCrusGeo, lenticularGeo };
}

export function createStapesGeometries() {
  // Stapes (Stirrup): Head, Anterior Crus, Posterior Crus, Footplate (Base)
  // Head
  const headGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 10);
  headGeo.rotateZ(Math.PI / 2);

  // Arch: Anterior and Posterior Crura
  const antCrusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.08, 0),
    new THREE.Vector3(-0.3, 0.18, 0.18),
    new THREE.Vector3(-0.7, 0.15, 0.25),
  ]);
  const antCrusGeo = new THREE.TubeGeometry(antCrusCurve, 12, 0.065, 8, false);

  const postCrusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.08, 0),
    new THREE.Vector3(-0.3, -0.18, -0.18),
    new THREE.Vector3(-0.7, -0.15, -0.25),
  ]);
  const postCrusGeo = new THREE.TubeGeometry(postCrusCurve, 12, 0.065, 8, false);

  // Footplate (Flat oval plate sitting in oval window)
  const footplateShape = new THREE.Shape();
  const w = 0.45;
  const h = 0.25;
  footplateShape.ellipse(0, 0, w, h, 0, Math.PI * 2);
  const footplateGeo = new THREE.ExtrudeGeometry(footplateShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.04,
    bevelThickness: 0.03,
  });
  footplateGeo.rotateY(Math.PI / 2);
  footplateGeo.translate(-0.75, 0, 0);

  return { headGeo, antCrusGeo, postCrusGeo, footplateGeo };
}

// ==========================================
// 5. INNER EAR: COCHLEA, VESTIBULE & SEMICIRCULAR CANALS
// ==========================================

export function createCochleaGeometry() {
  // Logarithmic spiral: 2.75 turns tapering from basal turn to apex
  const spiralPts = [];
  const numPts = 160;
  const totalTurns = 2.75;
  const maxRadius = 1.6;
  const heightTotal = 1.5;

  for (let i = 0; i <= numPts; i++) {
    const t = i / numPts;
    const angle = t * totalTurns * Math.PI * 2;
    // Logarithmic radius decay
    const r = maxRadius * (1 - 0.72 * Math.pow(t, 0.85));
    const x = -r * Math.cos(angle);
    const y = -r * Math.sin(angle);
    const z = heightTotal * t; // Tapering upward to apex
    spiralPts.push(new THREE.Vector3(x, y, z));
  }

  const cochleaCurve = new THREE.CatmullRomCurve3(spiralPts);
  
  // Custom tube radius function: tapering from basal diameter (0.55) to apical diameter (0.18)
  class VariableRadiusTubeGeometry extends THREE.BufferGeometry {
    constructor(curve, segments, radialSegments) {
      super();
      const frames = curve.computeFrenetFrames(segments, false);
      const positions = [];
      const normals = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const pt = curve.getPointAt(u);
        const N = frames.normals[i];
        const B = frames.binormals[i];
        // Radius decreases along length
        const radius = 0.52 * (1 - 0.65 * u);

        for (let j = 0; j <= radialSegments; j++) {
          const v = j / radialSegments;
          const theta = v * Math.PI * 2;
          const sin = Math.sin(theta);
          const cos = -Math.cos(theta);

          const normal = new THREE.Vector3()
            .copy(N).multiplyScalar(cos)
            .add(new THREE.Vector3().copy(B).multiplyScalar(sin))
            .normalize();

          const vertex = new THREE.Vector3()
            .copy(pt)
            .add(new THREE.Vector3().copy(normal).multiplyScalar(radius));

          positions.push(vertex.x, vertex.y, vertex.z);
          normals.push(normal.x, normal.y, normal.z);
          uvs.push(u, v);
        }
      }

      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialSegments; j++) {
          const a = i * (radialSegments + 1) + j;
          const b = (i + 1) * (radialSegments + 1) + j;
          const c = (i + 1) * (radialSegments + 1) + (j + 1);
          const d = i * (radialSegments + 1) + (j + 1);

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      this.setIndex(indices);
    }
  }

  const outerShellGeo = new VariableRadiusTubeGeometry(cochleaCurve, 100, 20);

  // Basilar membrane inside cochlea spiral (ribbon separating scalae)
  const basilarGeo = new THREE.BufferGeometry();
  const basilarPos = [];
  const basilarNorm = [];
  const basilarUV = [];
  const basilarIdx = [];
  const basilarSegments = 80;

  for (let i = 0; i <= basilarSegments; i++) {
    const u = i / basilarSegments;
    const pt = cochleaCurve.getPointAt(u);
    const tangent = cochleaCurve.getTangentAt(u);
    const up = new THREE.Vector3(0, 0, 1);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    // Basilar membrane is narrow at base (0.1) and wider at apex (0.28)
    const halfWidth = (0.08 + 0.18 * u);

    const p1 = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfWidth);
    const p2 = new THREE.Vector3().copy(pt).addScaledVector(normal, halfWidth);

    basilarPos.push(p1.x, p1.y, p1.z);
    basilarPos.push(p2.x, p2.y, p2.z);
    basilarNorm.push(0, 0, 1, 0, 0, 1);
    basilarUV.push(u, 0, u, 1);
  }

  for (let i = 0; i < basilarSegments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    basilarIdx.push(a, b, c);
    basilarIdx.push(b, d, c);
  }

  basilarGeo.setAttribute('position', new THREE.Float32BufferAttribute(basilarPos, 3));
  basilarGeo.setAttribute('normal', new THREE.Float32BufferAttribute(basilarNorm, 3));
  basilarGeo.setAttribute('uv', new THREE.Float32BufferAttribute(basilarUV, 2));
  basilarGeo.setIndex(basilarIdx);

  // Modiolus central core (cone)
  const modiolusGeo = new THREE.ConeGeometry(0.45, 1.6, 16);
  modiolusGeo.translate(0, 0, 0.7);

  return { outerShellGeo, basilarGeo, modiolusGeo, cochleaCurve };
}

export function createSemicircularCanalsGeometries() {
  // 3 Orthogonal Canals: Superior (Anterior), Posterior, Lateral (Horizontal)
  // 1. Superior Canal (Vertical in coronal-sagittal plane)
  const superiorPts = [];
  const supRadius = 1.1;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI * 1.35 - 0.2;
    superiorPts.push(new THREE.Vector3(
      -0.3 * Math.sin(angle),
      supRadius * Math.sin(angle) + 0.5,
      supRadius * Math.cos(angle)
    ));
  }
  const superiorCurve = new THREE.CatmullRomCurve3(superiorPts);
  const superiorGeo = new THREE.TubeGeometry(superiorCurve, 32, 0.16, 12, false);

  // 2. Posterior Canal (Vertical in orthogonal plane)
  const posteriorPts = [];
  const postRadius = 1.05;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI * 1.35 - 0.2;
    posteriorPts.push(new THREE.Vector3(
      postRadius * Math.cos(angle) - 0.2,
      postRadius * Math.sin(angle) + 0.3,
      0.3 * Math.sin(angle) - 0.5
    ));
  }
  const posteriorCurve = new THREE.CatmullRomCurve3(posteriorPts);
  const posteriorGeo = new THREE.TubeGeometry(posteriorCurve, 32, 0.15, 12, false);

  // 3. Lateral (Horizontal) Canal (Tilted ~30° to horizontal)
  const lateralPts = [];
  const latRadius = 0.95;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI * 1.4 - 0.3;
    lateralPts.push(new THREE.Vector3(
      latRadius * Math.cos(angle) + 0.2,
      -0.2 * Math.sin(angle) - 0.2,
      latRadius * Math.sin(angle) + 0.1
    ));
  }
  const lateralCurve = new THREE.CatmullRomCurve3(lateralPts);
  const lateralGeo = new THREE.TubeGeometry(lateralCurve, 32, 0.15, 12, false);

  // Central Vestibule chamber connecting canals and cochlea
  const vestibuleGeo = new THREE.SphereGeometry(0.75, 18, 14);
  vestibuleGeo.scale(1.2, 0.95, 1.1);

  // Ampullae (dilated bulbs at base of canals)
  const ampulla1Geo = new THREE.SphereGeometry(0.28, 12, 10);
  ampulla1Geo.translate(-0.1, 0.4, 1.0);

  const ampulla2Geo = new THREE.SphereGeometry(0.27, 12, 10);
  ampulla2Geo.translate(0.85, 0.2, -0.4);

  const ampulla3Geo = new THREE.SphereGeometry(0.26, 12, 10);
  ampulla3Geo.translate(-0.6, -0.3, 0.7);

  // Crus Commune (Common trunk uniting superior and posterior canals)
  const crusCommunePts = [
    new THREE.Vector3(-0.1, 1.4, -0.1),
    new THREE.Vector3(-0.1, 0.7, -0.1),
  ];
  const crusCommuneCurve = new THREE.CatmullRomCurve3(crusCommunePts);
  const crusCommuneGeo = new THREE.TubeGeometry(crusCommuneCurve, 10, 0.18, 10, false);

  return {
    superiorGeo,
    posteriorGeo,
    lateralGeo,
    vestibuleGeo,
    ampulla1Geo,
    ampulla2Geo,
    ampulla3Geo,
    crusCommuneGeo,
  };
}

// ==========================================
// 6. VESTIBULOCOCHLEAR NERVE (CN VIII)
// ==========================================
export function createNerveGeometries() {
  // Main nerve trunk leading into internal acoustic meatus
  const trunkPts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.8, -0.2, -0.3),
    new THREE.Vector3(-1.8, -0.5, -0.6),
  ];
  const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.32, 12, false);

  // Cochlear division fibers radiating from modiolus
  const cochlearBranchCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 0.2, 0.5),
      new THREE.Vector3(0.0, 0.1, 0.2),
      new THREE.Vector3(-0.5, -0.1, -0.1),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, -0.3, 0.3),
      new THREE.Vector3(0.1, -0.1, 0.1),
      new THREE.Vector3(-0.5, -0.1, -0.1),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, -0.5, 0.8),
      new THREE.Vector3(0.0, -0.2, 0.4),
      new THREE.Vector3(-0.5, -0.1, -0.1),
    ]),
  ];

  const cochlearBranchGeos = cochlearBranchCurves.map(
    curve => new THREE.TubeGeometry(curve, 14, 0.1, 8, false)
  );

  // Vestibular division fibers from ampullae
  const vestibularBranchCurves = [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.4, 1.0),
      new THREE.Vector3(-0.3, 0.2, 0.4),
      new THREE.Vector3(-0.7, 0.0, 0.0),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85, 0.2, -0.4),
      new THREE.Vector3(0.3, 0.1, -0.2),
      new THREE.Vector3(-0.7, 0.0, 0.0),
    ]),
  ];

  const vestibularBranchGeos = vestibularBranchCurves.map(
    curve => new THREE.TubeGeometry(curve, 14, 0.09, 8, false)
  );

  return { trunkGeo, cochlearBranchGeos, vestibularBranchGeos };
}

// ==========================================
// 7. SURROUNDING TEMPORAL BONE CUTAWAY
// ==========================================
export function createTemporalBoneCutawayGeometry() {
  // A stylized anatomical petrous block with hollowed out acoustic chambers
  const shape = new THREE.Shape();
  shape.moveTo(-6.5, -2.8);
  shape.lineTo(-6.5, 3.2);
  shape.lineTo(1.5, 3.2);
  shape.lineTo(1.5, -2.8);
  shape.closePath();

  // Cutout hole for the ear canal and tympanic cavity
  const hole = new THREE.Path();
  hole.moveTo(-0.5, 0.2);
  hole.quadraticCurveTo(-2.5, 0.4, -4.8, 0.0);
  hole.quadraticCurveTo(-5.5, -1.0, -4.5, -1.5);
  hole.quadraticCurveTo(-2.0, -1.2, -0.5, -0.8);
  hole.closePath();
  shape.holes.push(hole);

  const extrudeSettings = {
    depth: 4.5,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.3,
    bevelThickness: 0.3,
  };

  const boneGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  boneGeo.translate(0, 0, -2.25);
  return boneGeo;
}
