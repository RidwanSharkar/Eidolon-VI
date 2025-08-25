import { useRef, useEffect, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface DragonBreathProps {
  parentRef: React.RefObject<Group>;
  onComplete: () => void;
  isActive: boolean;
  startTime: number;
}

export default function DragonBreath({ parentRef, onComplete, isActive, startTime }: DragonBreathProps) {
  const breathRef = useRef<Group>(null);
  const [intensity, setIntensity] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeStartTime = useRef<number | null>(null);
  const currentPosition = useRef(new Vector3());
  const currentDirection = useRef(new Vector3());

  // Duration for the breath effect
  const BREATH_DURATION = 650; // 1.5 seconds duration

  // Handle automatic fade out after duration
  useEffect(() => {
    if (isActive && !isFadingOut) {
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        fadeStartTime.current = Date.now();
      }, BREATH_DURATION);

      return () => clearTimeout(timer);
    }
  }, [isActive, isFadingOut]);

  useFrame(() => {
    if (!breathRef.current) return;

    const currentTime = Date.now();

    // Update position and direction from parent
    if (parentRef.current) {
      currentPosition.current.copy(parentRef.current.position);
      currentPosition.current.y += 1.5; // Offset for breath origin (mouth level)
      currentDirection.current.set(0, 0, -1);
      currentDirection.current.applyQuaternion(parentRef.current.quaternion);
      
      // Move the origin forward by 3 units in the facing direction
      const forwardOffset = currentDirection.current.clone().multiplyScalar(-5);
      currentPosition.current.add(forwardOffset);
      
      // Update breath position and rotation
      breathRef.current.position.copy(currentPosition.current);
      breathRef.current.rotation.y = Math.atan2(currentDirection.current.x, currentDirection.current.z);
    }

    if (isFadingOut) {
      // Handle smooth fade out
      if (fadeStartTime.current) {
        const fadeElapsed = currentTime - fadeStartTime.current;
        const fadeDuration = 500; // 300ms fade out
        const progress = Math.min(fadeElapsed / fadeDuration, 1);
        setFadeProgress(1 - progress);

        if (progress >= 1) {
          breathRef.current.scale.setScalar(0);
          onComplete();
          return;
        }
      }
    } else if (isActive) {
      // Handle intensity growth over time - quick ramp up
      const activeTime = (currentTime - startTime) / 1000;
      const newIntensity = Math.min(1 + activeTime * 2, 2.5); // Grows quickly to 2.5x intensity
      setIntensity(newIntensity);
      setFadeProgress(1); // Ensure full visibility when active
    }

    // Apply fade progress to scale
    const scale = fadeProgress;
    breathRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={breathRef}>
      {/* Origin point effects - dragon's mouth */}
      <group position={[0, -1.5, 0]}>
        {/* Origin core glow */}
        <mesh>
          <sphereGeometry args={[0.4 * intensity, 16, 16]} />
          <meshStandardMaterial
            color="#00FF44"
            emissive="#00AA22"
            emissiveIntensity={3.0 * intensity * fadeProgress}
            transparent
            opacity={0.7 * fadeProgress}
          />
        </mesh>

        {/* Origin outer glow */}
        <mesh>
          <sphereGeometry args={[0.6 * intensity, 16, 16]} />
          <meshStandardMaterial
            color="#00FF44"
            emissive="#00AA22"
            emissiveIntensity={1.5 * intensity * fadeProgress}
            transparent
            opacity={0.5 * fadeProgress}
          />
        </mesh>

        {/* Origin point light */}
        <pointLight 
          color="#00FF44" 
          intensity={15 * intensity * fadeProgress} 
          distance={3 * intensity} 
        />
      </group>

      {/* Main breath cone - spreading flame effect */}
      <group position={[0, -1.5, 0]}>
        {/* Core flame cone */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[2.5 * intensity, 8, 12]} />
          <meshStandardMaterial
            color="#00FF44"
            emissive="#00AA22"
            emissiveIntensity={8 * intensity * fadeProgress}
            transparent
            opacity={0.8 * fadeProgress}
          />
        </mesh>

        {/* Inner flame glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[3.0 * intensity, 8, 12]} />
          <meshStandardMaterial
            color="#44FF66"
            emissive="#00FF44"
            emissiveIntensity={4 * intensity * fadeProgress}
            transparent
            opacity={0.6 * fadeProgress}
          />
        </mesh>

        {/* Outer flame spread */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[3.8 * intensity, 8, 12]} />
          <meshStandardMaterial
            color="#88FF88"
            emissive="#44FF44"
            emissiveIntensity={2 * intensity * fadeProgress}
            transparent
            opacity={0.4 * fadeProgress}
          />
        </mesh>

        {/* Outermost flame wisp */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[4.5 * intensity, 8, 12]} />
          <meshStandardMaterial
            color="#AAFFAA"
            emissive="#66FF66"
            emissiveIntensity={1 * intensity * fadeProgress}
            transparent
            opacity={0.2 * fadeProgress}
          />
        </mesh>

        {/* Flame particles */}
        {[...Array(Math.floor(20 * intensity))].map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const distance = Math.random() * 3 * intensity;
          const height = Math.random() * 7;
          return (
            <mesh
              key={`particle-${i}`}
              position={[
                Math.sin(angle) * distance,
                Math.cos(angle) * distance,
                height
              ]}
              rotation={[
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
              ]}
            >
              <octahedronGeometry args={[0.1 * intensity]} />
              <meshStandardMaterial
                color="#00FF44"
                emissive="#00AA22"
                emissiveIntensity={3 * intensity * fadeProgress}
                transparent
                opacity={0.7 * fadeProgress}
              />
            </mesh>
          );
        })}

        {/* End of breath light */}
        <pointLight 
          position={[0, 0, 6]} 
          color="#00FF44" 
          intensity={25 * intensity * fadeProgress} 
          distance={8 * intensity} 
        />
      </group>
    </group>
  );
}
