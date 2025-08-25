import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useReigniteManager } from './useReigniteManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { useFrame } from '@react-three/fiber';

interface ReigniteProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
  isActive?: boolean; // Determines if the effect is active
  onHealthChange?: (health: number) => void;
  setDamageNumbers?: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId?: React.MutableRefObject<number>;
}

export interface ReigniteRef {
  processKill: (position?: Vector3) => void;
}

const Reignite = forwardRef<ReigniteRef, ReigniteProps>(({
  parentRef,
  setCharges,
  isActive = true, // Default to true for backward compatibility
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId
}, ref) => {
  const groupRef = useRef<Group>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const [flameParticles, setFlameParticles] = useState<Array<{id: number, position: Vector3, velocity: Vector3, life: number}>>([]);
  const explosionScaleRef = useRef(0.1);
  const explosionStartTimeRef = useRef(0);
  const nextParticleId = useRef(1);
  const EXPLOSION_DURATION = 0.75; // Explosion duration in seconds

  const { processKill } = useReigniteManager({
    setCharges,
    onHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    parentRef
  });

  // Process kill function with enhanced effects
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processKillWithEffect = (position?: Vector3) => {
    // We're simplifying so we don't use position, but we keep the parameter
    // for API compatibility
    if (!isActive) {
      return;
    }
    
    // Use the enhanced processKill from manager (handles charge restoration and healing)
    processKill();
    
    // Show explosion effect
    setShowExplosion(true);
    explosionScaleRef.current = 0.1;
    explosionStartTimeRef.current = Date.now();

    // Create upward flame particles using relative positioning
    // Particles will be positioned relative to the Reignite group, not absolute world coordinates
    const newParticles: Array<{id: number, position: Vector3, velocity: Vector3, life: number}> = [];
    
    // Create 8-12 flame particles shooting upward
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 0.5 + Math.random() * 1.0;
      
      newParticles.push({
        id: nextParticleId.current++,
        // Use relative positioning - particles start at the center of the effect
        position: new Vector3(
          Math.cos(angle) * radius * 0.3,
          0.2,
          Math.sin(angle) * radius * 0.3
        ),
        velocity: new Vector3(
          Math.cos(angle) * 0.5,
          2.5 + Math.random() * 1.5, // Strong upward velocity
          Math.sin(angle) * 0.5
        ),
        life: 1.0 + Math.random() * 0.5 // 1-1.5 second lifetime
      });
    }
    
    setFlameParticles(prev => [...prev, ...newParticles]);
  };

  useImperativeHandle(ref, () => ({
    processKill: processKillWithEffect
  }));

  useFrame((_, delta) => {
    if (groupRef.current && parentRef.current) {
      // Position the effect exactly at the unit's current position
      groupRef.current.position.copy(parentRef.current.position);
      // Keep the effect at ground level where the spherical effect occurs
      groupRef.current.position.y = parentRef.current.position.y;
    }

    // Animate the explosion if it's active
    if (showExplosion) {
      const elapsed = (Date.now() - explosionStartTimeRef.current) / 1000;
      
      if (elapsed < EXPLOSION_DURATION) {
        // Calculate scale based on elapsed time - start small, expand quickly, then slow
        const progress = elapsed / EXPLOSION_DURATION;
        
        // Use a non-linear scale function for more dynamic effect
        // Fast expansion at first, slowing down towards the end
        explosionScaleRef.current = 3 * Math.pow(progress, 0.5) * (1 - progress * 0.5);
      } else {
        setShowExplosion(false);
      }
    }

    // Update flame particles
    setFlameParticles(prev => {
      return prev.map(particle => {
        // Update position based on velocity
        particle.position.add(particle.velocity.clone().multiplyScalar(delta));
        
        // Apply gravity and air resistance
        particle.velocity.y -= 9.8 * delta * 0.3; // Reduced gravity
        particle.velocity.multiplyScalar(0.98); // Air resistance
        
        // Reduce life
        particle.life -= delta;
        
        return particle;
      }).filter(particle => particle.life > 0); // Remove dead particles
    });
  });

  // Don't render anything if not active
  if (!isActive) return null;

  return (
    <group ref={groupRef}>
      {/* Simple explosion effect */}
      {showExplosion && (
        <mesh>
          <sphereGeometry args={[explosionScaleRef.current, 24, 24]} />
          <meshStandardMaterial
            color="#ff3300"
            emissive="#ff0000"
            emissiveIntensity={2}
            transparent
            opacity={1 - (explosionScaleRef.current / 3)} // Fade out as it expands
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Optional glow light */}
      {showExplosion && (
        <pointLight
          color="#ff3300"
          intensity={5 * (1 - explosionScaleRef.current / 3)}
          distance={5}
          decay={2}
        />
      )}

      {/* Upward flame particles */}
      {flameParticles.map(particle => (
        <FlameParticle 
          key={particle.id} 
          position={particle.position} 
          life={particle.life}
        />
      ))}
    </group>
  );
});

// Add display name to fix linter error
Reignite.displayName = 'Reignite';

// Flame particle component for upward fire effects
function FlameParticle({ position, life }: { position: Vector3; life: number }) {
  const particleRef = useRef<THREE.Mesh>(null);
  const maxLife = useRef(life);
  
  useFrame(() => {
    if (!particleRef.current) return;
    
    const lifeProgress = 1 - (life / maxLife.current);
    
    // Scale down as the particle ages
    const scale = 0.3 * (1 - lifeProgress * 0.7);
    particleRef.current.scale.set(scale, scale, scale);
    
    // Fade out
    const material = particleRef.current.material as THREE.MeshStandardMaterial;
    if (material) {
      material.opacity = Math.max(0, 1 - lifeProgress);
      
      // Color transition from bright orange to red
      const r = 1.0;
      const g = Math.max(0.2, 0.8 - lifeProgress * 0.6);
      const b = 0.0;
      material.color.setRGB(r, g, b);
      material.emissive.setRGB(r * 0.8, g * 0.6, b);
    }
  });
  
  return (
    <mesh ref={particleRef} position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[0.4, 8, 8]} />
      <meshStandardMaterial 
        color="#ff6600"
        emissive="#ff4400"
        emissiveIntensity={2.5}
        transparent={true}
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default Reignite;