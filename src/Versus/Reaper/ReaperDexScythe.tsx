// src/versus/Reaper/ReaperDexScythe.tsx
import { useRef } from 'react';
import { Group, Shape } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReaperScytheProps {
  isSwinging: boolean;
  onSwingComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function ReaperDexScythe({ isSwinging, onSwingComplete }: ReaperScytheProps) {
  const scytheRef = useRef<Group>(null);
  const swingProgress = useRef(0);
  const basePosition = [-0.85, 0.88, 0.28] as const; // Adjusted for smaller reaper
  
  useFrame((_, delta) => {
    if (isSwinging && scytheRef.current) {
      swingProgress.current += delta * 3.0; // Slightly faster than boss
      const swingPhase = Math.min(swingProgress.current / Math.PI/1.5, 1);
      
      if (swingProgress.current >= Math.PI * 0.5) {
        swingProgress.current = 0;
        scytheRef.current.rotation.set(0, 0, 0);
        scytheRef.current.position.set(...basePosition);
        onSwingComplete();
        return;
      }
      
      const forwardPhase = swingPhase <= 0.35
        ? swingPhase * 3
        : (0.7 - (swingPhase - 0.45));
      
      const pivotX = basePosition[0] + Math.sin(forwardPhase * Math.PI) * -1.6;
      const pivotY = basePosition[1] + Math.sin(forwardPhase * Math.PI) * -1.0;
      const pivotZ = basePosition[2] + Math.cos(forwardPhase * Math.PI) * 0.7;
      
      scytheRef.current.position.set(pivotX, pivotY, pivotZ);
      
      const rotationX = Math.sin(forwardPhase * Math.PI) * (Math.PI / 4);
      const rotationY = Math.sin(forwardPhase * Math.PI) * (Math.PI / 2);
      const rotationZ = Math.sin(forwardPhase * Math.PI) * (Math.PI / 4);
      
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

  const createBladeShape = () => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.12, -0.18);
    shape.bezierCurveTo(0.65, 0.18, 0.9, 0.4, 1.3, 0.48);
    shape.lineTo(0.9, 0.6);
    shape.bezierCurveTo(0.4, 0.16, 0.18, 0.0, 0.08, 0.56);
    shape.lineTo(0, 0);
    return shape;
  };

  const bladeExtradeSettings = {
    steps: 1,
    depth: 0.00008,
    bevelEnabled: true,
    bevelThickness: 0.024,
    bevelSize: 0.028,
    bevelSegments: 1,
    curveSegments: 14
  };

  return (
    <group 
      ref={scytheRef} 
      position={[basePosition[0], basePosition[1], basePosition[2]]}
      rotation={[0, 0, Math.PI]}
      scale={[0.8, 0.8, 0.8]} // Smaller than boss scythe
    >
      {/* Handle - shorter */}
      <group position={[0, -0.56, 0]} rotation={[0, 0, -Math.PI]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 2.0, 10]} />
          <meshStandardMaterial 
            color="#2c1810" 
            roughness={0.7} 
            transparent
            opacity={0.25}
          />
        </mesh>
        
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[0, 0.65 - i * 0.25, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.05, 0.008, 8, 14]} />
            <meshStandardMaterial 
              color="#8B4513" 
              metalness={0.3} 
              roughness={0.7}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}
      </group>
      
      {/* Blade connector - smaller */}
      <group position={[0, 0.28, 0]} rotation={[Math.PI / 1, 0, Math.PI]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.065, 0.24, 8]} />
          <meshStandardMaterial color="#2c1810" roughness={0.6} />
        </mesh>

        <group rotation-x={useFrame((state) => state.clock.getElapsedTime() * 2)}>
          <mesh position-y={-0.06} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.115, 0.016, 14, 28]} />
            <meshStandardMaterial
              color="#ff3300"
              emissive="#ff3300"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        <group rotation-x={useFrame((state) => -state.clock.getElapsedTime() * 2)}>
          <mesh position-y={0.024} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.14, 0.016, 14, 28]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        <mesh>
          <cylinderGeometry args={[0.105, 0.088, 0.26, 8]} />
          <meshStandardMaterial
            color="#ff1a1a"
            emissive="#ff1a1a"
            emissiveIntensity={1.5}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
      
      {/* BLADE - smaller */}
      <group position={[0, 0.3, 0.94]} rotation={[-0.8, -Math.PI / 2, Math.PI / 2.2]}>
        <mesh>
          <extrudeGeometry args={[createBladeShape(), { ...bladeExtradeSettings, depth: 0.024 }]} />
          <meshStandardMaterial 
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={1.25}
            metalness={0.8}
            roughness={0.1}
            opacity={0.5}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
} 