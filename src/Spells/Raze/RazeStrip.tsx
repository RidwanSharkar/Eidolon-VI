// src/Spells/Raze/RazeStrip.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, BufferGeometry, BufferAttribute, PointLight } from 'three';
import * as THREE from 'three';

interface RazeStripProps {
  startPosition: Vector3;
  direction: Vector3;
  maxDistance: number;
  width: number;
  currentDistance: number;
  onProgressUpdate: (distance: number) => void;
  isComplete: boolean;
}

export default function RazeStrip({
  startPosition,
  direction,
  maxDistance,
  width,
  currentDistance,
  onProgressUpdate,
  isComplete
}: RazeStripProps) {
  const groupRef = useRef<Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const embersRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightGroupRef = useRef<Group>(null);
  const startTimeRef = useRef(Date.now());
  const progressRef = useRef(0);

  // Create flame geometry and materials
  const { flameGeometry, flameMaterial, emberGeometry, emberMaterial, glowGeometry, glowMaterial, pointLights } = useMemo(() => {
    // Create a series of connected rectangles for the flame strip
    const segments = Math.ceil(maxDistance * 4); // 4 segments per unit for smooth fire
    const geometry = new BufferGeometry();
    
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const distance = t * maxDistance;
      
      // Calculate position along the strip, ensure it's on the ground
      const position = new Vector3()
        .copy(direction)
        .multiplyScalar(distance)
        .add(startPosition);
      position.y = 0; // Force to ground level

      // Create cross-section vertices with curvature and randomness
      const perpendicular = new Vector3(-direction.z, 0, direction.x).normalize();
      
      // Add curvature - sine wave along the strip
      const curvature = Math.sin(t * Math.PI * 2) * 0.3; // Gentle S-curve
      const randomOffset = (Math.random() - 0.5) * 0.2; // Random variation
      
      // Vary width along the strip for more natural look
      const widthVariation = 1 + Math.sin(t * Math.PI * 3) * 0.3 + (Math.random() - 0.5) * 0.4;
      const currentWidth = width * widthVariation;
      
      // Apply curvature offset
      const curveOffset = new Vector3(-direction.x, 0, direction.z).normalize().multiplyScalar(curvature + randomOffset);
      position.add(curveOffset);
      
      // Left side with jagged edges
      const leftPos = position.clone().add(perpendicular.clone().multiplyScalar(-currentWidth / 2));
      leftPos.add(new Vector3((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1)); // Small random offset
      vertices.push(leftPos.x, leftPos.y, leftPos.z);
      uvs.push(0, t);
      
      // Right side with jagged edges
      const rightPos = position.clone().add(perpendicular.clone().multiplyScalar(currentWidth / 2));
      rightPos.add(new Vector3((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1)); // Small random offset
      vertices.push(rightPos.x, rightPos.y, rightPos.z);
      uvs.push(1, t);
      
      // Create triangles for the flame surface
      if (i > 0) {
        const baseIdx = (i - 1) * 2;
        // First triangle
        indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
        // Second triangle
        indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    geometry.computeVertexNormals();

    // Enhanced flame material with better fire effect
    const flameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ff6600"),
      emissive: new THREE.Color("#ff3300"),
      emissiveIntensity: 3.0,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      roughness: 0.8,
      metalness: 0.0
    });

    // Ember particles
    const emberCount = Math.ceil(maxDistance * 10); // 10 embers per unit
    const emberPositions = new Float32Array(emberCount * 3);
    const emberColors = new Float32Array(emberCount * 3);
    const emberSizes = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
      const t = Math.random();
      const emberPos = new Vector3()
        .copy(direction)
        .multiplyScalar(t * maxDistance)
        .add(startPosition);
      
      // Force to ground level and add small random offset
      emberPos.y = 0.1; // Just slightly above ground
      emberPos.x += (Math.random() - 0.5) * width;
      emberPos.z += (Math.random() - 0.5) * width;

      emberPositions[i * 3] = emberPos.x;
      emberPositions[i * 3 + 1] = emberPos.y;
      emberPositions[i * 3 + 2] = emberPos.z;

      // Ember colors (orange to red)
      const colorIntensity = Math.random();
      emberColors[i * 3] = 1.0; // Red
      emberColors[i * 3 + 1] = 0.4 + colorIntensity * 0.6; // Green (orange component)
      emberColors[i * 3 + 2] = 0.0; // Blue

      emberSizes[i] = Math.random() * 0.25 + 0.05; // Random sizes
    }

    const emberGeo = new BufferGeometry();
    emberGeo.setAttribute('position', new BufferAttribute(emberPositions, 3));
    emberGeo.setAttribute('color', new BufferAttribute(emberColors, 3));
    emberGeo.setAttribute('size', new BufferAttribute(emberSizes, 1));

    const emberMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    // Create glow geometry (slightly larger than flame for glow effect)
    const glowGeo = geometry.clone();
    const glowVertices = glowGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < glowVertices.length; i += 3) {
      // Scale outward from center for glow effect
      const scale = 1.3;
      glowVertices[i] *= scale;     // x
      glowVertices[i + 2] *= scale; // z (keep y at ground level)
    }
    glowGeo.attributes.position.needsUpdate = true;

    // Glow material
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ff8800"),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Create point lights along the strip
    const lightCount = Math.ceil(maxDistance / 2); // One light every 2 units
    const lights: PointLight[] = [];
    
    for (let i = 0; i < lightCount; i++) {
      const t = i / (lightCount - 1);
      const lightPos = new Vector3()
        .copy(direction)
        .multiplyScalar(t * maxDistance)
        .add(startPosition);
      lightPos.y = 0.5; // Slightly above ground
      
      const light = new PointLight(
        new THREE.Color("#ff6600"), // Orange-red color
        2.0,                        // Intensity
        4.0,                        // Distance
        2.0                         // Decay
      );
      light.position.copy(lightPos);
      light.castShadow = false; // Disable shadows for performance
      lights.push(light);
    }

    // Add ambient lighting for broader environmental effect
    const ambientLightCount = Math.ceil(maxDistance / 4); // Fewer, larger ambient lights
    for (let i = 0; i < ambientLightCount; i++) {
      const t = (i + 0.5) / ambientLightCount; // Offset for better coverage
      const ambientPos = new Vector3()
        .copy(direction)
        .multiplyScalar(t * maxDistance)
        .add(startPosition);
      ambientPos.y = 1.0; // Higher up for broader coverage
      
      const ambientLight = new PointLight(
        new THREE.Color("#ff8833"), // Slightly warmer ambient color
        0.8,                        // Lower intensity
        8.0,                        // Larger distance
        1.5                         // Gentler decay
      );
      ambientLight.position.copy(ambientPos);
      ambientLight.castShadow = false;
      lights.push(ambientLight);
    }

    return {
      flameGeometry: geometry,
      flameMaterial: flameMat,
      emberGeometry: emberGeo,
      emberMaterial: emberMat,
      glowGeometry: glowGeo,
      glowMaterial: glowMat,
      pointLights: lights
    };
  }, [startPosition, direction, maxDistance, width]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000; // Convert to seconds
    const speed = 90; // Much faster spread - 90 units per second (reaches 18 units in 0.2 seconds)

    if (!isComplete) {
      // Update progress based on time
      const newDistance = Math.min(elapsed * speed, maxDistance);
      if (newDistance !== progressRef.current) {
        progressRef.current = newDistance;
        onProgressUpdate(newDistance);
      }
    }

    // Animate flame material and progressive reveal
    if (flameRef.current) {
      const material = flameRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 2.5 + Math.sin(elapsed * 8) * 0.8; // Enhanced flickering
      
      // Progressive reveal by modifying geometry draw range
      const geometry = flameRef.current.geometry as BufferGeometry;
      const totalIndices = geometry.index?.count || 0;
      const visibleRatio = Math.min(currentDistance / maxDistance, 1);
      const visibleIndices = Math.floor(totalIndices * visibleRatio);
      
      // Update draw range to show only revealed portion
      geometry.setDrawRange(0, visibleIndices);
      geometry.attributes.position.needsUpdate = true;
    }

    // Animate glow effect
    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMaterial.opacity = 0.3 + Math.sin(elapsed * 6) * 0.15; // Pulsing glow
      
      // Progressive reveal for glow
      const geometry = glowRef.current.geometry as BufferGeometry;
      const totalIndices = geometry.index?.count || 0;
      const visibleRatio = Math.min(currentDistance / maxDistance, 1);
      const visibleIndices = Math.floor(totalIndices * visibleRatio);
      geometry.setDrawRange(0, visibleIndices);
    }

    // Animate point lights
    if (lightGroupRef.current) {
      const visibleRatio = Math.min(currentDistance / maxDistance, 1);
      const mainLightCount = Math.ceil(maxDistance / 2);
      
      lightGroupRef.current.children.forEach((child, index) => {
        if (child instanceof PointLight) {
          const isMainLight = index < mainLightCount;
          const lightProgress = isMainLight 
            ? index / (mainLightCount - 1) 
            : (index - mainLightCount) / Math.ceil(maxDistance / 4);
          
          // Only show lights that are within the revealed area
          if (lightProgress <= visibleRatio || (!isMainLight && visibleRatio > 0.3)) {
            child.visible = true;
            
            if (isMainLight) {
              // Main lights: dramatic flickering
              const baseIntensity = 2.0;
              const flicker = Math.sin(elapsed * 10 + index) * 0.4;
              const pulse = Math.sin(elapsed * 3 + index * 0.5) * 0.3;
              child.intensity = baseIntensity + flicker + pulse;
              
              // Slight color variation for more realism
              const hue = 0.08 + Math.sin(elapsed * 5 + index) * 0.02; // Orange to red
              child.color.setHSL(hue, 1, 0.6);
            } else {
              // Ambient lights: gentle pulsing
              const baseIntensity = 0.8;
              const gentlePulse = Math.sin(elapsed * 2 + index * 0.3) * 0.2;
              child.intensity = baseIntensity + gentlePulse;
              
              // Warmer, more stable color
              const hue = 0.1 + Math.sin(elapsed * 2 + index) * 0.01;
              child.color.setHSL(hue, 0.8, 0.65);
            }
          } else {
            child.visible = false;
          }
        }
      });
    }

    // Animate embers
    if (embersRef.current) {
      const positions = embersRef.current.geometry.attributes.position.array as Float32Array;
      const colors = embersRef.current.geometry.attributes.color.array as Float32Array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Make embers float upward
        positions[i * 3 + 1] += delta * 0.5;
        
        // Reset embers that float too high
        if (positions[i * 3 + 1] > 0.15) {
          const t = Math.random();
          const emberPos = new Vector3()
            .copy(direction)
            .multiplyScalar(t * currentDistance)
            .add(startPosition);
          
          // Force to ground level - ignore startPosition.y
          emberPos.y = 0.05;
          
          positions[i * 3] = emberPos.x + (Math.random() - 0.5) * width;
          positions[i * 3 + 1] = 0.05; // Always start at ground level
          positions[i * 3 + 2] = emberPos.z + (Math.random() - 0.5) * width;
        }

        // Fade out embers over time
        const alpha = 1 - (elapsed % 1); // Cycle every second
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.4 + alpha * 0.6;
        colors[i * 3 + 2] = 0.0;
      }

      embersRef.current.geometry.attributes.position.needsUpdate = true;
      embersRef.current.geometry.attributes.color.needsUpdate = true;
      
      // Only show embers where the fire has reached
      const emberMaterial = embersRef.current.material as THREE.PointsMaterial;
      emberMaterial.opacity = Math.min(currentDistance / maxDistance, 1) * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glow effect (rendered first, behind the main flame) */}
      <mesh
        ref={glowRef}
        geometry={glowGeometry}
        material={glowMaterial}
        position={[0, -0.01, 0]} // Slightly below main flame
        renderOrder={-1}
      />
      
      {/* Main flame strip - positioned at origin since geometry is in world coordinates */}
      <mesh
        ref={flameRef}
        geometry={flameGeometry}
        material={flameMaterial}
        position={[0, 0, 0]}
        renderOrder={0}
      />
      
      {/* Point lights for dynamic lighting */}
      <group ref={lightGroupRef}>
        {pointLights.map((light, index) => (
          <primitive key={index} object={light} />
        ))}
      </group>
      
      {/* Floating embers */}
      <points
        ref={embersRef}
        geometry={emberGeometry}
        material={emberMaterial}
        renderOrder={1}
      />
    </group>
  );
}