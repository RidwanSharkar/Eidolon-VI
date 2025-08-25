import { useState, useCallback, useEffect } from 'react';
import { WeaponType, WEAPON_DASH_CHARGES, DASH_CHARGE_COOLDOWN, DASH_GLOBAL_COOLDOWN, DashChargesState, DashCharge } from '@/Weapons/weapons';

interface UseDashChargesProps {
  currentWeapon: WeaponType;
}

interface UseDashChargesReturn {
  dashCharges: DashChargesState;
  canVault: () => boolean;
  consumeDashCharge: () => boolean;
  getDashChargesDisplay: () => { available: number; total: number; cooldowns: number[] };
}

export function useDashCharges({ currentWeapon }: UseDashChargesProps): UseDashChargesReturn {
  // Initialize dash charges for the current weapon
  const initializeDashCharges = useCallback((weapon: WeaponType): DashChargesState => {
    const chargeCount = WEAPON_DASH_CHARGES[weapon];
    const charges: DashCharge[] = Array.from({ length: chargeCount }, () => ({
      isAvailable: true,
      cooldownRemaining: 0,
    }));
    
    return {
      charges,
      globalCooldownRemaining: 0,
    };
  }, []);

  const [dashCharges, setDashCharges] = useState<DashChargesState>(() => 
    initializeDashCharges(currentWeapon)
  );

  // Reset dash charges when weapon changes
  useEffect(() => {
    setDashCharges(initializeDashCharges(currentWeapon));
  }, [currentWeapon, initializeDashCharges]);

  // Cooldown management
  useEffect(() => {
    const interval = setInterval(() => {
      setDashCharges(prev => {
        let hasChanges = false;
        const newState = { ...prev };

        // Reduce global cooldown
        if (newState.globalCooldownRemaining > 0) {
          newState.globalCooldownRemaining = Math.max(0, newState.globalCooldownRemaining - 0.1);
          hasChanges = true;
        }

        // Reduce individual charge cooldowns
        newState.charges = newState.charges.map(charge => {
          if (charge.cooldownRemaining > 0) {
            const newCooldown = Math.max(0, charge.cooldownRemaining - 0.1);
            hasChanges = true;
            return {
              ...charge,
              cooldownRemaining: newCooldown,
              isAvailable: newCooldown === 0,
            };
          }
          return charge;
        });

        return hasChanges ? newState : prev;
      });
    }, 100); // Update every 100ms for smooth cooldown display

    return () => clearInterval(interval);
  }, []);

  // Check if we can vault (have available charge and not in global cooldown)
  const canVault = useCallback((): boolean => {
    const hasAvailableCharge = dashCharges.charges.some(charge => charge.isAvailable);
    const notInGlobalCooldown = dashCharges.globalCooldownRemaining <= 0;
    return hasAvailableCharge && notInGlobalCooldown;
  }, [dashCharges]);

  // Use a vault charge
  const consumeDashCharge = useCallback((): boolean => {
    if (!canVault()) {
      return false;
    }

    setDashCharges(prev => {
      const newState = { ...prev };
      
      // Find the first available charge and use it
      const availableChargeIndex = newState.charges.findIndex(charge => charge.isAvailable);
      if (availableChargeIndex === -1) {
        return prev; // No available charges
      }

      // Use the charge
      newState.charges[availableChargeIndex] = {
        isAvailable: false,
        cooldownRemaining: DASH_CHARGE_COOLDOWN,
      };

      // Set global cooldown
      newState.globalCooldownRemaining = DASH_GLOBAL_COOLDOWN;

      return newState;
    });

    return true;
  }, [canVault]);

  // Get display information for UI
  const getDashChargesDisplay = useCallback(() => {
    const available = dashCharges.charges.filter(charge => charge.isAvailable).length;
    const total = dashCharges.charges.length;
    const cooldowns = dashCharges.charges.map(charge => charge.cooldownRemaining);
    
    return { available, total, cooldowns };
  }, [dashCharges]);

  return {
    dashCharges,
    canVault,
    consumeDashCharge,
    getDashChargesDisplay,
  };
}