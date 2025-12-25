// src/weapons/Sword.tsx

import { useRef } from 'react';
import { Group, Shape, Vector3, Color, AdditiveBlending, ExtrudeGeometry, CylinderGeometry, TorusGeometry, ConeGeometry, SphereGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponSubclass } from './weapons';

// Pre-allocated colors for performance - avoids new THREE.Color() on every render
const SWORD_COLORS = {
  // Chain lightning colors
  chainLightningGold: new Color(0xFFD700),
  chainLightningOrange: new Color(0xFFA500),
  // Sword glow colors
  swordYellow: new Color(0xFFFF00),
  swordOrange: new Color(0xFF6F00),
  swordBrightOrange: new Color(0xFFB700),
  // Divine storm colors
  divineGold: new Color(0xFFD700),
  divineCornsilk: new Color(0xFFF8DC),
} as const;

// =============================================================================
// SHARED SHAPES - Created ONCE at module load to prevent memory leaks
// =============================================================================

const createBladeShapeOnce = (): Shape => {
  const shape = new Shape();
  
  // Start at center
  shape.moveTo(0, 0);
  
  // Left side guard (fixed symmetry)
  shape.lineTo(-0.25, 0.25);  
  shape.lineTo(-0.15, -0.15); 
  shape.lineTo(0, 0);
  
  // Right side guard (matches left exactly)
  shape.lineTo(0.25, 0.25);
  shape.lineTo(0.15, -0.15);
  shape.lineTo(0, 0);
  
  // Blade shape with symmetry
  shape.lineTo(0, 0.08);
  shape.lineTo(0.2, 0.2);
  shape.quadraticCurveTo(0.8, 0.15, 1.5, 0.18);
  shape.quadraticCurveTo(2.0, 0.1, 2.2, 0);
  
  shape.quadraticCurveTo(2.0, -0.1, 1.5, -0.18);
  shape.quadraticCurveTo(0.8, -0.15, 0.2, -0.2);
  shape.lineTo(0, -0.08);
  shape.lineTo(0, 0);
  
  return shape;
};

const createInnerBladeShapeOnce = (): Shape => {
  const shape = new Shape();
  shape.moveTo(0, 0);
  
  shape.lineTo(0, 0.06);   
  shape.lineTo(0.15, 0.15); 
  shape.quadraticCurveTo(1.2, 0.12, 1.5, 0.15); 
  shape.quadraticCurveTo(2.0, 0.08, 2.15, 0);    
  shape.quadraticCurveTo(2.0, -0.08, 1.5, -0.15); 
  shape.quadraticCurveTo(1.2, -0.12, 0.15, -0.15);
  shape.lineTo(0, -0.05);  
  shape.lineTo(0, 0);
  
  return shape;
};

// Create shapes once
const BLADE_SHAPE = createBladeShapeOnce();
const INNER_BLADE_SHAPE = createInnerBladeShapeOnce();

// Extrude settings (static, never change)
const BLADE_EXTRUDE_SETTINGS = {
  steps: 2,
  depth: 0.05,
  bevelEnabled: true,
  bevelThickness: 0.014,
  bevelSize: 0.02,
  bevelOffset: 0.04,
  bevelSegments: 2
};

const INNER_BLADE_EXTRUDE_SETTINGS = {
  ...BLADE_EXTRUDE_SETTINGS,
  depth: 0.06,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelOffset: 0,
  bevelSegments: 6
};

const ELECTRICAL_AURA_EXTRUDE_SETTINGS = {
  ...BLADE_EXTRUDE_SETTINGS,
  depth: 0.07
};

// =============================================================================
// SHARED GEOMETRIES - Created ONCE at module load to prevent memory leaks
// =============================================================================

const SWORD_SHARED_GEOMETRIES = {
  // Handle
  handle: new CylinderGeometry(0.03, 0.04, 0.9, 12),
  handleWrapping: new TorusGeometry(0.045, 0.016, 8, 16),
  
  // Guard
  guardTorus: new TorusGeometry(0.26, 0.07, 16, 32),
  guardSpike: new ConeGeometry(0.070, 0.55, 3),
  
  // Orb spheres
  orbCore: new SphereGeometry(0.155, 16, 16),
  orbGlow1: new SphereGeometry(0.1, 16, 16),
  orbGlow2: new SphereGeometry(0.145, 16, 16),
  orbGlow3: new SphereGeometry(0.175, 16, 16),
  
  // Blades
  blade: new ExtrudeGeometry(BLADE_SHAPE, BLADE_EXTRUDE_SETTINGS),
  innerBlade: new ExtrudeGeometry(INNER_BLADE_SHAPE, INNER_BLADE_EXTRUDE_SETTINGS),
  electricalAura: new ExtrudeGeometry(BLADE_SHAPE, ELECTRICAL_AURA_EXTRUDE_SETTINGS),
  
  // Effects
  sparkParticle: new SphereGeometry(1.25, 6, 6),
  divineOrb: new SphereGeometry(1.05, 16, 16),
  divineAura: new SphereGeometry(0.95, 12, 12)
};

// =============================================================================
// SHARED MATERIALS - Created ONCE at module load to prevent memory leaks
// =============================================================================

const SWORD_SHARED_MATERIALS = {
  handle: new MeshStandardMaterial({ color: "#2a3b4c", roughness: 0.7 }),
  handleWrapping: new MeshStandardMaterial({ color: "#1a2b3c", metalness: 0.6, roughness: 0.4 }),
  guard: new MeshStandardMaterial({ color: "#4a5b6c", metalness: 0.9, roughness: 0.1 }),
  orbCore: new MeshStandardMaterial({
    color: SWORD_COLORS.swordYellow,
    emissive: SWORD_COLORS.swordOrange,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 1
  }),
  orbGlow1: new MeshStandardMaterial({
    color: SWORD_COLORS.swordYellow,
    emissive: SWORD_COLORS.swordYellow,
    emissiveIntensity: 40,
    transparent: true,
    opacity: 0.8
  }),
  orbGlow2: new MeshStandardMaterial({
    color: SWORD_COLORS.swordYellow,
    emissive: SWORD_COLORS.swordOrange,
    emissiveIntensity: 35,
    transparent: true,
    opacity: 0.6
  }),
  orbGlow3: new MeshStandardMaterial({
    color: SWORD_COLORS.swordYellow,
    emissive: SWORD_COLORS.swordOrange,
    emissiveIntensity: 30,
    transparent: true,
    opacity: 0.4
  }),
  blade: new MeshStandardMaterial({
    color: SWORD_COLORS.swordOrange,
    emissive: SWORD_COLORS.swordOrange,
    emissiveIntensity: 2.5,
    metalness: 0.3,
    roughness: 0.1
  }),
  innerBlade: new MeshStandardMaterial({
    color: SWORD_COLORS.swordBrightOrange,
    emissive: SWORD_COLORS.swordOrange,
    emissiveIntensity: 5,
    metalness: 0.2,
    roughness: 0.1,
    opacity: 0.8,
    transparent: true
  }),
  electricalAura: new MeshStandardMaterial({
    color: SWORD_COLORS.chainLightningGold,
    emissive: SWORD_COLORS.chainLightningOrange,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.3,
    blending: AdditiveBlending
  }),
  divineOrb: new MeshStandardMaterial({
    color: SWORD_COLORS.divineGold,
    emissive: SWORD_COLORS.divineGold,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.3,
    blending: AdditiveBlending
  }),
  divineAura: new MeshStandardMaterial({
    color: SWORD_COLORS.divineCornsilk,
    emissive: SWORD_COLORS.divineGold,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.15,
    blending: AdditiveBlending
  })
};

interface SwordProps {
  isSwinging: boolean;
  isSmiting: boolean;
  isOathstriking: boolean;
  isDivineStorming?: boolean;
  isColossusStriking?: boolean;
  onSwingComplete?: () => void;
  onSmiteComplete?: () => void;
  onOathstrikeComplete?: () => void;
  onDivineStormComplete?: () => void;
  onColossusStrikeComplete?: () => void;
  hasChainLightning?: boolean;
  comboStep?: 1 | 2 | 3;
  currentSubclass?: WeaponSubclass;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  onHit?: (targetId: string, damage: number) => void;
  setDamageNumbers?: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isHealing?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isSmite?: boolean;
    isOathstrike?: boolean;
    isFirebeam?: boolean;
    isOrbShield?: boolean;
    isChainLightning?: boolean;
    isFireball?: boolean;
    isSummon?: boolean;
    isStealthStrike?: boolean;
    isPyroclast?: boolean;
    isEagleEye?: boolean;
    isBreach?: boolean;
    isBarrage?: boolean;
    isGlacialShard?: boolean;
    isAegis?: boolean;
    isCrossentropyBolt?: boolean;
    isDivineStorm?: boolean;
    isHolyBurn?: boolean;
    isEviscerate?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isHealing?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isSmite?: boolean;
    isOathstrike?: boolean;
    isFirebeam?: boolean;
    isOrbShield?: boolean;
    isChainLightning?: boolean;
    isFireball?: boolean;
    isSummon?: boolean;
    isStealthStrike?: boolean;
    isPyroclast?: boolean;
    isEagleEye?: boolean;
    isBreach?: boolean;
    isBarrage?: boolean;
    isGlacialShard?: boolean;
    isAegis?: boolean;
    isCrossentropyBolt?: boolean;
    isDivineStorm?: boolean;
    isHolyBurn?: boolean;
    isEviscerate?: boolean;
  }>) => void;
  nextDamageNumberId?: { current: number };
  setActiveEffects?: (callback: (prev: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>) => void;
  playerPosition?: Vector3;
}

export default function Sword({ 
  isSwinging, 
  isSmiting, 
  isOathstriking, 
  isDivineStorming = false,
  isColossusStriking = false,
  onSwingComplete, 
  onSmiteComplete,
  onOathstrikeComplete,
  onDivineStormComplete,
  onColossusStrikeComplete,
  hasChainLightning = false,
  comboStep = 1,
  currentSubclass,
  enemyData = [],
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  setActiveEffects,
  playerPosition
}: SwordProps) {
  const swordRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const smiteProgress = useRef(0);
  const colossusStrikeProgress = useRef(0);
  const divineStormRotation = useRef(0);
  const lastDivineStormHitTime = useRef<Record<string, number>>({});
  const basePosition = [-1.18, 0.225, 0.3] as const;
  
  // Chain Lightning Sparks
  const sparkParticles = useRef<Array<{
    position: Vector3;
    velocity: Vector3;
    life: number;
    scale: number;
  }>>([]);

  // Divine Storm DoT tracking
  const divineStormDoTEnemies = useRef<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>({});

  useFrame((_, delta) => {
    if (!swordRef.current) return;

    // Handle Divine Storm DoT ticks
    const now = Date.now();
    Object.entries(divineStormDoTEnemies.current).forEach(([enemyId, dotData]) => {
      const timeElapsed = now - dotData.startTime;
      const timeSinceLastTick = now - dotData.lastTickTime;
      
      // Check if DoT has expired
      if (timeElapsed >= dotData.duration) {
        delete divineStormDoTEnemies.current[enemyId];
        return;
      }
      
      // Apply DoT damage every second (1000ms)
      if (timeSinceLastTick >= 1000) {
        const enemy = enemyData.find(e => e.id === enemyId);
        if (enemy && enemy.health > 0) {
          // Deal 29 holy burn damage
          onHit?.(enemyId, 29);
          
          // Add holy burn damage number
          if (setDamageNumbers && nextDamageNumberId) {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: 29,
              position: enemy.position.clone(),
              isCritical: false,
              isHolyBurn: true,
              createdAt: Date.now()
            }]);
          }
          
          // Update last tick time
          dotData.lastTickTime = now;
        } else {
          // Enemy is dead, remove from DoT tracking
          delete divineStormDoTEnemies.current[enemyId];
        }
      }
    });

    if (isOathstriking) {
      swingProgress.current += delta * 15;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.6, 1);
      
      const pivotX = basePosition[0] + Math.sin(swingPhase * Math.PI) * 2.5;
      const pivotY = basePosition[1] + Math.sin(swingPhase * Math.PI) * -1.0;
      const pivotZ = basePosition[2] + Math.cos(swingPhase * Math.PI) * 1;
      
      swordRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = +1.275;
      const rotationY = Math.sin(swingPhase * Math.PI) * Math.PI;
      const rotationZ = Math.sin(swingPhase * Math.PI * 1.275) * (Math.PI / 2.5);
      swordRef.current.rotation.set(rotationX, rotationY, rotationZ);
      
      if (swingProgress.current >= Math.PI) {
        swingProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onOathstrikeComplete?.();
      }
      return;
    }

    if (isDivineStorming) {
      const TARGET_ROTATIONS = 1;
      const MAX_ROTATION = TARGET_ROTATIONS * Math.PI * 4;
      
      const CONSTANT_ROTATION_SPEED = 20;
      
      divineStormRotation.current += delta * CONSTANT_ROTATION_SPEED;
      
      if (divineStormRotation.current >= MAX_ROTATION) {
        divineStormRotation.current = 0;
        lastDivineStormHitTime.current = {};
        
        swordRef.current.position.set(...basePosition);
        swordRef.current.rotation.set(0, 0, 0);
        
        onDivineStormComplete?.();
        return;
      }
      
      const orbitRadius = 1.5;
      const angle = divineStormRotation.current;
      
      const orbitalX = Math.cos(angle) * orbitRadius;
      const orbitalZ = Math.sin(angle) * orbitRadius;
      
      const fixedHeight = 0.65; 
      
      swordRef.current.rotation.set(
        Math.PI/2.25,
        -angle + Math.PI,
        1
      );
      
      swordRef.current.rotateY(-angle + Math.PI);
      
      swordRef.current.position.set(orbitalX, fixedHeight, orbitalZ);
      
      // Damage detection
      const damageNow = Date.now();
      enemyData.forEach(enemy => {
        if (!enemy.health || enemy.health <= 0) return;
        
        const lastHitTime = lastDivineStormHitTime.current[enemy.id] || 0;
        if (damageNow - lastHitTime < 200) return;
        
        const actualPlayerPosition = playerPosition || new Vector3(0, 0, 0);
        const distance = actualPlayerPosition.distanceTo(enemy.position);
        
        if (distance <= 5.0) {
          lastDivineStormHitTime.current[enemy.id] = damageNow;
          
          onHit?.(enemy.id, 79);
          
          if (setDamageNumbers && nextDamageNumberId) {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: 79,
              position: enemy.position.clone(),
              isCritical: false,
              isDivineStorm: true,
              createdAt: Date.now()
            }]);
          }
          
          divineStormDoTEnemies.current[enemy.id] = {
            startTime: damageNow,
            lastTickTime: damageNow,
            duration: 3000
          };
          
          if (setActiveEffects) {
            setActiveEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'holyBurn',
              position: enemy.position.clone(),
              direction: new Vector3(0, 1, 0),
              duration: 3.0,
              startTime: damageNow,
              targetId: enemy.id
            }]);
          }
        }
      });
      
      return;
    }

    if (isSmiting) {
      smiteProgress.current += delta * (smiteProgress.current < Math.PI/2 ? 3 : 6);
      const smitePhase = Math.min(smiteProgress.current / Math.PI, 1);
      
      let rotationX, rotationY, positionX, positionY, positionZ;
      
      if (smitePhase < 0.5) {
        const windupPhase = smitePhase * 0.45;
        rotationX = -Math.PI/3 - (windupPhase * Math.PI/3);
        rotationY = windupPhase * Math.PI/4;
        
        positionX = basePosition[0] + (windupPhase * 1.5);
        positionY = basePosition[1] + windupPhase * 1.5;
        positionZ = basePosition[2] - windupPhase * 1.5;
      } else {
        const strikePhase = (smitePhase - 0.5) * 2;
        rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
        rotationY = (Math.PI/4) * (1 - strikePhase);
      
        positionX = basePosition[0] + (1.5 * (1 - strikePhase));
        positionY = basePosition[1] + (1.5 - strikePhase * 2.0);
        positionZ = basePosition[2] - (1.5 - strikePhase * 3.0);
      }
      
      swordRef.current.position.set(
        positionX,
        positionY,
        positionZ
      );
      
      swordRef.current.rotation.set(rotationX, rotationY, 0);
      
      if (smiteProgress.current >= Math.PI) {
        smiteProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onSmiteComplete?.();
      }
      return;
    }

    if (isColossusStriking) {
      colossusStrikeProgress.current += delta * (colossusStrikeProgress.current < Math.PI/2 ? 3 : 6);
      const colossusPhase = Math.min(colossusStrikeProgress.current / Math.PI, 1);
      
      let rotationX, rotationY, positionX, positionY, positionZ;
      
      if (colossusPhase < 0.5) {
        const windupPhase = colossusPhase * 0.45;
        rotationX = -Math.PI/3 - (windupPhase * Math.PI/3);
        rotationY = windupPhase * Math.PI/4;
        
        positionX = basePosition[0] + (windupPhase * 1.5);
        positionY = basePosition[1] + windupPhase * 1.5;
        positionZ = basePosition[2] - windupPhase * 1.5;
      } else {
        const strikePhase = (colossusPhase - 0.5) * 2;
        rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
        rotationY = (Math.PI/4) * (1 - strikePhase);
      
        positionX = basePosition[0] + (1.5 * (1 - strikePhase));
        positionY = basePosition[1] + (1.5 - strikePhase * 2.0);
        positionZ = basePosition[2] - (1.5 - strikePhase * 3.0);
      }
      
      swordRef.current.position.set(
        positionX,
        positionY,
        positionZ
      );
      
      swordRef.current.rotation.set(rotationX, rotationY, 0);
      
      if (colossusStrikeProgress.current >= Math.PI) {
        colossusStrikeProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onColossusStrikeComplete?.();
      }
      return;
    }

    if (isSwinging) {
      swingProgress.current += delta * 7.5;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
      
      const effectiveComboStep = currentSubclass === WeaponSubclass.VENGEANCE ? comboStep : 1;
      
      const completionThreshold = effectiveComboStep === 3 ? Math.PI * 0.9 : Math.PI * 0.55;
      
      if (swingProgress.current >= completionThreshold) {
        swingProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onSwingComplete?.();
        return;
      }
      if (effectiveComboStep === 1) {
        const forwardPhase = swingPhase <= 0.25
          ? swingPhase * 2
          : (0.725 - (swingPhase - 0.115) * 1.1);
        
        const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * 2;
        const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -2;
        const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1;
        
        swordRef.current.position.set(pivotX, pivotY, pivotZ);
        
        const rotationX = Math.sin(forwardPhase * Math.PI) * (-0.75) + 1.25;
        const rotationY = Math.sin(forwardPhase * Math.PI) * Math.PI/1.125;
        const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 3);
        
        swordRef.current.rotation.set(rotationX, rotationY, rotationZ);
      } else if (effectiveComboStep === 2) {
        const forwardPhase = swingPhase <= 0.275
          ? swingPhase * 2
          : (0.625 - (swingPhase - 0.075) * 1.20);
        
        const leftOffset = 2.5;
        const pivotX = basePosition[0] + leftOffset - Math.sin(forwardPhase * Math.PI) * 2.5;
        const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -0.2;
        const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1.1;
        
        swordRef.current.position.set(pivotX, pivotY, pivotZ);
        
        const rotationX = Math.sin(forwardPhase * Math.PI) * (-0.75) +1.5;
        const rotationY = -Math.sin(forwardPhase * Math.PI) * Math.PI;
        const rotationZ = -Math.sin(forwardPhase * Math.PI) * (Math.PI/1.75);
        
        swordRef.current.rotation.set(rotationX, rotationY, rotationZ);
      } else if (effectiveComboStep === 3) {
        let rotationX, rotationY, positionX, positionY, positionZ;
        
        if (swingProgress.current <= delta * 3) {
          const currentPos = swordRef.current.position;
          const currentRot = swordRef.current.rotation;
          
          swordRef.current.userData = {
            startPos: [currentPos.x, currentPos.y, currentPos.z],
            startRot: [currentRot.x, currentRot.y, currentRot.z]
          };
        }
        
        const startPos = swordRef.current.userData?.startPos || basePosition;
        const startRot = swordRef.current.userData?.startRot || [0, 0, 0];
        
        if (swingPhase < 0.2) {
          const windupPhase = swingPhase * 5;
          
          const targetWindupX = basePosition[0] + 1.5;
          const targetWindupY = basePosition[1] + 1.5;
          const targetWindupZ = basePosition[2] - 1.5;
          
          positionX = startPos[0] + (targetWindupX - startPos[0]) * windupPhase;
          positionY = startPos[1] + (targetWindupY - startPos[1]) * windupPhase;
          positionZ = startPos[2] + (targetWindupZ - startPos[2]) * windupPhase;
          
          const targetRotX = -Math.PI/3 - Math.PI/3;
          const targetRotY = Math.PI/4;
          rotationX = startRot[0] + (targetRotX - startRot[0]) * windupPhase;
          rotationY = startRot[1] + (targetRotY - startRot[1]) * windupPhase;
        } else {
          const strikePhase = (swingPhase - 0.2) * 2;
          rotationX = -2*Math.PI/3 + (strikePhase * 3*Math.PI/2);
          rotationY = (Math.PI/4) * (1 - strikePhase);
        
          positionX = basePosition[0] + (1.5 * (1 - strikePhase));
          positionY = basePosition[1] + (2 - strikePhase * 5);
          positionZ = basePosition[2] - (1.5 - strikePhase * 3.5);
        }
        
        swordRef.current.position.set(positionX, positionY, positionZ);
        swordRef.current.rotation.set(rotationX, rotationY, 0);
      }
      
      if (swingProgress.current >= Math.PI) {
        swingProgress.current = 0;
        swordRef.current.rotation.set(0, 0, 0);
        swordRef.current.position.set(...basePosition);
        onSwingComplete?.();
      }
    } else if (!isSwinging && !isSmiting && !isColossusStriking) {
      swordRef.current.rotation.x *= 0.85;
      swordRef.current.rotation.y *= 0.85;
      swordRef.current.rotation.z *= 0.85;
      
      swordRef.current.position.x += (basePosition[0] - swordRef.current.position.x) * 0.14;
      swordRef.current.position.y += (basePosition[1] - swordRef.current.position.y) * 0.14;
      swordRef.current.position.z += (basePosition[2] - swordRef.current.position.z) * 0.14;
    }

    // Handle electrical effects when Chain Lightning is unlocked
    if (hasChainLightning && swordRef.current) {
      if (Math.random() < 0.8) {
        for (let i = 0; i < 3; i++) {
          const randomLength = Math.random() * 2.2;
          const randomOffset = new Vector3(
            (Math.random() - 0.5) * 0.4,
            randomLength,
            (Math.random() - 0.5) * 0.4
          );
          
          sparkParticles.current.push({
            position: randomOffset,
            velocity: new Vector3(
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.2) * 4,
              (Math.random() - 0.5) * 4
            ).multiplyScalar(0.8),
            life: 1.0,
            scale: Math.random() * 0.02 + 0.005
          });
        }
      }

      sparkParticles.current.forEach(spark => {
        spark.velocity.x += Math.sin(Date.now() * 0.01) * delta * 0.5;
        spark.velocity.z += Math.cos(Date.now() * 0.01) * delta * 0.5;
        spark.position.add(spark.velocity.clone().multiplyScalar(delta));
        spark.life -= delta * 1.5;
        spark.velocity.y += delta * 0.5;
      });

      if (sparkParticles.current.length > 120) {
        sparkParticles.current = sparkParticles.current.slice(-120);
      }

      sparkParticles.current = sparkParticles.current.filter(spark => spark.life > 0);
    }
  });

  return (
    <group rotation={[-0.575, 0, 0.2]}>
      <group 
        ref={swordRef} 
        position={[basePosition[0], basePosition[1], basePosition[2]]}
        rotation={[0, 0, Math.PI]}
        scale={[0.75, 0.8, 0.65]}
      >
        {/* Handle */}
        <group position={[-0.025, -0.55, 0.35]} rotation={[0, 0, -Math.PI]}>
          <mesh geometry={SWORD_SHARED_GEOMETRIES.handle} material={SWORD_SHARED_MATERIALS.handle} />
          
          {/* Handle wrappings */}
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={i} 
              position={[0, +0.35 - i * 0.11, 0]} 
              rotation={[Math.PI / 2, 0, 0]}
              geometry={SWORD_SHARED_GEOMETRIES.handleWrapping}
              material={SWORD_SHARED_MATERIALS.handleWrapping}
            />
          ))}
        </group>
        
        {/* CIRCLE CONNECTION POINT */}
        <group position={[-0.025, 0.225, 0.35]} rotation={[Math.PI, 1.5, Math.PI]}>
          {/* Large torus */}
          <mesh geometry={SWORD_SHARED_GEOMETRIES.guardTorus} material={SWORD_SHARED_MATERIALS.guard} />
          
          {/* Decorative spikes around torus */}
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={`spike-${i}`} 
              position={[
                0.25 * Math.cos(i * Math.PI / 4),
                0.25 * Math.sin(i * Math.PI / 4),
                0
              ]}
              rotation={[0, 0, i * Math.PI / 4 - Math.PI / 2]}
              geometry={SWORD_SHARED_GEOMETRIES.guardSpike}
              material={SWORD_SHARED_MATERIALS.guard}
            />
          ))}
          
          {/* Core orb and glow layers */}
          <mesh geometry={SWORD_SHARED_GEOMETRIES.orbCore} material={SWORD_SHARED_MATERIALS.orbCore} />
          <mesh geometry={SWORD_SHARED_GEOMETRIES.orbGlow1} material={SWORD_SHARED_MATERIALS.orbGlow1} />
          <mesh geometry={SWORD_SHARED_GEOMETRIES.orbGlow2} material={SWORD_SHARED_MATERIALS.orbGlow2} />
          <mesh geometry={SWORD_SHARED_GEOMETRIES.orbGlow3} material={SWORD_SHARED_MATERIALS.orbGlow3} />

          {/* Enhanced point light */}
          <pointLight 
            color={SWORD_COLORS.swordOrange}
            intensity={2}
            distance={0.5}
            decay={2}
          />
        </group>
        
        {/* Blade */}
        <group position={[0, 0.5, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]}>
          {/* Base blade */}
          <mesh geometry={SWORD_SHARED_GEOMETRIES.blade} material={SWORD_SHARED_MATERIALS.blade} />
          
          {/* BLADE Glowing core */}
          <mesh geometry={SWORD_SHARED_GEOMETRIES.innerBlade} material={SWORD_SHARED_MATERIALS.innerBlade} />
        </group>

        {/* Electrical effects */}
        {hasChainLightning && (
          <group>
            {/* Electrical aura around blade */}
            <group position={[0, 1, 0.35]} rotation={[0, -Math.PI / 2, Math.PI / 2]} scale={[0.95, 1.10, 0.95]}>
              <mesh geometry={SWORD_SHARED_GEOMETRIES.electricalAura} material={SWORD_SHARED_MATERIALS.electricalAura} />
            </group>

            {/* Enhanced spark particles */}
            {sparkParticles.current.map((spark, index) => (
              <mesh 
                key={index} 
                position={spark.position.toArray()}
                scale={[spark.scale, spark.scale, spark.scale]}
                geometry={SWORD_SHARED_GEOMETRIES.sparkParticle}
              >
                <meshStandardMaterial
                  color={SWORD_COLORS.chainLightningGold}
                  emissive={SWORD_COLORS.chainLightningOrange}
                  emissiveIntensity={3 * spark.life}
                  transparent
                  opacity={spark.life * 0.6}
                  blending={AdditiveBlending}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Divine Storm Holy Energy Effects */}
        {isDivineStorming && (
          <group>
            {/* Central holy orb */}
            <mesh geometry={SWORD_SHARED_GEOMETRIES.divineOrb} material={SWORD_SHARED_MATERIALS.divineOrb} />

            {/* Outer divine aura */}
            <mesh geometry={SWORD_SHARED_GEOMETRIES.divineAura} material={SWORD_SHARED_MATERIALS.divineAura} />

            {/* Divine light */}
            <pointLight 
              color={SWORD_COLORS.divineGold}
              intensity={1}
              distance={8}
              decay={1}
            />
          </group>
        )}
      </group>
    </group>
  );
}
