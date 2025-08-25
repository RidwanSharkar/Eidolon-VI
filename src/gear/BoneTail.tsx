import { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import React from 'react';

interface BoneTailProps {
  movementDirection?: Vector3;
}

const BoneTail: React.FC<BoneTailProps> = ({ movementDirection = new Vector3() }) => {
  const tailRef = useRef<Group>(null);
  const [swayValues, setSwayValues] = useState({ x: 0, y: 0 });

  useFrame(({ clock }) => {
    if (!tailRef.current) return;
    
    const time = clock.getElapsedTime();
    
    // IDLE ANIMATION SETTINGS
    const idleFrequencyX = 0.7;    
    const idleFrequencyY = 0.5;    
    const idleAmplitudeX = 0.035;  
    const idleAmplitudeY = 0.175;   
    
    const idleSwayX = Math.sin(time * idleFrequencyX) * idleAmplitudeX;
    const idleSwayY = Math.sin(time * idleFrequencyY) * idleAmplitudeY;
    
    // MOVEMENT ANIMATION SETTINGS
    const baseMovementIntensity = 1.2;     
    const movementSwayXStrength = 0.45;    
    const movementSwayYStrength = 0.125;     
    const blendSpeed = 1.5;                  
    const baseRotationX = 0.1;             
    
    // Calculate movement intensity
    const movementIntensity = movementDirection.length() * baseMovementIntensity;
    
    // Calculate sway based on raw WASD input
    const movementSwayX = -movementDirection.z * movementSwayXStrength * movementIntensity;
    const movementSwayY = -movementDirection.x * movementSwayYStrength * movementIntensity;
    
    const blendFactor = Math.min(movementIntensity * blendSpeed, 1);
    const finalSwayX = idleSwayX * (1 - blendFactor) + movementSwayX * blendFactor;
    const finalSwayY = idleSwayY * (1 - blendFactor) + movementSwayY * blendFactor;
    
    setSwayValues({ x: finalSwayX, y: finalSwayY });
    tailRef.current.rotation.x = baseRotationX + finalSwayX;
    tailRef.current.rotation.y = finalSwayY;
  });

  const createVertebra = (scale: number = 1, index: number) => {
    const progress = index / 20;
    const curve = Math.pow(progress, 5) * 1.8;
    
    const nextProgress = (index + 1) / 15;
    const nextCurve = Math.pow(nextProgress, 2.2) * 0.8;
    const deltaY = nextCurve - curve;
    const deltaZ = 0.4 * (1 - (index / 20));
    
    // Progressive sway based on vertebra position
    const swayProgress = Math.max(0, 1 - (index / 15));
    const localSwayX = swayValues.x * swayProgress;
    const localSwayY = swayValues.y * Math.pow(swayProgress, 1.2);
    
    const initialAngle = Math.PI;
    const segmentAngle = Math.atan2(deltaY, deltaZ) + 
      (index === 0 ? initialAngle : 0) + 
      (localSwayX * (1 - index / 15));

    return (
      <group 
        position={[
          0, 
          -curve + 0.325,
          -index * 0.20 * (1 - (index / 40) - 0.1)
        ]} 
        scale={scale}
        rotation={[
          -segmentAngle + (localSwayX * 0.85),
          localSwayY * (1 - index / 2),
          0
        ]}
      >
        {/* Main vertebra */}
        <mesh rotation={[Math.PI/-4, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.055, 0.125, 6]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#304040"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>

        {/* Vertebra spikes */}
        <group rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          {/* Top spike */}
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.02, 0.06, 4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#304040"
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          
          {/* Side spikes */}
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.015, 0.25,  4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#304040"
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[-0.085, 0, 0]} rotation={[0, 0, Math.PI / -2]}>
            <coneGeometry args={[0.015, 0.2, 4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#304040"
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        </group>

        {/* Vertebra spikes */}
        <group rotation={[Math.PI / 24, 0, -Math.PI / 2]}>
          {/* Top spike */}
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.02, 0.06, 4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#304040"
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          
          {/* Side spikes */}
          <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI*2]}>
            <coneGeometry args={[0.0125, 0.04, 4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#304040"
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[-0.085, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.015, 0.04, 4]} />
            <meshStandardMaterial 
              color="#ffffff"
              emissive="#304040"
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
        </group>

        {/* Connecting joint */}
        <mesh position={[0, 0.025, +0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#304040"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      </group>
    );
  };

  return (
    <group 
      ref={tailRef}
      position={[0, -0.7, -0.25]}
      rotation={[-0.1, 0, 0]}
    >
      {[...Array(15)].map((_, index) => (
        <React.Fragment key={index}>
          {createVertebra(1 - (index * 0.04), index)}
        </React.Fragment>
      ))}
    </group>
  );
};

export default BoneTail; 