import { useRef, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface HolyNovaProps {
  position: Vector3;
  isActive: boolean;
  intensity?: number;
}

export default function HolyNova({ position, isActive, intensity = 1 }: HolyNovaProps) {
  const effectRef = useRef<Group>(null);
  const timeRef = useRef(0);
  
  // Cache geometries for the nova aura
  const geometries = useMemo(() => ({
    aura: new THREE.SphereGeometry(1.25, 32, 32),
    innerAura: new THREE.SphereGeometry(1.1, 32, 32),
    particles: new THREE.SphereGeometry(0.0375, 8, 8)
  }), []);

  // Cache materials with holy aura colors
  const materials = useMemo(() => ({
    aura: new THREE.MeshStandardMaterial({
      color: "#FFD700",
      emissive: "#FFD700",
      emissiveIntensity: 0.66,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    }),
    innerAura: new THREE.MeshStandardMaterial({
      color: "#FFF8DC",
      emissive: "#FFF8DC",
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.025,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    }),
    particles: new THREE.MeshStandardMaterial({
      color: "#FFD700",
      emissive: "#FFD700",
      emissiveIntensity: 0.66,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    })
  }), []);

  // Pre-calculate floating particle positions
  const particlePositions = useMemo(() => 
    Array(12).fill(0).map(() => {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      return {
        basePosition: new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi) * 1.5,
          Math.sin(theta) * Math.sin(phi) * 1.5,
          Math.cos(theta) * 1.5
        ),
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      };
    }), 
  []);

  // Animate the holy aura
  useFrame((_, delta) => {
    if (!effectRef.current) return;

    timeRef.current += delta;
    const time = timeRef.current;
    
    const fadeMultiplier = isActive ? 1 : 0;
    const pulseFactor = 1 + Math.sin(time * 3) * 0.2;

    // Update main aura
    if (effectRef.current.children[0]) {
      const auraScale = 1 + Math.sin(time * 2) * 0.1;
      effectRef.current.children[0].scale.setScalar(auraScale);
      materials.aura.opacity = 0.05 * fadeMultiplier * intensity * pulseFactor;
      materials.aura.emissiveIntensity = 1.0 * intensity * pulseFactor;
    }

    // Update inner aura
    if (effectRef.current.children[1]) {
      const innerScale = 1 + Math.sin(time * 2.5) * 0.08;
      effectRef.current.children[1].scale.setScalar(innerScale);
      materials.innerAura.opacity = 0.075 * fadeMultiplier * intensity * pulseFactor;
      materials.innerAura.emissiveIntensity = 2.0 * intensity * pulseFactor;
    }

    // Animate floating particles
    particlePositions.forEach((props, i) => {
      const particleGroup = effectRef.current?.children[2]?.children[i];
      if (particleGroup) {
        const orbitTime = time * props.speed + props.phase;
        const floatOffset = Math.sin(orbitTime * 2) * 0.3;
        
        particleGroup.position.copy(props.basePosition);
        particleGroup.position.y += floatOffset;
        
        // Rotate particles around the center
        const rotation = time * 0.5;
        particleGroup.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
        
        materials.particles.opacity = 0.8 * fadeMultiplier * intensity * (0.7 + Math.sin(orbitTime * 3) * 0.3);
      }
    });

    // Update lighting intensity
    const lights = effectRef.current.children.slice(-2); // Last 2 children are lights
    lights.forEach((light, i) => {
      if (light.type === 'PointLight') {
        const pointLight = light as THREE.PointLight;
        const baseIntensity = i === 0 ? 0.15 : 0.05;
        pointLight.intensity = baseIntensity * fadeMultiplier * intensity * pulseFactor;
      }
    });
  });

  return (
    <group
      ref={effectRef}
      position={position.toArray()}
    >
      {/* Main holy aura */}
      <mesh geometry={geometries.aura} material={materials.aura} />
      
      {/* Inner holy aura */}
      <mesh geometry={geometries.innerAura} material={materials.innerAura} />
      
      {/* Floating holy particles */}
      <group>
        {particlePositions.map((_, i) => (
          <mesh
            key={i}
            geometry={geometries.particles}
            material={materials.particles}
          />
        ))}
      </group>

      {/* Dynamic lighting for the aura */}
      <pointLight color="#FFD700" intensity={0.125} distance={8} decay={1} />
      <pointLight color="#FFF8DC" intensity={0.25} distance={6} decay={2} />
    </group>
  );
}
