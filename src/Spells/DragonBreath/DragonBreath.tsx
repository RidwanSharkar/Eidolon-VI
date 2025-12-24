import { useRef, useEffect, useState, useMemo } from 'react';
import { Group, Vector3, SphereGeometry, ConeGeometry, OctahedronGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

// Shared geometries for dragon breath particles - avoid per-render allocations
const sharedGeometries = {
  originCore: new SphereGeometry(0.4, 16, 16),
  originOuter: new SphereGeometry(0.6, 16, 16),
  coreFlame: new ConeGeometry(2.5, 8, 12),
  innerFlame: new ConeGeometry(3.0, 8, 12),
  outerFlame: new ConeGeometry(3.8, 8, 12),
  outerWisp: new ConeGeometry(4.5, 8, 12),
  particle: new OctahedronGeometry(0.1)
};

let dragonBreathResourceUsers = 0;

const disposeDragonBreathResources = () => {
  Object.values(sharedGeometries).forEach(geo => geo.dispose());
};

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

  // Resource management
  useEffect(() => {
    dragonBreathResourceUsers += 1;
    return () => {
      dragonBreathResourceUsers = Math.max(0, dragonBreathResourceUsers - 1);
      if (dragonBreathResourceUsers === 0) {
        disposeDragonBreathResources();
      }
    };
  }, []);

  // Pre-generate particle positions to avoid recalculating every render
  const particlePositions = useMemo(() => {
    return Array(20).fill(null).map((_, i) => {
      const angle = (i / 20) * Math.PI * 2;
      return { angle, randomHeight: Math.random() * 7 };
    });
  }, []);

  // Shared materials - memoized to avoid recreation
  const materials = useMemo(() => ({
    originCore: new MeshStandardMaterial({
      color: "#00FF44",
      emissive: "#00AA22",
      emissiveIntensity: 3.0,
      transparent: true,
      opacity: 0.7
    }),
    originOuter: new MeshStandardMaterial({
      color: "#00FF44",
      emissive: "#00AA22",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.5
    }),
    coreFlame: new MeshStandardMaterial({
      color: "#00FF44",
      emissive: "#00AA22",
      emissiveIntensity: 8,
      transparent: true,
      opacity: 0.8
    }),
    innerFlame: new MeshStandardMaterial({
      color: "#44FF66",
      emissive: "#00FF44",
      emissiveIntensity: 4,
      transparent: true,
      opacity: 0.6
    }),
    outerFlame: new MeshStandardMaterial({
      color: "#88FF88",
      emissive: "#44FF44",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.4
    }),
    outerWisp: new MeshStandardMaterial({
      color: "#AAFFAA",
      emissive: "#66FF66",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.2
    }),
    particle: new MeshStandardMaterial({
      color: "#00FF44",
      emissive: "#00AA22",
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.7
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

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

  // Update material properties based on intensity and fadeProgress
  useFrame(() => {
    materials.originCore.emissiveIntensity = 3.0 * intensity * fadeProgress;
    materials.originCore.opacity = 0.7 * fadeProgress;
    materials.originOuter.emissiveIntensity = 1.5 * intensity * fadeProgress;
    materials.originOuter.opacity = 0.5 * fadeProgress;
    materials.coreFlame.emissiveIntensity = 8 * intensity * fadeProgress;
    materials.coreFlame.opacity = 0.8 * fadeProgress;
    materials.innerFlame.emissiveIntensity = 4 * intensity * fadeProgress;
    materials.innerFlame.opacity = 0.6 * fadeProgress;
    materials.outerFlame.emissiveIntensity = 2 * intensity * fadeProgress;
    materials.outerFlame.opacity = 0.4 * fadeProgress;
    materials.outerWisp.emissiveIntensity = 1 * intensity * fadeProgress;
    materials.outerWisp.opacity = 0.2 * fadeProgress;
    materials.particle.emissiveIntensity = 3 * intensity * fadeProgress;
    materials.particle.opacity = 0.7 * fadeProgress;
  });

  return (
    <group ref={breathRef}>
      {/* Origin point effects - dragon's mouth */}
      <group position={[0, -1.5, 0]}>
        {/* Origin core glow */}
        <mesh 
          geometry={sharedGeometries.originCore} 
          material={materials.originCore}
          scale={[intensity, intensity, intensity]}
        />

        {/* Origin outer glow */}
        <mesh 
          geometry={sharedGeometries.originOuter} 
          material={materials.originOuter}
          scale={[intensity, intensity, intensity]}
        />

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
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          geometry={sharedGeometries.coreFlame} 
          material={materials.coreFlame}
          scale={[intensity, 1, intensity]}
        />

        {/* Inner flame glow */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          geometry={sharedGeometries.innerFlame} 
          material={materials.innerFlame}
          scale={[intensity, 1, intensity]}
        />

        {/* Outer flame spread */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          geometry={sharedGeometries.outerFlame} 
          material={materials.outerFlame}
          scale={[intensity, 1, intensity]}
        />

        {/* Outermost flame wisp */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          geometry={sharedGeometries.outerWisp} 
          material={materials.outerWisp}
          scale={[intensity, 1, intensity]}
        />

        {/* Flame particles - using pre-generated positions */}
        {particlePositions.slice(0, Math.floor(20 * intensity)).map((pos, i) => {
          const distance = 1.5 * intensity; // Fixed distance instead of random
          return (
            <mesh
              key={`particle-${i}`}
              position={[
                Math.sin(pos.angle) * distance,
                Math.cos(pos.angle) * distance,
                pos.randomHeight
              ]}
              rotation={[pos.angle, pos.angle * 0.5, pos.angle * 0.25]}
              geometry={sharedGeometries.particle}
              material={materials.particle}
              scale={[intensity, intensity, intensity]}
            />
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
