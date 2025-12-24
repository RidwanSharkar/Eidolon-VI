import { useRef, useEffect, useState, useMemo } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Group, Mesh, ConeGeometry, SphereGeometry, TorusGeometry, MeshStandardMaterial } from 'three';
import FrostTrail from './FrostTrail';

// Pre-allocated color for performance - avoids new Color() on every render
const FROST_TRAIL_COLOR = new Color("#4DDDFF");

// Shared geometries for glacial shard - avoid per-render allocations
const glacialShardGeometries = {
  mainCone: new ConeGeometry(0.25, 1.0, 8),
  frostAura: new SphereGeometry(0.5, 16, 16),
  frostMist: new SphereGeometry(0.8, 12, 12),
  torus0: new TorusGeometry(0.4, 0.05, 8, 16),
  torus1: new TorusGeometry(0.5, 0.05, 8, 16),
  // Impact geometries
  impactSphere: new SphereGeometry(2.0, 16, 16),
  innerSphere: new SphereGeometry(1.2, 12, 12),
  shardCone: new ConeGeometry(0.12, 0.6, 6),
  frostRing0: new TorusGeometry(1.5, 0.1, 8, 24),
  frostRing1: new TorusGeometry(1.8, 0.1, 8, 24),
  frostRing2: new TorusGeometry(2.1, 0.1, 8, 24)
};

let glacialShardResourceUsers = 0;

const disposeGlacialShardResources = () => {
  Object.values(glacialShardGeometries).forEach(geo => geo.dispose());
};

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
  const shardRef = useRef<Group>(null);
  const shardMeshRef = useRef<Mesh>(null);
  const startPosition = useRef(position.clone());
  const hasCollided = useRef(false);
  const [showImpact, setShowImpact] = useState(false);
  const [impactPosition, setImpactPosition] = useState<Vector3 | null>(null);

  // Resource management
  useEffect(() => {
    glacialShardResourceUsers += 1;
    return () => {
      glacialShardResourceUsers = Math.max(0, glacialShardResourceUsers - 1);
      if (glacialShardResourceUsers === 0) {
        disposeGlacialShardResources();
      }
    };
  }, []);

  // Shared materials - memoized
  const materials = useMemo(() => ({
    mainCone: new MeshStandardMaterial({
      color: "#2DD4FF",
      emissive: "#2DD4FF",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.95
    }),
    frostAura: new MeshStandardMaterial({
      color: "#CCFFFF",
      emissive: "#CCFFFF",
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    frostMist: new MeshStandardMaterial({
      color: "#E6FFFF",
      emissive: "#E6FFFF",
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    torus: new MeshStandardMaterial({
      color: "#4DDDFF",
      emissive: "#4DDDFF",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

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
            color={FROST_TRAIL_COLOR}
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
            <mesh 
              ref={shardMeshRef} 
              rotation={[Math.PI/2, 0, 0]}
              geometry={glacialShardGeometries.mainCone}
              material={materials.mainCone}
            />

            {/* Frost aura around shard - enhanced */}
            <mesh
              geometry={glacialShardGeometries.frostAura}
              material={materials.frostAura}
            />

            {/* Outer frost mist */}
            <mesh
              geometry={glacialShardGeometries.frostMist}
              material={materials.frostMist}
            />

            {/* Rotating ice rings for more dynamic effect */}
            {[0, 1].map((i) => (
              <mesh
                key={`ring-${i}`}
                rotation={[Math.PI/2, 0, Date.now() * 0.002 + i * Math.PI]}
                geometry={i === 0 ? glacialShardGeometries.torus0 : glacialShardGeometries.torus1}
              >
                <meshStandardMaterial
                  color="#4DDDFF"
                  emissive="#4DDDFF"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.6 - i * 0.2}
                  blending={AdditiveBlending}
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

  // Shared materials for impact - memoized
  const impactMaterials = useMemo(() => ({
    mainExplosion: new MeshStandardMaterial({
      color: "#2DD4FF",
      emissive: "#2DD4FF",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    secondaryExplosion: new MeshStandardMaterial({
      color: "#4DDDFF",
      emissive: "#4DDDFF",
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    shard: new MeshStandardMaterial({
      color: "#CCFFFF",
      emissive: "#CCFFFF",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    }),
    frostRing: new MeshStandardMaterial({
      color: "#AAEEFF",
      emissive: "#AAEEFF",
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(impactMaterials).forEach(mat => mat.dispose());
    };
  }, [impactMaterials]);

  // Pre-generate shard positions
  const shardPositions = useMemo(() => {
    return Array(12).fill(null).map((_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number]
    }));
  }, []);

  // Get frost ring geometry by index
  const getFrostRingGeometry = (i: number) => {
    switch (i) {
      case 0: return glacialShardGeometries.frostRing0;
      case 1: return glacialShardGeometries.frostRing1;
      case 2: return glacialShardGeometries.frostRing2;
      default: return glacialShardGeometries.frostRing0;
    }
  };
  
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

  // Update material opacities and emissive intensities
  impactMaterials.mainExplosion.opacity = 0.7 * fade;
  impactMaterials.mainExplosion.emissiveIntensity = 2.5 * fade;
  impactMaterials.secondaryExplosion.opacity = 0.8 * fade;
  impactMaterials.secondaryExplosion.emissiveIntensity = 3 * fade;
  impactMaterials.shard.opacity = 0.9 * fade;
  impactMaterials.shard.emissiveIntensity = 2 * fade;
  impactMaterials.frostRing.emissiveIntensity = 1.8 * fade;

  const mainScale = 1 + elapsed * 2;
  const innerScale = 1 + elapsed * 3;
  const ringScale = 1 + elapsed * 2;

  return (
    <group position={position}>
      {/* Main ice explosion effect */}
      <mesh
        geometry={glacialShardGeometries.impactSphere}
        material={impactMaterials.mainExplosion}
        scale={[mainScale, mainScale, mainScale]}
      />

      {/* Secondary explosion ring */}
      <mesh
        geometry={glacialShardGeometries.innerSphere}
        material={impactMaterials.secondaryExplosion}
        scale={[innerScale, innerScale, innerScale]}
      />

      {/* Ice shards burst - using pre-generated positions */}
      {shardPositions.map((shard, i) => {
        const radius = 2.0 * (1 + elapsed * 1.5);
        
        return (
          <mesh
            key={i}
            position={[
              Math.sin(shard.angle) * radius,
              Math.cos(shard.angle) * radius * 0.3,
              Math.cos(shard.angle + Math.PI/4) * radius * 0.5
            ]}
            rotation={shard.rotation}
            geometry={glacialShardGeometries.shardCone}
            material={impactMaterials.shard}
          />
        );
      })}

      {/* Expanding frost rings */}
      {[0, 1, 2].map((i) => {
        const opacity = 0.6 * fade * (1 - i * 0.2);
        return (
          <mesh
            key={`frost-ring-${i}`}
            rotation={[-Math.PI/2, 0, i * Math.PI/3]}
            geometry={getFrostRingGeometry(i)}
            scale={[ringScale, ringScale, ringScale]}
          >
            <meshStandardMaterial
              color="#AAEEFF"
              emissive="#AAEEFF"
              emissiveIntensity={1.8 * fade}
              transparent
              opacity={opacity}
              blending={AdditiveBlending}
            />
          </mesh>
        );
      })}

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