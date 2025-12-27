import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Group, Vector3, AdditiveBlending, SphereGeometry } from 'three';
import { useOrbShieldManager } from '@/Spells/Avalanche/useOrbShieldManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { useFrame } from '@react-three/fiber';

// MEMORY FIX: Shared geometry to prevent memory leak - created once at module level
// This was creating new geometry EVERY FRAME in the map function, causing severe memory leaks
const SPARK_GEOMETRY = new SphereGeometry(0.0125, 4, 4);

// MEMORY FIX: Shared vector to prevent creating new Vector3 objects in map function
const SHARED_POSITION_VECTOR = new Vector3();

interface OrbShieldProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export interface OrbShieldRef {
  calculateBonusDamage: () => number;
  consumeOrb: () => void;
}

const OrbShieldSparkEffect: React.FC<{ position: Vector3 }> = ({ position }) => {
  const [sparkPositions, setSparkPositions] = React.useState(() => 
    Array(15).fill(null).map(() => ({
      offset: new Vector3(
        (Math.random() - 0.5) * 0.8,
        0,
        (Math.random() - 0.5) * 0.8
      ),
      speed: new Vector3(
        (Math.random() - 0.5) * 0.55,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.55
      ),
      life: 1.0,
      orbit: {
        radius: 0.2 + Math.random() * 0.3,
        speed: (Math.random() + 0.5) * 2,
        phase: Math.random() * Math.PI * 2
      }
    }))
  );

  useFrame((_, delta) => {
    setSparkPositions(prev => prev.map(spark => {
      const time = Date.now() * 0.001;
      const orbitAngle = time * spark.orbit.speed + spark.orbit.phase;
      
      spark.offset.x = Math.cos(orbitAngle) * spark.orbit.radius + spark.speed.x;
      spark.offset.z = Math.sin(orbitAngle) * spark.orbit.radius + spark.speed.z;
      spark.offset.y = spark.speed.y;
      
      spark.speed.add(new Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.01
      ));
      
      spark.speed.multiplyScalar(0.8);
      spark.life -= delta * 1;
      
      if (spark.life <= 0) {
        return {
          offset: new Vector3(
            (Math.random() - 0.5) * 0.4,
            0,
            (Math.random() - 0.5) * 0.4
          ),
          speed: new Vector3(
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.05,
            (Math.random() - 0.5) * 0.15
          ),
          life: 1.0,
          orbit: {
            radius: 0.4 + Math.random() * 0.3,
            speed: (Math.random() + 0.5) * 2,
            phase: Math.random() * Math.PI * 2
          }
        };
      }
      return spark;
    }));
  });

  return (
    <group position={position}>
      {sparkPositions.map((spark, i) => (
        <mesh key={i} position={spark.offset.toArray()}>
          {/* MEMORY FIX: Use shared geometry instead of inline JSX to prevent memory leak */}
          <primitive object={SPARK_GEOMETRY} attach="geometry" />
          <meshStandardMaterial
            color="#4488ff"
            emissive="#4488ff"
            emissiveIntensity={3}
            transparent
            opacity={spark.life * 0.8}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

const OrbShield = forwardRef<OrbShieldRef, OrbShieldProps>(({
  parentRef,
  charges,
  setCharges,
}, ref) => {
  const groupRef = useRef<Group>(null);
  const { calculateBonusDamage, consumeOrb } = useOrbShieldManager({
    charges,
    setCharges,
  });

  useImperativeHandle(ref, () => ({
    calculateBonusDamage,
    consumeOrb
  }));

  useFrame(() => {
    if (groupRef.current && parentRef.current) {
      groupRef.current.position.copy(parentRef.current.position);
    }
  });

  if (!parentRef.current || !charges.some(charge => charge.available)) return null;

  const orbitRadius = 0.05;
  const particleCount = charges.length;

  return (
    <group ref={groupRef}>
      {charges.map((charge, index) => {
        if (!charge.available) return null;

        const phi = Math.acos(-1 + (2 * index) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        
        const x = orbitRadius * Math.sin(phi) * Math.cos(theta);
        const y = orbitRadius * Math.sin(phi) * Math.sin(theta + Date.now() * 0.001);
        const z = orbitRadius * Math.cos(phi);

        return (
          <OrbShieldSparkEffect
            key={charge.id}
            position={SHARED_POSITION_VECTOR.set(x, y, z)}
          />
        );
      })}
    </group>
  );
});

OrbShield.displayName = 'OrbShield';

export default OrbShield;