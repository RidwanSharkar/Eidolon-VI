export default function DragonSkull() {
  return (
    <group>
      {/* Main Horns - Left and Right */}
      {[-1, 1].map((side) => (
        <group 
          key={side} 
          position={[side * 0.675, 0.5, -0.2]}
          rotation={[-0.8, 0, side * 2.6]} // Changed X rotation to negative to tilt upward
        >
          {/* Main Horn Segment */}
          <mesh>
            <cylinderGeometry args={[.05, 0.009, 1.2, ]} />
            <meshStandardMaterial 
              color="#d4d4d4"
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>

          {/* Mid Section with Ridge Details */}
          <group 
            position={[0, 0.7, 0.2]} 
            rotation={[-0.0, 0, side * 0.3]} // Changed X rotation to negative
          >
            <mesh>
              <cylinderGeometry args={[0.09, 0.01, 1, 32, 32]} />
              <meshStandardMaterial 
                color="#c4c4c4"
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>
            
            {/* Ridge Spikes - adjusted positions */}
            {[...Array(6)].map((_, i) => (
              <group 
                key={i}
                position={[side * 0.08, i * 0.125, 0.05]}
                rotation={[11, 0, -side * 2]}
              >
                <mesh>
                  <coneGeometry args={[0.05, 0.11, 32, 32]} />
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
            position={[0, 0.90, 0.35]} 
            rotation={[-0.6, 0, side * 0.3]} // Changed X rotation to negative
          >
            <mesh>
              <cylinderGeometry args={[0.07, 0.010, 0.6, 8]} />
              <meshStandardMaterial 
                color="#b4b4b4"
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
          </group>

          {/* Sharp Tip */}
          <group 
            position={[side * .5, -0.4, -0.6]} // Adjusted Z position to move tip backward
            rotation={[0.35, 0, side * 0.4]} // Changed X rotation to more negative for upward tilt
          >
            <mesh>
              <cylinderGeometry args={[0.04, 0.01, 1., 8]} />
              <meshStandardMaterial 
                color="#a4a4a4"
                roughness={0.2}
                metalness={0.6}
              />
            </mesh>
          </group>

          {/* Decorative Grooves */}
          {[...Array(4)].map((_, i) => (
            <group 
              key={i}
              position={[side, i * 0.155 + 1, -.2]}
              rotation={[2, side * -3, 1]}
            >
              <mesh>
                <torusGeometry args={[0.095, 0.015, 8, 6 ,2 * Math.PI]} />
                <meshStandardMaterial 
                  color="#909090"
                  roughness={0.6}
                  metalness={0.2}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}