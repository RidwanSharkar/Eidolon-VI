import { Vector3 } from 'three';
import { useRef, useState } from 'react';
import { calculateDamage } from '../../Weapons/damage';

//=====================================================================================================
//DORMANT 
//=====================================================================================================
interface SmiteManagerProps {
  onHit: (targetId: string, damage: number) => void;
  setDamageNumbers: React.Dispatch<React.SetStateAction<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
  }[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
}

export function useSmiteManager({
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  enemyData
}: SmiteManagerProps) {
  const [isSmiting, setIsSmiting] = useState(false);
  const [smiteEffects, setSmiteEffects] = useState<{ id: number; position: Vector3 }[]>([]);
  const nextSmiteId = useRef(0);
  const pendingLightningTargets = useRef<Set<string>>(new Set());

  const handleSmiteHit = (targetId: string, target: { position: Vector3; health: number }) => {
    if (pendingLightningTargets.current.has(targetId)) {
      return false;
    }

    const baseDamage = 17;
    const { damage, isCritical } = calculateDamage(baseDamage);
    onHit(targetId, damage);

    const targetAfterInitialDamage = target.health - damage;
    if (targetAfterInitialDamage > 0) {
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: target.position.clone(),
        isCritical
      }]);

      pendingLightningTargets.current.add(targetId);

      const applyLightningDamage = () => {
        const currentTarget = enemyData.find(e => e.id === targetId);
        
        if (!currentTarget || 
            currentTarget.health <= 0 || 
            !pendingLightningTargets.current.has(targetId)) {
          pendingLightningTargets.current.delete(targetId);
          return;
        }
        
        const { damage: lightningDamage, isCritical: lightningCrit } = calculateDamage(47);
        onHit(targetId, lightningDamage);

        const updatedTarget = enemyData.find(e => e.id === targetId);
        if (updatedTarget && updatedTarget.health > 0) {
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: lightningDamage,
            position: updatedTarget.position.clone(),
            isCritical: lightningCrit,
            isLightning: true
          }]);
        }

        pendingLightningTargets.current.delete(targetId);
      };

      setTimeout(applyLightningDamage, 200);
    }

    return true;
  };

  const handleSmiteComplete = () => {
    setIsSmiting(false);
  };

  const handleSmiteEffectComplete = (id: number) => {
    setSmiteEffects(prev => prev.filter(effect => effect.id !== id));
  };

  return {
    isSmiting,
    setIsSmiting,
    smiteEffects,
    setSmiteEffects,
    nextSmiteId,
    handleSmiteHit,
    handleSmiteComplete,
    handleSmiteEffectComplete
  };
} 