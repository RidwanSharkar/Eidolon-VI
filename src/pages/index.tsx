import React, { useState, useRef, useEffect, useCallback } from 'react';

import { WeaponType, AbilityType } from '@/Weapons/weapons';
import { SceneProps } from '@/Scene/SceneProps';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { DEFAULT_WEAPON_ABILITIES, getModifiedCooldown } from '@/Weapons/weapons';
import { WeaponInfo } from '@/Unit/UnitProps';
import GameWrapper from '@/Scene/GameWrapper';

// repurposed legacy file for scene props
export default function HomePage() {
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType | null>(null);
  const controlsRef = useRef<OrbitControlsType>(null);
  const [playerHealth, setPlayerHealth] = useState(200);
  const [maxHealth, setMaxHealth] = useState(200);
  const [abilities, setAbilities] = useState<WeaponInfo>(() => DEFAULT_WEAPON_ABILITIES as WeaponInfo);

  const handleAbilityUnlock = (abilityType: AbilityType) => {
    setAbilities(prev => {
      const newAbilities = { ...prev };
      if (currentWeapon) {
        newAbilities[currentWeapon][abilityType] = {
          ...newAbilities[currentWeapon][abilityType],
          isUnlocked: true
        };
      }
      return newAbilities;
    });
  };

  const handleWeaponSelect = (weapon: WeaponType) => {
    setCurrentWeapon(weapon);
  };

  const handleAbilityUse = (weapon: WeaponType, abilityType: AbilityType) => {
    setAbilities(prev => {
      const newAbilities = { ...prev };
      newAbilities[weapon][abilityType].currentCooldown = getModifiedCooldown(weapon, abilityType, prev);
      return newAbilities;
    });
  };


  useEffect(() => {

    const interval = setInterval(() => {
      setAbilities((prev: WeaponInfo) => {
        const newAbilities = { ...prev };
        (Object.keys(newAbilities) as WeaponType[]).forEach(weapon => {
          ['q', 'e', 'r', 'passive', 'active'].forEach(ability => {
            const key = ability as 'q' | 'e' | 'r' | 'passive' | 'active';
            if (newAbilities[weapon][key].currentCooldown > 0) {
              newAbilities[weapon][key].currentCooldown -= 0.15;
            }
          });
        });
        return newAbilities;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);



  const handlePlayerDamage = (damage: number) => {
    setPlayerHealth(prevHealth => Math.max(0, prevHealth - damage));
  };

  const [killCount, setKillCount] = useState(0);

  // KILL COUNTER
  const handleEnemyDeath = useCallback(() => {
    setKillCount(prev => {
      const newCount = prev + 1;
      setMaxHealth(200 + newCount);
      setPlayerHealth(prev => prev + 1);
      return newCount;
    });
  }, []);


  // RESET
  const handleReset = () => {
    setMaxHealth(200);
    setPlayerHealth(200);
    setAbilities(prev => {
      const newAbilities = { ...prev };
      Object.keys(newAbilities).forEach(weapon => {
        ['q', 'e'].forEach(ability => {
          newAbilities[weapon as WeaponType][ability as 'q' | 'e'].currentCooldown = 0;
        });
      });
      return newAbilities;
    });
    setKillCount(0);
    setCurrentWeapon(null);  // FORCES WEAPON RESELECTION
  };

  // HEALTH CHANGE
  const handleHealthChange = useCallback((deltaHealth: number) => {
    setPlayerHealth(prevHealth => {
      const newHealth = Math.min(maxHealth, prevHealth + deltaHealth);
      return newHealth;
    });
  }, [maxHealth]);

  // sceneProps after handleReset
  const sceneProps: SceneProps = {
    bossActive: false,
    onAbilityUnlock: handleAbilityUnlock,
    onReset: handleReset,
    unitProps: {
      controlsRef,
      currentWeapon: currentWeapon || WeaponType.SCYTHE,
      onWeaponSelect: handleWeaponSelect,
      health: playerHealth,
      maxHealth: maxHealth,
      abilities,
      onAbilityUse: handleAbilityUse,
      onDamage: handlePlayerDamage,
      onEnemyDeath: handleEnemyDeath,
      onHealthChange: handleHealthChange,
      onHit: () => {},
      onPositionUpdate: () => {},
      enemyData: [],
      onFireballDamage: () => {},
      onSmiteDamage: () => {},
      isPlayer: true
    },
    killCount,
    onWeaponSelect: handleWeaponSelect,
    skeletonProps: [],
    onFireballDamage: () => {},
  };

  useEffect(() => {
    const preventSpaceScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventSpaceScroll);
    
    return () => {
      window.removeEventListener('keydown', preventSpaceScroll);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <GameWrapper
        sceneProps={sceneProps}
        currentWeapon={currentWeapon as WeaponType}
        onWeaponSelect={handleWeaponSelect}
        playerHealth={playerHealth}
        maxHealth={maxHealth}
        abilities={abilities}
        onReset={handleReset}
        killCount={killCount}
        onAbilityUnlock={handleAbilityUnlock}
        
      />
    </div>
  );
}