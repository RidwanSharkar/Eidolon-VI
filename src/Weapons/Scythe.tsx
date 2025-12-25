// src/weapons/Scythe.tsx

import React, { useRef, useEffect } from 'react';
import { Group, Shape, DoubleSide, ExtrudeGeometry, CylinderGeometry, TorusGeometry, MeshStandardMaterial, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponSubclass } from './weapons';

// =============================================================================
// SHARED SHAPES - Created ONCE at module load to prevent memory leaks
// =============================================================================

const createBladeShapeOnce = (): Shape => {
  const shape = new Shape();
  shape.moveTo(0, 0);
  
  // Create thick back edge first
  shape.lineTo(0.4, -0.130);
  shape.bezierCurveTo(
    0.8, 0.22,    // control point 1
    1.33, 0.5,    // control point 2
    1.6, 0.515    // end point (tip)
  );
  
  // Create sharp edge
  shape.lineTo(1.125, 0.75);
  shape.bezierCurveTo(
    0.5, 0.2,
    0.225, 0.0,
    0.1, 0.7
  );
  shape.lineTo(0, 0);
  return shape;
};

// Create shape once
const SCYTHE_BLADE_SHAPE = createBladeShapeOnce();

// Extrude settings (static, never change)
const BLADE_EXTRUDE_SETTINGS = {
  steps: 1,
  depth: 0.00010,
  bevelEnabled: true,
  bevelThickness: 0.030,
  bevelSize: 0.035,
  bevelSegments: 1,
  curveSegments: 16
};

const BLADE_MESH_EXTRUDE_SETTINGS = {
  ...BLADE_EXTRUDE_SETTINGS,
  depth: 0.03
};

// Pre-allocated colors
const SCYTHE_COLORS = {
  normal: new Color("#17CE54"),
  normalEmissive: new Color("#17CE54"),
  empowered: new Color("#8A2BE2"),
  empoweredEmissive: new Color("#9370DB"),
  handle: new Color("#a86432"),
  connector: new Color("#2c1810")
} as const;

// =============================================================================
// SHARED GEOMETRIES - Created ONCE at module load to prevent memory leaks
// =============================================================================

const SCYTHE_SHARED_GEOMETRIES = {
  // Handle
  handle: new CylinderGeometry(0.04, 0.04, 2.3, 12),
  handleWrapping: new TorusGeometry(0.07, 0.01, 8, 16),
  
  // Blade connector
  connector: new CylinderGeometry(0.08, 0.08, 0.3, 8),
  connectorGlow: new CylinderGeometry(0.13, 0.11, 0.32, 8),
  
  // Glow rings
  glowRing1: new TorusGeometry(0.14, 0.02, 16, 32),
  glowRing2: new TorusGeometry(0.155, 0.02, 16, 32),
  glowRing3: new TorusGeometry(0.17, 0.02, 16, 32),
  handleRing: new TorusGeometry(0.075, 0.02, 16, 32),
  
  // Blade
  blade: new ExtrudeGeometry(SCYTHE_BLADE_SHAPE, BLADE_MESH_EXTRUDE_SETTINGS)
};

// =============================================================================
// SHARED MATERIALS - Created ONCE at module load to prevent memory leaks
// These need to be cloned per-instance for empowered state changes
// =============================================================================

const SCYTHE_SHARED_MATERIALS = {
  handle: new MeshStandardMaterial({ color: SCYTHE_COLORS.handle, roughness: 0.7 }),
  handleWrapping: new MeshStandardMaterial({ color: SCYTHE_COLORS.handle, metalness: 0.3, roughness: 0.7 }),
  connector: new MeshStandardMaterial({ color: SCYTHE_COLORS.connector, roughness: 0.6 }),
  
  // Normal state materials
  glowRingNormal: new MeshStandardMaterial({
    color: SCYTHE_COLORS.normal,
    emissive: SCYTHE_COLORS.normalEmissive,
    emissiveIntensity: 1.25,
    transparent: true,
    opacity: 0.7
  }),
  connectorGlowNormal: new MeshStandardMaterial({
    color: SCYTHE_COLORS.normal,
    emissive: SCYTHE_COLORS.normal,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.3
  }),
  bladeNormal: new MeshStandardMaterial({
    color: SCYTHE_COLORS.normal,
    emissive: SCYTHE_COLORS.normal,
    emissiveIntensity: 1.3,
    metalness: 0.8,
    roughness: 0.1,
    opacity: 1,
    transparent: true,
    side: DoubleSide
  }),
  
  // Empowered state materials
  glowRingEmpowered: new MeshStandardMaterial({
    color: SCYTHE_COLORS.empowered,
    emissive: SCYTHE_COLORS.empoweredEmissive,
    emissiveIntensity: 1.25,
    transparent: true,
    opacity: 0.7
  }),
  connectorGlowEmpowered: new MeshStandardMaterial({
    color: SCYTHE_COLORS.empowered,
    emissive: SCYTHE_COLORS.empowered,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.3
  }),
  bladeEmpowered: new MeshStandardMaterial({
    color: SCYTHE_COLORS.empowered,
    emissive: SCYTHE_COLORS.empowered,
    emissiveIntensity: 1.3,
    metalness: 0.8,
    roughness: 0.1,
    opacity: 1,
    transparent: true,
    side: DoubleSide
  })
};

interface ScytheProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
  currentSubclass?: WeaponSubclass;
  level?: number;
  onLeftSwingStart?: () => void;
  onRightSwingStart?: () => void;
  isEmpowered?: boolean;
}

// Reusable ScytheModel component
function ScytheModel({ 
  scytheRef, 
  basePosition, 
  isLeft = false,
  isDualWielding = false,
  isEmpowered = false,
}: { 
  scytheRef: React.RefObject<Group>; 
  basePosition: readonly [number, number, number];
  isLeft?: boolean;
  isDualWielding?: boolean;
  isEmpowered?: boolean;
}) {
  // Select materials based on empowered state
  const glowRingMaterial = isEmpowered ? SCYTHE_SHARED_MATERIALS.glowRingEmpowered : SCYTHE_SHARED_MATERIALS.glowRingNormal;
  const connectorGlowMaterial = isEmpowered ? SCYTHE_SHARED_MATERIALS.connectorGlowEmpowered : SCYTHE_SHARED_MATERIALS.connectorGlowNormal;
  const bladeMaterial = isEmpowered ? SCYTHE_SHARED_MATERIALS.bladeEmpowered : SCYTHE_SHARED_MATERIALS.bladeNormal;

  return (
    <group 
      ref={scytheRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
      rotation={[0, 0, Math.PI]}
      scale={isDualWielding 
        ? [isLeft ? 0.65 : -0.65, 0.75, 0.65]
        : [isLeft ? -0.65 : 0.65, 0.75, 0.65]
      }
    >
      {/* Handle */}
      <group position={[0, -0.4, 0]} rotation={[0, 0, Math.PI + 0.3]}>
        <mesh geometry={SCYTHE_SHARED_GEOMETRIES.handle} material={SCYTHE_SHARED_MATERIALS.handle} />
        
        {/* Decorative wrappings handle */}
        {[...Array(10)].map((_, i) => (
          <mesh 
            key={i} 
            position={[0, 1 - i * 0.2, 0]} 
            rotation={[Math.PI/2, 0, 0]}
            geometry={SCYTHE_SHARED_GEOMETRIES.handleWrapping}
            material={SCYTHE_SHARED_MATERIALS.handleWrapping}
          />
        ))}
      </group>
      
      {/* Blade connector */}
      <group position={[-.305, 0.60, 0]} rotation={[Math.PI / 1, 0, Math.PI - 0.3]}>
        {/* Base connector */}
        <mesh geometry={SCYTHE_SHARED_GEOMETRIES.connector} material={SCYTHE_SHARED_MATERIALS.connector} />

        {/* Rotating glow rings - these use useFrame for rotation */}
        <RotatingRing position={-0.11} geometry={SCYTHE_SHARED_GEOMETRIES.glowRing1} material={glowRingMaterial} speed={2} />
        <RotatingRing position={-0.005} geometry={SCYTHE_SHARED_GEOMETRIES.glowRing2} material={glowRingMaterial} speed={-2} />
        <RotatingRing position={0.1} geometry={SCYTHE_SHARED_GEOMETRIES.glowRing3} material={glowRingMaterial} speed={-2} />
        
        {/* Handle rings */}
        <RotatingRing position={-0.35} geometry={SCYTHE_SHARED_GEOMETRIES.handleRing} material={glowRingMaterial} speed={-2} />
        <RotatingRing position={-0.54} geometry={SCYTHE_SHARED_GEOMETRIES.handleRing} material={glowRingMaterial} speed={-2} />
        <RotatingRing position={-0.74} geometry={SCYTHE_SHARED_GEOMETRIES.handleRing} material={glowRingMaterial} speed={-2} />

        {/* Static outer glow */}
        <mesh geometry={SCYTHE_SHARED_GEOMETRIES.connectorGlow} material={connectorGlowMaterial} />
      </group>
      
      {/* BLADE POSITION */}
      <group position={[0.37, 0.8, 0.775]} rotation={[0.2, -Math.PI / 3.6, Math.PI -0.175]} scale={[1.0, 0.55, 1.0]}>
        {/* Base blade */}
        <mesh geometry={SCYTHE_SHARED_GEOMETRIES.blade} material={bladeMaterial} />
      </group>
    </group>
  );
}

// Helper component for rotating rings to avoid inline useFrame
function RotatingRing({ 
  position, 
  geometry, 
  material, 
  speed 
}: { 
  position: number; 
  geometry: TorusGeometry; 
  material: MeshStandardMaterial; 
  speed: number;
}) {
  const ringRef = useRef<Group>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = state.clock.getElapsedTime() * speed;
    }
  });
  
  return (
    <group ref={ringRef}>
      <mesh 
        position-y={position} 
        rotation={[Math.PI/2, 0, 0]}
        geometry={geometry}
        material={material}
      />
    </group>
  );
}

export default function Scythe({ 
  isSwinging, 
  onSwingComplete, 
  currentSubclass = WeaponSubclass.CHAOS,
  level = 1,
  onLeftSwingStart = () => {},
  onRightSwingStart = () => {},
  isEmpowered = false
}: ScytheProps) {
  
  // Debug: Log when empowerment changes
  useEffect(() => {
    if (isEmpowered) {
      console.log('[Scythe] Legion empowerment activated - showing green trails');
    }
  }, [isEmpowered]);

  // Check if dual wielding should be enabled
  const isDualWielding = currentSubclass === WeaponSubclass.ABYSSAL && level >= 2;

  // Refs for single scythe (original behavior)
  const scytheRef = useRef<Group>(null);
  const swingProgress = useRef(0);

  // Refs for dual wielding
  const leftScytheRef = useRef<Group>(null);
  const rightScytheRef = useRef<Group>(null);
  const leftSwingProgress = useRef(0);
  const rightSwingProgress = useRef(0);
  const leftSwingDelay = useRef(0);
  const isSwingComplete = useRef(false);

  const basePosition = [-1.175, 0.65, 0.3] as const;
  const leftBasePosition = [-0.8, 0.75, 0.5] as const;
  const rightBasePosition = [0.8, 0.75, 0.5] as const;

  useFrame((_, delta) => {
    if (isDualWielding) {
      // Dual wielding animation logic
      if (isSwinging && leftScytheRef.current && rightScytheRef.current) {
        if (leftSwingProgress.current === 0 && rightSwingProgress.current === 0) {
          isSwingComplete.current = false;
        }
        
        // Handle left scythe swing with delay
        if (leftSwingDelay.current < 0.175) {
          leftSwingDelay.current += delta;
        } else {
          if (leftSwingProgress.current === 0) {
            onLeftSwingStart();
          }
          leftSwingProgress.current += delta * 8.5;

          const leftSwingPhase = Math.min(leftSwingProgress.current / Math.PI, 1);
          
          if (leftSwingProgress.current >= Math.PI) {
            leftSwingProgress.current = 0;
            leftSwingDelay.current = 0;
            leftScytheRef.current.rotation.set(0, 0, 0);
            leftScytheRef.current.position.set(...leftBasePosition);
          } else {
            const pivotX = leftBasePosition[0] + Math.sin(leftSwingPhase * Math.PI) * 2.5;
            const pivotY = leftBasePosition[1] + Math.sin(leftSwingPhase * Math.PI) * -1.5;
            const pivotZ = leftBasePosition[2] + Math.cos(leftSwingPhase * Math.PI) * 1.1;

            leftScytheRef.current.position.set(pivotX, pivotY, pivotZ);

            const leftRotationX = Math.sin(leftSwingPhase * Math.PI) * (-0.75) +0.3;
            const leftRotationY = Math.sin(leftSwingPhase * Math.PI) * Math.PI;
            const leftRotationZ = Math.sin(leftSwingPhase * Math.PI) * (-Math.PI / 2.5);

            leftScytheRef.current.rotation.set(leftRotationX, leftRotationY, leftRotationZ);
          }
        }

        // Handle right scythe swing
        if (rightSwingProgress.current === 0) {
          onRightSwingStart();
        }
        rightSwingProgress.current += delta * 8.5;

        const rightSwingPhase = Math.min(rightSwingProgress.current / Math.PI, 1);
        
        if (rightSwingProgress.current >= Math.PI) {
          rightSwingProgress.current = 0;
          rightScytheRef.current.rotation.set(0, 0, 0);
          rightScytheRef.current.position.set(...rightBasePosition);
          isSwingComplete.current = true;
          onSwingComplete();
        } else {
          const pivotX = rightBasePosition[0] - Math.sin(rightSwingPhase * Math.PI) * 2.5;
          const pivotY = rightBasePosition[1] + Math.sin(rightSwingPhase * Math.PI) * -1.5;
          const pivotZ = rightBasePosition[2] + Math.cos(rightSwingPhase * Math.PI) * 1.1;

          rightScytheRef.current.position.set(pivotX, pivotY, pivotZ);

          const rightRotationX = Math.sin(rightSwingPhase * Math.PI) * (-0.75)+0.3;
          const rightRotationY = -Math.sin(rightSwingPhase * Math.PI) * Math.PI;
          const rightRotationZ = Math.sin(rightSwingPhase * Math.PI) * (Math.PI / 2.5);
          rightScytheRef.current.rotation.set(rightRotationX, rightRotationY, rightRotationZ);
        }
      } else if (!isSwinging && leftScytheRef.current && rightScytheRef.current) {
        const easeFactor = 0.85;
        
        leftScytheRef.current.rotation.x *= easeFactor;
        leftScytheRef.current.rotation.y *= easeFactor;
        leftScytheRef.current.rotation.z *= easeFactor;
        leftScytheRef.current.position.x += (leftBasePosition[0] - leftScytheRef.current.position.x) * 0.14;
        leftScytheRef.current.position.y += (leftBasePosition[1] - leftScytheRef.current.position.y) * 0.14;
        leftScytheRef.current.position.z += (leftBasePosition[2] - leftScytheRef.current.position.z) * 0.07;

        rightScytheRef.current.rotation.x *= easeFactor;
        rightScytheRef.current.rotation.y *= easeFactor;
        rightScytheRef.current.rotation.z *= easeFactor;
        rightScytheRef.current.position.x += (rightBasePosition[0] - rightScytheRef.current.position.x) * 0.14;
        rightScytheRef.current.position.y += (rightBasePosition[1] - rightScytheRef.current.position.y) * 0.14;
        rightScytheRef.current.position.z += (rightBasePosition[2] - rightScytheRef.current.position.z) * 0.07;
      }
    } else {
      // Original single scythe animation logic
      if (isSwinging && scytheRef.current) {
        swingProgress.current += delta * 8.25;
        const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
        
        if (swingProgress.current >= Math.PI * 0.85) {
          swingProgress.current = 0;
          onSwingComplete();
          return;
        }
        
        const forwardPhase = swingPhase <= 0.3
          ? swingPhase * 2
          : (0.75 - (swingPhase - 0.125) * 1.55);
        
        const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * 2.5;
        const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -1.5;
        const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1.1;
        
        scytheRef.current.position.set(pivotX, pivotY, pivotZ);
        
        const rotationX = Math.sin(forwardPhase * Math.PI) * (-0.75) + 0.3;
        const rotationY = Math.sin(forwardPhase * Math.PI) * Math.PI;
        const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 3.5);
        
        scytheRef.current.rotation.set(rotationX, rotationY, rotationZ);
      } else if (!isSwinging && scytheRef.current) {
        const easeFactor = 0.85;
        scytheRef.current.rotation.x *= easeFactor;
        scytheRef.current.rotation.y *= easeFactor;
        scytheRef.current.rotation.z *= easeFactor;
        
        scytheRef.current.position.x += (basePosition[0] - scytheRef.current.position.x) * 0.14;
        scytheRef.current.position.y += (basePosition[1] - scytheRef.current.position.y) * 0.14;
        scytheRef.current.position.z += (basePosition[2] - scytheRef.current.position.z) * 0.025;
      }
    }
  });

  if (isDualWielding) {
    return (
      <group position={[0, -0.45, 0.5]} scale={[0.9 , 0.9, 0.9]}>
        {/* Left Scythe */}
        <ScytheModel 
          scytheRef={leftScytheRef}
          basePosition={leftBasePosition} 
          isLeft={true}
          isDualWielding={true}
          isEmpowered={isEmpowered}
        />
        
        {/* Right Scythe */}
        <ScytheModel 
          scytheRef={rightScytheRef} 
          basePosition={rightBasePosition} 
          isLeft={false}
          isDualWielding={true}
          isEmpowered={isEmpowered}
        />
      </group>
    );
  }

  // Original single scythe
  return <ScytheModel scytheRef={scytheRef} basePosition={basePosition} isDualWielding={false} isEmpowered={isEmpowered} />;
}
