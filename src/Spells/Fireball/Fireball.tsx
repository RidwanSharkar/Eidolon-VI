import React, { useRef } from 'react';
import { Mesh, Vector3, Clock, Color, Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import FireballTrail from '@/Spells/Fireball/FireballTrail';
import * as THREE from 'three'

interface FireballProps {
  position: Vector3;
  direction: Vector3;
  onImpact: () => void;
}

export default function Fireball({ position, direction, onImpact }: FireballProps) {
  const fireballRef = useRef<Mesh>(null);
  const clock = useRef(new Clock());
  const speed = 0.3;
  const lifespan = 10;
  const currentPosition = useRef(position.clone());
  const { scene } = useThree();
  const size = 0.25;
  const color = new Color('#00ff44');
  const impactGroup = useRef<Group>(null);
  const explosionStartTime = useRef<number | null>(null);
  const EXPLOSION_DURATION = 0.3;
  const EXPLOSION_SIZE = 0.8;
  const explosionRef = useRef<Group>(null);

  const checkCollision = (nextPosition: Vector3): boolean => {
    const raycaster = new THREE.Raycaster();
    const rayDirection = nextPosition.clone().sub(currentPosition.current).normalize();
    raycaster.set(currentPosition.current, rayDirection);

    const collidableObjects = scene.children.filter(child => 
      (child.name === 'mountain' && child instanceof THREE.Group) ||
      (child.name === 'tree' && child instanceof THREE.Group)
    );

    const allMeshes = collidableObjects.flatMap(group => {
      const meshes: THREE.Mesh[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
      return meshes;
    });

    const intersects = raycaster.intersectObjects(allMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const movementDistance = currentPosition.current.distanceTo(nextPosition);
      if (hit.distance <= movementDistance) {
        console.log('Collision detected:', hit.point);
        return true;
      }
    }

    return false;
  };

  const createExplosionEffect = (position: Vector3) => {
    if (!explosionRef.current) return;
    
    explosionRef.current.position.copy(position);
    explosionRef.current.visible = true;
    explosionStartTime.current = clock.current.getElapsedTime();
  };

  useFrame((_, delta) => {
    if (!fireballRef.current) return;

    if (clock.current.getElapsedTime() > lifespan) {
      fireballRef.current.removeFromParent();
      return;
    }

    const movement = direction.clone().multiplyScalar(speed * delta * 60);
    const nextPosition = currentPosition.current.clone().add(movement);

    if (checkCollision(nextPosition)) {
      if (fireballRef.current) {
        createExplosionEffect(currentPosition.current);
        fireballRef.current.removeFromParent();
      }
      onImpact();
    } else {
      currentPosition.current.copy(nextPosition);
      fireballRef.current.position.copy(currentPosition.current);
    }

    if (explosionStartTime.current !== null && explosionRef.current) {
      const elapsed = clock.current.getElapsedTime() - explosionStartTime.current;
      const progress = elapsed / EXPLOSION_DURATION;
      
      if (progress >= 1) {
        explosionRef.current.visible = false;
        explosionStartTime.current = null;
      } else {
        const scale = EXPLOSION_SIZE * (1 + progress);
        explosionRef.current.scale.set(scale, scale, scale);
        const opacity = 1 - progress;
        explosionRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.opacity = opacity;
          }
        });
      }
    }
  });

  return (
    <group name="fireball-group">
      <mesh ref={fireballRef} position={currentPosition.current}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
        <pointLight color={color} intensity={5} distance={12} />
      </mesh>
      <group ref={impactGroup} visible={false}>
        <mesh>
          <sphereGeometry args={[size * 1.25, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            transparent={true}
            opacity={1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      <FireballTrail
        color={color}
        size={size}
        meshRef={fireballRef}
        opacity={1}
      />
      <group ref={explosionRef} visible={false}>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={3}
            transparent
            opacity={1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <pointLight color={color} intensity={8} distance={4} decay={2} />
      </group>
    </group>
  );
}