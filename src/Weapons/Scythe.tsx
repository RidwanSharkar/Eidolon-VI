// src/weapons/Scythe.tsx

import React, { useRef, useEffect } from 'react';
import { Group, Shape } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeaponSubclass } from './weapons';

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
  // Create custom blade shape
  const createBladeShape = () => {
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

  const bladeExtradeSettings = {
    steps: 1,
    depth: 0.00010,
    bevelEnabled: true,
    bevelThickness: 0.030,
    bevelSize: 0.035,
    bevelSegments: 1,
    curveSegments: 16
  };

  return (
    <group 
      ref={scytheRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
      rotation={[0, 0, Math.PI]}
      scale={isDualWielding 
        ? [isLeft ? 0.65 : -0.65, 0.75, 0.65]  // Dual wielding orientation
        : [isLeft ? -0.65 : 0.65, 0.75, 0.65]  // Single scythe orientation
      }
    >
      {/* Handle */}
      <group position={[0, -0.4, 0]} rotation={[0, 0, Math.PI + 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 2.3, 12]} />
          <meshStandardMaterial color="#a86432" roughness={0.7} />
        </mesh>
        
        {/* Decorative wrappings handle */}
        {[...Array(10)].map((_, i) => (
          <mesh key={i} position={[0, 1 - i * 0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.07, 0.01, 8, 16]} />
            <meshStandardMaterial color="#a86432" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Blade connector */}
      <group position={[-.305, 0.60, 0]} rotation={[Math.PI / 1, 0, Math.PI - 0.3]}>
        {/* Base connector */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
          <meshStandardMaterial color="#2c1810" roughness={0.6} />
        </mesh>



        {/* Rotating glow rings */}
        <group rotation-x={useFrame((state) => state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.11} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.14, 0.02, 16, 32]} />
            <meshStandardMaterial
              color={isEmpowered ? "#8A2BE2" : "#17CE54"}
              emissive={isEmpowered ? "#9370DB" : "#17CE54"}
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Second ring rotating opposite direction */}
        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.005} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.155, 0.02, 16, 32]} />
            <meshStandardMaterial
              color={isEmpowered ? "#8A2BE2" : "#17CE54"}
              emissive={isEmpowered ? "#9370DB" : "#17CE54"}
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={0.1} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.17, 0.02, 16, 32]} />
            <meshStandardMaterial
              color={isEmpowered ? "#8A2BE2" : "#17CE54"}
              emissive={isEmpowered ? "#9370DB" : "#17CE54"}
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* HANDLE RING 1 */}
        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.35} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.075, 0.02, 16, 32]} />
            <meshStandardMaterial
              color={isEmpowered ? "#8A2BE2" : "#17CE54"}
              emissive={isEmpowered ? "#9370DB" : "#17CE54"}
              emissiveIntensity={1}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* HANDLE RING 2 */}
        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.54} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.075, 0.02, 16, 32]} />
            <meshStandardMaterial
              color={isEmpowered ? "#8A2BE2" : "#17CE54"}
              emissive={isEmpowered ? "#9370DB" : "#17CE54"}
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* HANDLE RING 3 */}
        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.74} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.075, 0.02, 16, 32]} />
            <meshStandardMaterial
              color={isEmpowered ? "#8A2BE2" : "#17CE54"}
              emissive={isEmpowered ? "#9370DB" : "#17CE54"}
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Static outer glow */}
        <mesh>
          <cylinderGeometry args={[0.13, 0.11, 0.32, 8]} />
          <meshStandardMaterial
            color={isEmpowered ? "#8A2BE2" : "#17CE54"}
            emissive={isEmpowered ? "#8A2BE2" : "#17CE54"}
            emissiveIntensity={1.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
      
      {/* BLADE POSITION */}
      <group position={[0.37, 0.8, 0.775]} rotation={[0.2, -Math.PI / 3.6, Math.PI -0.175]} scale={[1.0, 0.55, 1.0]}>
        {/* Base blade */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), { ...bladeExtradeSettings, depth: 0.03 }]} />
          <meshStandardMaterial 
            color={isEmpowered ? "#8A2BE2" : "#17CE54"}
            emissive={isEmpowered ? "#8A2BE2" : "#17CE54"}
            emissiveIntensity={1.3}
            metalness={0.8}
            roughness={0.1}
            opacity={1}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>



      </group>
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

  const basePosition = [-1.175, 0.65, 0.3] as const; // HEIGHT ORIGINAL 
  const leftBasePosition = [-0.8, 0.75, 0.5] as const;  // Mirror Sabres positioning
  const rightBasePosition = [0.8, 0.75, 0.5] as const;  // Mirror Sabres positioning

  useFrame((_, delta) => {
    if (isDualWielding) {
      // Dual wielding animation logic (similar to Sabres)
      if (isSwinging && leftScytheRef.current && rightScytheRef.current) {
        // Reset completion flag when starting new swing
        if (leftSwingProgress.current === 0 && rightSwingProgress.current === 0) {
          isSwingComplete.current = false;
        }
        
        // Handle left scythe swing with delay (inspired by Sabres)
        if (leftSwingDelay.current < 0.175) {
          leftSwingDelay.current += delta;
        } else {
          if (leftSwingProgress.current === 0) {
            onLeftSwingStart();
          }
          leftSwingProgress.current += delta * 8.5;

          const leftSwingPhase = Math.min(leftSwingProgress.current / Math.PI, 1); // Simplified like Sabres
          
          if (leftSwingProgress.current >= Math.PI) { // Simplified completion check
            leftSwingProgress.current = 0;
            leftSwingDelay.current = 0;
            leftScytheRef.current.rotation.set(0, 0, 0);
            leftScytheRef.current.position.set(...leftBasePosition);
          } else {
            // Left scythe movement (mirrored from Sabres approach)
            const pivotX = leftBasePosition[0] + Math.sin(leftSwingPhase * Math.PI) * 2.5; // Same direction as base position
            const pivotY = leftBasePosition[1] + Math.sin(leftSwingPhase * Math.PI) * -1.5; // Same Y movement
            const pivotZ = leftBasePosition[2] + Math.cos(leftSwingPhase * Math.PI) * 1.1; // Same Z movement

            leftScytheRef.current.position.set(pivotX, pivotY, pivotZ);

            // Left scythe rotations (properly mirrored)
            const leftRotationX = Math.sin(leftSwingPhase * Math.PI) * (-0.75) +0.3;
            const leftRotationY = Math.sin(leftSwingPhase * Math.PI) * Math.PI; // Same direction as right
            const leftRotationZ = Math.sin(leftSwingPhase * Math.PI) * (-Math.PI / 2.5); // Inverted Z for mirroring

            leftScytheRef.current.rotation.set(leftRotationX, leftRotationY, leftRotationZ);
          }
        }

        // Handle right scythe swing (starts immediately, mirrored approach)
        if (rightSwingProgress.current === 0) {
          onRightSwingStart();
        }
        rightSwingProgress.current += delta * 8.5;

        const rightSwingPhase = Math.min(rightSwingProgress.current / Math.PI, 1); // Simplified like Sabres
        
        if (rightSwingProgress.current >= Math.PI) { // Simplified completion check
          rightSwingProgress.current = 0;
          rightScytheRef.current.rotation.set(0, 0, 0);
          rightScytheRef.current.position.set(...rightBasePosition);
          isSwingComplete.current = true;
          onSwingComplete();
        } else {
          // Right scythe movement (mirrored from left)
          const pivotX = rightBasePosition[0] - Math.sin(rightSwingPhase * Math.PI) * 2.5; // Opposite direction from left
          const pivotY = rightBasePosition[1] + Math.sin(rightSwingPhase * Math.PI) * -1.5; // Same Y movement
          const pivotZ = rightBasePosition[2] + Math.cos(rightSwingPhase * Math.PI) * 1.1; // Same Z movement

          rightScytheRef.current.position.set(pivotX, pivotY, pivotZ);

          // Right scythe rotations (mirrored from left)
          const rightRotationX = Math.sin(rightSwingPhase * Math.PI) * (-0.75)+0.3;
          const rightRotationY = -Math.sin(rightSwingPhase * Math.PI) * Math.PI; // Inverted Y for mirroring
          const rightRotationZ = Math.sin(rightSwingPhase * Math.PI) * (Math.PI / 2.5); // Positive Z for mirroring
          rightScytheRef.current.rotation.set(rightRotationX, rightRotationY, rightRotationZ);
        }
      } else if (!isSwinging && leftScytheRef.current && rightScytheRef.current) {
        // Return to base positions when not swinging
        const easeFactor = 0.85;
        
        // Left scythe
        leftScytheRef.current.rotation.x *= easeFactor;
        leftScytheRef.current.rotation.y *= easeFactor;
        leftScytheRef.current.rotation.z *= easeFactor;
        leftScytheRef.current.position.x += (leftBasePosition[0] - leftScytheRef.current.position.x) * 0.14;
        leftScytheRef.current.position.y += (leftBasePosition[1] - leftScytheRef.current.position.y) * 0.14;
        leftScytheRef.current.position.z += (leftBasePosition[2] - leftScytheRef.current.position.z) * 0.07;

        // Right scythe
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
        {/* Left Scythe - mirrored internally by ScytheModel */}
        <ScytheModel 
          scytheRef={leftScytheRef}
          basePosition={leftBasePosition} 
          isLeft={true}
          isDualWielding={true}
          isEmpowered={isEmpowered}
        />
        
        {/* Right Scythe - standard orientation */}
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