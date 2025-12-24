import * as THREE from 'three';

// MEMORY FIX: Cached geometries - created once at module load
const CACHED_GEOMETRIES = {
  mainHorn: new THREE.CylinderGeometry(0.08, 0.0125, 1, 8),
  midSection: new THREE.CylinderGeometry(0.08, 0.008, 0.8, 16),
  upperSection: new THREE.CylinderGeometry(0.07, 0.0075, 0.6, 5),
  ridgeSpike: new THREE.ConeGeometry(0.0325, 0.1, 16),
  toothSmall: new THREE.ConeGeometry(0.02, 0.075, 3),
  toothLarge: new THREE.ConeGeometry(0.025, 0.095, 3),
  toothFang: new THREE.ConeGeometry(0.0325, 0.1425, 3)
};

// MEMORY FIX: Cached materials - created once at module load
const CACHED_MATERIALS = {
  horn: new THREE.MeshStandardMaterial({
    color: "#d4d4d4",
    roughness: 0.4,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  }),
  midSection: new THREE.MeshStandardMaterial({
    color: "#c4c4c4",
    roughness: 0.4,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  }),
  spike: new THREE.MeshStandardMaterial({
    color: "#b4b4b4",
    roughness: 0.4,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  }),
  tooth: new THREE.MeshStandardMaterial({
    color: "#e8e8e8",
    roughness: 0.4,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95
  })
};

// Pre-computed positions for teeth
const UPPER_TEETH_OFFSETS = [-0.07, -0.02, 0.02, 0.07];
const LOWER_TEETH_OFFSETS = [-0.08, -0.015, 0.015, 0.09];
const RIDGE_POSITIONS = [0, 1, 2, 3, 4];

export default function DragonSkull() {
  return (
    <group>
      {/* Main Horns - Left and Right */}
      {[-0.89, 0.89].map((side) => (
        <group 
          key={side} 
          position={[side * 0.56, 0.625, -0.75]}
          rotation={[-1.35, 0, side * 3.025]}
        >
          {/* Main Horn Segment - MEMORY FIX: Use cached geometry */}
          <mesh geometry={CACHED_GEOMETRIES.mainHorn} material={CACHED_MATERIALS.horn} />

          {/* Teeth Rows */}
          <group position={[0, 1.35, -0.0]} scale={1.6} rotation={[-0.65, 0, 0]}>
            {/* Upper teeth row */}
            {UPPER_TEETH_OFFSETS.map((offset, i) => (
              <group key={`upper-${i}`} position={[offset, 0.125, -0.15]} rotation={[+2, 0, 0]} scale={[1., 1.5, 1.2]}>
                <mesh 
                  geometry={CACHED_GEOMETRIES.toothSmall}
                  material={CACHED_MATERIALS.tooth}
                />
              </group>
            ))}
            
            {/* Lower teeth row */}
            {LOWER_TEETH_OFFSETS.map((offset, i) => (
              <group key={`lower-${i}`} position={[offset, 0.01075, 0]} rotation={[-0.45, 0, 0]}>
                <mesh 
                  geometry={i === 0 || i === 3 ? CACHED_GEOMETRIES.toothFang : CACHED_GEOMETRIES.toothLarge}
                  material={CACHED_MATERIALS.tooth}
                  scale={i === 0 || i === 3 ? [1.3, 1.5, 1.3] : [1, 1, 1]}
                />
              </group>
            ))}
          </group>

          {/* Mid Section with Ridge Details */}
          <group 
            position={[0, 0.4, 0.2]} 
            rotation={[-0.05, 0, side * 0.3]} 
          >
            <mesh geometry={CACHED_GEOMETRIES.midSection} material={CACHED_MATERIALS.midSection} />
            
            {/* Ridge Spikes */}
            {RIDGE_POSITIONS.map((i) => (
              <group 
                key={i}
                position={[side * +0.02, i * 0.095, 0.07]}
                rotation={[Math.PI / 1.5, 0, 0]}
              >
                <mesh geometry={CACHED_GEOMETRIES.ridgeSpike} material={CACHED_MATERIALS.spike} />
              </group>
            ))}
          </group>

          {/* Upper Curved Section */}
          <group 
            position={[0, 1.0225, +0.3]} 
            rotation={[-0.925, 0, side * 0.5]}
          >
            <mesh geometry={CACHED_GEOMETRIES.upperSection} material={CACHED_MATERIALS.spike} />
          </group>
        </group>
      ))}
    </group>
  );
}
