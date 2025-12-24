// MEMORY FIX: Centralized shared geometries for the entire game
// Import these cached geometries instead of using inline JSX geometry declarations
// which create NEW geometry objects on every React render

import * as THREE from 'three';

// ============================================================================
// BASIC SHAPES - Standard sizes, use mesh scale for variations
// ============================================================================

export const SPHERE_GEOMETRIES = {
  // Tiny (particles, small effects)
  tiny: new THREE.SphereGeometry(0.05, 8, 8),
  tinyHQ: new THREE.SphereGeometry(0.05, 16, 16),
  
  // Small (projectiles, orbs)
  small: new THREE.SphereGeometry(0.1, 8, 8),
  smallHQ: new THREE.SphereGeometry(0.1, 16, 16),
  
  // Medium (effects, impacts)
  medium: new THREE.SphereGeometry(0.3, 12, 12),
  mediumHQ: new THREE.SphereGeometry(0.3, 24, 24),
  
  // Large (shields, explosions)
  large: new THREE.SphereGeometry(1, 16, 16),
  largeHQ: new THREE.SphereGeometry(1, 32, 32),
  
  // Extra large (auras, big effects)
  xlarge: new THREE.SphereGeometry(2, 16, 16),
  
  // Unit (scale this for any size)
  unit: new THREE.SphereGeometry(1, 16, 16),
  unitHQ: new THREE.SphereGeometry(1, 32, 32),
};

export const CYLINDER_GEOMETRIES = {
  // Thin cylinders (lightning, beams)
  thin: new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
  thinTapered: new THREE.CylinderGeometry(0.03, 0.08, 1, 8),
  
  // Medium cylinders (weapons, effects)
  medium: new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
  mediumTapered: new THREE.CylinderGeometry(0.05, 0.15, 1, 8),
  
  // Thick cylinders (handles, pillars)
  thick: new THREE.CylinderGeometry(0.2, 0.2, 1, 12),
  thickTapered: new THREE.CylinderGeometry(0.15, 0.25, 1, 12),
  
  // Unit (scale for any size)
  unit: new THREE.CylinderGeometry(1, 1, 1, 12),
  unitTapered: new THREE.CylinderGeometry(0.5, 1, 1, 12),
  
  // Specific sizes for common use cases
  handle: new THREE.CylinderGeometry(0.03, 0.04, 0.9, 12),
  arrow: new THREE.CylinderGeometry(0.03, 0.125, 2.1, 6),
  beam: new THREE.CylinderGeometry(0.1, 0.3, 8, 8),
};

export const TORUS_GEOMETRIES = {
  // Rings (orbitals, halos)
  tiny: new THREE.TorusGeometry(0.1, 0.02, 8, 16),
  small: new THREE.TorusGeometry(0.2, 0.03, 8, 16),
  medium: new THREE.TorusGeometry(0.5, 0.05, 8, 24),
  large: new THREE.TorusGeometry(1, 0.1, 12, 32),
  xlarge: new THREE.TorusGeometry(3, 0.3, 8, 32),
  
  // Arc (partial torus for slashes)
  arcSmall: new THREE.TorusGeometry(2, 0.4, 16, 32, Math.PI),
  arcMedium: new THREE.TorusGeometry(3, 0.8, 8, 32, Math.PI),
  arcLarge: new THREE.TorusGeometry(3, 0.9, 16, 32, Math.PI),
  
  // Handle wrapping
  handleWrap: new THREE.TorusGeometry(0.045, 0.016, 8, 16),
  handleWrapSmall: new THREE.TorusGeometry(0.0225, 0.004, 8, 16),
  
  // Unit (scale for any size)
  unit: new THREE.TorusGeometry(1, 0.1, 12, 32),
};

export const BOX_GEOMETRIES = {
  tiny: new THREE.BoxGeometry(0.1, 0.1, 0.1),
  small: new THREE.BoxGeometry(0.2, 0.2, 0.2),
  medium: new THREE.BoxGeometry(0.5, 0.5, 0.5),
  large: new THREE.BoxGeometry(1, 1, 1),
  
  // Flat plates
  plateSmall: new THREE.BoxGeometry(0.1, 0.1, 0.3),
  plateMedium: new THREE.BoxGeometry(0.5, 0.5, 0.1),
  
  // Unit (scale for any size)
  unit: new THREE.BoxGeometry(1, 1, 1),
};

export const PLANE_GEOMETRIES = {
  small: new THREE.PlaneGeometry(1, 1),
  medium: new THREE.PlaneGeometry(2, 2),
  large: new THREE.PlaneGeometry(4, 4),
  xlarge: new THREE.PlaneGeometry(6, 1),
  
  // Unit (scale for any size)
  unit: new THREE.PlaneGeometry(1, 1),
  
  // Specific sizes
  slash: new THREE.PlaneGeometry(6, 1),
  trail: new THREE.PlaneGeometry(1, 0.1),
};

export const CONE_GEOMETRIES = {
  small: new THREE.ConeGeometry(0.1, 0.3, 8),
  medium: new THREE.ConeGeometry(0.2, 0.5, 8),
  large: new THREE.ConeGeometry(0.5, 1, 12),
  
  // Unit (scale for any size)
  unit: new THREE.ConeGeometry(1, 1, 12),
};

export const RING_GEOMETRIES = {
  small: new THREE.RingGeometry(0.1, 0.2, 16),
  medium: new THREE.RingGeometry(0.3, 0.5, 24),
  large: new THREE.RingGeometry(1, 1.5, 32),
  
  // Unit (scale for any size)
  unit: new THREE.RingGeometry(0.8, 1, 32),
};

// ============================================================================
// COMMON MATERIALS - Pre-allocated for frequent use cases
// ============================================================================

export const EFFECT_MATERIALS = {
  // Glows and emissions
  greenGlow: new THREE.MeshStandardMaterial({
    color: "#00ff44",
    emissive: "#00ff44",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
  }),
  greenGlowBright: new THREE.MeshStandardMaterial({
    color: "#66ff88",
    emissive: "#66ff88",
    emissiveIntensity: 3,
    transparent: true,
    opacity: 0.9,
  }),
  goldGlow: new THREE.MeshStandardMaterial({
    color: "#FFD700",
    emissive: "#FFD700",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
  }),
  redGlow: new THREE.MeshStandardMaterial({
    color: "#FF4444",
    emissive: "#FF4444",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
  }),
  purpleGlow: new THREE.MeshStandardMaterial({
    color: "#8B008B",
    emissive: "#8B008B",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
  }),
  blueGlow: new THREE.MeshStandardMaterial({
    color: "#00BFFF",
    emissive: "#00BFFF",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
  }),
  cyanGlow: new THREE.MeshStandardMaterial({
    color: "#00ffff",
    emissive: "#00ffff",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8,
  }),
  frostGlow: new THREE.MeshStandardMaterial({
    color: "#AAEEFF",
    emissive: "#AAEEFF",
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.7,
  }),
  whiteGlow: new THREE.MeshStandardMaterial({
    color: "#FFFFFF",
    emissive: "#FFFFFF",
    emissiveIntensity: 3,
    transparent: true,
    opacity: 0.9,
  }),
  
  // Basic materials
  darkMetal: new THREE.MeshStandardMaterial({
    color: "#2a3b4c",
    roughness: 0.7,
  }),
  lightMetal: new THREE.MeshStandardMaterial({
    color: "#4a5b6c",
    metalness: 0.8,
    roughness: 0.2,
  }),
};

// ============================================================================
// WEAPON-SPECIFIC GEOMETRIES
// ============================================================================

export const WEAPON_GEOMETRIES = {
  // Sword components
  swordGuard: new THREE.TorusGeometry(0.26, 0.07, 16, 32),
  swordCore: new THREE.SphereGeometry(0.155, 16, 16),
  swordGlow1: new THREE.SphereGeometry(0.1, 16, 16),
  swordGlow2: new THREE.SphereGeometry(0.145, 16, 16),
  swordGlow3: new THREE.SphereGeometry(0.175, 16, 16),
  swordDivineOrb: new THREE.SphereGeometry(1.05, 16, 16),
  swordDivineAura: new THREE.SphereGeometry(0.95, 12, 12),
  
  // Scythe components (add specific ones as needed)
  
  // Spear components (add specific ones as needed)
  
  // Bow components (add specific ones as needed)
  
  // Sabres components (add specific ones as needed)
};

// ============================================================================
// EFFECT-SPECIFIC GEOMETRIES
// ============================================================================

export const EFFECT_GEOMETRIES = {
  // Explosions
  explosionCore: new THREE.SphereGeometry(0.3, 32, 32),
  explosionInner: new THREE.SphereGeometry(0.2, 24, 24),
  explosionRing: new THREE.TorusGeometry(0.6, 0.045, 16, 32),
  explosionParticle: new THREE.SphereGeometry(0.05, 8, 8),
  
  // Lightning
  lightningBolt: new THREE.CylinderGeometry(0.1, 0.1, 20, 8),
  lightningImpact: new THREE.SphereGeometry(0.3, 8, 8),
  lightningSource: new THREE.SphereGeometry(0.4, 12, 12),
  lightningChain: new THREE.CylinderGeometry(0.05, 0.05, 1, 6),
  
  // Shields/Barriers
  shieldBubble: new THREE.SphereGeometry(0.8, 16, 16),
  shieldLarge: new THREE.SphereGeometry(2.5, 12, 12),
  
  // Projectiles
  fireball: new THREE.SphereGeometry(0.28, 32, 32),
  fireballTrail: new THREE.SphereGeometry(0.28, 16, 16),
  arrow: new THREE.CylinderGeometry(0.03, 0.125, 2.1, 6),
  arrowRing: new THREE.TorusGeometry(0.125, 0.05, 6, 12),
  
  // Slashes/Swipes
  slashArc: new THREE.TorusGeometry(3, 0.8, 8, 32, Math.PI),
  slashInner: new THREE.TorusGeometry(3, 0.4, 16, 32, Math.PI),
  slashOuter: new THREE.TorusGeometry(2, 0.9, 16, 32, Math.PI),
  slashPlane: new THREE.PlaneGeometry(6, 1),
  
  // Auras/Circles
  auraRing: new THREE.CylinderGeometry(0.5, 0.8, 0.1, 32),
  whirlwindRing: new THREE.TorusGeometry(3, 0.3, 8, 32),
  
  // Soul/Spirit effects
  soulOrb: new THREE.SphereGeometry(2, 16, 16),
  soulParticle: new THREE.SphereGeometry(0.15, 8, 8),
  soulShard: new THREE.BoxGeometry(0.1, 0.1, 0.3),
  
  // Beam effects
  beamCore: new THREE.CylinderGeometry(0.1, 0.3, 8, 8),
  beamThin: new THREE.CylinderGeometry(0.05, 0.05, 1, 6),
  
  // Summon effects
  summonPillar: new THREE.CylinderGeometry(0.5, 0.5, 4, 8),
  aegisProjectile: new THREE.CylinderGeometry(0.2, 0.15, 0.6, 6),
  dualWieldGlow: new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
  
  // Frost effects
  frostTrail: new THREE.SphereGeometry(0.8, 8, 8),
  glacialShield: new THREE.SphereGeometry(2.5, 12, 12),
  
  // Stealth effects
  stealthStrike: new THREE.SphereGeometry(1, 8, 8),
};

// ============================================================================
// SKELETON/ENEMY MODEL GEOMETRIES
// ============================================================================

export const SKELETON_GEOMETRIES = {
  // Head components
  skull: new THREE.SphereGeometry(0.22, 8, 8),
  facePlate: new THREE.BoxGeometry(0.28, 0.28, 0.1),
  cheekbone: new THREE.BoxGeometry(0.08, 0.12, 0.15),
  jaw: new THREE.CylinderGeometry(0.08, 0.08, 0.2, 5),
  
  // Eye components
  eyeCore: new THREE.SphereGeometry(0.02, 8, 8),
  eyeInner: new THREE.SphereGeometry(0.035, 8, 8),
  eyeOuter: new THREE.SphereGeometry(0.05, 6, 2),
  
  // Body components
  pelvis: new THREE.CylinderGeometry(0.21, 0.20, 0.2, 8),
  neck: new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6),
  
  // Limb components
  joint: new THREE.SphereGeometry(0.06, 8, 8),
  jointLarge: new THREE.SphereGeometry(0.075, 8, 8),
  kneeJoint: new THREE.SphereGeometry(0.08, 12, 12),
  elbowJoint: new THREE.SphereGeometry(0.12, 12, 12),
  bone: new THREE.CylinderGeometry(0.04, 0.032, 1, 6),
  
  // Hand/Foot
  handBase: new THREE.BoxGeometry(0.2, 0.15, 0.08),
  footPlate: new THREE.BoxGeometry(0.15, 0.02, 0.4),
  
  // Armor components
  shoulderBase: new THREE.CylinderGeometry(0.123, 0.19, 0.175, 6),
  armorPlate: new THREE.BoxGeometry(0.12, 0.19, 0.02),
  armorRidge: new THREE.BoxGeometry(0.035, 0.24, 0.015),
  
  // Rim/ring decorations
  rimTop: new THREE.TorusGeometry(0.065, 0.02, 3, 5),
  rimMid: new THREE.TorusGeometry(0.16, 0.02, 4, 5),
  rimBottom: new THREE.TorusGeometry(0.20, 0.02, 4, 5),
  rimHover: new THREE.TorusGeometry(0.125, 0.0175, 6, 6),
};

// ============================================================================
// GEAR/COSMETIC GEOMETRIES
// ============================================================================

export const GEAR_GEOMETRIES = {
  // Dragon parts
  hornBase: new THREE.ConeGeometry(0.08, 0.4, 8),
  hornTip: new THREE.ConeGeometry(0.04, 0.2, 6),
  skullPlate: new THREE.SphereGeometry(0.15, 8, 8),
  
  // Wing parts
  wingBone: new THREE.CylinderGeometry(0.02, 0.015, 1, 6),
  wingJoint: new THREE.SphereGeometry(0.03, 8, 8),
  wingMembrane: new THREE.PlaneGeometry(1, 1),
  
  // Tail parts
  tailSegment: new THREE.CylinderGeometry(0.05, 0.04, 0.3, 8),
  tailJoint: new THREE.SphereGeometry(0.04, 8, 8),
  tailSpike: new THREE.ConeGeometry(0.03, 0.15, 6),
};

// ============================================================================
// MULTIPLAYER EFFECT GEOMETRIES - For synchronized effects rendering
// ============================================================================

export const MULTIPLAYER_EFFECT_GEOMETRIES = {
  // Explosion effects (dynamically scaled)
  explosionSphere: new THREE.SphereGeometry(1, 32, 32),
  explosionInner: new THREE.SphereGeometry(1, 24, 24),
  explosionRing: new THREE.TorusGeometry(1, 0.075, 16, 32),
  explosionSpark: new THREE.SphereGeometry(1, 8, 8),
  
  // Fireball effects
  fireballCore: new THREE.SphereGeometry(0.28, 32, 32),
  fireballTrail: new THREE.SphereGeometry(0.28, 16, 16),
  
  // Arrow/projectile effects
  arrowBody: new THREE.CylinderGeometry(0.03, 0.125, 2.1, 6),
  arrowRing: new THREE.TorusGeometry(0.125, 0.05, 6, 12),
  
  // Whirlwind/aura effects
  whirlwindRing: new THREE.TorusGeometry(3, 0.3, 8, 32),
  auraRing: new THREE.RingGeometry(0.85, 1.0, 32),
  
  // Slash arc effects
  slashArc: new THREE.TorusGeometry(3, 0.8, 8, 32, Math.PI),
  slashInner: new THREE.TorusGeometry(3, 0.4, 16, 32, Math.PI),
  slashOuter: new THREE.TorusGeometry(2, 0.9, 16, 32, Math.PI),
  
  // Shield effects
  shieldBubble: new THREE.SphereGeometry(0.8, 16, 16),
  shieldLarge: new THREE.SphereGeometry(1, 12, 12), // Scale for 2.5 or 3
  
  // Soul/spirit effects
  soulOrb: new THREE.SphereGeometry(2, 16, 16),
  soulParticle: new THREE.SphereGeometry(0.15, 8, 8),
  soulShard: new THREE.BoxGeometry(0.1, 0.1, 0.3),
  
  // Lightning/beam effects
  lightningBolt: new THREE.CylinderGeometry(0.1, 0.1, 1, 8), // Scale height
  lightningImpact: new THREE.SphereGeometry(0.3, 8, 8),
  lightningSource: new THREE.SphereGeometry(0.4, 12, 12),
  
  // Charge area effects
  chargeArea: new THREE.PlaneGeometry(1, 1), // Scale for charge progress
  
  // Dragon breath cone
  breathCone: new THREE.ConeGeometry(4, 8, 8),
  
  // Totem/pillar effects
  totemPillar: new THREE.CylinderGeometry(0.5, 0.5, 4, 8),
  
  // Aegis projectile
  aegisProjectile: new THREE.CylinderGeometry(0.2, 0.15, 0.6, 6),
  
  // Glacial effects
  glacialShard: new THREE.ConeGeometry(0.3, 1.5, 6),
  glacialTrail: new THREE.SphereGeometry(0.8, 8, 8),
  glacialShield: new THREE.SphereGeometry(2.5, 12, 12),
  icicle: new THREE.ConeGeometry(0.075, 0.3, 6),
  icicleSmall: new THREE.ConeGeometry(0.05, 0.15, 6),
  
  // Deep freeze
  icosahedron: new THREE.IcosahedronGeometry(1.5, 1),
  
  // Stealth effects
  stealthStrike: new THREE.SphereGeometry(1, 8, 8),
  stealthMist: new THREE.SphereGeometry(3, 16, 16),
  
  // Blizzard
  blizzardArea: new THREE.CylinderGeometry(6, 6, 0.5, 16),
  
  // Lava/fire projectiles
  lavaCore: new THREE.SphereGeometry(0.25, 16, 16),
  lavaInner: new THREE.SphereGeometry(0.2, 12, 12),
  lavaOuter: new THREE.SphereGeometry(0.35, 12, 12),
  lavaRing: new THREE.TorusGeometry(0.375, 0.04, 6, 12),
  lavaTrail: new THREE.SphereGeometry(0.205, 12, 12),
  
  // Pyroclast
  pyroclastCore: new THREE.SphereGeometry(0.5, 8, 8),
  pyroclastTrail: new THREE.SphereGeometry(0.3, 6, 6),
  pyroclastExplosion: new THREE.SphereGeometry(3, 12, 12),
  
  // Reignite
  reigniteColumn: new THREE.CylinderGeometry(0.5, 1, 2, 8),
  
  // Breach
  breachTorus: new THREE.TorusGeometry(2, 0.5, 8, 16),
  
  // Bow powershot beams
  beamCore: new THREE.CylinderGeometry(0.025, 0.025, 20, 8),
  beamGlow: new THREE.CylinderGeometry(0.0625, 0.0625, 20, 8),
  beamSpark: new THREE.SphereGeometry(0.02, 4, 4),
  
  // Barrage arrows
  barrageArrow: new THREE.CylinderGeometry(0.04, 0.15, 2.5, 6),
  barrageRing: new THREE.TorusGeometry(0.15, 0.06, 6, 12),
  
  // Eagle eye
  eagleEyeOuter: new THREE.RingGeometry(0.6, 0.8, 32),
  eagleEyeInner: new THREE.RingGeometry(0.2, 0.3, 32),
  eagleEyeLine: new THREE.BoxGeometry(0.05, 0.05, 0.4),
  
  // Venom
  venomCloud: new THREE.SphereGeometry(1.5, 16, 16),
  venomParticle: new THREE.SphereGeometry(0.1, 8, 8),
  
  // Combo indicators
  comboRing: new THREE.RingGeometry(1.2, 1.5, 32),
  comboOrb: new THREE.SphereGeometry(0.1, 8, 8),
  
  // Dragon claw slash
  clawSlash: new THREE.PlaneGeometry(6, 1),
  
  // CrossEntropy bolt
  crossEntropyBolt: new THREE.SphereGeometry(0.28, 8, 8),
  
  // Dual wield
  dualWieldGlow: new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
  
  // Soul Reaper mark
  soulReaperMarkOuter: new THREE.RingGeometry(1.2, 1.5, 32),
  soulReaperMarkInner: new THREE.RingGeometry(0.6, 0.8, 32),
  soulReaperSymbol: new THREE.BoxGeometry(0.1, 0.1, 0.3),
  
  // Soul Reaper sword
  soulReaperBlade: new THREE.CylinderGeometry(0.1, 0.05, 3, 8),
  soulReaperGlow: new THREE.CylinderGeometry(0.15, 0.1, 3.2, 8),
  soulReaperTrail: new THREE.CylinderGeometry(0.2, 0.05, 4, 8),
  
  // Frenzy aura
  frenzyRing: new THREE.RingGeometry(0.85, 1.0, 3),
  frenzyGlow: new THREE.CylinderGeometry(0.5, 0.8, 0.1, 32),
};

// ============================================================================
// MODEL GEOMETRIES - For enemy/unit models
// ============================================================================

export const MODEL_GEOMETRIES = {
  // Skull/head parts
  cranium: new THREE.SphereGeometry(0.22, 8, 8),
  craniumLarge: new THREE.SphereGeometry(0.26, 8, 8),
  facePlate: new THREE.BoxGeometry(0.28, 0.28, 0.1),
  facePlateLarge: new THREE.BoxGeometry(0.34, 0.34, 0.12),
  cheekbone: new THREE.BoxGeometry(0.08, 0.12, 0.15),
  jaw: new THREE.CylinderGeometry(0.08, 0.08, 0.2, 5),
  jawLarge: new THREE.CylinderGeometry(0.10, 0.10, 0.24, 5),
  
  // Eye parts
  eyeSmall: new THREE.SphereGeometry(0.02, 8, 8),
  eyeMedium: new THREE.SphereGeometry(0.025, 8, 8),
  eyeLarge: new THREE.SphereGeometry(0.035, 8, 8),
  
  // Teeth
  toothSmall: new THREE.ConeGeometry(0.01, 0.08, 3),
  toothMedium: new THREE.ConeGeometry(0.03, 0.075, 3),
  
  // Shoulder plates
  shoulderBase: new THREE.CylinderGeometry(0.185, 0.2, 0.225, 4),
  shoulderSpike: new THREE.CylinderGeometry(0.06, 0.06, 0.115, 4),
  shoulderSpikeMid: new THREE.CylinderGeometry(0.04, 0.03, 0.12, 4),
  shoulderSpikeTip: new THREE.ConeGeometry(0.04, 0.175, 4),
  shoulderRidge: new THREE.BoxGeometry(0.01, 0.12, 0.02),
  
  // Shoulder - titan scale
  titanShoulderBase: new THREE.CylinderGeometry(0.369, 0.57, 0.525, 6),
  titanShoulderPlate: new THREE.BoxGeometry(0.36, 0.57, 0.06),
  titanShoulderRidge: new THREE.BoxGeometry(0.105, 0.72, 0.045),
  titanShoulderRimSmall: new THREE.TorusGeometry(0.195, 0.06, 3, 5),
  titanShoulderRimMed: new THREE.TorusGeometry(0.48, 0.06, 4, 5),
  titanShoulderRimLarge: new THREE.TorusGeometry(0.60, 0.06, 4, 5),
  titanShoulderRimHover: new THREE.TorusGeometry(0.375, 0.0525, 6, 6),
  
  // Horn segments
  hornBase: new THREE.CylinderGeometry(0.15, 0.138, 0.12, 4),
  hornRidge: new THREE.BoxGeometry(0.06, 0.132, 0.03),
  
  // Pelvis
  pelvisBowl: new THREE.CylinderGeometry(0.35, 0.34, 0.27, 8),
  pelvisBowlSmall: new THREE.CylinderGeometry(0.31, 0.30, 0.24, 8),
  pelvisJoint: new THREE.SphereGeometry(0.075, 8, 8),
  pelvisJointLarge: new THREE.SphereGeometry(0.11, 8, 8),
  
  // Neck
  neck: new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6),
  neckSmall: new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6),
  neckLarge: new THREE.CylinderGeometry(0.066, 0.066, 0.165, 6),
  
  // Foot/boot
  footPlate: new THREE.BoxGeometry(0.15, 0.02, 0.4),
  footPlateLarge: new THREE.BoxGeometry(0.45, 0.06, 1.2),
  
  // Hand
  handBase: new THREE.BoxGeometry(0.2, 0.15, 0.08),
  handBaseLarge: new THREE.BoxGeometry(0.6, 0.45, 0.24),
  
  // Claw joint
  clawJoint: new THREE.SphereGeometry(0.12, 12, 12),
  clawJointLarge: new THREE.SphereGeometry(0.36, 12, 12),
  
  // Knee joint
  kneeJoint: new THREE.SphereGeometry(0.08, 12, 12),
  kneeJointLarge: new THREE.SphereGeometry(0.24, 12, 12),
  
  // Health bar geometries (for multiplayer)
  healthBarBg: new THREE.PlaneGeometry(1, 0.1),
  healthBarFill: new THREE.PlaneGeometry(1, 0.08),
  nameTagBg: new THREE.PlaneGeometry(2, 0.3),
  nameTagFill: new THREE.PlaneGeometry(1.9, 0.25),
  disconnectIndicator: new THREE.SphereGeometry(0.1, 8, 8),
  
  // Player outer glow
  playerGlow: new THREE.SphereGeometry(0.415, 32, 32),
};

// ============================================================================
// ABYSSAL SKELETON SPECIFIC GEOMETRIES
// ============================================================================

export const ABYSSAL_SKELETON_GEOMETRIES = {
  // Shoulder pauldron
  shoulderPauldron: new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.9),
  shoulderPlate: new THREE.BoxGeometry(0.1, 0.165, 0.033),
  shoulderSpike: new THREE.ConeGeometry(0.022, 0.12, 8),
  shoulderSpikeBase: new THREE.CylinderGeometry(0.033, 0.022, 0.055, 8),
  shoulderTrimSmall: new THREE.TorusGeometry(0.165, 0.016, 6, 12),
  shoulderTrimMed: new THREE.TorusGeometry(0.198, 0.022, 8, 16),
  shoulderTrimLarge: new THREE.TorusGeometry(0.22, 0.018, 8, 16),
  shoulderEmblem: new THREE.CylinderGeometry(0.055, 0.055, 0.022, 8),
  shoulderEmblemInner: new THREE.CylinderGeometry(0.033, 0.033, 0.011, 6),
  shoulderEmblemSpike: new THREE.ConeGeometry(0.016, 0.044, 6),
  shoulderGuard: new THREE.BoxGeometry(0.088, 0.132, 0.055),
  shoulderGuardTrim: new THREE.BoxGeometry(0.099, 0.143, 0.011),
  
  // Leg parts  
  kneeJoint: new THREE.SphereGeometry(0.088, 12, 12),
  bootBody: new THREE.BoxGeometry(0.175, 0.21, 0.55),
  bootFront: new THREE.BoxGeometry(0.15, 0.225, 0.055),
  bootTop: new THREE.BoxGeometry(0.14, 0.25, 0.018),
  bootSole: new THREE.BoxGeometry(0.175, 0.325, 0.044),
  bootSide: new THREE.BoxGeometry(0.0175, 0.40, 0.14),
  
  // Claw/hand
  clawJoint: new THREE.SphereGeometry(0.132, 12, 12),
  handBase: new THREE.BoxGeometry(0.22, 0.165, 0.088),
  
  // Head
  cranium: new THREE.SphereGeometry(0.26, 8, 8),
  facePlate: new THREE.BoxGeometry(0.34, 0.34, 0.12),
  jaw: new THREE.CylinderGeometry(0.10, 0.10, 0.24, 5),
  eye: new THREE.SphereGeometry(0.025, 8, 8),
  helmetBowl: new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
  
  // Pelvis
  pelvis: new THREE.CylinderGeometry(0.22, 0.20, 0.18, 8),
  pelvisJoint: new THREE.SphereGeometry(0.08, 8, 8),
  girdle: new THREE.CylinderGeometry(0.275, 0.275, 0.08, 16),
  kiltPlate: new THREE.BoxGeometry(0.25, 0.375, 0.02),
  kiltTrim: new THREE.BoxGeometry(0.09, 0.18, 0.01),
  
  // Neck
  neck: new THREE.CylinderGeometry(0.066, 0.066, 0.165, 6),
};

// ============================================================================
// HELPER FUNCTION - Get geometry with scale recommendation
// ============================================================================

/**
 * Helper to choose the right base geometry and calculate scale
 * @param type - Type of geometry (sphere, cylinder, etc.)
 * @param targetSize - The size you want
 * @returns Object with geometry ref and scale multiplier
 */
export function getScaledGeometry(
  type: 'sphere' | 'cylinder' | 'torus' | 'box' | 'plane',
  targetSize: number
): { geometry: THREE.BufferGeometry; scale: number } {
  switch (type) {
    case 'sphere':
      if (targetSize <= 0.1) return { geometry: SPHERE_GEOMETRIES.small, scale: targetSize / 0.1 };
      if (targetSize <= 0.5) return { geometry: SPHERE_GEOMETRIES.medium, scale: targetSize / 0.3 };
      return { geometry: SPHERE_GEOMETRIES.unit, scale: targetSize };
    case 'cylinder':
      return { geometry: CYLINDER_GEOMETRIES.unit, scale: targetSize };
    case 'torus':
      return { geometry: TORUS_GEOMETRIES.unit, scale: targetSize };
    case 'box':
      return { geometry: BOX_GEOMETRIES.unit, scale: targetSize };
    case 'plane':
      return { geometry: PLANE_GEOMETRIES.unit, scale: targetSize };
    default:
      return { geometry: SPHERE_GEOMETRIES.unit, scale: targetSize };
  }
}

