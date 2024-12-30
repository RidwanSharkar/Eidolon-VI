import { useRef, useState, useEffect, useCallback } from 'react';
import { Vector3, Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import Fireball from '../Spells/Fireball/Fireball';
import * as THREE from 'three';
import { WeaponType, WEAPON_DAMAGES } from '../Weapons/weapons';

import Scythe from '@/Weapons/Scythe';
import Sword from '@/Weapons/Sword';
import Sabres from '@/Weapons/Sabres';
import EtherealBow from '@/Weapons/EtherBow';

import Smite from '@/Spells/Smite/Smite';
import DamageNumber from '@/Interface/DamageNumber';
import Billboard from '@/Interface/Billboard';
import GhostTrail from '@/Unit/GhostTrail';
import BoneWings from '@/Unit/Gear/BoneWings';
import BoneAura from '@/Unit/Gear/BoneAura';
import BonePlate from '@/Unit/Gear/BonePlate';
import BoneTail from '@/Unit/Gear/BoneTail';
import BoneVortex from '@/Unit/Gear/BoneVortex';
import { UnitProps } from './UnitProps';
import { useUnitControls } from '@/Unit/useUnitControls';
import { calculateDamage } from '@/Weapons/damage';
import Boneclaw from '@/Spells/Boneclaw/Boneclaw';
import Blizzard from '@/Spells/Blizzard/Blizzard';
import { useAbilityKeys } from './useAbilityKeys';
import { useFirebeamManager } from '../Spells/Firebeam/useFirebeamManager';
import Firebeam from '../Spells/Firebeam/Firebeam';
import ChargedOrbitals, { ORBITAL_COOLDOWN } from '@/Unit/ChargedOrbitals';
import Reanimate, { ReanimateRef } from '../Spells/Reanimate/Reanimate';
import Oathstrike from '@/Spells/Oathstrike/Oathstrike';
import { useOathstrike } from '../Spells/Oathstrike/useOathstrike';
import CrusaderAura from '../Spells/CrusaderAura/CrusaderAura';


// refactor maybe
// ISOLATE BEFORE SPLITTING: SMITE- >FIREBALL -> , BOW 

//=====================================================================================================

//  ORBITAL CHARGES FIREBALL INTERFACE 
interface FireballData {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
}

//=====================================================================================================

// EXPORT UNIT
export default function Unit({
  onHit,
  controlsRef,
  currentWeapon,
  health,
  maxHealth,
  isPlayer = false,
  abilities,
  onAbilityUse,
  onPositionUpdate,
  enemyData,
  onHealthChange,
}: UnitProps) {
  const groupRef = useRef<Group>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [fireballs, setFireballs] = useState<FireballData[]>([]);
  const nextFireballId = useRef(0);
  const { camera } = useThree();
  const { keys: movementKeys } = useUnitControls({
    groupRef,
    controlsRef,
    camera: camera!,
    onPositionUpdate,
    health
  });

  // SMITE 
  const [isSmiting, setIsSmiting] = useState(false);
  const [smiteEffects, setSmiteEffects] = useState<{ id: number; position: Vector3 }[]>([]);
  const nextSmiteId = useRef(0);

  // DAMAGE NUMBERS 
  const [damageNumbers, setDamageNumbers] = useState<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isSmite?: boolean;
  }[]>([]);
  const nextDamageNumberId = useRef(0);
  const [hitCountThisSwing, setHitCountThisSwing] = useState<Record<string, number>>({});

  // BOW CHARGES 
  const [isBowCharging, setIsBowCharging] = useState(false);
  const [bowChargeProgress, setBowChargeProgress] = useState(0);
  const bowChargeStartTime = useRef<number | null>(null);
  const bowChargeLineOpacity = useRef(0);

  // PROJECTILES 
  const [activeProjectiles, setActiveProjectiles] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    power: number;
    startTime: number;
    maxDistance: number;
    startPosition: Vector3;
    hasCollided?: boolean;
  }>>([]);


  // FIREBALL ORBITAL CHARGES
  const [fireballCharges, setFireballCharges] = useState<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>([
    { id: 1, available: true, cooldownStartTime: null },
    { id: 2, available: true, cooldownStartTime: null },
    { id: 3, available: true, cooldownStartTime: null },
    { id: 4, available: true, cooldownStartTime: null },
    { id: 5, available: true, cooldownStartTime: null },
    { id: 6, available: true, cooldownStartTime: null },
    { id: 7, available: true, cooldownStartTime: null },
    { id: 8, available: true, cooldownStartTime: null }
  ]);
  const [collectedBones, ] = useState<number>(15); // LATER



  const pendingLightningTargets = useRef<Set<string>>(new Set()); 
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
  }>>([]);

  // Add to existing state declarations
  const [isOathstriking, setIsOathstriking] = useState(false);
  const [hasHealedThisSwing, setHasHealedThisSwing] = useState(false);

  // Add near other refs at top of component
  const crusaderAuraRef = useRef<{ processHealingChance: () => void }>(null);





  //=====================================================================================================

  // FIREBALL SHOOTING 
  const shootFireball = useCallback(() => {
    if (!groupRef.current) return;

    const availableChargeIndex = fireballCharges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) return;

    const unitPosition = groupRef.current.position.clone();
    unitPosition.y += 1;

    const direction = new Vector3(0, 0, 1);
    direction.applyQuaternion(groupRef.current.quaternion);

    setFireballCharges(prev => prev.map((charge, index) => 
      index === availableChargeIndex
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    setFireballs(prev => [...prev, {
      id: nextFireballId.current++,
      position: unitPosition.clone(),
      startPosition: unitPosition.clone(),
      direction: direction.normalize(),
      maxDistance: 35
    }]);
  }, [groupRef, fireballCharges]);

  const handleFireballImpact = (id: number) => {
    setFireballs(prev => prev.filter(fireball => fireball.id !== id));
  };

  //=====================================================================================================

  // SMITE LOGIC
  const handleWeaponHit = (targetId: string) => {
    if (!groupRef.current || !isSwinging) return;

    const now = Date.now();
    const lastHitTime = hitCountThisSwing[`${targetId}_time`] || 0;
    const hitCooldown = 240; // double attack detection
    
    if (now - lastHitTime < hitCooldown) return;

    const target = enemyData.find(e => e.id === targetId);
    if (!target) return;

    // store the hit time
    setHitCountThisSwing(prev => ({
      ...prev,
      [target.id]: (prev[target.id] || 0) + 1,
      [`${target.id}_time`]: now
    }));

    const isEnemy = target.id.startsWith('enemy');
    if (!isEnemy) return;

    const maxHits = isEnemy 
      ? (currentWeapon === WeaponType.SABRES  ? 2 : 1)
      : 1;
    const currentHits = hitCountThisSwing[target.id] || 0;

    if (currentHits >= maxHits) return;

    const distance = groupRef.current.position.distanceTo(target.position);
    const weaponRange = (currentWeapon === WeaponType.SABRES) ? 5.0 : 4.5;

    if (distance <= weaponRange) {
      // Add new angle check ONLY for Sabres
      if (currentWeapon === WeaponType.SABRES ) {
        const toTarget = new Vector3()
          .subVectors(target.position, groupRef.current.position)
          .normalize();
        const forward = new Vector3(0, 0, 1)
          .applyQuaternion(groupRef.current.quaternion);
        
        const angle = toTarget.angleTo(forward);
        // Restrict hit detection to a narrower arc (about 60 degrees total)
        if (Math.abs(angle) > Math.PI / 5) {
          return;
        }
      }
      let baseDamage = WEAPON_DAMAGES[currentWeapon].normal;
      
      // SMITE LOGIC
      if (isSmiting && currentWeapon === WeaponType.SWORD) {
        if (pendingLightningTargets.current.has(target.id) || isProcessingAbility) {
          return;
        }
        
        setIsProcessingAbility(true);
        
        // Initial hit
        baseDamage = 37;
        const { damage, isCritical } = calculateDamage(baseDamage);
        onHit(target.id, damage);
        
        // Revalidate target after initial hit
        const updatedTarget = enemyData.find(e => e.id === target.id);
        if (!updatedTarget || updatedTarget.health <= 0) {
          return;
        }

        // Show initial damage number
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: updatedTarget.position.clone(),
          isCritical
        }]);

        // Track pending lightning
        pendingLightningTargets.current.add(target.id);

        // Schedule lightning damage
        setTimeout(() => {
          // Final validation before lightning
          const finalTarget = enemyData.find(e => e.id === target.id);
          if (!finalTarget || 
              finalTarget.health <= 0 || 
              !pendingLightningTargets.current.has(target.id)) {
            pendingLightningTargets.current.delete(target.id);
            return;
          }

          // Apply lightning damage
          const { damage: lightningDamage, isCritical: lightningCrit } = calculateDamage(47);
          onHit(target.id, lightningDamage);

          // Show lightning damage number
          const afterLightningTarget = enemyData.find(e => e.id === target.id);
          if (afterLightningTarget && afterLightningTarget.health > 0) {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: lightningDamage,
              position: afterLightningTarget.position.clone(),
              isCritical: lightningCrit,
              isLightning: true
            }]);
          }

          pendingLightningTargets.current.delete(target.id);
        }, 200);
        setTimeout(() => {
          setIsProcessingAbility(false);
        }, 250); // Slightly longer than  lightning delay

        return;
      }

      //=====================================================================================================

      // NORMAL WEAPON HIT HANDLING
      const { damage, isCritical } = calculateDamage(baseDamage);
      onHit(target.id, damage); 

      // Calculate target's health after damage
      const targetAfterDamage = target.health - damage;

      // Add Crusader Aura healing check for Sword Q
      if (currentWeapon === WeaponType.SWORD && 
          abilities[WeaponType.SWORD].passive.isUnlocked && 
          !isSmiting && !isOathstriking && 
          !hasHealedThisSwing &&
          targetAfterDamage > 0) {  // Only trigger healing if target is still alive
        crusaderAuraRef.current?.processHealingChance();
        setHasHealedThisSwing(true);
      }

      // Only display damage number if target is still alive
      if (targetAfterDamage > 0) {
        // Special handling for Sabres to offset damage numbers
        if (currentWeapon === WeaponType.SABRES) {
          const offset = currentHits === 0 ? -0.4 : 0.4;
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: new Vector3(
              target.position.x + offset,
              target.position.y,
              target.position.z
            ),
            isCritical
          }]);
        } else {
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: target.position.clone(),
            isCritical
          }]);
        }
      }

      return;
    }

    return;
  };

  const handleSwingComplete = () => {
    setIsSwinging(false);
    setHitCountThisSwing({});
    setIsSmiting(false); // Reset smiting after swing
    setHasHealedThisSwing(false);
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isSwinging && groupRef.current) {
      // Handle hits for enemy units
      enemyData.forEach(enemy => {
        handleWeaponHit(enemy.id);
      });
    }

    //=====================================================================================================

    // SABRE BOW CHARGING 
    if (isBowCharging && bowChargeStartTime.current !== null) {
      const chargeTime = (Date.now() - bowChargeStartTime.current) / 1000;
      const progress = Math.min(chargeTime / 1.75, 1); // 2 seconds for full charge
      setBowChargeProgress(progress);

      // Smooth charge line opacity using delta
      const targetOpacity = progress;
      const currentOpacity = bowChargeLineOpacity.current;
      bowChargeLineOpacity.current += (targetOpacity - currentOpacity) * delta * 15;

      if (progress >= 1) {
        releaseBowShot(1);
      }
    }

    // Update projectiles with piercing behavior
    setActiveProjectiles(prev => prev.map(projectile => {
      // Calculate distance traveled
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      
      if (distanceTraveled < projectile.maxDistance) {
        const speed = 0.5;
        projectile.position.add(
          projectile.direction
            .clone()
            .multiplyScalar(speed)
        );

        // Check for collisions with enemies but don't remove projectile
        enemyData.forEach(enemy => {
          const projectilePos2D = new Vector3(
            projectile.position.x,
            0,
            projectile.position.z
          );
          const enemyPos2D = new Vector3(
            enemy.position.x,
            0,
            enemy.position.z
          );
          const distanceToEnemy = projectilePos2D.distanceTo(enemyPos2D);
          
          if (distanceToEnemy < 1.4) { // Hit radius
            handleProjectileHit(projectile.id, enemy.id, projectile.power, projectile.position);
          }
        });
        
        return projectile;
      }
      return projectile;
    }).filter(projectile => {
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      return distanceTraveled < projectile.maxDistance; // Only remove when max distance reached
    }));

    //=====================================================================================================

    // FIREBALLS 
    setFireballs(prev => prev.map(fireball => {
      const distanceTraveled = fireball.position.distanceTo(fireball.startPosition);
      
      if (distanceTraveled < fireball.maxDistance) {
        const speed = 0.5;
        fireball.position.add(
          fireball.direction
            .clone()
            .multiplyScalar(speed)
        );
    
        // Check enemy collisions - only with living enemies
        for (const enemy of enemyData) {
          if (enemy.health <= 0) continue; // Skip dead enemies
          
          const enemyPos = enemy.position.clone();
          enemyPos.y = 1.5;
          if (fireball.position.distanceTo(enemyPos) < 1.5) {
            handleFireballHit(fireball.id, enemy.id);
            return null;
          }
        }
    
        return fireball;
      }
      return fireball;
    }).filter(Boolean) as FireballData[]);

    // Update fireball charge cooldowns
    setFireballCharges(prev => prev.map(charge => {
      if (!charge.available && charge.cooldownStartTime) {
        const elapsedTime = Date.now() - charge.cooldownStartTime;
        if (elapsedTime >= ORBITAL_COOLDOWN) {
          return { ...charge, available: true, cooldownStartTime: null };
        }
      }
      return charge;
    }));
  });

  //=====================================================================================================

  // SABRE BOW SHOT 
    const [isProcessingAbility, setIsProcessingAbility] = useState(false);
    const [lastBowShotTime, setLastBowShotTime] = useState<number>(0);

  const releaseBowShot = useCallback((power: number) => {
    if (!groupRef.current) return;
    
    const now = Date.now();
    const timeSinceLastShot = now - lastBowShotTime;
    if (timeSinceLastShot < 500) { // 250ms cooldown between shots
        return;
    }
    setLastBowShotTime(now);
    
    const unitPosition = groupRef.current.position.clone();
    unitPosition.y += 1;

    const direction = new Vector3(0, 0, 1);
    direction.applyQuaternion(groupRef.current.quaternion);

    const maxRange = 80;
    const rayStart = unitPosition.clone();

    // Add projectile with max range limit
    setActiveProjectiles(prev => [...prev, {
        id: Date.now(),
        position: rayStart.clone(),
        direction: direction.clone(),
        power,
        startTime: Date.now(),
        maxDistance: maxRange,
        startPosition: rayStart.clone()
    }]);

    setIsBowCharging(false);
    setBowChargeProgress(0);
    bowChargeStartTime.current = null;
    onAbilityUse(currentWeapon, 'e');
}, [currentWeapon, groupRef, setActiveProjectiles, onAbilityUse, lastBowShotTime]);

  //=====================================================================================================

  // FIREBEAM 
  const {  startFirebeam, stopFirebeam } = useFirebeamManager({
    parentRef: groupRef,
    onHit,
    enemyData,
    setActiveEffects,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    setDamageNumbers,
    nextDamageNumberId
  });

  //=====================================================================================================

  // ABILITY KEYS 
  const reanimateRef = useRef<ReanimateRef>(null);

  const handleHealthChange = useCallback((healAmount: number) => {
    if (onHealthChange) {
      // Pass the delta amount directly
      onHealthChange(healAmount);
    }
  }, [onHealthChange]);

  const { activateOathstrike } = useOathstrike({
    parentRef: groupRef,
    onHit,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    enemyData,
    onHealthChange: handleHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    currentHealth: health,
    maxHealth: maxHealth
  });

  useAbilityKeys({
    keys: movementKeys,
    groupRef,
    currentWeapon,
    abilities,
    isSwinging,
    isSmiting,
    isBowCharging,
    bowChargeProgress,
    nextSmiteId,
    setIsSwinging,
    setIsSmiting,
    setIsBowCharging,
    setBowChargeStartTime: (value) => { bowChargeStartTime.current = value; },
    setSmiteEffects,
    setActiveEffects,
    onAbilityUse,
    shootFireball,
    releaseBowShot,
    startFirebeam,
    stopFirebeam,
    castReanimate: () => {
      reanimateRef.current?.castReanimate();
    },
    reanimateRef,
    health,
    maxHealth,
    onHealthChange,
    activateOathstrike,
    setIsOathstriking,
  });

  //=====================================================================================================

  // SMITE COMPLETE 
  const handleSmiteComplete = () => {
    setIsSmiting(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };

  const handleSmiteEffectComplete = (id: number) => {
    setSmiteEffects(prev => prev.filter(effect => effect.id !== id));
  };

  //=====================================================================================================

  // DAMAGE NUMBERS COMPLETE 
  const handleDamageNumberComplete = (id: number) => {
    setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
  };

  //=====================================================================================================

  // SABRE DOUBLE HIT
  useEffect(() => {
    if (currentWeapon === WeaponType.SABRES ) {
      setHitCountThisSwing({});
    }
  }, [currentWeapon]);

  //=====================================================================================================

  //BOW PROJECTILE HIT 
  const handleProjectileHit = (projectileId: number, targetId: string, power: number, projectilePosition: Vector3) => {
    const isEnemy = targetId.startsWith('enemy');
    if (!isEnemy) return;

    const enemy = enemyData.find(e => e.id === targetId);
    if (!enemy) return;

    // Skip if projectile has already hit this target
    const hitKey = `${projectileId}_${targetId}`;
    if (hitCountThisSwing[hitKey]) {
        return;
    }

    // Create 2D positions by ignoring Y axis
    const projectilePos2D = new Vector3(
      projectilePosition.x,
      0,
      projectilePosition.z
    );
    const enemyPos2D = new Vector3(
      enemy.position.x,
      0,
      enemy.position.z
    );

    // Check distance in 2D space (ignoring Y axis)
    const distanceToEnemy = projectilePos2D.distanceTo(enemyPos2D);
    if (distanceToEnemy > 1.4) return; // Hit radius check in 2D

    // Mark this specific projectile-target combination as hit
    setHitCountThisSwing(prev => ({
        ...prev,
        [hitKey]: 1
    }));

    const baseDamage = 10;
    const maxDamage = 87;
    const scaledDamage = Math.floor(baseDamage + (maxDamage - baseDamage) * (power * power));
    const fullChargeDamage = power >= 0.99 ? 20 : 0;
    const finalDamage = scaledDamage + fullChargeDamage;
    
    onHit(targetId, finalDamage);

    const targetAfterDamage = enemy.health - finalDamage;
    if (targetAfterDamage > 0) {
        setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: finalDamage,
            position: enemy.position.clone(),
            isCritical: power >= 0.99
        }]);
    }
  };

  //=====================================================================================================

  // FIREBALL HIT 
  const handleFireballHit = (fireballId: number, targetId: string) => {
    const isEnemy = targetId.startsWith('enemy');
    if (!isEnemy) return;

    const enemy = enemyData.find(e => e.id === targetId);
    if (!enemy) return;

    const { damage, isCritical } = calculateDamage(53); // Fixed fireball damage
    
    onHit(targetId, damage);

    // Check if target is still alive before adding damage number
    const targetAfterDamage = enemy.health - damage;
    if (targetAfterDamage > 0) {
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: enemy.position.clone(),
        isCritical
      }]);
    }

    // Remove the fireball
    handleFireballImpact(fireballId);
  };

  //=====================================================================================================

  // POSITION UPDATE 
  useFrame(() => {
    if (groupRef.current) {
      const position = groupRef.current.position.clone();
      onPositionUpdate(position);
    }
  });

  //=====================================================================================================

  // Add new handler (near other handle*Complete functions)
  const handleOathstrikeComplete = () => {
    setIsOathstriking(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };

  return (
    <>
      <group ref={groupRef} position={[0, 1, 0]}>
        {/* HEAD - core sphere with striped pattern */}

        
        {/* Enhanced outer glow */}
        <mesh scale={1.1}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshBasicMaterial
            color="#EAC4D5"
            transparent
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>

        {/* Skull decoration - made smaller and more ethereal */}
        <mesh position={[0, 0.2, 0.25]} scale={0.35}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshPhongMaterial
            color="#EAC4D5"
            transparent
            opacity={0.3}
            emissive="#EAC4D5"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Add Bone Wings with proper position/rotation vectors */}
        <group position={[0, 0.2, -0.2]}>
          {/* Left Wing */}
          <group rotation={[0, Math.PI / 5.5, 0]}>
            <BoneWings 
              collectedBones={collectedBones} 
              isLeftWing={true}
              parentRef={groupRef} 
            />
          </group>
          
          {/* Right Wing */}
          <group rotation={[0, -Math.PI / 5.5, 0]}>
            <BoneWings 
              collectedBones={collectedBones} 
              isLeftWing={false}
              parentRef={groupRef} 
            />
          </group>
        </group>

        <ChargedOrbitals 
          parentRef={groupRef} 
          charges={fireballCharges}
          weaponType={currentWeapon}
        />
      <group scale={[1 , 0.85, 1]} position={[0, 0, -0.1]}>
        <BonePlate />
      </group>
        <BoneTail />
        
        {currentWeapon === WeaponType.SABRES ? (
          <Sabres 
            isSwinging={isSwinging} 
            onSwingComplete={handleSwingComplete}
            onLeftSwingStart={() => {}}
            onRightSwingStart={() => {}}
            isBowCharging={isBowCharging}
          />
        ) : currentWeapon === WeaponType.SCYTHE ? (
          <Scythe 
            parentRef={groupRef}
            isSwinging={isSwinging} 
            onSwingComplete={handleSwingComplete} 
          />
        ) : (
          <Sword
            isSwinging={isSwinging}
            isSmiting={isSmiting}
            isOathstriking={isOathstriking}
            onSwingComplete={handleSwingComplete}
            onSmiteComplete={handleSmiteComplete}
            onOathstrikeComplete={handleOathstrikeComplete}
          />
        )}

        {/* Enemy HP Bar */}
        {!isPlayer && (
          <Billboard
            position={[0, 2, 0]}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <mesh>
              <planeGeometry args={[1, 0.1]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            <mesh position={[0.5 + (health / maxHealth) * 0.5, 0, 0.001]}>
              <planeGeometry args={[(health / maxHealth), 0.08]} />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* Add ghost trail effect */}
      <GhostTrail parentRef={groupRef} weaponType={currentWeapon} />

      {/* Fireballs  */}
      {fireballs.map(fireball => (
        <Fireball
          key={fireball.id}
          position={fireball.position}
          direction={fireball.direction}
          onImpact={() => handleFireballImpact(fireball.id)}
        />
      ))}

      {smiteEffects.map(effect => (
        <Smite
          key={effect.id}
          weaponType={currentWeapon}
          position={effect.position}
          onComplete={() => handleSmiteEffectComplete(effect.id)}
        />
      ))}

      {damageNumbers.map(dn => (
        <DamageNumber
          key={dn.id}
          damage={dn.damage}
          position={dn.position}
          isCritical={dn.isCritical}
          isLightning={dn.isLightning}
          onComplete={() => handleDamageNumberComplete(dn.id)}
        />
      ))}

      {(currentWeapon === WeaponType.SABRES) && isBowCharging && (
        <EtherealBow
          position={groupRef.current?.position.clone().add(new Vector3(0, 1.5  , 0)) || new Vector3()}
          direction={new Vector3(0, 0, 1).applyQuaternion(groupRef.current?.quaternion || new THREE.Quaternion())}
          chargeProgress={bowChargeProgress}
          isCharging={isBowCharging}
          onRelease={releaseBowShot}
        />
      )}

      {activeProjectiles.map(projectile => (
        <group key={projectile.id}>
          <group
            position={projectile.position.toArray()}
            rotation={[
              0,
              Math.atan2(projectile.direction.x, projectile.direction.z),
              0
            ]}
          >
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.1, 1.2, 8]} />
              <meshStandardMaterial
                color="#00ffff"
                emissive="#00ffff"
                emissiveIntensity={2.5}
                transparent
                opacity={0.9}
              />
            </mesh>

            <mesh rotation={[Math.PI/2, 0, 0]}>
              <sphereGeometry args={[0.00025, 16, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={8}
                transparent
                opacity={0.7}
              />
            </mesh>


            {[...Array(6)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin(Date.now() * 0.01 + i) * 0.2,
                  Math.cos(Date.now() * 0.01 + i) * 0.2,
                  -i * 0.3
                ]}
              >
                <sphereGeometry args={[0.05 - i * 0.03, 8, 8]} />
                <meshStandardMaterial
                  color="#00ffff"
                  emissive="#00ffff"
                  emissiveIntensity={4}
                  transparent
                  opacity={0.5 - i * 0.1}
                />
              </mesh>
            ))}

            {[...Array(3)].map((_, i) => (
              <mesh
                key={`ring-${i}`}
                position={[0, 0, -i * 0.45-0.5]}
                rotation={[Math.PI , 0, Date.now() * 0.003 + i * Math.PI / 3]}
              >
                <torusGeometry args={[0.2 + i * 0.1, 0.05, 8, 16]} />
                <meshStandardMaterial
                  color="#00ffff"
                  emissive="#00ffff"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.4 - i * 0.1}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            <pointLight 
              color="#00ffff" 
              intensity={4} 
              distance={5}
              decay={2}
            />

            <pointLight
              color="#80ffff"
              intensity={2}
              distance={8}
              decay={1}
            />
          </group>

          {projectile.power >= 1 && 
           projectile.position.distanceTo(projectile.startPosition) < projectile.maxDistance && 
           !projectile.hasCollided && (
            <group
              position={projectile.position.toArray()}
              rotation={[
                0,
                Math.atan2(projectile.direction.x, projectile.direction.z),
                0
              ]}
            >
              {/* Large power shot arrow */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.475, 1.25, 8]} /> {/* Doubled size */}
                <meshStandardMaterial
                  color="#00ffff"
                  emissive="#00ffff"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={0.8}
                />
              </mesh>

              <mesh rotation={[Math.PI/2, 0, 0]}>
                <sphereGeometry args={[0.0005, 16, 16]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={0.5}
                />
              </mesh>

              {[...Array(10)].map((_, i) => {
                const opacity = 1 - (i * 0.04);
                const offset = -i * 0.4 -0.42;
                
                return (
                  <group 
                    key={`power-trail-${i}`}
                    position={[0, 0, offset]}
                  >
                    <mesh>
                      <torusGeometry args={[0.05, 0.025, 3, 16]} />
                      <meshStandardMaterial
                        color="#00ffff"
                        emissive="#00ffff"
                        emissiveIntensity={3}
                        transparent
                        opacity={opacity}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>

                    <mesh>
                      <torusGeometry args={[0.17, 0.15, 6, 4]} />
                      <meshStandardMaterial
                        color="#ffffff"
                        emissive="#80ffff"
                        emissiveIntensity={3}
                        transparent
                        opacity={opacity * 0.5}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              <pointLight
                color="#00ffff"
                intensity={2}
                distance={2}
                decay={2}
              />
            </group>
          )}
        </group>
      ))}

      <BoneVortex parentRef={groupRef} weaponType={currentWeapon} />
      <BoneAura parentRef={groupRef} />

      {activeEffects.map(effect => {
        if (effect.type === 'boneclaw') {
          return (
            <Boneclaw
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              parentRef={groupRef}
              enemyData={enemyData}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              onHitTarget={(targetId, damage, isCritical, position, isBoneclaw) => {
                onHit(targetId, damage);
                setDamageNumbers(prev => [...prev, {
                  id: nextDamageNumberId.current++,
                  damage,
                  position: position.clone(),
                  isCritical,
                  isBoneclaw
                }]);
              }}
            />
          );
        } else if (effect.type === 'blizzard') {
          return (
            <Blizzard
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              parentRef={groupRef}
              onHitTarget={(targetId, damage, isCritical, position, isBlizzard) => {
                onHit(targetId, damage);
                setDamageNumbers(prev => [...prev, {
                  id: nextDamageNumberId.current++,
                  damage,
                  position: position.clone(),
                  isCritical,
                  isBlizzard
                }]);
              }}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'firebeam') {
          return (
            <Firebeam
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'oathstrike') {
          return (
            <Oathstrike
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              parentRef={groupRef}
            />
          );
        }
        return null;
      })}

      <Reanimate
        ref={reanimateRef}
        parentRef={groupRef}
        onHealthChange={handleHealthChange}
        charges={fireballCharges}
        setCharges={setFireballCharges}
        setDamageNumbers={setDamageNumbers}
        nextDamageNumberId={nextDamageNumberId}
        currentHealth={health}
        maxHealth={maxHealth}
      />

      {currentWeapon === WeaponType.SWORD && 
       abilities[WeaponType.SWORD].passive.isUnlocked && (
        <CrusaderAura 
          ref={crusaderAuraRef}
          parentRef={groupRef} 
          onHealthChange={handleHealthChange}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          currentHealth={health}
          maxHealth={maxHealth}
        />
      )}
    </>
  );
}