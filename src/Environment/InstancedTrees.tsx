import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GeneratedTree } from './terrainGenerators';

interface InstancedTreesProps {
  trees: GeneratedTree[];
}

const InstancedTrees: React.FC<InstancedTreesProps> = ({ trees }) => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRefs = useRef<(THREE.InstancedMesh | null)[]>([]);

  useEffect(() => {
    if (!trunkRef.current) return;

    const matrix = new THREE.Matrix4();

    // Handle trunks
    trees.forEach((tree, i) => {
      matrix.makeTranslation(
        tree.position.x,
        tree.position.y,
        tree.position.z
      );
      matrix.scale(new THREE.Vector3(tree.scale * 0.9, tree.scale * 0.9, tree.scale * 0.9));
      trunkRef.current?.setMatrixAt(i, matrix);
    });

    // Update trunk matrices
    if (trunkRef.current.instanceMatrix) {
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }

    // Handle foliage layers
    foliageRefs.current.forEach((ref, layerIndex) => {
      if (!ref) return;
      
      trees.forEach((tree, i) => {
        const layer = [
          { posY: 2.24, size: 1.35, height: 1.7 },
          { posY: 2.76, size: 1.08, height: 1.36 },
          { posY: 3.4, size: 0.756, height: 1.36 },
          { posY: 3.62, size: 0.709, height: 0.765 }
        ][layerIndex];

        matrix.makeTranslation(
          tree.position.x,
          layer.posY * tree.scale,
          tree.position.z
        );
        matrix.scale(new THREE.Vector3(tree.scale * 0.9, tree.scale * 0.9, tree.scale * 0.9));
        ref.setMatrixAt(i, matrix);
        ref.setColorAt(i, tree.leafColor);
      });

      ref.instanceMatrix.needsUpdate = true;
      if (ref.instanceColor) ref.instanceColor.needsUpdate = true;
    });
  }, [trees]);

  return (
    <group>
      {/* Trunk instances */}
      <instancedMesh
        args={[undefined, undefined, trees.length]}
        ref={trunkRef}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.25, 0.25 * 1.225, 4, 8]} />
        <meshStandardMaterial
          color="#FFBD83"
          roughness={0.8}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Foliage instances */}
      {[
        { posY: 0.56, size: 1.35, height: 1.7, emissiveIntensity: 0.675 },
        { posY: 0.69, size: 1.08, height: 1.36, emissiveIntensity: 0.775 },
        { posY: 0.85, size: 0.756, height: 1.36, emissiveIntensity: 0.875 },
        { posY: 0.905, size: 0.709, height: 0.765, emissiveIntensity: 0.975 }
      ].map((layer, index) => (
        <instancedMesh
          key={`foliage-${index}`}
          args={[undefined, undefined, trees.length]}
          ref={(el) => { foliageRefs.current[index] = el; }}
          frustumCulled={false}
        >
          <coneGeometry args={[layer.size, layer.height, 8]} />
          <meshStandardMaterial
            roughness={0.4}
            metalness={0.1}
            emissiveIntensity={0.375 + (index * 0.1)}
          />
        </instancedMesh>
      ))}
    </group>
  );
};

export default InstancedTrees; 