import { useCallback } from 'react';
import { ChargeStatus } from '@/color/ChargedOrbitals';
import { WeaponType } from '@/Weapons/weapons';

interface WeaponAbility {
  isUnlocked: boolean;
  currentCooldown: number;
}

interface WeaponAbilities {
  q: WeaponAbility;
  e: WeaponAbility;
  r: WeaponAbility;
  passive: WeaponAbility;
  active: WeaponAbility;
}

interface UseReigniteManagerProps {
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
  currentWeapon?: WeaponType;
  abilities?: Record<WeaponType, WeaponAbilities>;
}

export function useReigniteManager({
  charges,
  setCharges,
  currentWeapon,
  abilities,
}: UseReigniteManagerProps) {
  const restoreCharge = useCallback(() => {
    // Check if the Spear's passive ability is unlocked
    const isPassiveUnlocked = currentWeapon === WeaponType.SPEAR && 
                             abilities && 
                             abilities[WeaponType.SPEAR]?.passive?.isUnlocked;
    
    // Only proceed if the passive is unlocked or if we don't have weapon info
    // (this allows the component to work even without the weapon check)
    if (currentWeapon !== undefined && abilities !== undefined && !isPassiveUnlocked) {
      return;
    }

    // Find the first unavailable charge
    const unavailableChargeIndex = charges.findIndex(charge => !charge.available);
    if (unavailableChargeIndex === -1) return; // All charges are available

    // Instantly restore the charge
    setCharges(prev => prev.map((charge, index) => 
      index === unavailableChargeIndex ? {
        ...charge,
        available: true,
        cooldownStartTime: null
      } : charge
    ));
  }, [charges, setCharges, currentWeapon, abilities]);

  return { restoreCharge };
}
