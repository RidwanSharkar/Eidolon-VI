 import { useRef, useEffect, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useOathstrikeAnimation } from '@/Spells/Oathstrike/useOathstrikeAnimation';

interface StealthStrikeEffectProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function StealthStrikeEffect({ position, direction, onComplete, parentRef }: StealthStrikeEffectProps) {
  const effectRef = useRef<Group>(null);
  
  // Cache geometries - oval-shaped arcs for stealth effect
  const geometries = useMemo(() => {
    // Create custom oval-shaped geometry
    const createOvalArc = (majorRadius: number, minorRadius: number, tubeRadius: number, segments: number = 32) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const normals = [];
      const uvs = [];
      const indices = [];

      // Create oval arc vertices
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI; // Half circle
        const x = Math.cos(angle) * minorRadius; // Narrower horizontally
        const y = Math.sin(angle) * majorRadius; // Longer vertically
        
        // Create tube around the oval path
        for (let j = 0; j <= 8; j++) {
          const tubeAngle = (j / 8) * Math.PI * 2;
          const tubeX = Math.cos(tubeAngle) * tubeRadius;
          const tubeZ = Math.sin(tubeAngle) * tubeRadius;
          
          vertices.push(x + tubeX, y, tubeZ);
          normals.push(tubeX / tubeRadius, 0, tubeZ / tubeRadius);
          uvs.push(i / segments, j / 8);
        }
      }

      // Create indices for triangles
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < 8; j++) {
          const a = i * 9 + j;
          const b = i * 9 + j + 1;
          const c = (i + 1) * 9 + j;
          const d = (i + 1) * 9 + j + 1;

          indices.push(a, b, c);
          indices.push(b, d, c);
        }
      }

      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      
      return geometry;
    };

    return {
      mainArc: createOvalArc(2.25, 0.75, 0.1), // Taller and narrower oval (major=height, minor=width)
      innerGlow: createOvalArc(1.75, 0.6, 0.2),
      outerGlow: createOvalArc(1.4, 0.4, 0.3),
      particle: new THREE.SphereGeometry(0.08, 8, 8)
    };
  }, []);

  // Cache materials with stealth colors
  const materials = useMemo(() => ({
    mainFlame: new THREE.MeshStandardMaterial({
      color: "#9b4dff", // Purple
      emissive: "#4d2bff", // Deep purple
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    }),
    innerGlow: new THREE.MeshStandardMaterial({
      color: "#4d8eff", // Blue
      emissive: "#2b4dff", // Deep blue
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7
    }),
    outerGlow: new THREE.MeshStandardMaterial({
      color: "#9b4dff", // Purple
      emissive: "#4d2bff", // Deep purple
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.5
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#4d8eff", // Blue
      emissive: "#2b4dff", // Deep blue
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6
    })
  }), []);

  const particlePositions = useMemo(() => 
    Array(12).fill(0).map((_, i) => {
      const angle = (i * Math.PI) / 6;
      return {
        position: new THREE.Vector3(
          Math.cos(angle) * 0.5, // Narrower horizontally to match oval
          Math.sin(angle) * 1.0, // Longer vertically to match oval
          0
        )
      };
    }), 
  []);

  const { reset } = useOathstrikeAnimation({
    effectRef,
    position,
    direction,
    parentRef
  });

  useEffect(() => {
    return () => {
      reset();
      onComplete();
    };
  }, [reset, onComplete]);

  return (
    <group
      ref={effectRef}
      position={position.toArray()}
      rotation={[Math.PI/2, Math.atan2(direction.x, direction.z), 0]}
    >
      <group position={[0, 0, 0]}>
        <mesh geometry={geometries.mainArc} material={materials.mainFlame} />
        <mesh geometry={geometries.innerGlow} material={materials.innerGlow} />
        <mesh geometry={geometries.outerGlow} material={materials.outerGlow} />
        
        {particlePositions.map((props, i) => (
          <mesh
            key={i}
            position={props.position}
            geometry={geometries.particle}
            material={materials.particle}
          />
        ))}

        <pointLight color="#9b4dff" intensity={8} distance={4} />
        <pointLight color="#4d8eff" intensity={5} distance={6} />
      </group>
    </group>
  );
} 