import { useRef } from 'react';
import { Vector3, Group, MeshBasicMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoneclawScratchProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
}

export default function BoneClawScratch({ position, direction, onComplete }: BoneclawScratchProps) {
  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 1.2;
  const delayTimer = useRef(0);
  const startDelay = 0.125;
  const color = new THREE.Color('#39ff14');
  const scorchedDuration = 2.5;
  const scorchedRef = useRef<Group>(null);
  const scorchedProgressRef = useRef(0);

  // Calculate three positions, one center and two on the sides
  const centerPosition = new Vector3(
    position.x + direction.x * 5,
    0,
    position.z + direction.z * 5
  );

  // Calculate perpendicular vector for spacing the side scratches
  const perpVector = new Vector3(-direction.z, 0, direction.x).normalize();
  const spacing = 1.35; // Adjust this value to control spacing between scratches

  const leftPosition = centerPosition.clone().add(perpVector.clone().multiplyScalar(-spacing));
  const rightPosition = centerPosition.clone().add(perpVector.clone().multiplyScalar(spacing));

  useFrame((_, delta) => {
    if (!effectRef.current) return;

    if (delayTimer.current < startDelay) {
      delayTimer.current += delta;
      return;
    }

    progressRef.current += delta;
    scorchedProgressRef.current += delta;
    const progress = Math.min(progressRef.current / animationDuration, 1);
    const scorchedProgress = Math.min(scorchedProgressRef.current / scorchedDuration, 1);

    if (progress < 1) {
      const startY = 3.5; //HEIGHT
      const currentY = startY * (1 - progress);
      effectRef.current.position.y = currentY;

      const scale = progress < 0.9 ? 1 : 1 - (progress - 0.9) / 0.2;
      effectRef.current.scale.set(scale, scale, scale);
    } else {
      onComplete();
    }

    if (scorchedRef.current) {
      const fadeOut = scorchedProgress > 0.7 
        ? 1 - ((scorchedProgress - 0.7) / 0.3)
        : 1;
      
      scorchedRef.current.scale.set(
        Math.min(scorchedProgress * 1.2, 1),
        1,
        Math.min(scorchedProgress * 1.2, 1)
      );
      
      const materials = (scorchedRef.current.children[0] as THREE.Mesh).material as MeshBasicMaterial;
      materials.opacity = fadeOut * 0.6;
    }
  });

  const createScratchEffect = (pos: Vector3, isCenter: boolean) => (
    <group
      position={[pos.x, 0, pos.z]}
      rotation={[
        isCenter ? Math.PI / 6 : Math.PI / 6,
        Math.atan2(direction.x, direction.z),
        0
      ]}
    >
      {/* Core beam */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 15, 16]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              float strength = 1.0 - length(vUv - vec2(0.5));
              vec3 glowColor = mix(uColor, vec3(1.0), 0.3);
              gl_FragColor = vec4(glowColor, strength * 0.95);
            }
          `}
          uniforms={{
            uColor: { value: color }
          }}
        />
      </mesh>

            {/* inner core beam */}
            <mesh>
        <cylinderGeometry args={[0.175, 0.175, 15, 16]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              float strength = 1.0 - length(vUv - vec2(0.5));
              vec3 glowColor = mix(uColor, vec3(1.0), 0.4);
              gl_FragColor = vec4(glowColor, strength * 0.8);
            }
          `}
          uniforms={{
            uColor: { value: color }
          }}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <cylinderGeometry args={[0.25, 0.25, 15, 16]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              float strength = 1.0 - length(vUv - vec2(0.5));
              vec3 glowColor = mix(uColor, vec3(1.0), 0.5);
              gl_FragColor = vec4(glowColor, strength * 0.6);
            }
          `}
          uniforms={{
            uColor: { value: color }
          }}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <cylinderGeometry args={[0.375, 0.375, 15, 16]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              float strength = 1.0 - length(vUv - vec2(0.5));
              vec3 glowColor = mix(uColor, vec3(1.0), 0.6);
              gl_FragColor = vec4(glowColor, strength * 0.4);
            }
          `}
          uniforms={{
            uColor: { value: color }
          }}
        />
      </mesh>

      {/*Spiral effectSky */}
      {[...Array(16)].map((_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 1.5, 0]} position={[0, +7.45, 0]}>
          <torusGeometry args={[0.5, 0.08, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={3}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}


      {/* Adding Floating particles from Smite */}
      {[...Array(20)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * Math.PI) / 4) * 0.5 ,
            (i - 4) * 0.5,
            Math.sin((i * Math.PI) / 4) * 0.5,
          ]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={12}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Impact point glow */}
      <pointLight position={[0, 0, 0]} color={color} intensity={20} distance={6} />

      {/* Ambient glow */}
      <pointLight position={[0, 0, 0]} color={color} intensity={15} distance={3} />
    </group>
  );


  return (
    <group
      ref={effectRef}
      visible={delayTimer.current >= startDelay}
    >
      {createScratchEffect(leftPosition, false)}
      {createScratchEffect(centerPosition, true)}
      {createScratchEffect(rightPosition, false)}
    </group>
  );
}