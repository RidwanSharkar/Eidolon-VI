import { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ElementalTrail from './ElementalTrail';

interface ElementalProjectileProps {
  id: number;
  position: Vector3;
  direction: Vector3;
  targetId?: string;
  currentTargetPosition?: Vector3;
  onImpact?: (position?: Vector3) => void;
  checkCollisions?: (projectileId: number, position: Vector3) => boolean;
}

export default function ElementalProjectile({ 
  id,
  position, 
  direction, 
  targetId,
  currentTargetPosition,
  onImpact,
  checkCollisions
}: ElementalProjectileProps) {
  const projectileRef = useRef<THREE.Group>(null);
  const projectileMeshRef = useRef<THREE.Mesh>(null);
  const startPosition = useRef(position.clone());
  const hasCollided = useRef(false);
  const [showImpact, setShowImpact] = useState(false);
  const [impactPosition, setImpactPosition] = useState<Vector3 | null>(null);

  // Initialize position on mount
  useEffect(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(position);
    }
  }, [position]);

  // Track current movement direction for rotation
  const currentDirection = useRef(direction.clone());

  useFrame((_, delta) => { 
    if (!projectileRef.current || hasCollided.current) return;

    // Calculate movement direction with homing behavior
    let movementDirection = direction.clone();
    
    // If we have a current target position, add homing behavior
    if (currentTargetPosition && targetId) {
      const currentPos = projectileRef.current.position;
      // Add height offset to target position for better trajectory (match other projectiles)
      const adjustedTargetPosition = currentTargetPosition.clone().setY(currentTargetPosition.y + 1.5);
      const targetDirection = adjustedTargetPosition.sub(currentPos).normalize();
      
      // Blend original direction with target direction for smooth homing
      // 30% original direction, 70% homing for strong tracking
      movementDirection = direction.clone().multiplyScalar(0.3).add(
        targetDirection.multiplyScalar(0.7)
      ).normalize();
      
      // Update current direction for rotation
      currentDirection.current = movementDirection.clone();
    }

    // Move projectile forward with fast speed
    const speed = 20 * delta; // Match the speed from Elemental constants
    projectileRef.current.position.add(
      movementDirection.multiplyScalar(speed)
    );

    // Check collisions each frame
    if (checkCollisions) {
      const currentPos = projectileRef.current.position.clone();
      const hitSomething = checkCollisions(id, currentPos);
      
      if (hitSomething) {
        hasCollided.current = true;
        setImpactPosition(currentPos);
        setShowImpact(true);
        if (onImpact) {
          onImpact(currentPos);
        }
        return;
      }
    }

    // Check max distance (30 units)
    if (projectileRef.current.position.distanceTo(startPosition.current) > 30) {
      if (!hasCollided.current) {
        hasCollided.current = true;
        setImpactPosition(projectileRef.current.position.clone());
        setShowImpact(true);
        if (onImpact) {
          onImpact(projectileRef.current.position.clone());
        }
      }
    }
  });

  return (
    <group>
      {!hasCollided.current && (
        <>
          {/* Elemental trail effect - outside the moving group to avoid coordinate conflicts */}
          <ElementalTrail
            color={new THREE.Color("#4FC3F7")}
            size={0.35}
            meshRef={projectileRef}
            opacity={0.9}
          />
          
          <group ref={projectileRef} position={position.toArray()}>
            <group
              rotation={[
                0,
                Math.atan2(currentDirection.current.x, currentDirection.current.z),
                Math.PI/4
              ]}
            >
              {/* Main ice shard - larger and more prominent */}
              <mesh ref={projectileMeshRef} rotation={[Math.PI/2, 0, 0]}>
                <coneGeometry args={[0.175, 0.6, 8]} />
                <meshStandardMaterial
                  color="#4FC3F7"
                  emissive="#29B6F6"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={0.90}
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>

   

  
                      </group>
          </group>
        </>
      )}

      {/* Impact effect */}
      {showImpact && impactPosition && (
        <ElementalImpact position={impactPosition} onComplete={() => {
          setTimeout(() => {
            if (onImpact) {
              onImpact();
            }
          }, 300);
        }} />
      )}
    </group>
  );
}

interface ElementalImpactProps {
  position: Vector3;
  onComplete?: () => void;
}

function ElementalImpact({ position, onComplete }: ElementalImpactProps) {
  const [elapsed, setElapsed] = useState(0);
  const duration = 0.3;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const newElapsed = (Date.now() - startTime) / 1000;
      setElapsed(newElapsed);
      
      if (newElapsed >= duration) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const fade = Math.max(0, 1 - (elapsed / duration));

  return (
    <group position={position.toArray()}>
      {/* Water explosion effect */}
      <mesh>
        <sphereGeometry args={[0.6 * (1 + elapsed * 2), 16, 16]} />
        <meshStandardMaterial
          color="#4FC3F7"
          emissive="#29B6F6"
          emissiveIntensity={0.8 * fade}
          transparent
          opacity={0.6 * fade}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>


      <pointLight
        color="#4FC3F7"
        intensity={1.2 * fade}
        distance={4}
        decay={2}
      />
    </group>
  );
} 