import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import GuidedBoltTrail from './GuidedBoltTrail';

// Pre-allocated color for trail - module level constant
const TRAIL_COLOR = new THREE.Color("#4DC7FF");

interface GuidedBoltMissileProps {
  position: Vector3;
  targetPosition: Vector3;
  direction: Vector3;
}

export default function GuidedBoltMissile({ position, targetPosition, direction }: GuidedBoltMissileProps) {
  const missileRef = useRef<Group>(null);
  
  // Light teal color for guided bolt arrows
  const arrowColor = "#80d9ff";
  
  // Shared material for the bone arrow with teal coloring - properly memoized
  const boneMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: arrowColor,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 1,
      emissive: arrowColor,
      emissiveIntensity: 0.3
    });
  }, [arrowColor]);

  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      boneMaterial.dispose();
    };
  }, [boneMaterial]);

  useFrame(() => {
    if (!missileRef.current) return;

    // Update missile position
    missileRef.current.position.copy(position);

    // Calculate rotation towards target direction
    if (direction) {
      missileRef.current.rotation.y = Math.atan2(direction.x, direction.z);
      missileRef.current.rotation.x = -Math.asin(direction.y);
    }

    // Optional: Add visual effect that points towards the target
    // This could be used for a subtle "homing" visual indicator
    if (targetPosition && missileRef.current) {
      // Calculate distance to target for potential visual effects
      const distanceToTarget = position.distanceTo(targetPosition);
      
      // Adjust glow intensity based on proximity to target (closer = brighter)
      const proximityGlow = Math.max(0.3, 1.0 - (distanceToTarget / 10));
      if (missileRef.current.children.length > 0) {
        const light = missileRef.current.children.find(child => child.type === 'PointLight');
        if (light && light instanceof THREE.PointLight) {
          light.intensity = 1.5 * proximityGlow;
        }
      }
    }
  });

  return (
    <group>
      {/* Trail effect */}
      <GuidedBoltTrail
        color={TRAIL_COLOR}
        size={0.3}
        meshRef={missileRef}
        opacity={0.9}
      />
      
      <group ref={missileRef} position={position.toArray()}>
        {/* Main bone shaft */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.045, 0.9, 6]} />
          <meshStandardMaterial {...boneMaterial} />
        </mesh>

        {/* Bone joints/decorations */}
        {[-0.2, 0, 0.2].map((offset, i) => (
          <group key={i} position={[0, 0, offset]}>
            <mesh>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial {...boneMaterial} />
            </mesh>
          </group>
        ))}

        {/* Arrow head (bone spike) */}
        <group position={[0, 0, -0.5]}>
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[0.08, 0.25, 6]} />
            <meshStandardMaterial {...boneMaterial} />
          </mesh>
        </group>

        {/* Small decorative spikes */}
        {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
          <group 
            key={i} 
            position={[
              Math.sin(angle) * 0.06,
              Math.cos(angle) * 0.06,
              0
            ]}
            rotation={[0, 0, angle]}
          >
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <coneGeometry args={[0.015, 0.08, 4]} />
              <meshStandardMaterial {...boneMaterial} />
            </mesh>
          </group>
        ))}

        {/* Magical aura around the arrow */}
        <mesh>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial
            color="#80d9ff"
            emissive="#80d9ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Subtle glow light */}
        <pointLight 
          color="#60c9ff"
          intensity={1.5}
          distance={2.5}
          decay={2}
        />
      </group>
    </group>
  );
} 