import React, { useState} from 'react';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';

interface ChainLightningEffectProps {
  startPosition: Vector3;
  targetPositions: Vector3[];
}

const ChainLightningEffect: React.FC<ChainLightningEffectProps> = ({
  startPosition,
  targetPositions
}) => {
  const [time, setTime] = useState(0);
  const duration = 0.5;
  
  // Add randomized flicker timing
  const [flicker, setFlicker] = useState(1);
  
  useFrame((_, delta) => {
    setTime(prev => Math.min(prev + delta, duration));
    // Create random flickering effect
    setFlicker(Math.random() * 0.5 + 0.5);
  });

  const progress = time / duration;

  // Helper function to generate lightning offset with increased height
  const getLightningOffset = (segmentProgress: number, magnitude: number) => {
    return new Vector3(
      (Math.random() - 0.5) * magnitude +
        Math.sin(segmentProgress * Math.PI * 8 + time * 30) * magnitude,
      (Math.random() - 0.5) * magnitude +
        Math.cos(segmentProgress * Math.PI * 8 + time * 30) * magnitude + 2, // HEIGHT
      (Math.random() - 0.5) * magnitude +
        Math.sin(segmentProgress * Math.PI * 8 + time * 30) * magnitude
    );
  };

  // Define lightning colors
  const coreColor = new Color('#FFD700');  // Golden yellow
  const glowColor = new Color('#FFA500');  // Slightly orange glow

  return (
    <group>
      {targetPositions.map((targetPos, index) => {
        const startPos = index === 0 ? startPosition : targetPositions[index - 1];
        const direction = targetPos.clone().sub(startPos);
        const distance = direction.length();
        const segments = Math.ceil(distance * 4); // Increased segment density

        return (
          <group key={index}>
            {/* Main lightning beam */}
            {[...Array(segments)].map((_, i) => {
              const segmentProgress = i / segments;
              const offset = getLightningOffset(segmentProgress, 0.3);
              const pos = startPos.clone()
                .lerp(targetPos, segmentProgress)
                .add(offset)
                .add(new Vector3(0, Math.sin(segmentProgress * Math.PI) * 2, 0)); // arc height
              
              // Randomize segment thickness
              const thickness = Math.random() * 0.035 + 0.05;

              return (
                <group key={i}>
                  <mesh position={pos.toArray()}>
                    <sphereGeometry args={[thickness, 8, 8]} />
                    <meshStandardMaterial
                      color={coreColor}
                      emissive={coreColor}
                      emissiveIntensity={5 * flicker}
                      transparent
                      opacity={(0.7 * (1 - progress)) * flicker}
                    />
                  </mesh>
                  
                  {/* Branching effect */}
                  {Math.random() < 0.2 && (
                    <mesh
                      position={pos.clone().add(getLightningOffset(segmentProgress, 0.5)).toArray()}
                    >
                      <sphereGeometry args={[thickness * 0.35, 8, 8]} />
                      <meshStandardMaterial
                        color={glowColor}
                        emissive={glowColor}
                        emissiveIntensity={4 * flicker}
                        transparent
                        opacity={(0.75 * (1 - progress)) * flicker}
                      />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* Impact point */}
            <mesh position={targetPos.toArray()}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial
                color={coreColor}
                emissive={coreColor}
                emissiveIntensity={3 * flicker}
                transparent
                opacity={(0.6 * (1 - progress)) * flicker}
              />
            </mesh>

            {/* Impact light */}
            <pointLight
              position={targetPos.toArray()}
              color={glowColor}
              intensity={15 * (1 - progress) * flicker}
              distance={4}
              decay={2}
            />
          </group>
        );
      })}
    </group>
  );
};

export default ChainLightningEffect; 