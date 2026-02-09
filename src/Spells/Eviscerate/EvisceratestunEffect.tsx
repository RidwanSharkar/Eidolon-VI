// src/Spells/Eviscerate/EvisceratestunEffect.tsx

import { useRef, useEffect, useState } from 'react';
import { Group, Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';

// Pre-allocated colors for performance - avoids new Color() on every render
const COLORS = {
  purpleBlue: new Color(0x8844FF),
  purpleEmission: new Color(0x6622FF),
  lightPurple: new Color(0xCC88FF),
  lightPurpleEmission: new Color(0xAA66FF),
  pinkRed: new Color(0xFF4488),
  magenta: new Color(0xDD44FF),
  purpleWhite: new Color(0xFFCCFF),
} as const;

interface EvisceratestunEffectProps {
  position: Vector3;
  duration?: number;
  startTime?: number;
  onComplete?: () => void;
}

export default function EvisceratestunEffect({ 
  position, 
  duration = 3000, // 3 seconds for Eviscerate stun
  startTime = Date.now(),
  onComplete 
}: EvisceratestunEffectProps) {
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
    if (progress > 0.83) { // Start fade later for 3-second duration
      const fadeStart = 0.83;
      const fadeProgress = (progress - fadeStart) / (1 - fadeStart);
      setFadeProgress(1 - fadeProgress);
    } else {
      setFadeProgress(1);
    }

    // Pulsing intensity effect - slightly different from concussive blow
    const pulseIntensity = 0.7 + 0.3 * Math.sin(elapsed * 0.006);
    setIntensity(pulseIntensity * fadeProgress);

    // Rotate the lightning bolts - slightly slower for Eviscerate
    effectRef.current.rotation.y += rotationSpeed.current * 0.8;
    effectRef.current.rotation.x = Math.sin(elapsed * 0.003) * 0.12;
  });

  return (
    <group ref={effectRef} position={position}>
      {/* Central lightning core - Purple/Red theme for Eviscerate */}
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.purpleBlue}
          emissive={COLORS.purpleEmission}
          emissiveIntensity={intensity * 3}
          transparent
          opacity={fadeProgress * 0.9}
        />
      </mesh>

      {/* Inner electric sphere */}
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial
          color={COLORS.lightPurple}
          emissive={COLORS.lightPurpleEmission}
          emissiveIntensity={intensity * 5}
          transparent
          opacity={fadeProgress * 0.7}
        />
      </mesh>

      {/* Lightning bolt rings - Red/Purple theme */}
      {[...Array(3)].map((_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 3 + lightningOffset.current, 0]}>
          <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 4]} />
            <meshStandardMaterial
              color={COLORS.pinkRed}
              emissive={COLORS.pinkRed}
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
            color={COLORS.magenta}
            emissive={COLORS.magenta}
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
          color={COLORS.purpleBlue}
          emissive={COLORS.purpleBlue}
          emissiveIntensity={intensity * 2}
          transparent
          opacity={fadeProgress * 0.5}
        />
      </mesh>

      {/* Point light for illumination - Purple theme */}
      <pointLight 
        color={COLORS.purpleBlue}
        intensity={intensity * 3}
        distance={3}
        decay={2}
      />

      {/* Electric sparks - White with purple tint */}
      {[...Array(8)].map((_, i) => (
        <mesh key={`spark-${i}`} 
              position={[
                (0.3 + Math.random() * 0.5) * Math.cos(i * Math.PI / 4),
                Math.random() * 0.4 - 0.2,
                (0.3 + Math.random() * 0.5) * Math.sin(i * Math.PI / 4)
              ]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial
            color={COLORS.purpleWhite}
            emissive={COLORS.purpleWhite}
            emissiveIntensity={intensity * 6}
            transparent
            opacity={fadeProgress * Math.random() * 0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
