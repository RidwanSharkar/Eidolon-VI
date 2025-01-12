import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useOrbShieldManager } from '@/Spells/OrbShield/useOrbShieldManager';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.8
      ),
      speed: new Vector3(
        (Math.random() - 0.5) * 0.55,
        (Math.random() - 0.5) * 0.15,
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
      spark.offset.y = Math.sin(orbitAngle) * spark.orbit.radius + spark.speed.y;
      spark.offset.z = Math.cos(orbitAngle * 0.7) * spark.orbit.radius + spark.speed.z;
      
      spark.speed.add(new Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ));
      
      spark.speed.multiplyScalar(0.95);
      
      spark.life -= delta * 2;
      
      if (spark.life <= 0) {
        return {
          offset: new Vector3(
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4
          ),
          speed: new Vector3(
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.15
          ),
          life: 1.0,
          orbit: {
            radius: 0.2 + Math.random() * 0.3,
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
          <sphereGeometry args={[0.015, 4, 4]} />
          <meshStandardMaterial
            color="#4488ff"
            emissive="#4488ff"
            emissiveIntensity={3}
            transparent
            opacity={spark.life * 0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
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

  const orbitRadius = 0.5;
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
            position={new Vector3(x, y, z)}
          />
        );
      })}
    </group>
  );
});

OrbShield.displayName = 'OrbShield';

export default OrbShield;