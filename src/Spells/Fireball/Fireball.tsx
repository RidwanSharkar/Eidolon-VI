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
  const speed = 0.4;
  const lifespan = 10;
  const currentPosition = useRef(position.clone());
  const { scene } = useThree();
  const size = 0.3;
  const color = new Color('#00ff44');
  const impactGroup = useRef<Group>(null);
  const isExploding = useRef(false);
  const explosionStartTime = useRef(0);
  const explosionDuration = 1.0; // Duration in seconds

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
    if (!impactGroup.current) return;
    isExploding.current = true;
    explosionStartTime.current = clock.current.getElapsedTime();
    impactGroup.current.position.copy(position);
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

    // Handle explosion animation
    if (isExploding.current && impactGroup.current) {
      const explosionProgress = (clock.current.getElapsedTime() - explosionStartTime.current) / explosionDuration;
      
      if (explosionProgress >= 1) {
        isExploding.current = false;
        impactGroup.current.scale.set(1, 1, 1);
        impactGroup.current.visible = false;
      } else {
        const scale = 1 + explosionProgress * 2;
        impactGroup.current.scale.set(scale, scale, scale);
        impactGroup.current.visible = true;
        // Fade out the opacity
        const mesh = impactGroup.current.children[0] as THREE.Mesh;
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.opacity = 1 - explosionProgress;
        }
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
    </group>
  );
}