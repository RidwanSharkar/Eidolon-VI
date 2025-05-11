import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWhirlwindManager } from './useWhirlwindManager';
import { ReigniteRef } from '../Reignite/Reignite';


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
  reigniteRef?: React.RefObject<ReigniteRef>;
}

// WhirlwindFireEffect component
function WhirlwindFireEffect({ parentRef, rotationSpeed }: { parentRef: React.RefObject<Group>, rotationSpeed: React.RefObject<number> }) {
  const flameParticlesRef = useRef<THREE.Group>(null);
  const lastUpdateTime = useRef(0);
  const particleRefs = useRef<Array<{
    angle: number;
    height: number;
    radius: number;
    rotationOffset: number;
    speed: number;
    spinSpeed: number;
  }>>([]);

  // Initialize particles with much tighter radius
  useEffect(() => {
    particleRefs.current = Array(56).fill(null).map((_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      height: 0 + Math.random() * 1,
      radius: 0.4 + Math.random() * 2.25,
      rotationOffset: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      spinSpeed: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3)
    }));

    // Store ref value for cleanup
    const particles = flameParticlesRef.current;

    // Cleanup function
    return () => {
      if (particles) {
        // Dispose of geometries and materials
        particles.children.forEach(child => {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        // Clear the particles array
        particles.clear();
        // Remove from parent if it exists
        if (particles.parent) {
          particles.parent.remove(particles);
        }
      }
      // Clear the refs
      particleRefs.current = [];
      lastUpdateTime.current = 0;
    };
  }, []);

  useFrame((_, delta) => {
    if (!flameParticlesRef.current || !parentRef.current || rotationSpeed.current === null) return;

    // Rotate the entire flame effect
    flameParticlesRef.current.rotation.y += delta * (rotationSpeed.current || 0) * 0.5;

    // Update particles
    const now = Date.now();
    if (now - lastUpdateTime.current > 50) {
      particleRefs.current.forEach((particle, i) => {
        const child = flameParticlesRef.current!.children[i] as THREE.Mesh;
        if (!child) return;

        // Update particle position in a tight spiral pattern
        particle.angle += delta * particle.speed * (rotationSpeed.current || 0) / 5;
        
        // Calculate position with very small radius to keep particles centered
        const x = Math.cos(particle.angle) * particle.radius;
        const z = Math.sin(particle.angle) * particle.radius;
        
        // Set position relative to center, with height variation
        child.position.set(
          x,
          particle.height + Math.sin(now * 0.002 + i) * 0.2 - 0.35, // Add slight vertical movement
          z
        );
        
        // Rotate particle around its own axis
        child.rotation.y += delta * particle.spinSpeed;
        child.rotation.x += delta * particle.spinSpeed * 0.75;
        
        // Scale based on rotation speed
        const speedScale = 0.25 + ((rotationSpeed.current || 0) / 25) * 0.2;
        child.scale.setScalar(speedScale);

        // Update material properties
        const material = child.material as THREE.MeshStandardMaterial;
        if (material) {
          material.opacity = 0.2 + ((rotationSpeed.current || 0) / 25) * 0.3;
          material.emissiveIntensity = 0.025 + ((rotationSpeed.current || 0) / 25) * 1.01;
        }
      });
      lastUpdateTime.current = now;
    }
  });

  return (
    <group ref={flameParticlesRef}>
      {/* Fire particles */}
      {particleRefs.current.map((_, i) => (
        <mesh key={i}>
          <dodecahedronGeometry args={[0.115, 0]} /> {/*  particle size */}
          <meshStandardMaterial
            color="#FF4400"
            emissive="#FF2200"
            emissiveIntensity={2}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Ground fire ring  */}
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.5, 32]} /> 
        <meshStandardMaterial
          color="#FF3000"
          emissive="#FF2200"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>


      {/* Dynamic lighting - centered */}
      <pointLight
        position={[0, 0.5, 0]}
        color="#FF6000"
        intensity={0.1 + ((rotationSpeed.current || 0) / 25) * 2}
        distance={3}
        decay={2}
      />
    </group>
  );
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
  onWhirlwindEnd,
  reigniteRef
}: WhirlwindProps) {
  const whirlwindRef = useRef<Group>(null);
  const rotationSpeed = useRef(0);
  const hitEnemies = useRef<Set<string>>(new Set());
  const lastHitTime = useRef<Record<string, number>>({});
  const fireEffectRef = useRef<boolean>(false);
  const prevActiveState = useRef<boolean>(false);

  const { consumeCharge } = useWhirlwindManager({
    parentRef,
    charges,
    setCharges,
    isWhirlwinding: isActive,
    onWhirlwindEnd
  });

  // Add check for available charges
  const hasAvailableCharges = charges.some(charge => charge.available);
  const shouldBeActive = isActive && hasAvailableCharges;

  // Reset rotation speed when whirlwind is newly activated
  useEffect(() => {
    if (shouldBeActive && !prevActiveState.current) {
      // Reset speed when starting a new whirlwind
      rotationSpeed.current = 0;
    }
    prevActiveState.current = shouldBeActive;
  }, [shouldBeActive]);

  useEffect(() => {
    if (!shouldBeActive && isActive) {
      hitEnemies.current.clear();
      rotationSpeed.current = 0;
      fireEffectRef.current = false;
      onWhirlwindEnd?.();
    }
  }, [shouldBeActive, isActive, onWhirlwindEnd]);

  useEffect(() => {
    if (shouldBeActive) {
      // Set fire effect to active when whirlwind starts
      fireEffectRef.current = true;
      
      const interval = setInterval(() => {
        const success = consumeCharge();
        if (!success) {
          // Stop whirlwind if no charges available
          fireEffectRef.current = false;
          onWhirlwindEnd?.();
        }
      }, 500); // CHECK CHARGES INTERVAL
      
      return () => {
        clearInterval(interval);
        // Ensure fire effect is cleaned up
        fireEffectRef.current = false;
      };
    } else {
      // Ensure fire effect is cleaned up when not active
      fireEffectRef.current = false;
    }
  }, [shouldBeActive, consumeCharge, onWhirlwindEnd]);

  useEffect(() => {
    // Capture refs at effect creation time
    const currentHitEnemies = hitEnemies.current;
    
    return () => {
      // Use captured values in cleanup
      fireEffectRef.current = false;
      currentHitEnemies.clear();
      rotationSpeed.current = 0;
    };
  }, []);

  useFrame((_, delta) => {
    if (!whirlwindRef.current || !parentRef.current || !shouldBeActive) return;

    // Update position to follow parent
    whirlwindRef.current.position.copy(parentRef.current.position);
    
    // Accelerate rotation up to max speed
    rotationSpeed.current = Math.min(rotationSpeed.current + delta * 8, 25);
    
    // Apply rotation
    whirlwindRef.current.rotation.y += rotationSpeed.current * delta;

    // Hit detection
    if (onHit && setDamageNumbers && nextDamageNumberId && enemyData) {
      enemyData.forEach(enemy => {
        // Check if enemy is already dead - add this check
        if (enemy.health <= 0) return;
        
        const now = Date.now();
        const lastHit = lastHitTime.current[enemy.id] || 0;
        
        // Scale hit interval based on rotation speed (faster rotation = faster hits)
        // Start at 550ms at speed 0, decrease to 150ms at max speed (25), with slower progression
        const minInterval = 175; // Minimum interval in ms
        const maxInterval = 500; // Maximum interval in ms
        const speedRatio = Math.pow(rotationSpeed.current / 25, 2); // Square the ratio to make progression slower
        const currentInterval = maxInterval - (maxInterval - minInterval) * speedRatio;

        
        // Debounce hit detection with dynamic interval
        if (now - lastHit < currentInterval) return;

        const distance = whirlwindRef.current!.position.distanceTo(enemy.position);
        const maxRange = 4.6; // Spear range
        
        if (distance <= maxRange) {
          // Sweet spot check (80-100% of max range)
          const isMaxRangeHit = distance >= maxRange * 0.825;
          
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
          
          // Get enemy health before damage
          const previousHealth = enemy.health;
          
          // Apply damage
          onHit(enemy.id, damage);
          
          // Check if enemy was killed and process Reignite if needed
          if (previousHealth > 0 && previousHealth - damage <= 0 && reigniteRef?.current) {
            // Create a fresh clone of the position to avoid reference issues
            const killPosition = enemy.position.clone();
            reigniteRef.current.processKill(killPosition);
          }
          
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
    <group>
      {/* Add the fire effect directly as a child of the parent */}
      {shouldBeActive && fireEffectRef.current && parentRef.current && (
        <primitive object={parentRef.current}>
          <WhirlwindFireEffect parentRef={parentRef} rotationSpeed={rotationSpeed} />
        </primitive>
      )}

      <group ref={whirlwindRef}>
        {shouldBeActive && (
          <>
            {/* Whirlwind effect rings - rotated to be parallel to ground */}
            {[0.5, 1, 1.5].map((radius, i) => (
              <mesh key={i} position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
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
                position={[0, -0.25, 0]}
                rotation={[0, (i / 8) * Math.PI*2, 0]}
              >
                <planeGeometry args={[6, 0.25]} />
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
    </group>
  );
} 