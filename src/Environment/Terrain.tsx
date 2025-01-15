import { Mesh, Shape, DoubleSide, } from 'three';
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3, Euler } from 'three';
import { BrokenBonePlate, ScatteredBones, BrokenShoulderPlate, SubmergedBonePlate, getFixedDoodads } from './BoneDoodads';

interface TerrainProps {
  color?: string;
  roughness?: number;
  metalness?: number;
}

// Helper function to generate random positions within map bounds
const getRandomPosition = () => {
  const mapSize = 100; // Adjust based on your terrain size
  const x = (Math.random() - 0.5) * mapSize;
  const z = (Math.random() - 0.5) * mapSize;
  return new Vector3(x, 0, z);
};

export default function Terrain({ color = "#FFCAE5", roughness = 0.5, metalness = 0.1 }: TerrainProps) {
  // All hooks must be at the top level
  const terrainRef = useRef<Mesh>(null);
  const octagonRef = useRef<Shape | null>(null);
  
  // Create the shader material
  const snowMaterial = useRef(new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      scale: { value: 20.0 },
      elevation: { value: 0.3 }, // hmm irrelvant cuz flat geometry**
      groundScale: { value: 0. },
      patchScale: { value: 0.1 },
      baseColor: { value: new THREE.Color(color) },
      roughnessValue: { value: roughness },
      metalnessValue: { value: metalness },
      crackIntensity: { value: 2.0 },
      glowStrength: { value: 0.8 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float scale;
      uniform float elevation;
      uniform float groundScale;
      uniform float patchScale;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      
      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,
                           0.366025403784439,
                          -0.577350269189626,
                           0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                         + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      uniform float crackIntensity;
      uniform float glowStrength;

      float getCrackPattern(vec2 uv) {
        // Create sharp, vein-like cracks
        float noise1 = abs(snoise(uv * 3.0));
        float noise2 = abs(snoise(uv * 6.0 + 1234.5));
        
        // Combine noises to create crack pattern
        float crack = smoothstep(0.7, 0.8, noise1 * noise2);
        return crack;
      }

      void main() {
        // Create brown patches
        vec2 patchUv = vUv * patchScale;
        float patchPattern = snoise(patchUv + time * 0.01);
        float patchPattern2 = snoise(patchUv * 1.5 + time * 0.015); // Second noise for third color
        
        // Add a third noise pattern for light blue patches
        vec2 lightPatchUv = vUv * 0.1; // Larger scale for light patches
        float lightPattern = smoothstep(0.4, 0.6, snoise(lightPatchUv + time * 0.007));
        
        // Base colors - muted blue fantasy theme with light accents
        vec3 grassColor = vec3(0.2, 0.265, 0.6);      // Deeper muted blue
        vec3 brownColor = vec3(0.20, 0.3, 0.7);    // Medium muted blue
        vec3 lightBrownColor = vec3(0.3, 0.4, 0.8); // Lighter muted blue
        vec3 accentColor = vec3(0.5, 0.6, 0.95);    // Very light blue accent
        
        // Mix colors based on noise patterns
        vec3 baseGroundColor = mix(grassColor, brownColor, patchPattern * 0.6);
        baseGroundColor = mix(baseGroundColor, lightBrownColor, patchPattern2 * 0.4);
        // Add light blue accents
        baseGroundColor = mix(baseGroundColor, accentColor, lightPattern * 0.3);
        
        // Add noise detail
        vec2 uv = vUv * scale;
        float n = snoise(uv) * 0.5;
        n += snoise(uv * 2.0) * 0.25;
        
        // Apply detail to final color
        vec3 finalColor = mix(baseGroundColor, baseGroundColor * 1.2, n * 0.3);
        
        // Add cracks
        vec2 crackUv = vUv * crackIntensity + time * 0.05;
        float crackPattern = getCrackPattern(crackUv);
        
        // Create glowing effect for cracks
        vec3 glowColor = vec3(0.2, 0.8, 0.3); // Green gas color
        float glow = smoothstep(0.2, 0.8, crackPattern) * glowStrength;
        
        // Pulse the glow
        float pulse = sin(time * 2.0) * 0.5 + 0.5;
        glow *= 0.8 + 0.2 * pulse;
        
        // Mix the crack glow with the base terrain
        finalColor = mix(finalColor, glowColor, glow * 0.6);
        
        // Add extra brightness to crack centers
        float crackCenter = smoothstep(0.85, 0.95, crackPattern);
        finalColor += glowColor * crackCenter * 0.5;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: DoubleSide,
  })).current;

  // Initialize octagon shape
  useEffect(() => {
    if (!octagonRef.current) {
      const shape = new Shape();
      const radius = 50;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
      }
      shape.closePath();
      octagonRef.current = shape;
    }
  }, []);

  // Animate snow sparkle
  useFrame(({ clock }) => {
    if (snowMaterial.uniforms) {
      snowMaterial.uniforms.time.value = clock.getElapsedTime();
    }
  });

  const TerrainDoodads = () => {
    const doodads = useRef<Array<{ 
      position: Vector3; 
      rotation: Euler; 
      type: string; 
      scale?: number; 
    }>>([]);

    useEffect(() => {
      // Start with fixed doodads
      const newDoodads = [...getFixedDoodads()];
      
      // Add random doodads
      // Add bone plates (1-2)
      for (let i = 0; i < 1 + Math.floor(Math.random()); i++) {
        newDoodads.push({
          position: getRandomPosition(),
          rotation: new Euler(0, Math.random() * Math.PI * 2, 0),
          type: 'plate',
          scale: 0.8 + Math.random() * 0.4
        });
      }
      
      // Add scattered bones (20-40)
      const boneCount = 20 + Math.floor(Math.random() * 20);
      for (let i = 0; i < boneCount; i++) {
        newDoodads.push({
          position: getRandomPosition(),
          rotation: new Euler(
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * 0.5
          ),
          type: 'bones'
        });
      }
      
      // Add shoulder plates and other decorative pieces (10-20)
      const decorativeCount = 10 + Math.floor(Math.random() * 10);
      for (let i = 0; i < decorativeCount; i++) {
        newDoodads.push({
          position: getRandomPosition(),
          rotation: new Euler(
            Math.random() * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * 0.3
          ),
          type: 'shoulder'
        });
      }
      
      doodads.current = newDoodads;
    }, []);

    return (
      <>
        {doodads.current.map((doodad, index) => {
          switch (doodad.type) {
            case 'submerged':
              return <SubmergedBonePlate key={index} {...doodad} />;
            case 'plate':
              return <BrokenBonePlate key={index} {...doodad} />;
            case 'bones':
              return <ScatteredBones key={index} {...doodad} />;
            case 'shoulder':
              return <BrokenShoulderPlate key={index} {...doodad} />;
            default:
              return null;
          }
        })}
      </>
    );
  };

  return (
    <group>
      {/* Main terrain */}
      <mesh ref={terrainRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {octagonRef.current && <shapeGeometry args={[octagonRef.current]} />}
        <primitive object={snowMaterial} attach="material" />
      </mesh>  

      <TerrainDoodads />
    </group>
  );
}

// 9EE493 6CC551 AFD0D6

// BEST AFD0D6 -> 6CC551