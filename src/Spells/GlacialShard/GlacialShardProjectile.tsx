import { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import FrostTrail from './FrostTrail';

interface GlacialShardProjectileProps {
  id: number;
  position: Vector3;
  direction: Vector3;
  onImpact?: (position?: Vector3) => void;
  checkCollisions?: (shardId: number, position: Vector3) => boolean;
}

export default function GlacialShardProjectile({ 
  id,
  position, 
  direction, 
  onImpact,
  checkCollisions
}: GlacialShardProjectileProps) {
  const shardRef = useRef<THREE.Group>(null);
  const shardMeshRef = useRef<THREE.Mesh>(null);
  const startPosition = useRef(position.clone());
  const hasCollided = useRef(false);
  const [showImpact, setShowImpact] = useState(false);
  const [impactPosition, setImpactPosition] = useState<Vector3 | null>(null);

  // Initialize position on mount
  useEffect(() => {
    if (shardRef.current) {
      shardRef.current.position.copy(position);
    }
  }, [position]);

  useFrame((_, delta) => { 
    if (!shardRef.current || hasCollided.current) return;

    // Move shard forward with fast speed
    const speed = 35 * delta; // Slightly faster speed
    shardRef.current.position.add(
      direction.clone().multiplyScalar(speed)
    );

    // Check collisions each frame with improved detection
    if (checkCollisions) {
      const currentPos = shardRef.current.position.clone();
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

    // Check max distance (50 units)
    if (shardRef.current.position.distanceTo(startPosition.current) > 30) {
      if (!hasCollided.current) {
        hasCollided.current = true;
        setImpactPosition(shardRef.current.position.clone());
        setShowImpact(true);
        if (onImpact) {
          onImpact(shardRef.current.position.clone());
        }
      }
    }
  });

  // Handle impact completion
  const handleImpactComplete = () => {
    setTimeout(() => {
      if (onImpact) {
        onImpact();
      }
    }, 300);
  };

  return (
    <group>
      {!hasCollided.current && (
        <>
          {/* Frost trail effect - completely outside the moving group to avoid coordinate conflicts */}
          <FrostTrail
            color={new THREE.Color("#4DDDFF")}
            size={0.4}
            meshRef={shardRef}
            opacity={0.9}
          />
          
          <group ref={shardRef} position={position.toArray()}>
            <group
              rotation={[
                0,
                Math.atan2(direction.x, direction.z),
                0
              ]}
            >
            {/* Main shard crystal - larger and more prominent */}
            <mesh ref={shardMeshRef} rotation={[Math.PI/2, 0, 0]}>
              <coneGeometry args={[0.25, 1.0, 8]} />
              <meshStandardMaterial
                color="#2DD4FF"
                emissive="#2DD4FF"
                emissiveIntensity={2.5}
                transparent
                opacity={0.95}
              />
            </mesh>




            {/* Frost aura around shard - enhanced */}
            <mesh>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial
                color="#CCFFFF"
                emissive="#CCFFFF"
                emissiveIntensity={1.2}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Outer frost mist */}
            <mesh>
              <sphereGeometry args={[0.8, 12, 12]} />
              <meshStandardMaterial
                color="#E6FFFF"
                emissive="#E6FFFF"
                emissiveIntensity={0.6}
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Rotating ice rings for more dynamic effect */}
            {[...Array(2)].map((_, i) => (
              <mesh
                key={`ring-${i}`}
                rotation={[Math.PI/2, 0, Date.now() * 0.002 + i * Math.PI]}
              >
                <torusGeometry args={[0.4 + i * 0.1, 0.05, 8, 16]} />
                <meshStandardMaterial
                  color="#4DDDFF"
                  emissive="#4DDDFF"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.6 - i * 0.2}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Enhanced light source */}
            <pointLight
              color="#2DD4FF"
              intensity={4}
              distance={6}
              decay={2}
            />
          </group>
        </group>
        </>
      )}

      {/* Impact effect */}
      {showImpact && impactPosition && (
        <GlacialShardImpact 
          position={impactPosition}
          onComplete={handleImpactComplete}
        />
      )}
    </group>
  );
}

// Impact effect component
interface GlacialShardImpactProps {
  position: Vector3;
  onComplete?: () => void;
}

function GlacialShardImpact({ position, onComplete }: GlacialShardImpactProps) {
  const startTime = useRef(Date.now());
  const [, forceUpdate] = useState({});
  const IMPACT_DURATION = 0.8; // Slightly longer duration
  
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
      
      const elapsed = (Date.now() - startTime.current) / 1000;
      if (elapsed > IMPACT_DURATION) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 16);
    
    const timer = setTimeout(() => {
      clearInterval(interval);
      if (onComplete) onComplete();
    }, IMPACT_DURATION * 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  const elapsed = (Date.now() - startTime.current) / 1000;
  const fade = Math.max(0, 1 - (elapsed / IMPACT_DURATION));
  
  if (fade <= 0) return null;

  return (
    <group position={position}>
      {/* Main ice explosion effect */}
      <mesh>
        <sphereGeometry args={[2.0 * (1 + elapsed * 2), 16, 16]} />
        <meshStandardMaterial
          color="#2DD4FF"
          emissive="#2DD4FF"
          emissiveIntensity={2.5 * fade}
          transparent
          opacity={0.7 * fade}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary explosion ring */}
      <mesh>
        <sphereGeometry args={[1.2 * (1 + elapsed * 3), 12, 12]} />
        <meshStandardMaterial
          color="#4DDDFF"
          emissive="#4DDDFF"
          emissiveIntensity={3 * fade}
          transparent
          opacity={0.8 * fade}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ice shards burst */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 2.0 * (1 + elapsed * 1.5);
        
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * radius,
              Math.cos(angle) * radius * 0.3,
              Math.cos(angle + Math.PI/4) * radius * 0.5
            ]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          >
            <coneGeometry args={[0.12, 0.6, 6]} />
            <meshStandardMaterial
              color="#CCFFFF"
              emissive="#CCFFFF"
              emissiveIntensity={2 * fade}
              transparent
              opacity={0.9 * fade}
            />
          </mesh>
        );
      })}

      {/* Expanding frost rings */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={`frost-ring-${i}`}
          rotation={[-Math.PI/2, 0, i * Math.PI/3]}
        >
          <torusGeometry args={[1.5 * (1 + elapsed * 2) + i * 0.3, 0.1, 8, 24]} />
          <meshStandardMaterial
            color="#AAEEFF"
            emissive="#AAEEFF"
            emissiveIntensity={1.8 * fade}
            transparent
            opacity={0.6 * fade * (1 - i * 0.2)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Enhanced bright flash */}
      <pointLight
        color="#2DD4FF"
        intensity={12 * fade}
        distance={8}
        decay={2}
      />
    </group>
  );
} 