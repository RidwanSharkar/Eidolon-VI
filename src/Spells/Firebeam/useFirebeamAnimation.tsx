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
  const startupDuration = 0;
  const fadeOutDuration = 1.2;
  const delayTimer = useRef(0);
  const startDelay = 0.0;
  const isActive = useRef(true);
  const isFadingOut = useRef(false);

  useEffect(() => {
    const currentBeam = beamRef.current;
    
    return () => {
      isActive.current = false;
      if (currentBeam) {
        isFadingOut.current = true;
        setTimeout(() => {
          if (currentBeam) {
            currentBeam.scale.z = 0;
          }
        }, fadeOutDuration * 1000);
      }
    };
  }, [beamRef]);

  useFrame((_, delta) => {
    if (!beamRef.current) return;

    if (delayTimer.current < startDelay) {
      delayTimer.current += delta;
      return;
    }

    if (isFadingOut.current) {
      progressRef.current -= delta / fadeOutDuration;
      if (progressRef.current > 0) {
        beamRef.current.scale.z = progressRef.current;
      }
    } else if (progressRef.current < 1) {
      progressRef.current += delta / startupDuration;
      const progress = Math.min(progressRef.current, 1);
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
      isFadingOut.current = true;
      setTimeout(() => {
        if (beamRef.current) {
          beamRef.current.scale.z = 0;
        }
        isFadingOut.current = false;
      }, fadeOutDuration * 2000);
    }
  };
}; 