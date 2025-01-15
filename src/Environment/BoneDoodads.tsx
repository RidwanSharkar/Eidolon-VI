import { Vector3, Euler } from 'three';


// Scattered rib cage fragment (based on BonePlate design)
export const RibFragment = ({ position, rotation, scale = 1 }: { position: Vector3; rotation: Euler; scale?: number }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Spine segment */}
    <mesh>
      <cylinderGeometry args={[0.04, 0.04, 0.4, 4]} />
      <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
    </mesh>

    {/* Two vertebrae */}
    {[-0.1, 0.1].map((yPos, i) => (
      <group key={i} position={[0, yPos, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 6]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>
    ))}

    {/* Pair of ribs */}
    {[-1, 1].map((side, i) => (
      <group key={i} rotation={[0, 0, (Math.PI / 3) * side]}>
        <mesh position={[side * 0.085, 0.05, 0.08]} rotation={[0.3, side * Math.PI / 2, side * -0.5]}>
          <torusGeometry args={[0.2, 0.022, 8, 12, Math.PI * 1.1]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
    ))}
  </group>
);

// Broken arm fragment (based on Boneclaw design)
export const BoneClawFragment = ({ position, rotation, scale = 1 }: { position: Vector3; rotation: Euler; scale?: number }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {/* Main bone segments */}
    <group position={[0.075, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
        <meshStandardMaterial color="#d6cfc7" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
    <group position={[-0.075, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
        <meshStandardMaterial color="#d6cfc7" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>

    {/* Joint sphere */}
    <mesh position={[0, 0.4, 0]}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial color="#d6cfc7" roughness={0.9} metalness={0.1} />
    </mesh>
  </group>
);

// Simple scattered bones (femurs, etc)
export const ScatteredBones = ({ position, rotation }: { position: Vector3; rotation: Euler }) => {
  // Generate a random number of bones for this cluster (2-6)
  const boneCount = 2 + Math.floor(Math.random() * 5);
  
  const createBone = (offset: Vector3, individualRotation: Euler) => (
    <group position={offset} rotation={individualRotation}>
      {/* Main bone shaft */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.035, 0.8, 6]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Joint ends */}
      {[-0.35, 0.35].map((yPos, i) => (
        <group key={i} position={[0, yPos, 0]}>
          {/* Main joint bulb */}
          <mesh>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
          </mesh>
          
          {/* Joint protrusions */}
          <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.02, 0.04, 4, 8]} />
            <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Generate multiple bones in the cluster */}
      {[...Array(boneCount)].map(() => {
        // Create random offset within a small area
        const offset = new Vector3(
          (Math.random() - 0.5) * 0.6,
          0.02, // Slight height variation to prevent z-fighting
          (Math.random() - 0.5) * 0.6
        );

        // Random rotation around Y-axis (laying flat)
        const individualRotation = new Euler(
          Math.PI / 2, // Rotated 90° to lay flat
          Math.random() * Math.PI * 2, // Random rotation around Y
          Math.random() * 0.2 - 0.1 // Slight tilt
        );

        return createBone(offset, individualRotation);
      })}
    </group>
  );
};

interface DoodadData {
  position: Vector3;
  rotation: Euler;
  type: 'ribFragment' | 'clawFragment' | 'bones';
  scale?: number;
}

export const TerrainDoodads = ({ doodadData }: { doodadData: DoodadData[] }) => {
  return (
    <>
      {doodadData.map((doodad, index) => {
        switch (doodad.type) {
          case 'ribFragment':
            return <RibFragment key={index} {...doodad} />;
          case 'clawFragment':
            return <BoneClawFragment key={index} {...doodad} />;
          case 'bones':
            return <ScatteredBones key={index} {...doodad} />;
          default:
            return null;
        }
      })}
    </>
  );
}; 