export default function DragonSkull() {
  return (
    <group>
      {/* Main Horns - Left and Right */}
      {[-.905, 0.905].map((side) => (
        <group 
          key={side} 
          position={[side * 0.575, 0.9, -0.55]}
          rotation={[-0.9, 0, side * 3.025]} // Changed X rotation to negative to tilt upward
        >
          {/* Main Horn Segment */}
          <mesh>
            <cylinderGeometry args={[.09, 0.0125, 1, ]} />
            <meshStandardMaterial 
              color="#d4d4d4"
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>

          {/* Added Teeth Row */}
          <group position={[0, 2.2, 0.1]} scale={2}>
            {[-0.03, -0.06, -0.09, 0, 0.03].map((offset, i) => (
              <group key={i} position={[offset, 0, 0]} rotation={[0.5, 0, 0]}>
                <mesh>
                  <coneGeometry args={[0.02, 0.075, 3]} />
                  <meshStandardMaterial 
                    color="#e8e8e8"
                    roughness={0.3}
                    metalness={0.4}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* Mid Section with Ridge Details */}
          <group 
            position={[0, 0.375, 0.2]} 
            rotation={[-0.0, 0, side * 0.3]} 
          >
            <mesh>
              <cylinderGeometry args={[0.08, 0.008, 0.8, 32, 32]} />
              <meshStandardMaterial 
                color="#c4c4c4"
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>
            
            {/* Ridge Spikes - adjusted to point forward */}
            {[...Array(5)].map((_, i) => (
              <group 
                key={i}
                position={[side * +0.02, i * 0.095, 0.07]}
                rotation={[Math.PI / 1.5, 0, 0]}
              >
                <mesh>
                  <coneGeometry args={[0.0325, 0.1, 32, 32]} />
                  <meshStandardMaterial 
                    color="#b4b4b4"
                    roughness={0.5}
                    metalness={0.3}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* Upper Curved Section */}
          <group 
            position={[0, 1.15, +0.325]} 
            rotation={[-0.675, 0, side * 0.5]} // Changed X rotation to negative
          >
            <mesh>
              <cylinderGeometry args={[0.071, 0.0075, 0.6, 5]} />
              <meshStandardMaterial 
                color="#b4b4b4"
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
          </group>



        </group>
      ))}
    </group>
  );
}