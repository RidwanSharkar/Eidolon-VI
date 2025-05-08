import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Vector3 } from 'three';
import EagleEyeEffect from './EagleEyeEffect';
import VenomEffect from './VenomEffect';

interface EagleEyeManagerProps {
  isUnlocked: boolean;
}

interface EagleEyeEffectData {
  id: number;
  position: Vector3;
}

interface VenomEffectData {
  id: number;
  position: Vector3;
}

export default forwardRef(function EagleEyeManager({ isUnlocked }: EagleEyeManagerProps, ref) {
  const [eagleEyeEffects, setEagleEyeEffects] = useState<EagleEyeEffectData[]>([]);
  const [venomEffects, setVenomEffects] = useState<VenomEffectData[]>([]);
  const nextEffectId = useRef(0);
  
  const createEagleEyeEffect = (position: Vector3) => {
    if (!isUnlocked) return;
    
    setEagleEyeEffects(prev => [
      ...prev,
      {
        id: nextEffectId.current++,
        position: position.clone()
      }
    ]);
    
    // Create venom effect at the same position
    setVenomEffects(prev => [
      ...prev,
      {
        id: nextEffectId.current++,
        position: position.clone()
      }
    ]);
  };
  
  const handleEffectComplete = (id: number) => {
    setEagleEyeEffects(prev => prev.filter(effect => effect.id !== id));
  };
  
  const handleVenomEffectComplete = (id: number) => {
    setVenomEffects(prev => prev.filter(effect => effect.id !== id));
  };
  
  useImperativeHandle(ref, () => ({
    createEagleEyeEffect
  }));
  
  return (
    <>
      {eagleEyeEffects.map(effect => (
        <EagleEyeEffect
          key={effect.id}
          position={effect.position}
          onComplete={() => handleEffectComplete(effect.id)}
        />
      ))}
      
      {venomEffects.map(effect => (
        <VenomEffect
          key={effect.id}
          position={effect.position}
          onComplete={() => handleVenomEffectComplete(effect.id)}
        />
      ))}
    </>
  );
}); 