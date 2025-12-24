import { useRef } from 'react';
import { Group, TorusGeometry, SphereGeometry, CylinderGeometry, BoxGeometry, MeshStandardMaterial } from 'three';

// MEMORY FIX: Cached geometries - created once at module load, reused by all instances
const CACHED_GEOMETRIES = {
  rib: new TorusGeometry(0.2, 0.022, 8, 12, Math.PI * 1.1),
  ribJointLarge: new SphereGeometry(0.0375, 8, 8),
  ribJointSmall: new SphereGeometry(0.02, 4, 4),
  ribConnection: new CylinderGeometry(0.06, 0.05, 0.075, 6),
  spineColumn: new CylinderGeometry(0.04, 0.04, 0.9, 4),
  vertebraCore: new CylinderGeometry(0.06, 0.06, 0.04, 6),
  vertebraProtrusion: new BoxGeometry(0.0175, 0.06, 0.075)
};

// MEMORY FIX: Cached materials - created once at module load, reused by all instances
const CACHED_MATERIALS = {
  bone: new MeshStandardMaterial({
    color: "#e8e8e8",
    roughness: 0.4,
    metalness: 0.3
  }),
  boneDark: new MeshStandardMaterial({
    color: "#d8d8d8",
    roughness: 0.5,
    metalness: 0.2
  })
};

// Pre-computed rib piece data to avoid re-rendering
const RIB_OFFSETS = [
  { yOffset: 0.45, scale: 0.7 },
  { yOffset: 0.3, scale: 0.8 },
  { yOffset: 0.15, scale: 0.9 },
  { yOffset: 0, scale: 1 },
  { yOffset: -0.15, scale: 0.9 },
  { yOffset: -0.3, scale: 0.8 },
  { yOffset: -0.45, scale: 0.7 }
];

const SPINE_POSITIONS = [-0.3, -0.15, 0, 0.15, 0.3];

const BonePlate: React.FC = () => {
  const plateRef = useRef<Group>(null);

  return (
    <group 
      ref={plateRef}
      position={[0, 0.04, 0]}
      rotation={[0.25, Math.PI + Math.PI, 0]}
    >
      <group>
        {/* Spine */}
        <group>
          {/* Vertical spine column */}
          <mesh geometry={CACHED_GEOMETRIES.spineColumn} material={CACHED_MATERIALS.bone} />

          {/* Spine segments/vertebrae */}
          {SPINE_POSITIONS.map((yPos, i) => (
            <group key={i} position={[0, yPos, 0]}>
              {/* Vertebra core */}
              <mesh geometry={CACHED_GEOMETRIES.vertebraCore} material={CACHED_MATERIALS.boneDark} />
              
              {/* Vertebra protrusions */}
              <mesh 
                position={[0, 0, -0.125]} 
                geometry={CACHED_GEOMETRIES.vertebraProtrusion} 
                material={CACHED_MATERIALS.boneDark} 
              />
            </group>
          ))}
        </group>
        
        {/* Rib pairs */}
        <group position={[0, 0, 0]}>
          {RIB_OFFSETS.map((rib, i) => (
            <group key={i} position={[0, rib.yOffset, 0]} scale={rib.scale}>
              {/* Left rib */}
              <group rotation={[0, 0, -Math.PI / 3]}>
                <mesh 
                  position={[0.085, 0.05, 0.08]}
                  rotation={[0.3, Math.PI / 2, -0.5]}
                  geometry={CACHED_GEOMETRIES.rib}
                  material={CACHED_MATERIALS.bone}
                />

                {/* Rib end joint */}
                <mesh 
                  position={[0, 0, -0.1]}
                  geometry={CACHED_GEOMETRIES.ribJointLarge}
                  material={CACHED_MATERIALS.boneDark}
                />
              </group>

              {/* Right rib */}
              <group rotation={[0, 0, Math.PI / 3]}>
                <mesh 
                  position={[-0.085, 0.05, 0.08]}
                  rotation={[0.3, -Math.PI / 2, 0]}
                  geometry={CACHED_GEOMETRIES.rib}
                  material={CACHED_MATERIALS.bone}
                />

                {/* Rib end joint */}
                <mesh 
                  position={[-0.3, -0.15, 0]}
                  geometry={CACHED_GEOMETRIES.ribJointSmall}
                  material={CACHED_MATERIALS.boneDark}
                />
              </group>

              {/* Rib connection to spine */}
              <mesh 
                geometry={CACHED_GEOMETRIES.ribConnection}
                material={CACHED_MATERIALS.bone}
              />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};

export default BonePlate;
