import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

import { WeaponType, WeaponSubclass, AbilityType, WeaponInfo } from '@/Weapons/weapons';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { SUBCLASS_ABILITIES, getModifiedCooldown } from '@/Weapons/weapons';
import GameWrapper from '@/Scene/GameWrapper';

// Get default abilities for all weapons (using first subclass as default for each)
const getDefaultAbilitiesForAllWeapons = (): WeaponInfo => {
  const defaultSubclasses: Record<WeaponType, WeaponSubclass> = {
    [WeaponType.SWORD]: WeaponSubclass.VENGEANCE,
    [WeaponType.SCYTHE]: WeaponSubclass.CHAOS,
    [WeaponType.SABRES]: WeaponSubclass.ASSASSIN,
    [WeaponType.SPEAR]: WeaponSubclass.STORM,
    [WeaponType.BOW]: WeaponSubclass.ELEMENTAL,
  };

  const result: Partial<WeaponInfo> = {};
  Object.values(WeaponType).forEach(weapon => {
    const defaultSubclass = defaultSubclasses[weapon];
    result[weapon] = SUBCLASS_ABILITIES[defaultSubclass];
  });
  
  return result as WeaponInfo;
};

// Client-side only component
function HomePageContent() {
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType | null>(null);
  const [currentSubclass, setCurrentSubclass] = useState<WeaponSubclass | null>(null);
  const controlsRef = useRef<OrbitControlsType>(null);
  const [playerHealth, setPlayerHealth] = useState(200);
  const [maxHealth, setMaxHealth] = useState(200);
  const [abilities, setAbilities] = useState<WeaponInfo>(() => getDefaultAbilitiesForAllWeapons());
  
  // Local kill count (used in single player, multiplayer handled in GameWrapper)
  const [localKillCount, setLocalKillCount] = useState(0);
  
  // Skeleton count (for Abyssal Scythe FrenzyAura)
  const [, setSkeletonCount] = useState(0);

  // Player stun ref for lightning strikes
  const playerStunRef = useRef<{ triggerStun: (duration: number) => void } | null>(null);

  const handleWeaponSelect = (weapon: WeaponType, subclass?: WeaponSubclass) => {
    setCurrentWeapon(weapon);
    setCurrentSubclass(subclass || null);
    
    if (subclass) {
      // Update abilities based on selected subclass
      setAbilities(prev => {
        const newAbilities = { ...prev };
        newAbilities[weapon] = { ...SUBCLASS_ABILITIES[subclass] };
        
        // Unlock abilities based on current level
        const currentLevel = getLevel(localKillCount);
        const weaponAbilities = newAbilities[weapon];
        Object.keys(weaponAbilities).forEach(abilityKey => {
          const ability = weaponAbilities[abilityKey as AbilityType];
          if (ability && ability.unlockLevel <= currentLevel) {
            ability.isUnlocked = true;
          }
        });
        
        return newAbilities;
      });
    }
  };

  const handleAbilityUnlock = (abilityType: AbilityType) => {
    if (!currentWeapon || !currentSubclass) return;
    
    setAbilities(prev => {
      const newAbilities = { ...prev };
      const weaponAbilities = newAbilities[currentWeapon];
      const ability = weaponAbilities[abilityType];
      
      if (ability && !ability.isUnlocked) {
        ability.isUnlocked = true;
      }
      
      return newAbilities;
    });
  };

  const handleModifyAbilityCooldown = useCallback((weapon: WeaponType, abilityType: AbilityType) => {
    setAbilities(prevAbilities => {
      const newAbilities = { ...prevAbilities };
      const ability = newAbilities[weapon][abilityType];
      
      if (ability && ability.isUnlocked) {
        const modifiedCooldown = getModifiedCooldown(weapon, abilityType, prevAbilities, currentSubclass || undefined);
        ability.currentCooldown = modifiedCooldown;
      } 
      
      return newAbilities;
    });
  }, [currentSubclass]);

  // New function to reset ability cooldown to 0
  const handleResetAbilityCooldown = useCallback((weapon: WeaponType, abilityType: AbilityType) => {
    setAbilities(prevAbilities => {
      const newAbilities = { ...prevAbilities };
      const ability = newAbilities[weapon][abilityType];
      
      if (ability && ability.isUnlocked) {
        ability.currentCooldown = 0; // Reset cooldown to 0
      } 
      
      return newAbilities;
    });
  }, []);

  const handleSkeletonCountChange = useCallback((count: number) => {
    setSkeletonCount(count);
  }, []);

  const handlePlayerDamage = (damage: number) => {
    setPlayerHealth(prevHealth => Math.max(0, prevHealth - damage));
  };

  const handlePlayerHeal = (healAmount: number) => {
    setPlayerHealth(prevHealth => Math.min(maxHealth, prevHealth + healAmount));
  };

  // Function to calculate level based on kill count (same as Panel.tsx)
  const getLevel = (kills: number) => {
    if (kills < 10) return 1;    
    if (kills < 25) return 2;     
    if (kills < 45) return 3;    
    if (kills < 70) return 4;   
    return 5;                      // Level 5: 20+ kills
  };

  // Function to unlock abilities based on current level and subclass
  const unlockAbilitiesForLevel = useCallback((level: number) => {
    if (!currentWeapon || !currentSubclass) return;

    setAbilities(prev => {
      const newAbilities = { ...prev };
      const weaponAbilities = newAbilities[currentWeapon];
      let hasChanges = false;

      // Check each ability to see if it should be unlocked at this level
      Object.keys(weaponAbilities).forEach(abilityKey => {
        const ability = weaponAbilities[abilityKey as AbilityType];
        if (ability && !ability.isUnlocked && ability.unlockLevel <= level) {
          ability.isUnlocked = true;
          hasChanges = true;
        }
      });

      return hasChanges ? newAbilities : prev;
    });
  }, [currentWeapon, currentSubclass]);

  // KILL COUNTER - only used in single player mode (multiplayer handled in GameWrapper)
  const handleEnemyDeath = useCallback(() => {
    setLocalKillCount(prev => {
      const newCount = prev + 1;
      const newLevel = getLevel(newCount);
      const currentLevel = getLevel(prev);
      
      // Update max health based on new kill count
      const newMaxHealth = 200 + newCount;
      setMaxHealth(newMaxHealth);
      // Heal by 1 when kill count increases (but don't exceed max health)
      setPlayerHealth(prevHealth => Math.min(newMaxHealth, prevHealth + 1));
      
      // Check if we leveled up and unlock new abilities
      if (newLevel > currentLevel) {
        unlockAbilitiesForLevel(newLevel);
      }
      
      return newCount;
    });
  }, [unlockAbilitiesForLevel]);

  // RESET
  const handleReset = () => {
    setPlayerHealth(200);
    setMaxHealth(200);
    setAbilities(() => getDefaultAbilitiesForAllWeapons());
    // Reset local kill count
    setLocalKillCount(0);
    // Reset skeleton count
    setSkeletonCount(0);
    setCurrentWeapon(null);  // FORCES WEAPON RESELECTION
    setCurrentSubclass(null); // FORCES SUBCLASS RESELECTION
    
    // Dispatch reset event for other components
    window.dispatchEvent(new CustomEvent('gameReset'));
  };

  // Add this cooldown management system in index.tsx
  useEffect(() => {
    const cooldownInterval = setInterval(() => {
      setAbilities(prev => {
        const newAbilities = { ...prev };
        let hasChanges = false;
        
        // Decrement cooldowns for all weapons and abilities
        Object.values(WeaponType).forEach(weaponType => {
          const weaponAbilities = newAbilities[weaponType];
          if (weaponAbilities) {
            Object.keys(weaponAbilities).forEach(abilityKey => {
              const ability = weaponAbilities[abilityKey as AbilityType];
              if (ability && ability.currentCooldown > 0) {
                ability.currentCooldown = Math.max(0, ability.currentCooldown - 0.15);
                hasChanges = true;
              }
            });
          }
        });
        
        return hasChanges ? newAbilities : prev;
      });
    }, 150);

    return () => clearInterval(cooldownInterval);
  }, []);

  return (
    <main>
      <GameWrapper
        sceneProps={{
          unitProps: {
            controlsRef,
            currentWeapon: currentWeapon || WeaponType.SCYTHE,
            currentSubclass: currentSubclass || undefined,
            onWeaponSelect: handleWeaponSelect,
            health: playerHealth,
            maxHealth: maxHealth,
            abilities,
            onAbilityUse: handleModifyAbilityCooldown,
            onResetAbilityCooldown: handleResetAbilityCooldown,
            onDamage: handlePlayerDamage,
            onEnemyDeath: handleEnemyDeath,
            onHealthChange: handlePlayerHeal,
            onHit: () => {},
            onPositionUpdate: () => {},
            enemyData: [],
            onFireballDamage: () => {},
            onSmiteDamage: () => {},
            isPlayer: true,
            level: getLevel(localKillCount),
            onSkeletonCountChange: handleSkeletonCountChange
          },
          playerStunRef,
          onWeaponSelect: handleWeaponSelect,
          onReset: handleReset,
          skeletonProps: [],
          killCount: localKillCount,
          onAbilityUnlock: handleAbilityUnlock,
          onFireballDamage: () => {},
          bossActive: false
        }}
        currentWeapon={currentWeapon || WeaponType.SCYTHE}
        currentSubclass={currentSubclass || undefined}
        onWeaponSelect={handleWeaponSelect}
        playerHealth={playerHealth}
        maxHealth={maxHealth}
        abilities={abilities}
        onReset={handleReset}
        killCount={localKillCount}
        onAbilityUnlock={handleAbilityUnlock}
      />
    </main>
  );
}

// Dynamic import to prevent SSR issues
const HomePage = dynamic(() => Promise.resolve(HomePageContent), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default HomePage;