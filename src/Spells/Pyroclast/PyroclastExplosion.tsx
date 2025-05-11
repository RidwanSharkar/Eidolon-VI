import React, { useRef, useState, useEffect } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';

interface PyroclastExplosionProps {
  position: Vector3;
  chargeTime?: number;
  explosionStartTime: number | null;
  onComplete?: () => void;
}

const IMPACT_DURATION = 0.8; 

export default function PyroclastExplosion({ 
  position, 
  chargeTime = 1.0,
  explosionStartTime,
  onComplete 
}: PyroclastExplosionProps) {
  const startTime = useRef(explosionStartTime || Date.now());
  const [, forceUpdate] = useState({}); // Force updates to animate
  const normalizedCharge = Math.min(chargeTime / 4, 1.0);
  const scale = 0.5 + (normalizedCharge * 0.8); // Increased base scale
  const intensity = 2 + (normalizedCharge * 3); // Increased intensity
  const sparkCount = 12; // More sparks
  
  useEffect(() => {
    // Animation timer
    const interval = setInterval(() => {
      forceUpdate({});
      
      // Check if we should clean up
      const elapsed = (Date.now() - startTime.current) / 1000;
      if (elapsed > IMPACT_DURATION) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 16); // ~60fps
    
    // Cleanup timer after explosion duration
    const timer = setTimeout(() => {
      clearInterval(interval);
      if (onComplete) onComplete();
    }, IMPACT_DURATION * 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Calculate fade based on elapsed time
  const elapsed = (Date.now() - startTime.current) / 1000;
  const duration = IMPACT_DURATION;
  const fade = Math.max(0, 1 - (elapsed / duration));
  
  if (fade <= 0) return null;

  // More dynamic effect - faster expansion for initial impact
  const expansionRate = 3 + (elapsed < 0.1 ? 8 : 0);

  return (
    <group position={position}>
      {/* Core explosion sphere */}
      <mesh>
        <sphereGeometry args={[0.5 * scale * (1 + elapsed * expansionRate), 32, 32]} />
        <meshStandardMaterial
          color="#FF2200"
          emissive="#FF3300" 
          emissiveIntensity={intensity * fade * 0.5}
          transparent
          opacity={0.9 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner energy sphere */}
      <mesh>
        <sphereGeometry args={[0.525 * scale * (1 + elapsed * (expansionRate + 1)), 24, 24]} />
        <meshStandardMaterial
          color="#FF4400"
          emissive="#FF6600"
          emissiveIntensity={intensity * 0.5 * fade}
          transparent
          opacity={0.95 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Multiple expanding rings */}
      {[0.45, 0.675, 0.8, 0.925, 1.125].map((ringSize, i) => (
        <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
          <torusGeometry args={[ringSize * scale * (1 + elapsed * (expansionRate + 2)), 0.06 * scale, 16, 32]} />
          <meshStandardMaterial  
            color="#FF2200"
            emissive="#FF4400"
            emissiveIntensity={intensity * fade * 0.3}
            transparent
            opacity={0.7 * fade * (1 - i * 0.15)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Particle sparks - more dynamic positioning */}
      {[...Array(sparkCount)].map((_, i) => {
        const angle = (i / sparkCount) * Math.PI * 2;
        const randomOffset = Math.random() * 0.3;
        const radius = scale * (1 + elapsed * (expansionRate - 1)) * (1 + randomOffset);
        const yOffset = (Math.random() - 0.5) * 0.5; // Add some vertical variation
        
        return (
          <mesh
            key={`spark-${i}`}
            position={[
              Math.sin(angle) * radius,
              Math.cos(angle) * radius + yOffset,
              (Math.random() - 0.5) * 0.3 // Add some depth
            ]}
          >
            <sphereGeometry args={[0.08 * scale, 8, 8]} />
            <meshStandardMaterial
              color="#FF5500"
              emissive="#FF7700"
              emissiveIntensity={intensity * 1.2 * fade}
              transparent
              opacity={0.9 * fade}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}

      {/* Dynamic lights - brighter and more intense */}
      <pointLight
        color="#FF2200"
        intensity={intensity * 3 * fade}
        distance={5 * scale}
        decay={1.8}
      />
      <pointLight
        color="#FF4400"
        intensity={intensity * 1.5 * fade}
        distance={8 * scale}
        decay={1.5}
      />
      
      {/* Additional bright flash at the beginning */}
      {elapsed < 0.1 && (
        <pointLight
          color="#FF3300"
          intensity={intensity * 5 * (1 - elapsed * 10)}
          distance={3 * scale}
          decay={1}
        />
      )}
    </group>
  );
}

