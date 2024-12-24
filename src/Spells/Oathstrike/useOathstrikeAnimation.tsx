import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Object3D, Material } from 'three';
import * as THREE from 'three';
interface OathstrikeAnimationProps {
  effectRef: React.RefObject<Group>;
  position: Vector3;
  direction: Vector3;
}

export const useOathstrikeAnimation = ({
  effectRef,
}: OathstrikeAnimationProps) => {
  const progressRef = useRef(0);
  const animationDuration = 0.4; // Match sword swing speed
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
    if (!effectRef.current || !isActive.current) return;

    progressRef.current += delta;
    const progress = progressRef.current / animationDuration;

    if (progress <= 1) {
      // Follow sword swing arc
      const swingAngle = Math.PI * 0.8; // Total swing angle
      const currentAngle = -swingAngle/2 + (progress * swingAngle);
      
      effectRef.current.rotation.y = currentAngle;

      // Scale and fade effects
      const scale = Math.sin(progress * Math.PI) * 1.5;
      effectRef.current.scale.set(scale, scale, scale);

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
      isActive.current = false;
      if (effectRef.current) {
        effectRef.current.scale.set(0, 0, 0);
      }
    }
  };
}; 