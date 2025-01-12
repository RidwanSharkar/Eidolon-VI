// src/weapons/Scythe.tsx

import { useRef,  } from 'react';
import { Group, Shape,  } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ScytheProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
}

interface ScytheProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function Scythe({ isSwinging, onSwingComplete, }: ScytheProps) {
  const scytheRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-1.175, 0.9, 0.3] as const;  // POSITIONING
  
  useFrame((_, delta) => {
    if (isSwinging && scytheRef.current) {
      swingProgress.current += delta * 6.5;
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
      
      // Complete swing earlier to prevent extra rotation
      if (swingProgress.current >= Math.PI * 0.85) {
        swingProgress.current = 0;
        scytheRef.current.rotation.set(0, 0, 0);
        scytheRef.current.position.set(...basePosition);
        onSwingComplete();
        return;
      }
      
      // SWING ANIMATION
      const forwardPhase = swingPhase <= 0.25
        ? swingPhase * 2
        : (0.75 - (swingPhase - 0.125) * 1.675);
      
      const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * 2.5;
      const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -1.5;
      const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 1.1;
      
      scytheRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = Math.sin(forwardPhase * Math.PI) * (-0.75) +0.3;
      const rotationY = Math.sin(forwardPhase * Math.PI) * Math.PI;
      const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 3);
      
      scytheRef.current.rotation.set(rotationX, rotationY, rotationZ);
    } else if (!isSwinging && scytheRef.current) {
      scytheRef.current.rotation.x *= 0.85;
      scytheRef.current.rotation.y *= 0.85;
      scytheRef.current.rotation.z *= 0.85;
      
      scytheRef.current.position.x += (basePosition[0] - scytheRef.current.position.x) * 0.20;
      scytheRef.current.position.y += (basePosition[1] - scytheRef.current.position.y) * 0.20;
      scytheRef.current.position.z += (basePosition[2] - scytheRef.current.position.z) * 0.20;
    }
  });

  // Create custom blade shape
  const createBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    
    // Create thick back edge first
    shape.lineTo(0.4, -0.130); // ** COOL SPOT **  REMOVE VERTEX SET 0 param
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
      scale={[1, 1, 1.]}
    >
      {/* Handle   */}
      <group position={[0, -0.4, 0]} rotation={[0, 0, Math.PI + 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 2.3, 12]} />
          <meshStandardMaterial color="#a86432" roughness={0.7} />
        </mesh>
        
        {/* Decorative wrappings handle */}
        {[...Array(10)].map((_, i) => ( //10 wrappings
          <mesh key={i} position={[0, 1 - i * 0.2, 0]} rotation={[Math.PI/2, 0, 0]}> {/*  starting position */}
            <torusGeometry args={[0.07, 0.01, 8, 16]} />
            <meshStandardMaterial color="#a86432" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Blade connector  */}
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
              color="#39ff14"
              emissive="#39ff14"
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
              color="#39ff14"
              emissive="#39ff14"
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

                {/* Second ring rotating opposite direction */}
                <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={0.1} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.17, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#39ff14"
              emissive="#39ff14"
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
              color="#39ff14"
              emissive="#39ff14"
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
              color="#39ff14"
              emissive="#39ff14"
              emissiveIntensity={1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

                                            {/* HANDLE RING 2 */}
                                            <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.74} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.075, 0.02, 16, 32]} />
            <meshStandardMaterial
              color="#39ff14"
              emissive="#39ff14"
              emissiveIntensity={ 1.25}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>






        {/* Static outer glow */}
        <mesh>
          <cylinderGeometry args={[0.13, 0.11, 0.32, 8]} />
          <meshStandardMaterial
            color="#39ff14"
            emissive="#39ff14"
            emissiveIntensity={1.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
      
      {/* BLADE with glowing effect - adjusted position */}
      <group position={[0.37, 0.8, 0.775]} rotation={[0.2, -Math.PI / 3.6, Math.PI -0.175]} scale={[1.0, 0.55, 1.0]}>
        {/* Base blade */}
        <mesh>
          <extrudeGeometry args={[createBladeShape(), { ...bladeExtradeSettings, depth: 0.03 }]} />
          <meshStandardMaterial 
            color="#39ff14"
            emissive="#39ff14"
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