import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface MushroomData {
  position: THREE.Vector3;
  scale: number;
  variant: 'pink' | 'green' | 'blue';
}

interface InstancedMushroomsProps {
  mushrooms: MushroomData[];
}

const InstancedMushrooms: React.FC<InstancedMushroomsProps> = ({ mushrooms }) => {
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const capRef = useRef<THREE.InstancedMesh>(null);
  const spotsRef = useRef<THREE.InstancedMesh>(null);

  const variantColors = useMemo(() => ({
    pink: {
      main: new THREE.Color("#FAA9C5").multiplyScalar(4.5),
      spots: new THREE.Color("#FAA9C5").multiplyScalar(4.5)
    },
    green: {
      main: new THREE.Color("#FF8DC6").multiplyScalar(2.5),
      spots: new THREE.Color("#92E2FF").multiplyScalar(2.5)
    },
    blue: {
      main: new THREE.Color("#92E2FF").multiplyScalar(2.5),
      spots: new THREE.Color("#92E2FF").multiplyScalar(2.5)
    }
  }), []);

  useEffect(() => {
    if (!stemRef.current || !capRef.current || !spotsRef.current) return;

    const matrix = new THREE.Matrix4();

    // Handle stems with brighter colors
    mushrooms.forEach((mushroom, i) => {
      matrix.makeTranslation(
        mushroom.position.x,
        mushroom.position.y,
        mushroom.position.z
      );
      matrix.scale(new THREE.Vector3(
        mushroom.scale * 0.8,
        mushroom.scale * 0.8,
        mushroom.scale * 0.8
      ));
      stemRef.current?.setMatrixAt(i, matrix);
      stemRef.current?.setColorAt(i, variantColors[mushroom.variant].main.clone().multiplyScalar(0.9));
    });

    // Handle caps with enhanced glow
    mushrooms.forEach((mushroom, i) => {
      matrix.makeTranslation(
        mushroom.position.x,
        mushroom.position.y + (0.35 * mushroom.scale * 0.8),
        mushroom.position.z
      );
      matrix.scale(new THREE.Vector3(
        mushroom.scale * 0.8,
        mushroom.scale * 0.8,
        mushroom.scale * 0.8
      ));
      capRef.current?.setMatrixAt(i, matrix);
      capRef.current?.setColorAt(i, variantColors[mushroom.variant].main);
    });

    // Handle spots with enhanced glow
    mushrooms.forEach((mushroom, i) => {
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI / 3);
        const spotIndex = i * 6 + j;

        matrix.makeTranslation(
          mushroom.position.x + Math.sin(angle) * 0.15 * mushroom.scale * 0.8,
          mushroom.position.y + (0.4 + Math.cos(angle) * 0.1) * mushroom.scale * 0.8,
          mushroom.position.z + Math.cos(angle) * 0.15 * mushroom.scale * 0.8
        );
        
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(-Math.PI / 3, 0, -angle)
        );
        
        matrix.multiply(rotationMatrix);
        matrix.scale(new THREE.Vector3(
          mushroom.scale * 0.8,
          mushroom.scale * 0.8,
          mushroom.scale * 0.8
        ));
        
        spotsRef.current?.setMatrixAt(spotIndex, matrix);
        spotsRef.current?.setColorAt(spotIndex, variantColors[mushroom.variant].spots);
      }
    });

    // Update matrices and colors
    stemRef.current.instanceMatrix.needsUpdate = true;
    capRef.current.instanceMatrix.needsUpdate = true;
    spotsRef.current.instanceMatrix.needsUpdate = true;

    if (stemRef.current.instanceColor) stemRef.current.instanceColor.needsUpdate = true;
    if (capRef.current.instanceColor) capRef.current.instanceColor.needsUpdate = true;
    if (spotsRef.current.instanceColor) spotsRef.current.instanceColor.needsUpdate = true;
  }, [mushrooms, variantColors]);

  return (
    <group>
      <instancedMesh
        args={[undefined, undefined, mushrooms.length]}
        ref={stemRef}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.12, 0.7, 16]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.2}
          emissiveIntensity={0.5}
        />
      </instancedMesh>

      <instancedMesh
        args={[undefined, undefined, mushrooms.length]}
        ref={capRef}
      >
        <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.2}
          emissiveIntensity={0.8}
          transparent
          opacity={0.95}
        />
      </instancedMesh>

      <instancedMesh
        args={[undefined, undefined, mushrooms.length * 6]}
        ref={spotsRef}
      >
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.3}
          emissiveIntensity={1.5}
          transparent
          opacity={0.95}
        />
      </instancedMesh>
    </group>
  );
};

export default InstancedMushrooms; 