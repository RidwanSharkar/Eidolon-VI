import * as THREE from 'three';
import { useMemo } from 'react';

// MEMORY FIX: Cached geometries - created once at module load
const CACHED_GEOMETRIES = {
  hornSegment: new THREE.CylinderGeometry(1, 1.5, 1, 10), // Unit size, will be scaled
  ridge: new THREE.BoxGeometry(1, 1, 1) // Unit size, will be scaled
};

// Pre-computed segment data to avoid recalculating on every render
const SEGMENTS = 18;
const HEIGHT_PER_SEGMENT = 0.0675;
const BASE_WIDTH = 0.075;
const TWIST_AMOUNT = Math.PI * 1.75;
const CURVE_AMOUNT = 3.25;

interface SegmentData {
  progress: number;
  width: number;
  twist: number;
  curve: number;
}

// Pre-compute segment data
const SEGMENT_DATA: SegmentData[] = Array.from({ length: SEGMENTS }, (_, i) => {
  const progress = i / (SEGMENTS + 1);
  return {
    progress,
    width: BASE_WIDTH * (1 - progress * 0.725),
    twist: Math.pow(progress, 0.2) * TWIST_AMOUNT,
    curve: Math.pow(progress, 2.7) * CURVE_AMOUNT
  };
});

export function DragonHorns({ isLeft = false }: { isLeft?: boolean }) {
  // Memoize materials since they depend on progress (color changes)
  const segmentMaterials = useMemo(() => {
    return SEGMENT_DATA.map(({ progress }) => 
      new THREE.MeshStandardMaterial({
        color: `rgb(${Math.round(139 - progress * 80)}, ${Math.round(0 + progress * 20)}, ${Math.round(0 + progress * 20)})`,
        roughness: 0.7,
        metalness: 0.4
      })
    );
  }, []);

  const ridgeMaterials = useMemo(() => {
    return SEGMENT_DATA.map(({ progress }) =>
      new THREE.MeshStandardMaterial({
        color: `rgb(${Math.round(159 - progress * 100)}, ${Math.round(20 + progress * 20)}, ${Math.round(20 + progress * 20)})`,
        roughness: 0.8,
        metalness: 0.3
      })
    );
  }, []);

  return (
    <group rotation={[-0.45, isLeft ? -0.7 : 0.7, isLeft ? -0.15 : 0.15]}> 
      {SEGMENT_DATA.map(({ width, twist, curve }, i) => (
        <group 
          key={i}
          position={[
            curve * (isLeft ? -0.15 : 0.15),
            i * HEIGHT_PER_SEGMENT,
            -curve * 0.725
          ]}
          rotation={[-1.5 * SEGMENT_DATA[i].progress, twist, 0]}
        >
          {/* MEMORY FIX: Use cached geometry with scale */}
          <mesh 
            geometry={CACHED_GEOMETRIES.hornSegment}
            material={segmentMaterials[i]}
            scale={[width, HEIGHT_PER_SEGMENT, width]}
          />
          
          {/* Ridge details */}
          {Array.from({ length: 6 }).map((_, j) => (
            <group 
              key={j} 
              rotation={[0, (j * Math.PI / 2), 0]}
            >
              <mesh 
                position={[width * 0.95, 0, 0]}
                geometry={CACHED_GEOMETRIES.ridge}
                material={ridgeMaterials[i]}
                scale={[width * 0.3, HEIGHT_PER_SEGMENT * 1.25 + 0.175, width * 1.5]}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
