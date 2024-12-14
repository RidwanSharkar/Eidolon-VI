import { Mesh, Shape, DoubleSide, InstancedMesh, Matrix4 } from 'three';
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TerrainProps {
  color?: string;
  roughness?: number;
  metalness?: number;
}

export default function Terrain({ color = "#ffffff", roughness = 0.5, metalness = 0.1 }: TerrainProps) {
  const terrainRef = useRef<Mesh>(null);
  const bonesRef = useRef<InstancedMesh>(null);
  
  // Create custom snow shader material
  const snowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      scale: { value: 20.0 },
      elevation: { value: 0.2 },
      groundScale: { value: 0.1 },
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
        // Create large distinct patches
        vec2 groundUv = vUv * groundScale;
        float groundPattern = snoise(groundUv);
        
        // Create snow texture for detail
        vec2 uv = vUv * scale;
        float n = snoise(uv) * 0.5;
        n += snoise(uv * 2.0) * 0.25;
        n += snoise(uv * 4.0) * 0.125;
        n += snoise(uv * 8.0) * 0.0625;
        
        // Sparkle effect
        float sparkle = pow(max(0.0, snoise(uv * 20.0 + time * 0.1)), 20.0) * 0.3;
        
        // Create blight glow spots
        float blightSpots = pow(max(0.0, snoise(uv * 8.0 + time * 0.05)), 8.0) * 0.15;
        
        // Colors
        vec3 snowColor = vec3(0.92, 0.93, 0.95);
        vec3 blightColor = vec3(0.25, 0.22, 0.20); // Slightly browner tone, was (0.15, 0.13, 0.12)
        vec3 glowColor = vec3(0.3, 0.8, 0.2); // Keeping the same sickly green glow
        
        // Create sharp transitions between snow and ground
        float blend = smoothstep(0.0, 0.1, groundPattern);
        vec3 finalColor = mix(snowColor, blightColor, blend);
        
        // Add green glow spots only to blighted areas
        float blightAmount = blend;
        finalColor += glowColor * blightSpots * blightAmount;
        
        // Add snow effects only to snow areas
        float snowAmount = 1.0 - blend;
        float shadow = smoothstep(-1.0, 1.0, n) * 0.2;
        finalColor = mix(finalColor, finalColor * 1.15, shadow * snowAmount);
        finalColor += vec3(sparkle * snowAmount);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: DoubleSide,
  });

  // Animate snow sparkle
  useFrame(({ clock }) => {
    snowMaterial.uniforms.time.value = clock.getElapsedTime();
  });

  // Create octagon shape for the ground
  const octagon = new Shape();
  const radius = 50;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    if (i === 0) octagon.moveTo(x, z);
    else octagon.lineTo(x, z);
  }
  octagon.closePath();

  // Scatter bones across the terrain
  useEffect(() => {
    if (bonesRef.current) {
      const matrix = new Matrix4();
      const numBones = 200;

      for (let i = 0; i < numBones; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 45;
        const x = distance * Math.cos(angle);
        const z = distance * Math.sin(angle);
        const scale = 0.1 + Math.random() * 0.15;
        const rotation = Math.random() * Math.PI * 2;

        matrix.compose(
          new THREE.Vector3(x, 0.01, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(
            Math.random() * 0.3,
            rotation,
            Math.random() * 0.3
          )),
          new THREE.Vector3(scale, scale, scale)
        );
        bonesRef.current.setMatrixAt(i, matrix);
      }
      bonesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  return (
    <group>
      {/* Main terrain */}
      <mesh ref={terrainRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[octagon]} />
        <primitive object={snowMaterial} attach="material" />
      </mesh>

      {/* Scattered bones */}
      <instancedMesh
        ref={bonesRef}
        args={[undefined, undefined, 200]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial
          color="#e8e8e8"
          roughness={0.7}
          metalness={0.2}
          emissive="#304050"
          emissiveIntensity={0.1}
        />
      </instancedMesh>

      {/* Ground fog effect */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          transparent
          opacity={0.4}
          color="#b8c6db"
          fog={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle ground glow for undead atmosphere */}
      <pointLight
        position={[0, 0.1, 0]}
        color="#304050"
        intensity={0.5}
        distance={10}
        decay={2}
      />
    </group>
  );
}