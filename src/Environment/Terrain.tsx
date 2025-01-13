import { Mesh, Shape, DoubleSide, } from 'three';
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TerrainProps {
  color?: string;
  roughness?: number;
  metalness?: number;
}

export default function Terrain({ color = "#FFCAE5", roughness = 0.5, metalness = 0.1 }: TerrainProps) {
  // All hooks must be at the top level
  const terrainRef = useRef<Mesh>(null);
  const octagonRef = useRef<Shape | null>(null);
  
  // Create the shader material
  const snowMaterial = useRef(new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      scale: { value: 20.0 },
      elevation: { value: 0.3 },
      groundScale: { value: 0. },
      patchScale: { value: 0.1 },
      baseColor: { value: new THREE.Color(color) },
      roughnessValue: { value: roughness },
      metalnessValue: { value: metalness },
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
      
      void main() {
        // Create brown patches
        vec2 patchUv = vUv * patchScale;
        float patchPattern = snoise(patchUv + time * 0.01);
        float patchPattern2 = snoise(patchUv * 1.5 + time * 0.015); // Second noise for third color
        
        // Base colors
        vec3 grassColor = vec3(0.2, 0.35, 0.15);      // Dark green base
        vec3 blueColor = vec3(0.2, 0.3, 0.45);        // Deep blue
        vec3 lightBlueColor = vec3(0.3, 0.4, 0.55);   // Light blue
        
        // Mix colors based on noise patterns
        vec3 baseGroundColor = mix(grassColor, blueColor, patchPattern * 0.7);
        baseGroundColor = mix(baseGroundColor, lightBlueColor, patchPattern2 * 0.5);
        
        // Add noise detail
        vec2 uv = vUv * scale;
        float n = snoise(uv) * 0.5;
        n += snoise(uv * 2.0) * 0.25;
        
        // Apply detail to final color
        vec3 finalColor = mix(baseGroundColor, baseGroundColor * 1.2, n * 0.3);
        
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


  return (
    <group>
      {/* Main terrain */}
      <mesh ref={terrainRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {octagonRef.current && <shapeGeometry args={[octagonRef.current]} />}
        <primitive object={snowMaterial} attach="material" />
      </mesh>  


    </group>
  );
}

// 9EE493 6CC551 AFD0D6

// BEST AFD0D6 -> 6CC551