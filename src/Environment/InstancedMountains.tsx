import { forwardRef, useEffect } from 'react';
import * as THREE from 'three';

const InstancedMountains = forwardRef(({ data }, ref) => {
  useEffect(() => {
    // Setup instanced mesh
    if (!ref.current) return;
    
    data.forEach((mountain, i) => {
      const matrix = new THREE.Matrix4();
      matrix.setPosition(mountain.position);
      matrix.scale(mountain.scale);
      ref.current.setMatrixAt(i, matrix);
    });
    
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh
      ref={ref}
      args={[/* geometry */, /* material */, data.length]}
    />
  );
});

export default InstancedMountains; 