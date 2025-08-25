import { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import LavaLashTrail from './LavaLashTrail';

interface LavaLashProjectileProps {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition?: Vector3;
  maxDistance?: number;
  opacity?: number;
  fadeStartTime?: number | null;
  hasCollided?: boolean;
  onImpact?: (position?: Vector3) => void;
  checkCollisions?: (projectileId: number, position: Vector3) => boolean;
}

export default function LavaLashProjectile({ 
  id, // eslint-disable-line @typescript-eslint/no-unused-vars
  position, 
  direction,
  startPosition, // eslint-disable-line @typescript-eslint/no-unused-vars
  maxDistance = 15, // eslint-disable-line @typescript-eslint/no-unused-vars
  opacity: propOpacity = 1,
  fadeStartTime, // eslint-disable-line @typescript-eslint/no-unused-vars
  hasCollided: propHasCollided = false,
  onImpact,
  checkCollisions // eslint-disable-line @typescript-eslint/no-unused-vars
}: LavaLashProjectileProps) {
  const projectileRef = useRef<THREE.Group>(null);
  const projectileMeshRef = useRef<THREE.Mesh>(null);
  const hasCollided = useRef(propHasCollided);
  const [showImpact, ] = useState(false);
  const [impactPosition, ] = useState<Vector3 | null>(null);
  const [opacity, setOpacity] = useState(propOpacity); // Use prop opacity or default to 1.0

  // Initialize position on mount
  useEffect(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(position);
    }
  }, [position]);

  // Update opacity from props when fading
  useEffect(() => {
    setOpacity(propOpacity);
  }, [propOpacity]);

  // Update position from props
  useFrame(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(position);
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
          {/* Lava trail effect - completely outside the moving group to avoid coordinate conflicts */}
          <LavaLashTrail
            color={new THREE.Color("#FF4500")} // Orange-red fire color
            size={0.205}
            meshRef={projectileRef}
            opacity={opacity * 0.9} // Apply dynamic opacity to trail
          />
          
          <group ref={projectileRef} position={position.toArray()}>
            <group
              rotation={[
                0,
                Math.atan2(direction.x, direction.z),
                0
              ]}
            >
            {/* Main fireball core */}
            <mesh ref={projectileMeshRef}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial
                color="#FF6600"
                emissive="#FF6600"
                emissiveIntensity={3.0 * opacity}
                transparent
                opacity={0.9 * opacity}
              />
            </mesh>

            {/* Inner fire core */}
            <mesh>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial
                color="#FFAA00"
                emissive="#FFAA00"
                emissiveIntensity={4.0 * opacity}
                transparent
                opacity={0.8 * opacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Outer fire aura */}
            <mesh>
              <sphereGeometry args={[0.35, 12, 12]} />
              <meshStandardMaterial
                color="#FF4500"
                emissive="#FF4500"
                emissiveIntensity={2.0 * opacity}
                transparent
                opacity={0.4 * opacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Rotating fire rings for dynamic effect */}
            {[...Array(2)].map((_, i) => (
              <mesh
                key={`fire-ring-${i}`}
                rotation={[Math.PI/2, 0, Date.now() * 0.003 + i * Math.PI]}
              >
                <torusGeometry args={[0.375 + i * 0.1, 0.04, 6, 12]} />
                <meshStandardMaterial
                  color="#FF6600"
                  emissive="#FF6600"
                  emissiveIntensity={2.5 * opacity}
                  transparent
                  opacity={(0.7 - i * 0.2) * opacity}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Enhanced light source */}
            <pointLight
              color="#FF4500"
              intensity={5 * opacity}
              distance={8}
              decay={2}
            />
          </group>
        </group>
        </>
      )}

      {/* Impact effect */}
      {showImpact && impactPosition && (
        <LavaLashImpact 
          position={impactPosition}
          onComplete={handleImpactComplete}
        />
      )}
    </group>
  );
}

// Impact effect component
interface LavaLashImpactProps {
  position: Vector3;
  onComplete?: () => void;
}

function LavaLashImpact({ position, onComplete }: LavaLashImpactProps) {
  const startTime = useRef(Date.now());
  const [, forceUpdate] = useState({});
  const IMPACT_DURATION = 0.3; // Shorter duration for fire explosion
  
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
      {/* Main fire explosion effect */}
      <mesh>
        <sphereGeometry args={[1.8 * (1 + elapsed * 2.5), 16, 16]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF4500"
          emissiveIntensity={3.0 * fade}
          transparent
          opacity={0.8 * fade}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Secondary explosion ring */}
      <mesh>
        <sphereGeometry args={[1.0 * (1 + elapsed * 3.5), 12, 12]} />
        <meshStandardMaterial
          color="#FFAA00"
          emissive="#FFAA00"
          emissiveIntensity={4.0 * fade}
          transparent
          opacity={0.9 * fade}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Fire sparks burst */}
      {[...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 1.5 * (1 + elapsed * 2.0);
        
        return (
          <mesh
            key={i}
            position={[
              Math.sin(angle) * radius,
              Math.cos(angle) * radius * 0.2 + Math.random() * 0.5,
              Math.cos(angle + Math.PI/3) * radius * 0.4
            ]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#FF6600"
              emissive="#FF6600"
              emissiveIntensity={3 * fade}
              transparent
              opacity={0.9 * fade}
            />
          </mesh>
        );
      })}

      {/* Expanding fire rings */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={`fire-explosion-ring-${i}`}
          rotation={[-Math.PI/2, 0, i * Math.PI/3]}
        >
          <torusGeometry args={[1.2 * (1 + elapsed * 2.5) + i * 0.2, 0.08, 6, 16]} />
          <meshStandardMaterial
            color="#FF4500"
            emissive="#FF4500"
            emissiveIntensity={2.5 * fade}
            transparent
            opacity={0.7 * fade * (1 - i * 0.2)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Enhanced bright flash */}
      <pointLight
        color="#FF4500"
        intensity={15 * fade}
        distance={10}
        decay={2}
      />
    </group>
  );
}
