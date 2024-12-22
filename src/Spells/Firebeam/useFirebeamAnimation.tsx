import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';

interface FirebeamAnimationProps {
  beamRef: React.RefObject<Group>;
  position: Vector3;
  direction: Vector3;
}

export const useFirebeamAnimation = ({
  beamRef,
}: FirebeamAnimationProps) => {
  const progressRef = useRef(0);
  const startupDuration = 0.;
  const delayTimer = useRef(0);
  const startDelay = 0.0;
  const isActive = useRef(true);

  useEffect(() => {
    const currentBeam = beamRef.current;
    
    return () => {
      isActive.current = false;
      if (currentBeam) {
        currentBeam.scale.z = 0;
      }
    };
  }, [beamRef]);

  useFrame((_, delta) => {
    if (!beamRef.current || !isActive.current) return;

    if (delayTimer.current < startDelay) {
      delayTimer.current += delta;
      return;
    }

    if (progressRef.current < startupDuration) {
      progressRef.current += delta;
      const progress = Math.min(progressRef.current / startupDuration, 1);
      beamRef.current.scale.z = progress;
    }

    // Animate beam particles
    beamRef.current.children.forEach((child, index) => {
      if (child.name === 'particle') {
        child.position.z = ((Date.now() * 0.01 + index * 50) % 200) / 10;
      }
    });
  });

  return {
    reset: () => {
      progressRef.current = 0;
      delayTimer.current = 0;
      isActive.current = false;
      if (beamRef.current) {
        beamRef.current.scale.z = 0;
      }
    }
  };
}; 