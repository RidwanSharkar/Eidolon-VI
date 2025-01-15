import { Vector3, Euler } from 'three';

export const BrokenBonePlate = ({ position, rotation, scale = 1 }: { position: Vector3; rotation: Euler; scale?: number }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh>
      <cylinderGeometry args={[0.4, 0.35, 0.15, 8]} />
      <meshStandardMaterial color="#e8e8e8" roughness={0.6} metalness={0.2} />
    </mesh>
    
    {/* Broken rib pieces */}
    {[0.2, -0.2].map((offset, i) => (
      <group key={i} position={[offset, 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
        <mesh>
          <torusGeometry args={[0.15, 0.02, 6, 8, Math.PI * 0.7]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>
    ))}
  </group>
);

// Scattered bone pieces
export const ScatteredBones = ({ position, rotation }: { position: Vector3; rotation: Euler }) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <cylinderGeometry args={[0.03, 0.025, 0.4, 6]} />
      <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.3} />
    </mesh>
    <mesh position={[0, 0.2, 0]}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
    </mesh>
  </group>
);

// Broken shoulder plate
export const BrokenShoulderPlate = ({ position, rotation }: { position: Vector3; rotation: Euler }) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <cylinderGeometry args={[0.3, 0.25, 0.15, 6]} />
      <meshStandardMaterial color="#e8e8e8" roughness={0.6} metalness={0.2} />
    </mesh>
    {/* Broken spikes */}
    {[0, 0.5, 1].map((angle, i) => (
      <group key={i} rotation={[0, angle * Math.PI * 2/3, 0]} position={[0.2, 0, 0]}>
        <mesh rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.01, 0.15, 4]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>
    ))}
  </group>
);

// Large submerged bone plate with tail
export const SubmergedBonePlate = ({ position, rotation }: { position: Vector3; rotation: Euler }) => (
  <group position={position} rotation={rotation}>
    {/* Main plate - partially submerged */}
    <group position={[0, -0.2, 0]}>
      <mesh>
        <cylinderGeometry args={[2.2, 2.0, 0.3, 8]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Spine protrusions */}
      {[...Array(6)].map((_, i) => (
        <group 
          key={i} 
          position={[
            Math.cos(i * Math.PI / 3) * 1.5,
            0.1,
            Math.sin(i * Math.PI / 3) * 1.5
          ]}
        >
          <mesh>
            <cylinderGeometry args={[0.15, 0.2, 0.25, 6]} />
            <meshStandardMaterial color="#d8d8d8" roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>

    {/* Tail section emerging from ground */}
    {[...Array(8)].map((_, i) => (
      <group 
        key={`tail-${i}`} 
        position={[0, -0.15 - i * 0.1, 2 + i * 0.5]}
        rotation={[Math.PI * 0.1, 0, 0]}
      >
        <mesh>
          <cylinderGeometry args={[0.3 - i * 0.02, 0.28 - i * 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Vertebrae joints */}
        <mesh position={[0, 0, 0.2]}>
          <sphereGeometry args={[0.2 - i * 0.015, 8, 8]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>
    ))}
  </group>
);

// Update TerrainDoodads to always include one SubmergedBonePlate
export const getFixedDoodads = (): Array<{ 
  position: Vector3; 
  rotation: Euler; 
  type: string; 
  scale?: number; 
}> => [{
  position: new Vector3(15, -0.2, 10),
  rotation: new Euler(-Math.PI * 0.05, Math.PI * 1.2, 0),
  type: 'submerged'
}];

// Add other bone doodad components here... 