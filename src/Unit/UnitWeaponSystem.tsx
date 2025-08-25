import React, { useCallback } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { WeaponType, WeaponSubclass, WeaponInfo } from '../Weapons/weapons';
import { DamageNumber } from './useDamageNumbers';

// Weapon components
import Scythe from '@/Weapons/Scythe';
import Sword from '@/Weapons/Sword';
import Shield from '@/Weapons/Shield';
import Sabres from '@/Weapons/Sabres';
import EtherealBow from '@/Weapons/EtherBow';
import Spear from '@/Weapons/Spear';
import HolyNova from '@/color/HolyNova';

interface UnitWeaponSystemProps {
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  abilities: WeaponInfo;
  level: number;
  
  // Animation states
  isSwinging: boolean;
  isBowCharging: boolean;
  bowChargeProgress: number;
  bowGroundEffectProgress: number;
  bowChargeLineOpacity: React.MutableRefObject<number>;
  isPerfectShotWindow: boolean;
  isAbilityBowAnimation: boolean;
  swordComboStep: 1 | 2 | 3;
  icicleComboStep: 1 | 2 | 3;
  isWhirlwinding: boolean;
  isPyroclastActive: boolean;
  pyroclastChargeProgress: React.MutableRefObject<number>;
  isThrowSpearCharging: boolean;
  throwSpearChargeProgress: number;
  isSpearThrown: boolean;
  isFirebeaming: boolean;
  isBreaching: boolean;
  
  // Ability states
  isSmiting: boolean;
  isOathstriking: boolean;
  isDivineStorming: boolean;
  isColossusStriking: boolean;
  
  // Shield state
  shieldState: {
    isActive: boolean;
    isRecharging: boolean;
    rechargeProgress: number;
  };
  
  // Legion empowerment
  legionEmpowerment: {
    isEmpowered: boolean;
  };
  
  // Instant powershot for Venom Bow
  hasInstantPowershot: boolean;
  
  // Enemy data for weapon hit detection
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
    isDying?: boolean;
  }>;
  
  // Charges
  fireballCharges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  
  // Callback functions
  onSwingComplete: () => void;
  onSmiteComplete: () => void;
  onOathstrikeComplete: () => void;
  onDivineStormComplete: () => void;
  onColossusStrikeComplete: () => void;
  releaseBowShot: (progress: number, isPerfectShot?: boolean) => void;
  onHit: (targetId: string, damage: number) => void;
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumber[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  setActiveEffects: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>>>;
}

const UnitWeaponSystem = React.memo<UnitWeaponSystemProps>(({
  groupRef,
  currentWeapon,
  currentSubclass,
  abilities,
  level,
  isSwinging,
  isBowCharging,
  bowChargeProgress,
  // bowGroundEffectProgress - unused in weapon system
  // bowChargeLineOpacity - unused in weapon system  
  // isPerfectShotWindow - unused in weapon system
  isAbilityBowAnimation,
  swordComboStep,
  // icicleComboStep - unused in weapon system
  isWhirlwinding,
  // isPyroclastActive - unused in weapon system
  // pyroclastChargeProgress - unused in weapon system
  isThrowSpearCharging,
  throwSpearChargeProgress,
  isSpearThrown,
  isFirebeaming,
  // isBreaching - unused in weapon system
  isSmiting,
  isOathstriking,
  isDivineStorming,
  isColossusStriking,
  shieldState,
  legionEmpowerment,
  hasInstantPowershot,
  enemyData,
  fireballCharges,
  onSwingComplete,
  onSmiteComplete,
  onOathstrikeComplete,
  onDivineStormComplete,
  onColossusStrikeComplete,
  releaseBowShot,
  onHit,
  setDamageNumbers,
  nextDamageNumberId,
  setActiveEffects
}) => {
  
  // Render the appropriate weapon based on current weapon type
  const renderWeapon = useCallback(() => {
    switch (currentWeapon) {
      case WeaponType.SABRES:
        return (
          <Sabres
            isSwinging={isSwinging}
            onSwingComplete={onSwingComplete}
            onLeftSwingStart={() => {}}
            onRightSwingStart={() => {}}
            isBowCharging={isBowCharging}
            isFirebeaming={isFirebeaming}
            hasActiveAbility={abilities[WeaponType.SABRES].active.isUnlocked}
          />
        );
        
      case WeaponType.SCYTHE:
        return (
          <Scythe 
            parentRef={groupRef}
            isSwinging={isSwinging} 
            onSwingComplete={onSwingComplete}
            currentSubclass={currentSubclass}
            level={level}
            onLeftSwingStart={() => {}}
            onRightSwingStart={() => {}}
            isEmpowered={currentSubclass === WeaponSubclass.ABYSSAL && legionEmpowerment.isEmpowered}
          />
        );
        
      case WeaponType.SPEAR:
        return (
          <Spear
            isSwinging={isSwinging}
            onSwingComplete={onSwingComplete}
            enemyData={enemyData}
            onHit={(targetId: string, damage: number) => {
              onHit(targetId, damage);
            }}
            setDamageNumbers={setDamageNumbers}
            nextDamageNumberId={nextDamageNumberId}
            isWhirlwinding={isWhirlwinding}
            fireballCharges={fireballCharges}
            currentSubclass={currentSubclass}
            isThrowSpearCharging={isThrowSpearCharging}
            throwSpearChargeProgress={throwSpearChargeProgress}
            isSpearThrown={isSpearThrown}
            // Concussive Blow now handled directly in Unit.tsx hit detection
          />
        );
        
      case WeaponType.BOW:
        return (
          <group position={[0, 0.1, 0.3]}>
            <EtherealBow
              position={new Vector3()}
              direction={new Vector3(0, 0, 1).applyQuaternion(groupRef.current?.quaternion || new THREE.Quaternion())}
              chargeProgress={bowChargeProgress}
              isCharging={isBowCharging || isAbilityBowAnimation}
              onRelease={releaseBowShot}
              currentSubclass={currentSubclass}
              hasInstantPowershot={hasInstantPowershot}
              isAbilityBowAnimation={isAbilityBowAnimation}
            />
          </group>
        );
        
      case WeaponType.SWORD:
      default:
        return (
          <>
            <Sword
              isSwinging={isSwinging}
              isSmiting={isSmiting}
              isOathstriking={isOathstriking}
              isDivineStorming={isDivineStorming}
              isColossusStriking={isColossusStriking}
              onSwingComplete={onSwingComplete}
              onSmiteComplete={onSmiteComplete}
              onOathstrikeComplete={onOathstrikeComplete}
              onDivineStormComplete={onDivineStormComplete}
              onColossusStrikeComplete={onColossusStrikeComplete}
              hasChainLightning={currentSubclass === WeaponSubclass.VENGEANCE}
              comboStep={swordComboStep}
              currentSubclass={currentSubclass}
              enemyData={enemyData}
              onHit={onHit}
              setDamageNumbers={setDamageNumbers}
              nextDamageNumberId={nextDamageNumberId}
              setActiveEffects={setActiveEffects}
              playerPosition={groupRef.current?.position}
            />
            {/* Shield for Divinity subclass */}
            {currentSubclass === WeaponSubclass.DIVINITY && (
              <>
                <Shield 
                  isShieldActive={shieldState.isActive}
                  isRecharging={shieldState.isRecharging}
                  rechargeProgress={shieldState.rechargeProgress}
                />
                {/* Holy Nova effect when Divine Shield is active */}
                <HolyNova
                  position={new Vector3(0, 0, 0)}
                  isActive={shieldState.isActive && !shieldState.isRecharging}
                  intensity={1.0}
                />
              </>
            )}
          </>
        );
    }
  }, [
    currentWeapon,
    currentSubclass,
    abilities,
    level,
    isSwinging,
    isBowCharging,
    bowChargeProgress,
    isAbilityBowAnimation,
    swordComboStep,
    isWhirlwinding,
    isThrowSpearCharging,
    throwSpearChargeProgress,
    isSpearThrown,
    isFirebeaming,
    isSmiting,
    isOathstriking,
    isDivineStorming,
    isColossusStriking,
    shieldState,
    legionEmpowerment,
    hasInstantPowershot,
    enemyData,
    fireballCharges,
    onSwingComplete,
    onSmiteComplete,
    onOathstrikeComplete,
    onDivineStormComplete,
    onColossusStrikeComplete,
    releaseBowShot,
    onHit,
    setDamageNumbers,
    nextDamageNumberId,
    setActiveEffects,
    groupRef
  ]);

  return <>{renderWeapon()}</>;
});

UnitWeaponSystem.displayName = 'UnitWeaponSystem';

export default UnitWeaponSystem;