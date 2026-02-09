// src/Spells/ConcussiveBlow/ConcussiveStunEffect.tsx

import { useRef, useEffect, useState } from 'react';
import { Group, Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';

// Pre-allocated colors for performance - avoids new Color() on every render
const COLORS = {
  electricBlue: new Color(0x4444FF),
  blueEmission: new Color(0x2222FF),
  lightBlue: new Color(0x8888FF),
  blueEmissionLight: new Color(0x6666FF),
  electricYellow: new Color(0xFFFF44),
  cyan: new Color(0x44DDFF),
  pointLight: new Color(0x4488FF),
  white: new Color(0xFFFFFF),
} as const;

interface ConcussiveStunEffectProps {
  position: Vector3;
  duration?: number;
  startTime?: number;
  onComplete?: () => void;
}

export default function ConcussiveStunEffect({ 
  position, 
  duration = 2500, 
  startTime = Date.now(),
  onComplete 
}: ConcussiveStunEffectProps) {
  const effectRef = useRef<Group>(null);
  const [intensity, setIntensity] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(1);
  const rotationSpeed = useRef(Math.random() * 0.03 + 0.02);
  const lightningOffset = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    // No longer using setTimeout here as it was being reset by re-renders
    // The component now self-completes in useFrame when progress reaches 1
  }, []);

  useFrame(() => {
    if (!effectRef.current) return;

    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Auto-complete when duration is reached
    if (progress >= 1) {
      if (onComplete) onComplete();
      return;
    }

    // Fade out in the last 500ms
    if (progress > 0.75) {
      const fadeStart = 0.75;
      const fadeProgress = (progress - fadeStart) / (1 - fadeStart);
      setFadeProgress(1 - fadeProgress);
    } else {
      setFadeProgress(1);
    }

    // Pulsing intensity effect - faster pulse than freeze
    const pulseIntensity = 0.6 + 0.4 * Math.sin(elapsed * 0.008);
    setIntensity(pulseIntensity * fadeProgress);

    // Rotate the lightning bolts
    effectRef.current.rotation.y += rotationSpeed.current;
    effectRef.current.rotation.x = Math.sin(elapsed * 0.004) * 0.15;
  });

  return (
    <group ref={effectRef} position={position}>
      {/* Central lightning core */}
      <mesh>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.electricBlue}
          emissive={COLORS.blueEmission}
          emissiveIntensity={intensity * 3}
          transparent
          opacity={fadeProgress * 0.9}
        />
      </mesh>

      {/* Inner electric sphere */}
      <mesh>
        <sphereGeometry args={[0.175, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.lightBlue}
          emissive={COLORS.blueEmissionLight}
          emissiveIntensity={intensity * 5}
          transparent
          opacity={fadeProgress * 0.7}
        />
      </mesh>

      {/* Lightning bolt rings */}
      {[...Array(3)].map((_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 3 + lightningOffset.current, 0]}>
          <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 4]} />
            <meshStandardMaterial
              color={COLORS.electricYellow}
              emissive={COLORS.electricYellow}
              emissiveIntensity={intensity * 4}
              transparent
              opacity={fadeProgress * 0.8}
            />
          </mesh>
        </group>
      ))}

      {/* Vertical lightning bolts */}
      {[...Array(4)].map((_, i) => (
        <mesh key={`vertical-${i}`} 
              position={[
                0.4 * Math.cos(i * Math.PI / 2), 
                0, 
                0.4 * Math.sin(i * Math.PI / 2)
              ]}
              rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 2, 4]} />
          <meshStandardMaterial
            color={COLORS.cyan}
            emissive={COLORS.cyan}
            emissiveIntensity={intensity * 3}
            transparent
            opacity={fadeProgress * 0.6}
          />
        </mesh>
      ))}

      {/* Outer electric ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 16]} />
        <meshStandardMaterial
          color={COLORS.electricBlue}
          emissive={COLORS.electricBlue}
          emissiveIntensity={intensity * 5}
          transparent
          opacity={fadeProgress * 0.5}
        />
      </mesh>

      {/* Point light for illumination */}
      <pointLight 
        color={COLORS.pointLight}
        intensity={intensity * 3}
        distance={3}
        decay={2}
      />

      {/* Electric sparks */}
      {[...Array(8)].map((_, i) => (
        <mesh key={`spark-${i}`} 
              position={[
                (0.3 + Math.random() * 0.5) * Math.cos(i * Math.PI / 4),
                Math.random() * 0.4 - 0.2,
                (0.3 + Math.random() * 0.5) * Math.sin(i * Math.PI / 4)
              ]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial
            color={COLORS.white}
            emissive={COLORS.white}
            emissiveIntensity={intensity * 6}
            transparent
            opacity={fadeProgress * Math.random() * 0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
