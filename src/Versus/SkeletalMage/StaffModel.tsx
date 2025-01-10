// src/versus/SkeletalMage/StaffModel.tsx

interface StaffModelProps {
    isLeftHand: boolean;
  }
  
  export default function StaffModel({ isLeftHand }: StaffModelProps) {
    return (
      <group rotation={[0, 0, isLeftHand ? Math.PI / 6 : -Math.PI / 6]}>
        {/* Staff handle */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
  
        {/* Staff head */}
        <group position={[0, 0.8, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
              color="#4169E1"
              emissive="#4169E1"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Orbiting crystals */}
          {[0, 1.3, 2.2].map((i) => (
            <group 
              key={i} 
              rotation={[0, (Math.PI * 2 * i) / 3, 0]}
              position={[0.2, 0, 0]}
            >
              <mesh>
                <octahedronGeometry args={[0.06]} />
                <meshStandardMaterial 
                  color="#4169E1"
                  emissive="#4169E1"
                  emissiveIntensity={1}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    );
  } 