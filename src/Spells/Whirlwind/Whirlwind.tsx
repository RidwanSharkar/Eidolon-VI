import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWhirlwindManager } from './useWhirlwindManager';

interface WhirlwindProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  onHit?: (targetId: string, damage: number) => void;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  setDamageNumbers?: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
  }>) => void;
  nextDamageNumberId?: { current: number };
  charges: Array<{
    id: number; 
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  onWhirlwindEnd?: () => void;
}

export default function Whirlwind({
  parentRef,
  isActive,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId,
  charges,
  setCharges,
  onWhirlwindEnd
}: WhirlwindProps) {
  const whirlwindRef = useRef<Group>(null);
  const rotationSpeed = useRef(0);
  const hitEnemies = useRef<Set<string>>(new Set());
  const lastHitTime = useRef<Record<string, number>>({});

  const { consumeCharge } = useWhirlwindManager({
    parentRef,
    charges,
    setCharges,
    isWhirlwinding: isActive
  });

  // Add check for available charges
  const hasAvailableCharges = charges.some(charge => charge.available);
  const shouldBeActive = isActive && hasAvailableCharges;

  useEffect(() => {
    if (!shouldBeActive) {
      hitEnemies.current.clear();
      rotationSpeed.current = 0;
      onWhirlwindEnd?.();
    }
  }, [shouldBeActive, onWhirlwindEnd]);

  useEffect(() => {
    if (shouldBeActive) {
      const interval = setInterval(() => {
        const success = consumeCharge();
        if (!success) {
          // Stop whirlwind if no charges available
          onWhirlwindEnd?.();
        }
      }, 1000); // Consume 1 orb every 1.25 seconds
      
      return () => clearInterval(interval);
    }
  }, [shouldBeActive, consumeCharge, onWhirlwindEnd]);

  useFrame((_, delta) => {
    if (!whirlwindRef.current || !parentRef.current || !shouldBeActive) return;

    // Update position to follow parent
    whirlwindRef.current.position.copy(parentRef.current.position);
    
    // Accelerate rotation up to max speed
    rotationSpeed.current = Math.min(rotationSpeed.current + delta * 3, 25);
    
    // Apply rotation
    whirlwindRef.current.rotation.y += rotationSpeed.current * delta;

    // Hit detection
    if (onHit && setDamageNumbers && nextDamageNumberId && enemyData) {
      enemyData.forEach(enemy => {
        const now = Date.now();
        const lastHit = lastHitTime.current[enemy.id] || 0;
        
        // Debounce hit detection (150ms)
        if (now - lastHit < 333) return;

        const distance = whirlwindRef.current!.position.distanceTo(enemy.position);
        const maxRange = 6.25; // Spear range
        
        if (distance <= maxRange) {
          // Sweet spot check (85-100% of max range)
          const isMaxRangeHit = distance >= maxRange * 0.8;
          
          const baseDamage = 19; // Base whirlwind damage
          let damage, isCritical;

          if (isMaxRangeHit) {
            // Guaranteed critical at max range with bonus damage
            damage = baseDamage * 2;
            isCritical = true;
          } else {
            damage = baseDamage;
            isCritical = false;
          }
          
          onHit(enemy.id, damage);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: enemy.position.clone(),
            isCritical
          }]);
          
          lastHitTime.current[enemy.id] = now;
        }
      });
    }
  });

  return (
    <group ref={whirlwindRef}>
      {shouldBeActive && (
        <>
          {/* Whirlwind effect rings - rotated to be parallel to ground */}
          {[0.5, 1, 1.5].map((radius, i) => (
            <mesh key={i} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius * 2, 0.1, 16, 32]} />
              <meshStandardMaterial
                color={new THREE.Color(0xFF0000)}
                emissive={new THREE.Color(0xFF0000)}
                emissiveIntensity={2}
                transparent
                opacity={0.6 - i * 0.15}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}

          {/* Energy trails - also rotated to be parallel to ground */}
          {[...Array(8)].map((_, i) => (
            <mesh
              key={`trail-${i}`}
              position={[0, 0.5, 0]}
              rotation={[0, (i / 8) * Math.PI*2, 0]}
            >
              <planeGeometry args={[6.75, 0.5]} />
              <meshStandardMaterial
                color={new THREE.Color(0xFF0000)}
                emissive={new THREE.Color(0xFF0000)}
                emissiveIntensity={1.5}
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
} 