import { useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, Material, Mesh } from 'three';

interface DamageNumberProps {
  damage: number;
  position: Vector3;
  isCritical?: boolean;
  isLightning?: boolean;
  onComplete: () => void;
}

interface TextMesh extends Mesh {
  material: Material & {
    opacity: number;
  };
}

export default function DamageNumber({ damage, position, isCritical = false, isLightning = false, onComplete }: DamageNumberProps) {
  const textRef = useRef<TextMesh>(null);
  const startTime = useRef(Date.now());
  const startY = position.y + 3.5;
  
  const timeOffset = (Date.now() % 1000) / 1000;
  const horizontalOffset = Math.sin(timeOffset * Math.PI * 2) * 0.3;
  const verticalOffset = Math.cos(timeOffset * Math.PI * 2) * 0.2;

  useFrame(() => {
    if (!textRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const duration = 1000;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      onComplete();
      return;
    }
    
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const floatHeight = startY + (easedProgress * 1.2);
    const finalY = floatHeight + verticalOffset;
    const finalX = position.x + horizontalOffset;
    
    textRef.current.position.set(finalX, finalY, position.z);
    textRef.current.material.opacity = Math.min(1, 3 * (1 - progress));
  });

  return (
    <Text
      ref={textRef}
      position={[position.x, startY, position.z]}
      fontSize={0.5}
      color={isCritical ? "#ff0000" : (isLightning ? "#ffff00" : "#ffffff")}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.1}
      outlineColor="#000000"
      material-transparent={true}
      material-depthTest={false}
    >
      {damage}
    </Text>
  );
} 