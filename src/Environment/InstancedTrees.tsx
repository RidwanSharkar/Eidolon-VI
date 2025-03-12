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

    // Handle trunks - brighten trunk color
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

    // Handle foliage layers with brighter colors
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
        
        // Brighten the leaf color
        const brightLeafColor = tree.leafColor.clone().multiplyScalar(1.5);
        ref.setColorAt(i, brightLeafColor);
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
          roughness={0.6}  // Reduced roughness
          metalness={0.2}  // Slightly increased metalness
          emissive="#FFBD83"  // Added emissive
          emissiveIntensity={0.0}  // Subtle emissive effect
        />
      </instancedMesh>

      {/* Foliage instances with increased emissive intensity */}
      {[
        { posY: 0.56, size: 1.35, height: 1.7, emissiveIntensity: 1.0 },
        { posY: 0.69, size: 1.08, height: 1.36, emissiveIntensity: 1.3 },
        { posY: 0.85, size: 0.756, height: 1.36, emissiveIntensity: 1.6 },
        { posY: 0.905, size: 0.709, height: 0.765, emissiveIntensity: 1.9 }
      ].map((layer, index) => (
        <instancedMesh
          key={`foliage-${index}`}
          args={[undefined, undefined, trees.length]}
          ref={(el) => { foliageRefs.current[index] = el; }}
          frustumCulled={false}
        >
          <coneGeometry args={[layer.size, layer.height, 8]} />
          <meshStandardMaterial
            roughness={0.3}  // Reduced roughness for more shine
            metalness={0.2}  // Slightly increased metalness
            emissiveIntensity={layer.emissiveIntensity}  // Increased emissive intensity
            transparent
            opacity={1}  // 0.9 try Slight transparency
          />
        </instancedMesh>
      ))}
    </group>
  );
};

export default InstancedTrees; 