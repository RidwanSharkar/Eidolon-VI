import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Object3D, Material } from 'three';
import * as THREE from 'three';

interface OathstrikeAnimationProps {
  effectRef: React.RefObject<Group>;
  parentRef: React.RefObject<Group>;
  position: Vector3;
  direction: Vector3;
}

export const useOathstrikeAnimation = ({
  effectRef,
  parentRef,
}: OathstrikeAnimationProps) => {
  const progressRef = useRef(0);
  const animationDuration = 0.2;
  const isActive = useRef(true);

  useEffect(() => {
    const currentEffect = effectRef.current;
    
    return () => {
      isActive.current = false;
      if (currentEffect) {
        currentEffect.scale.set(0, 0, 0);
      }
    };
  }, [effectRef]);

  useFrame((_, delta) => {
    if (!effectRef.current || !isActive.current || !parentRef.current) return;

    progressRef.current += delta;
    const progress = progressRef.current / animationDuration;

    if (progress <= 1) {
      // Use quaternion to get parent's forward direction
      const parentQuaternion = parentRef.current.quaternion;
      
      // Create the forward vector and apply parent's rotation
      const forward = new THREE.Vector3(0, 0, 2);
      forward.applyQuaternion(parentQuaternion);
      
      // Position the effect
      effectRef.current.position.copy(parentRef.current.position)
        .add(forward)
        .setY(0.1);
      
      // Create a quaternion for laying flat (-90 degrees around X axis)
      const flatRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(-1, 0, 0),
        -Math.PI/2
      );
      
      // Combine the flat rotation with the parent's rotation
      effectRef.current.quaternion.copy(parentQuaternion)
        .multiply(flatRotation);

      // Scale and fade effects
      const scale = Math.sin(progress * Math.PI) * 1.5;
      effectRef.current.scale.set(scale, scale, scale * 0.5);

      effectRef.current.traverse((child: Object3D) => {
        const material = (child as THREE.Mesh).material as Material & { opacity?: number };
        if (material?.opacity !== undefined) {
          material.opacity = Math.sin(progress * Math.PI);
        }
      });
    } else {
      isActive.current = false;
      if (effectRef.current) {
        effectRef.current.scale.set(0, 0, 0);
      }
    }
  });

  return {
    reset: () => {
      progressRef.current = 0;
      isActive.current = true;
      if (effectRef.current) {
        effectRef.current.scale.set(0, 0, 0);
      }
    }
  };
}; 