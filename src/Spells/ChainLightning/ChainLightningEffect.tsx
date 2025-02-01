import React, { useMemo, useRef } from 'react';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChainLightningEffectProps {
  startPosition: Vector3;
  targetPositions: Vector3[];
}

const ChainLightningEffect: React.FC<ChainLightningEffectProps> = ({
  startPosition,
  targetPositions
}) => {
  const timeRef = useRef(0);
  const flickerRef = useRef(1);
  const duration = 0.5;

  // Cache geometries
  const geometries = useMemo(() => ({
    segment: new THREE.SphereGeometry(1, 8, 8), // Will be scaled per instance
    impact: new THREE.SphereGeometry(0.4, 16, 16)
  }), []);

  // Cache materials
  const materials = useMemo(() => ({
    core: new THREE.MeshStandardMaterial({
      color: new Color('#FFD700'),
      emissive: new Color('#FFD700'),
      emissiveIntensity: 5,
      transparent: true
    }),
    branch: new THREE.MeshStandardMaterial({
      color: new Color('#FFA500'),
      emissive: new Color('#FFA500'),
      emissiveIntensity: 4,
      transparent: true
    }),
    impact: new THREE.MeshStandardMaterial({
      color: new Color('#FFD700'),
      emissive: new Color('#FFD700'),
      emissiveIntensity: 3,
      transparent: true
    })
  }), []);

  // Pre-calculate base offsets
  const baseOffsets = useMemo(() => {
    return Array(32).fill(0).map(() => new THREE.Vector3(
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.15 + 2,
      (Math.random() - 0.5) * 0.15
    ));
  }, []);

  useFrame((_, delta) => {
    timeRef.current = Math.min(timeRef.current + delta, duration);
    flickerRef.current = Math.random() * 0.5 + 0.5;

    // Update material opacities
    const progress = timeRef.current / duration;
    materials.core.opacity = (0.7 * (1 - progress)) * flickerRef.current;
    materials.branch.opacity = (0.75 * (1 - progress)) * flickerRef.current;
    materials.impact.opacity = (0.6 * (1 - progress)) * flickerRef.current;
  });

  return (
    <group>
      {targetPositions.map((targetPos, index) => {
        const startPos = index === 0 ? startPosition : targetPositions[index - 1];
        const direction = targetPos.clone().sub(startPos);
        const distance = direction.length();
        const segments = Math.ceil(distance * 8);

        return (
          <group key={index}>
            {Array(segments).fill(0).map((_, i) => {
              const segmentProgress = i / segments;
              const baseOffset = baseOffsets[i % baseOffsets.length];
              const pos = startPos.clone()
                .lerp(targetPos, segmentProgress)
                .add(baseOffset)
                .add(new Vector3(0, Math.sin(segmentProgress * Math.PI) * 0.5, 0));
              
              const thickness = Math.random() * 0.025 + 0.04;

              return (
                <group key={i}>
                  <mesh 
                    position={pos.toArray()}
                    geometry={geometries.segment}
                    material={materials.core}
                    scale={[thickness, thickness, thickness]}
                  />
                  
                  {Math.random() < 0.2 && (
                    <mesh
                      position={pos.clone().add(baseOffsets[(i + 1) % baseOffsets.length])}
                      geometry={geometries.segment}
                      material={materials.branch}
                      scale={[thickness * 0.35, thickness * 0.35, thickness * 0.35]}
                    />
                  )}
                </group>
              );
            })}

            <mesh 
              position={targetPos.toArray()}
              geometry={geometries.impact}
              material={materials.impact}
            />

            <pointLight
              position={targetPos.toArray()}
              color="#FFA500"
              intensity={15 * (1 - timeRef.current / duration) * flickerRef.current}
              distance={4}
              decay={2}
            />
          </group>
        );
      })}
    </group>
  );
};

export default ChainLightningEffect; 