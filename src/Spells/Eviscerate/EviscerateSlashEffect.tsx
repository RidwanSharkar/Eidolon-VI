import { useRef, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EviscerateSlashEffectProps {
  parentRef: React.RefObject<Group>;
  direction: Vector3;
  onComplete: () => void;
  position: Vector3;
  rotationOffset: number;
}

export default function EviscerateSlashEffect({ 
  direction,
  onComplete,
  position,
  rotationOffset
}: EviscerateSlashEffectProps) {
  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 0.65; // Faster slash animation for better visual impact

  // Cache geometries for performance - Create diagonal slash shapes
  const geometries = useMemo(() => ({
    mainSlash: new THREE.PlaneGeometry(4, 0.4), // Wide diagonal slash plane
    innerGlow: new THREE.PlaneGeometry(4.2, 0.25), // Inner glow
    outerGlow: new THREE.PlaneGeometry(4.5, 0.5), // Outer glow
    particle: new THREE.SphereGeometry(0.08, 6, 6),
    trailSegment: new THREE.PlaneGeometry(1.0, 0.2) // Trail segments
  }), []);

  // Blue assassin slash materials
  const materials = useMemo(() => ({
    mainSlash: new THREE.MeshStandardMaterial({
      color: "#1f7fff", // Bright blue
      emissive: "#003d8b", // Dark blue
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }),
    innerGlow: new THREE.MeshStandardMaterial({
      color: "#87ceeb", // Light blue core
      emissive: "#4a90e2", // Medium blue
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }),
    outerGlow: new THREE.MeshStandardMaterial({
      color: "#1e3a8a", // Dark blue
      emissive: "#1e40af", // Navy blue
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#60a5fa", // Light blue
      emissive: "#3b82f6", // Blue
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }),
    trail: new THREE.MeshStandardMaterial({
      color: "#7dd3fc", // Sky blue
      emissive: "#0ea5e9", // Bright blue
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }), []);

  // Create particle positions along the diagonal slash line
  const particlePositions = useMemo(() => 
    Array(10).fill(0).map((_, i) => {
      const t = (i / 9) - 0.5; // From -0.5 to 0.5 along the slash
      return {
        position: new THREE.Vector3(
          t * 3, // X position along slash
          Math.random() * 0.3 - 0.15, // Slight Y variation
          0.1 + Math.random() * 0.1 // Slightly forward with variation
        ),
        delay: i * 0.015 // Stagger particle appearance
      };
    }), 
  []);

  // Trail positions for sword trail effect along diagonal
  const trailPositions = useMemo(() => 
    Array(8).fill(0).map((_, i) => {
      const t = (i / 7) - 0.5; // From -0.5 to 0.5
      return {
        position: new THREE.Vector3(
          t * 2.5, // X position along slash
          Math.random() * 0.2 - 0.1, // Slight Y variation
          -0.05 // Slightly behind main slash
        ),
        delay: i * 0.015
      };
    }), 
  []);

  useFrame((_, delta) => {
    if (!effectRef.current) return;

    // Use the passed position prop
    effectRef.current.position.copy(position);

    progressRef.current += delta;
    const progress = Math.min(progressRef.current / animationDuration, 1);

    // Scale and fade animation
    const scale = Math.sin(progress * Math.PI) * 1.2; // Peak at middle, fade at ends
    const opacity = Math.sin(progress * Math.PI); // Same fade pattern
    
    effectRef.current.scale.set(scale, scale, scale);
    
    // Debug logging for first few frames
    if (progress < 0.1) {
      console.log(`[EviscerateSlashEffect] progress: ${progress.toFixed(3)}, scale: ${scale.toFixed(3)}, opacity: ${opacity.toFixed(3)}`);
    }
    
    // Update material opacities
    if (materials.mainSlash) materials.mainSlash.opacity = opacity * 0.9;
    if (materials.innerGlow) materials.innerGlow.opacity = opacity * 0.8;
    if (materials.outerGlow) materials.outerGlow.opacity = opacity * 0.6;
    if (materials.particle) materials.particle.opacity = opacity * 0.7;
    if (materials.trail) materials.trail.opacity = opacity * 0.6;

    // Complete animation
    if (progress >= 1) {
      onComplete();
    }
  });

  // Calculate rotation based on rotation offset and direction
  const slashRotation = useMemo(() => {
    const baseRotation = Math.atan2(direction.x, direction.z);
    return [Math.PI/4 +Math.PI/4, baseRotation, rotationOffset+Math.PI/4] as [number, number, number];
  }, [direction, rotationOffset]);

  // Debug: Log when component renders
  console.log(`[EviscerateSlashEffect] Rendering slash effect component`);

  return (
    <group
      ref={effectRef}
      rotation={slashRotation}
    >
      {/* Main slash arc */}
      <mesh geometry={geometries.mainSlash} material={materials.mainSlash} />
      <mesh geometry={geometries.innerGlow} material={materials.innerGlow} />
      <mesh geometry={geometries.outerGlow} material={materials.outerGlow} />
      
      {/* Sword trail segments */}
      {trailPositions.map((trail, i) => (
        <mesh
          key={`trail-${i}`}
          position={trail.position}
          geometry={geometries.trailSegment}
          material={materials.trail}
        />
      ))}
      
      {/* Spark particles along the arc */}
      {particlePositions.map((particle, i) => (
        <mesh
          key={`particle-${i}`}
          position={particle.position}
          geometry={geometries.particle}
          material={materials.particle}
        />
      ))}

      {/* Dynamic lighting */}
      <pointLight 
        color="#1f7fff" 
        intensity={15} 
        distance={4} 
        decay={2}
        position={[0, 0, 0]}
      />
      <pointLight 
        color="#60a5fa" 
        intensity={8} 
        distance={6} 
        decay={2}
        position={[0, 0.5, 0]}
      />
    </group>
  );
}
