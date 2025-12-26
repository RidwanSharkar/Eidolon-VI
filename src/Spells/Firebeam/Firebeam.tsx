import { useRef, useEffect, useState, useMemo } from 'react';
import { Group, Vector3, SphereGeometry, TorusGeometry, CylinderGeometry, BoxGeometry, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

// Shared geometries for Firebeam - prevents memory leaks from intensity-based recreation
const FIREBEAM_GEOMETRIES = {
  originCore: new SphereGeometry(0.45, 16, 16),
  originOuter: new SphereGeometry(0.65, 16, 16),
  originRing: new TorusGeometry(0.3625, 0.075, 8, 32),
  beamCore: new CylinderGeometry(0.05, 0.1, 20, 16),
  beamInner: new CylinderGeometry(0.125, 0.275, 20, 16),
  beamOuter: new CylinderGeometry(0.30, 0.375, 20, 16),
  beamOuterest: new CylinderGeometry(0.35, 0.375, 20, 16),
  spiral: new TorusGeometry(0.35, 0.05, 8, 32),
  spark: new BoxGeometry(0.05, 0.05, 0.1)
};

interface FirebeamProps {
  parentRef: React.RefObject<Group>;
  onComplete: () => void;
  onHit?: () => void;
  isActive: boolean;
  startTime: number;
}

export default function Firebeam({ parentRef, onComplete, isActive, startTime }: FirebeamProps) {
  const beamRef = useRef<Group>(null);
  const [intensity, setIntensity] = useState(1);
  const [fadeProgress, setFadeProgress] = useState(isActive ? 1 : 0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeStartTime = useRef<number | null>(null);
  const currentPosition = useRef(new Vector3());
  const currentDirection = useRef(new Vector3());
  // Track if we've ever been active to prevent immediate fade on mount
  const hasBeenActive = useRef(isActive);

  // Pre-generate spark positions once to avoid memory allocation on render
  const sparkPositions = useMemo(() => 
    [...Array(24)].map(() => ({
      pos: [
        (Math.random() - 0.5) * 1.0,
        (Math.random() - 0.5) * 1.75,
        Math.random() * 5 - 11
      ] as [number, number, number],
      rot: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ] as [number, number, number]
    })), []);

  // Memoized materials to prevent recreation on every render
  const materials = useMemo(() => ({
    originCore: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.65
    }),
    originOuter: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.65
    }),
    originRing: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    }),
    beamCore: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 50,
      transparent: true,
      opacity: 0.95
    }),
    beamInner: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 10,
      transparent: true,
      opacity: 0.7
    }),
    beamOuter: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.6
    }),
    beamOuterest: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.6
    }),
    spiral: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.3
    }),
    spark: new MeshStandardMaterial({
      color: "#58FCEC",
      emissive: "#00E5FF",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.75
    })
  }), []);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

  // Handle fade out when beam becomes inactive, and reset when it becomes active
  useEffect(() => {
    if (isActive) {
      // Reset fading state when beam becomes active
      hasBeenActive.current = true;
      setIsFadingOut(false);
      fadeStartTime.current = null;
      setFadeProgress(1);
    } else if (!isActive && !isFadingOut && hasBeenActive.current) {
      // Only start fading if we were previously active
      setIsFadingOut(true);
      fadeStartTime.current = Date.now();
    }
  }, [isActive, isFadingOut]);

  useFrame(() => {
    if (!beamRef.current) return;

    const currentTime = Date.now();

    // Update position and direction from parent
    if (parentRef.current) {
      currentPosition.current.copy(parentRef.current.position);
      currentPosition.current.y += 1; // Offset for beam origin
      
      currentDirection.current.set(0, 0, 1);
      currentDirection.current.applyQuaternion(parentRef.current.quaternion);
      
      // Update beam position and rotation
      beamRef.current.position.copy(currentPosition.current);
      beamRef.current.rotation.y = Math.atan2(currentDirection.current.x, currentDirection.current.z);
    }

    if (isFadingOut) {
      // Handle smooth fade out
      if (fadeStartTime.current) {
        const fadeElapsed = currentTime - fadeStartTime.current;
        const fadeDuration = 400; // 800ms fade out
        const progress = Math.min(fadeElapsed / fadeDuration, 1);
        setFadeProgress(1 - progress);

        if (progress >= 1) {
          beamRef.current.scale.setScalar(0);
          onComplete();
          return;
        }
      }
    } else if (isActive) {
      // Handle intensity increase over time
      const activeTime = (currentTime - startTime) / 1000;
      const newIntensity = Math.min(1 + activeTime * 0.3, 1.5); // Max 2x intensity after ~3.3 seconds
      setIntensity(newIntensity);
      setFadeProgress(1); // Ensure full visibility when active
    }

    // Update material properties based on intensity and fade
    materials.originCore.emissiveIntensity = 2.5 * intensity * fadeProgress;
    materials.originCore.opacity = 0.65 * fadeProgress;
    materials.originOuter.emissiveIntensity = 0.7 * intensity * fadeProgress;
    materials.originOuter.opacity = 0.65 * fadeProgress;
    materials.originRing.emissiveIntensity = 0.8 * intensity * fadeProgress;
    materials.originRing.opacity = 0.9 * fadeProgress;
    materials.beamCore.emissiveIntensity = 50 * intensity * fadeProgress;
    materials.beamCore.opacity = 0.95 * fadeProgress;
    materials.beamInner.emissiveIntensity = 10 * intensity * fadeProgress;
    materials.beamInner.opacity = 0.7 * fadeProgress;
    materials.beamOuter.emissiveIntensity = 2 * intensity * fadeProgress;
    materials.beamOuter.opacity = 0.6 * fadeProgress;
    materials.beamOuterest.emissiveIntensity = 0.75 * intensity * fadeProgress;
    materials.beamOuterest.opacity = 0.6 * fadeProgress;
    materials.spiral.emissiveIntensity = 1 * intensity * fadeProgress;
    materials.spiral.opacity = 0.3 * fadeProgress;
    materials.spark.emissiveIntensity = 2 * intensity * fadeProgress;
    materials.spark.opacity = 0.75 * fadeProgress;

    // Apply fade progress to scale
    const scale = fadeProgress;
    beamRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={beamRef}>
      {/* Origin point effects */}
      <group position={[0, -1.1, 0]}>
        {/* Origin core glow - scale instead of recreating geometry */}
        <mesh scale={[intensity, intensity, intensity]} geometry={FIREBEAM_GEOMETRIES.originCore} material={materials.originCore} />

        {/* Origin outer glow */}
        <mesh scale={[intensity, intensity, intensity]} geometry={FIREBEAM_GEOMETRIES.originOuter} material={materials.originOuter} />

        {/* Origin energy rings */}
        {[...Array(3)].map((_, i) => (
          <mesh 
            key={`ring-${i}`}
            rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}
            scale={[intensity, intensity, intensity]}
            geometry={FIREBEAM_GEOMETRIES.originRing}
            material={materials.originRing}
          />
        ))}

        {/* Origin point light */}
        <pointLight 
          color="#58FCEC" 
          intensity={20 * intensity * fadeProgress} 
          distance={3 * intensity} 
        />
      </group>

      {/* Main beam group */}
      <group position={[0, -1.1, 10.7]}>
        {/* Core beam - scale Y for intensity effect */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[intensity, 1, intensity]} geometry={FIREBEAM_GEOMETRIES.beamCore} material={materials.beamCore} />

        {/* Inner glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[intensity, 1, intensity]} geometry={FIREBEAM_GEOMETRIES.beamInner} material={materials.beamInner} />

        {/* Outer glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[intensity, 1, intensity]} geometry={FIREBEAM_GEOMETRIES.beamOuter} material={materials.beamOuter} />

        {/* Outerest glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[intensity, 1, intensity]} geometry={FIREBEAM_GEOMETRIES.beamOuterest} material={materials.beamOuterest} />

        {/* Spiral effect - fixed count to avoid dynamic array creation */}
        {[...Array(5)].map((_, i) => (
          <mesh 
            key={i} 
            rotation={[-Math.PI / 4, 0, (i * Math.PI) / -1.5]}
            position={[0, 0, 10]}
            scale={[intensity, intensity, intensity]}
            geometry={FIREBEAM_GEOMETRIES.spiral}
            material={materials.spiral}
          />
        ))}

        {/* End-beam sparks - using pre-generated positions */}
        {sparkPositions.map((spark, i) => (
          <mesh
            key={`spark-${i}`}
            position={[spark.pos[0] * intensity, spark.pos[1] * intensity, spark.pos[2]]}
            rotation={spark.rot}
            geometry={FIREBEAM_GEOMETRIES.spark}
            material={materials.spark}
          />
        ))}

        {/* Adjusted point light for the sparks */}
        <pointLight 
          position={[0, 0, 12]} 
          color="#00E5FF" 
          intensity={12 * intensity * fadeProgress} 
          distance={4 * intensity} 
        />
      </group>
    </group>
  );
} 