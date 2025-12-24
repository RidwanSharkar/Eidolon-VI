// src/Spells/ConcussiveBlow/PlayerStunEffect.tsx

import { useRef, useEffect, useState } from 'react';
import { Group, Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';

// Pre-allocated colors for performance - avoids new Color() on every render
const COLORS = {
  brightBlue: new Color(0x6666FF),
  blueEmission: new Color(0x4444FF),
  lightBlue: new Color(0xAAAAFF),
  lightBlueEmission: new Color(0x8888FF),
  brightYellow: new Color(0xFFFF66),
  brightCyan: new Color(0x66EEFF),
  pointLight: new Color(0x6699FF),
  white: new Color(0xFFFFFF),
} as const;

interface PlayerStunEffectProps {
  position: Vector3;
  duration?: number;
  startTime?: number;
  onComplete?: () => void;
}

export default function PlayerStunEffect({ 
  position, 
  duration = 2000, // 2 seconds for lightning stun
  startTime = Date.now(),
  onComplete 
}: PlayerStunEffectProps) {
  const effectRef = useRef<Group>(null);
  const [intensity, setIntensity] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(1);
  const rotationSpeed = useRef(Math.random() * 0.03 + 0.02);
  const lightningOffset = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onComplete]);

  useFrame(() => {
    if (!effectRef.current) return;

    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Fade out in the last 500ms
    if (progress > 0.75) {
      const fadeStart = 0.75;
      const fadeProgress = (progress - fadeStart) / (1 - fadeStart);
      setFadeProgress(1 - fadeProgress);
    } else {
      setFadeProgress(1);
    }

    // Pulsing intensity effect - faster pulse for lightning stun
    const pulseIntensity = 0.7 + 0.3 * Math.sin(elapsed * 0.01);
    setIntensity(pulseIntensity * fadeProgress);

    // Rotate the lightning bolts
    effectRef.current.rotation.y += rotationSpeed.current;
    effectRef.current.rotation.x = Math.sin(elapsed * 0.005) * 0.2;
  });

  return (
    <group ref={effectRef} position={position} scale={[0.675, 0.675, 0.675]}>
      {/* Central lightning core - larger for player effect */}
      <mesh>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.brightBlue}
          emissive={COLORS.blueEmission}
          emissiveIntensity={intensity * 4}
          transparent
          opacity={fadeProgress * 0.9}
        />
      </mesh>

      {/* Inner electric sphere */}
      <mesh>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.lightBlue}
          emissive={COLORS.lightBlueEmission}
          emissiveIntensity={intensity * 6}
          transparent
          opacity={fadeProgress * 0.8}
        />
      </mesh>

      {/* Lightning bolt rings - more prominent for player */}
      {[...Array(4)].map((_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 4 + lightningOffset.current, 0]}>
          <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 1.6, 4]} />
            <meshStandardMaterial
              color={COLORS.brightYellow}
              emissive={COLORS.brightYellow}
              emissiveIntensity={intensity * 5}
              transparent
              opacity={fadeProgress * 0.9}
            />
          </mesh>
        </group>
      ))}

      {/* Vertical lightning bolts - taller for player */}
      {[...Array(6)].map((_, i) => (
        <mesh key={`vertical-${i}`} 
              position={[
                0.5 * Math.cos(i * Math.PI / 3), 
                0, 
                0.5 * Math.sin(i * Math.PI / 3)
              ]}
              rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.5, 4]} />
          <meshStandardMaterial
            color={COLORS.brightCyan}
            emissive={COLORS.brightCyan}
            emissiveIntensity={intensity * 4}
            transparent
            opacity={fadeProgress * 0.7}
          />
        </mesh>
      ))}

      {/* Outer electric ring - larger */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.06, 8, 16]} />
        <meshStandardMaterial
          color={COLORS.brightBlue}
          emissive={COLORS.brightBlue}
          emissiveIntensity={intensity * 3}
          transparent
          opacity={fadeProgress * 0.6}
        />
      </mesh>

      {/* Additional outer ring for more dramatic effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.04, 8, 16]} />
        <meshStandardMaterial
          color={COLORS.blueEmission}
          emissive={COLORS.blueEmission}
          emissiveIntensity={intensity * 2}
          transparent
          opacity={fadeProgress * 0.4}
        />
      </mesh>

      {/* Point light for illumination - brighter */}
      <pointLight 
        color={COLORS.pointLight}
        intensity={intensity * 5}
        distance={4}
        decay={2}
      />

      {/* Electric sparks - more numerous */}
      {[...Array(12)].map((_, i) => (
        <mesh key={`spark-${i}`} 
              position={[
                (0.4 + Math.random() * 0.7) * Math.cos(i * Math.PI / 6),
                Math.random() * 0.6 - 0.3,
                (0.4 + Math.random() * 0.7) * Math.sin(i * Math.PI / 6)
              ]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshStandardMaterial
            color={COLORS.white}
            emissive={COLORS.white}
            emissiveIntensity={intensity * 8}
            transparent
            opacity={fadeProgress * Math.random() * 0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
