import React, { useMemo } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { WeaponType, WeaponSubclass, WeaponInfo, AbilityType } from '../Weapons/weapons';

// Visual effect components
import GhostTrail from '@/color/GhostTrail';
import BoneVortex from '@/color/BoneVortex';
import BoneAura from '@/color/BoneAura';
import ChargedOrbitals from '@/color/ChargedOrbitals';
import IcicleOrbitals, { IcicleCharge } from '@/Spells/Firebeam/IcicleOrbitals';
import StealthMistEffect from '@/Spells/Stealth/StealthMistEffect';
import { IncinerateEmpowerment } from '@/color/IncinerateEmpowerment';

// Spell effect components
import Fireball from '@/Spells/Fireball/Fireball';
import CrossentropyBolt from '@/Spells/Fireball/CrossentropyBolt';
import Smite from '@/Spells/Smite/Smite';
import DamageNumber from '@/Interface/DamageNumber';
import Boneclaw from '@/Spells/Boneclaw/Boneclaw';

// Types
import { DamageNumber as DamageNumberType } from './useDamageNumbers';
import { VaultDirection } from '@/Spells/Vault/UnifiedVault';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';
import { calculateDragonBreathHits } from '@/Spells/DragonBreath/DragonBreathDamage';
import DragonBreath from '@/Spells/DragonBreath/DragonBreath';
import DivineStorm from '@/Spells/DivineStorm/DivineStorm';
import ColossusStrikeLightning from '@/Spells/BowLightning/ColossusStrikeLightning';
import { FrenzyAuraRef } from '@/Spells/FrenzyAura/FrenzyAura';
import { ReanimateRef } from '@/Spells/Reanimate/Reanimate';
import { ReigniteRef } from '@/Spells/Reignite/Reignite';
import { SoulReaperRef } from '@/Spells/SoulReaper/SoulReaper';
import GlacialShard, { GlacialShardRef } from '@/Spells/GlacialShard/GlacialShard';
import Firebeam from '@/Spells/Firebeam/Firebeam';
import ElementalTrail from '@/Spells/Summon/ElementalTrail';
import { useEffect, useRef } from 'react';
// EagleEyeManagerRef interface
interface EagleEyeManagerRef {
  createEagleEyeEffect: (position: Vector3) => void;
}

// IcicleProjectileWithTrail component
interface IcicleProjectileWithTrailProps {
  projectile: {
    id: number;
    position: Vector3;
    direction: Vector3;
    opacity: number;
  };
}

function IcicleProjectileWithTrail({ projectile }: IcicleProjectileWithTrailProps) {
  const projectileRef = useRef<THREE.Group>(null);

  // Update position when projectile position changes
  useEffect(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(projectile.position);
    }
  }, [projectile.position]);

  return (
    <group>
      {/* Icicle trail effect - smaller than elemental */}
      <ElementalTrail
        color={new THREE.Color("#CCFFFF")}
        size={0.2} // Smaller than elemental (0.35)
        meshRef={projectileRef}
        opacity={projectile.opacity * 0.8}
      />
      
      <group 
        ref={projectileRef}
        position={projectile.position.toArray()}
        rotation={[
          0, // No X rotation
          Math.atan2(projectile.direction.x, projectile.direction.z), // Yaw rotation to point towards target
          0  // No Z rotation
        ]}
      >
        {/* Main icicle body - rotated to point forward like ElementalProjectile */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <coneGeometry args={[0.08, 0.4, 6]} />
          <meshStandardMaterial
            color="#AAEEFF"
            emissive="#AAEEFF"
            emissiveIntensity={0.8}
            transparent
            opacity={projectile.opacity}
          />
        </mesh>
        
        {/* Subtle glow effect */}
        <pointLight 
          color="#CCFFFF"
          intensity={0.5 * projectile.opacity}
          distance={2}
          decay={2}
        />
      </group>
    </group>
  );
}

// Interfaces
interface ActiveEffect {
  id: number;
  type: string;
  position: Vector3;
  direction: Vector3;
  duration?: number;
  startTime?: number;
  parentRef?: React.RefObject<Group>;
  enemyId?: string;
  targetPosition?: Vector3;
  targetId?: string;
}

interface FireballData {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  isCrossentropyBolt?: boolean;
}

interface PooledProjectile {
  id: number;
  position: Vector3;
  direction: Vector3;
  power: number;
  startTime: number;
  maxDistance: number;
  startPosition: Vector3;
  hasCollided?: boolean;
  isFullyCharged?: boolean;
  hitEnemies?: Set<string>;
  opacity?: number;
  fadeStartTime?: number | null;
  isPerfectShot?: boolean;
}

interface UnitEffectsSystemProps {
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  abilities: WeaponInfo;
  level: number;
  health: number;
  maxHealth: number;
  isPlayer: boolean;
  
  // Visual state
  isStealthed: boolean;
  isIncinerateEmpowered: boolean;
  collectedBones: number;
  movementDirection: Vector3;
  
  // Effects data
  activeEffects: ActiveEffect[];
  setActiveEffects: React.Dispatch<React.SetStateAction<ActiveEffect[]>>;
  damageNumbers: DamageNumberType[];
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumberType[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  fireballs: FireballData[];
  activeProjectiles: PooledProjectile[];
  
  // Refs for external access
  frenzyAuraRef: React.RefObject<FrenzyAuraRef>;
  reanimateRef: React.RefObject<ReanimateRef>;
  reigniteRef: React.RefObject<ReigniteRef>;
  soulReaperRef: React.RefObject<SoulReaperRef>;
  glacialShardRef: React.RefObject<GlacialShardRef>;
  eagleEyeManagerRef: React.RefObject<EagleEyeManagerRef>;
  
  // Boneclaw effects
  boneclawActiveEffects?: Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
  }>;
  removeBoneclawEffect?: (id: string) => void;
  
  // Charges and orbitals
  fireballCharges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  icicleCharges: Array<IcicleCharge>;
  
  // Animation states
  isFirebeaming: boolean;
  firebeamStartTime: React.MutableRefObject<number | null>;
  isBreaching: boolean;
  isThrowSpearCharging: boolean;
  throwSpearChargeProgress: number;
  isSpearThrown: boolean;
  icicleComboStep: 1 | 2 | 3;
  
  // Callback functions
  onHit: (targetId: string, damage: number) => void;
  onHealthChange?: (health: number) => void;
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  handleFireballImpact: (id: number, impactPosition?: Vector3) => void;
  handleDamageNumberComplete: (id: number) => void;
  handleSmiteEffectComplete: (id: number) => void;
  handleColossusLightningComplete: (id: number) => void;
  handleIcicleComboComplete: () => void;
  onFreezeStateCheck?: (targetId: string) => boolean;
  onApplySlowEffect?: (enemyId: string, duration?: number) => void;
  onApplyKnockbackEffect?: (targetId: string, direction: Vector3, force: number) => void;
  
  // Enemy data
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
    isDying?: boolean;
  }>;
  
  // Summoned units
  summonedUnitsData: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
    type: 'skeleton' | 'elemental' | 'abyssal-abomination';
    ownerId?: string;
  }>;
  
  // Additional effect states
  smiteEffects: Array<{ id: number; position: Vector3 }>;
  colossusLightningEffects: Array<{ id: number; position: Vector3 }>;
  abyssalSlashEffects: Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    damage: number;
  }>;
  playerStunEffects: Array<{
    id: string;
    position: Vector3;
    duration: number;
    startTime: number;
  }>;
  
  // Active vault state
  activeVault: { isActive: boolean; direction: VaultDirection | null };
  
  // Dragon Breath processing
  dragonBreathDamageApplied: React.MutableRefObject<Set<number>>;
  processDragonBreathKill: () => void;
  
  // Multiplayer
  isInRoom: boolean;
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  
  // Projectile management functions
  getBarrageProjectiles?: () => Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    opacity?: number;
  }>;
  getIcicleProjectilesRef?: React.MutableRefObject<(() => Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    opacity: number;
  }>) | null>;
}

const UnitEffectsSystem = React.memo<UnitEffectsSystemProps>(({
  groupRef,
  currentWeapon,
  currentSubclass,
  abilities,
  level,
  // health, // TODO: Use for health-based effects
  // maxHealth, // TODO: Use for health-based effects
  isPlayer,
  isStealthed,
  isIncinerateEmpowered,
  // collectedBones, // TODO: Use for bone-based effects
  // movementDirection, // TODO: Use for movement-based effects
  activeEffects,
  setActiveEffects,
  damageNumbers,
  setDamageNumbers,
  nextDamageNumberId,
  fireballs,
  activeProjectiles,
  // frenzyAuraRef, // TODO: Use for frenzy aura effects
  // reanimateRef, // TODO: Use for reanimate effects
  // reigniteRef, // TODO: Use for reignite effects
  // soulReaperRef, // TODO: Use for soul reaper effects
  glacialShardRef,
  // eagleEyeManagerRef, // TODO: Use for eagle eye effects
  boneclawActiveEffects,
  removeBoneclawEffect,
  fireballCharges,
  icicleCharges,
  isFirebeaming,
  firebeamStartTime,
  // isBreaching, // TODO: Use for breach effects
  // isThrowSpearCharging, // TODO: Use for spear charge effects
  // throwSpearChargeProgress, // TODO: Use for spear charge progress
  // isSpearThrown, // TODO: Use for thrown spear effects
  icicleComboStep,
  onHit,
  // onHealthChange, // TODO: Use for health change effects
  // onAbilityUse, // TODO: Use for ability use effects
  handleFireballImpact,
  handleDamageNumberComplete,
  handleSmiteEffectComplete,
  handleColossusLightningComplete,
  handleIcicleComboComplete,
  onFreezeStateCheck,
  onApplySlowEffect,
  onApplyKnockbackEffect,
  enemyData,
  // summonedUnitsData, // TODO: Use for summoned unit effects
  smiteEffects,
  colossusLightningEffects,
  // abyssalSlashEffects, // TODO: Use for abyssal slash rendering
  // playerStunEffects, // TODO: Use for player stun rendering
  // activeVault, // TODO: Use for vault effects
  dragonBreathDamageApplied,
  processDragonBreathKill,
  isInRoom,
  sendEffect,
  getBarrageProjectiles,
  getIcicleProjectilesRef
}) => {
  
  // Memoize expensive calculations
  const memoizedProjectiles = useMemo(() => activeProjectiles, [activeProjectiles]);
  const memoizedFireballs = useMemo(() => fireballs, [fireballs]);
  const memoizedDamageNumbers = useMemo(() => damageNumbers, [damageNumbers]);

  return (
    <>
      {/* Ghost Trail */}
      <GhostTrail parentRef={groupRef} weaponType={currentWeapon} weaponSubclass={currentSubclass} />

      {/* Bone Effects */}
      <BoneVortex parentRef={groupRef} weaponType={currentWeapon} weaponSubclass={currentSubclass} />
      <BoneAura parentRef={groupRef} />

      {/* Charged Orbitals */}
      <ChargedOrbitals 
        parentRef={groupRef} 
        charges={fireballCharges}
        weaponType={currentWeapon}
        weaponSubclass={currentSubclass}
      />

      {/* Icicle Orbitals for FROST sabres subclass - innate ability */}
      {currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && (
        <IcicleOrbitals
          parentRef={groupRef}
          charges={icicleCharges}
          setCharges={(callback) => {
            // This should be connected to the parent's icicle charges state
            console.log('Icicle charges updated:', callback);
          }}
          enemyData={enemyData}
          onHit={onHit}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          level={level}
          onFreezeStateCheck={onFreezeStateCheck}
          onApplySlowEffect={onApplySlowEffect}
          comboStep={icicleComboStep}
          onComboComplete={handleIcicleComboComplete}
          onShootIcicle={() => {
            console.log('Icicle shot from orbitals');
          }}
          onUpdateProjectiles={() => {
            console.log('Icicle projectiles updated');
          }}
          onGetActiveProjectiles={() => {
            console.log('Getting active icicle projectiles');
          }}
          sendEffect={sendEffect}
          isInRoom={isInRoom}
          isPlayer={isPlayer}
        />
      )}

      {/* GlacialShard for FROST sabres subclass */}
      {currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && (
        <GlacialShard
          ref={glacialShardRef}
          parentRef={groupRef}
          onHit={onHit}
          enemyData={enemyData}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          charges={fireballCharges}
          setCharges={() => {
            console.log('GlacialShard charges updated');
          }}
          setActiveEffects={setActiveEffects}
          currentSubclass={currentSubclass}
          sendEffect={sendEffect}
          isInRoom={isInRoom}
          isPlayer={isPlayer}
        />
      )}

      {/* Stealth mist effect */}
      {isStealthed && <StealthMistEffect parentRef={groupRef} />}

      {/* Incinerate Empowerment effect for Pyro Spear */}
      {currentWeapon === WeaponType.SPEAR && 
       currentSubclass === WeaponSubclass.PYRO && 
       isIncinerateEmpowered && (
        <IncinerateEmpowerment
          position={new Vector3(0, 0, 0)}
          isEmpowered={isIncinerateEmpowered}
        />
      )}

      {/* Fireballs */}
      {memoizedFireballs.map(fireball => (
        fireball.isCrossentropyBolt ? (
          <CrossentropyBolt
            key={fireball.id}
            position={fireball.position}
            direction={fireball.direction}
            onImpact={(impactPosition?: Vector3) => handleFireballImpact(fireball.id, impactPosition)}
          />
        ) : (
          <Fireball
            key={fireball.id}
            position={fireball.position}
            direction={fireball.direction}
            onImpact={(impactPosition?: Vector3) => handleFireballImpact(fireball.id, impactPosition)}
          />
        )
      ))}

      {/* Smite Effects */}
      {smiteEffects.map(effect => (
        <Smite
          key={effect.id}
          weaponType={currentWeapon}
          position={effect.position}
          onComplete={() => handleSmiteEffectComplete(effect.id)}
        />
      ))}

      {/* Boneclaw Effects for Chaos Scythe */}
      {boneclawActiveEffects && boneclawActiveEffects.map(effect => (
        <Boneclaw
          key={effect.id}
          position={effect.position}
          direction={effect.direction}
          parentRef={groupRef}
          enemyData={enemyData}
          level={level}
          onComplete={() => {
            removeBoneclawEffect?.(effect.id);
          }}
          onHitTarget={(targetId, damage, isCritical, position, isBoneclaw) => {
            onHit(targetId, damage);
            setDamageNumbers(prev => [...prev, {
              id: Date.now(),
              damage,
              position: position.clone(),
              isCritical,
              isBoneclaw
            }]);
          }}
          onKillingBlow={(position) => {
            // This is handled by the useBoneclaw hook in UnitOptimized
            console.log('Boneclaw killing blow at:', position);
          }}
        />
      ))}

      {/* Divine Storm Effects */}
      {activeEffects.filter(effect => effect.type === 'divineStorm').map(effect => (
        <DivineStorm
          key={effect.id}
          position={effect.position}
          onComplete={() => {
            setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
          }}
          parentRef={groupRef}
          isActive={true}
        />
      ))}

      {/* Firebeam Effects */}
      {activeEffects.filter(effect => effect.type === 'firebeam').map(effect => (
        <Firebeam
          key={effect.id}
          parentRef={effect.parentRef || groupRef}
          isActive={isFirebeaming}
          startTime={firebeamStartTime.current || Date.now()}
          onComplete={() => {
            setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

      {/* Dragon Breath Effects */}
      {activeEffects.filter(effect => effect.type === 'dragonbreath').map(effect => {
        // Handle Dragon Breath damage on first render
        if (!dragonBreathDamageApplied.current.has(effect.id)) {
          // Mark damage as applied to prevent multiple applications
          dragonBreathDamageApplied.current.add(effect.id);
          
          const hits = calculateDragonBreathHits(
            effect.position,
            effect.direction,
            enemyData,
            new Set() // No hit tracking needed since it's instant
          );

          // Apply damage to all enemies hit and check for kills
          hits.forEach(hit => {
            // Get the target and store its health before damage
            const target = enemyData.find(e => e.id === hit.targetId);
            const previousHealth = target ? target.health : 0;
            
            onHit(hit.targetId, hit.damage);
            
            // Check if the enemy was killed by Dragon Breath
            if (target && previousHealth > 0 && previousHealth - hit.damage <= 0) {
              // Process kill for Dragon Breath - restore 3 orb charges
              processDragonBreathKill();
            }
            
            // Apply knockback effect (except for Fallen Titan)
            if (hit.knockbackDirection && onApplyKnockbackEffect && !hit.targetId.includes('fallen-titan')) {
              onApplyKnockbackEffect(hit.targetId, hit.knockbackDirection, 5.0);
            }
            
            // Create damage number
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: hit.damage,
              position: hit.position.clone().add(new Vector3(0, 2, 0)),
              isCritical: hit.isCritical,
              isDragonBreath: true
            }]);
          });
        }

        return (
          <DragonBreath
            key={effect.id}
            parentRef={groupRef}
            onComplete={() => {
              setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
            }}
            isActive={true}
            startTime={effect.startTime || Date.now()}
          />
        );
      })}

      {/* Damage Numbers */}
      {memoizedDamageNumbers.map(dn => (
        <DamageNumber
          key={dn.id}
          damage={dn.damage}
          position={dn.position}
          isCritical={dn.isCritical}
          isLightning={dn.isLightning}
          isHealing={dn.isHealing}
          isBlizzard={dn.isBlizzard}
          isBoneclaw={dn.isBoneclaw}
          isSmite={dn.isSmite}
          isSword={dn.isSword}
          isSabres={dn.isSabres}
          isOathstrike={dn.isOathstrike}
          isFirebeam={dn.isFirebeam}
          isOrbShield={dn.isOrbShield}
          isChainLightning={dn.isChainLightning}
          isFireball={dn.isFireball}
          isSummon={dn.isSummon}
          isStealthStrike={dn.isStealthStrike}
          isPyroclast={dn.isPyroclast}
          isEagleEye={dn.isEagleEye}
          isBreach={dn.isBreach}
          isBowLightning={dn.isBowLightning}
          isBarrage={dn.isBarrage}
          isGlacialShard={dn.isGlacialShard}
          isAegis={dn.isAegis}
          isCrossentropyBolt={dn.isCrossentropyBolt}
          isGuidedBolt={dn.isGuidedBolt}
          isDivineStorm={dn.isDivineStorm}
          isHolyBurn={dn.isHolyBurn}
          isColossusStrike={dn.isColossusStrike}
          isColossusLightning={dn.isColossusLightning}
          isFirestorm={dn.isFirestorm}
          isElementalBowPowershot={dn.isElementalBowPowershot}
          isElementalQuickShot={dn.isElementalQuickShot}
          isPoisonDoT={dn.isPoisonDoT}
          isRaze={dn.isRaze}
          isSoulReaper={dn.isSoulReaper}
          isLavaLash={dn.isLavaLash}
          isDragonBreath={dn.isDragonBreath}
          isLegionEmpoweredScythe={dn.isLegionEmpoweredScythe}
          onComplete={() => handleDamageNumberComplete(dn.id)}
        />
      ))}

      {/* Colossus Strike Lightning Effects */}
      {colossusLightningEffects.map(lightning => (
        <ColossusStrikeLightning
          key={lightning.id}
          position={lightning.position}
          onComplete={() => handleColossusLightningComplete(lightning.id)}
        />
      ))}

      {/* Bow Projectiles */}
      {memoizedProjectiles.map(projectile => (
        <group key={projectile.id}>
          <group
            position={projectile.position.toArray()}
            rotation={[
              0,
              Math.atan2(projectile.direction.x, projectile.direction.z),
              0
            ]}
          >
            {/* Base arrow */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.075, 1.75, 6]} /> {/* Segments */}
              <meshStandardMaterial
                color={currentSubclass === WeaponSubclass.VENOM ? "#00ff60" : "#00ffff"}
                emissive={currentSubclass === WeaponSubclass.VENOM ? "#00aa30" : "#00ffff"}
                emissiveIntensity={currentSubclass === WeaponSubclass.VENOM ? 1.2 : 1}
                transparent
                opacity={projectile.opacity !== undefined ? projectile.opacity : 1}
              />
            </mesh>

            {/* Arrow Rings */}
            {[...Array(3)].map((_, i) => ( 
              <mesh
                key={`ring-${i}`}
                position={[0, 0, -i * 0.45 + 0.5]}
                rotation={[Math.PI, 0, Date.now() * 0.003 + i * Math.PI / 3]}
              >
                <torusGeometry args={[0.125 + i * 0.04, 0.05, 6, 12]} /> {/* Segments */}
                <meshStandardMaterial
                  color={currentSubclass === WeaponSubclass.VENOM ? "#00ff50" : "#00ffff"}
                  emissive={currentSubclass === WeaponSubclass.VENOM ? "#00aa25" : "#00ffff"}
                  emissiveIntensity={currentSubclass === WeaponSubclass.VENOM ? 3.5 : 3}
                  transparent
                  opacity={(0.9 - i * 0.125) * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Single light instead of two */}
            <pointLight 
              color={currentSubclass === WeaponSubclass.VENOM ? "#00ff50" : "#00ffff"}
              intensity={currentSubclass === WeaponSubclass.VENOM ? 3.5 : 3}
              distance={currentSubclass === WeaponSubclass.VENOM ? 5.5 : 5}
              decay={2}
            />
          </group>

          {/* POWERSHOT projectiles - thinner version with proper color coding */}
          {(projectile.power >= 1 || projectile.isPerfectShot) && 
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
              {/* Core arrow shaft - thinner */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.18, 1.5, 4]} /> {/* Thinner than original */}
                <meshStandardMaterial
                  color={
                    currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff0000" :
                    currentSubclass === WeaponSubclass.VENOM ? "#00ff40" : "#EAC4D5"
                  }
                  emissive={
                    currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#cc0000" :
                    currentSubclass === WeaponSubclass.VENOM ? "#00aa20" : "#EAC4D5"
                  }
                  emissiveIntensity={
                    currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 3.0 :
                    currentSubclass === WeaponSubclass.VENOM ? 2.0 : 1.5
                  }
                  transparent
                  opacity={0.7 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                />
              </mesh>

              {/* Reduced ethereal trails - thinner */}
              {[...Array(
                currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 4 :
                currentSubclass === WeaponSubclass.VENOM ? 3 : 3
              )].map((_, i) => { // Fewer particles
                const totalParticles = currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 4 :
                                     currentSubclass === WeaponSubclass.VENOM ? 3 : 3;
                const angle = (i / totalParticles) * Math.PI * 2;
                const radius = 0.25; // Smaller radius
                return (
                  <group 
                    key={`ghost-trail-${i}`}
                    position={[
                      Math.sin(angle + Date.now() * 0.003) * radius,
                      Math.cos(angle + Date.now() * 0.003) * radius,
                      -1.0 // Closer to arrow
                    ]}
                  >
                    <mesh>
                      <sphereGeometry args={[0.08, 3, 3]} /> {/* Smaller spheres */}
                      <meshStandardMaterial
                        color={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff2200" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00ff60" : "#00ffff"
                        }
                        emissive={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#aa0000" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00aa30" : "#00ffff"
                        }
                        emissiveIntensity={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 1.5 :
                          currentSubclass === WeaponSubclass.VENOM ? 1.3 : 1
                        }
                        transparent
                        opacity={0.5 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* Fire particles for elemental shots - smaller */}
              {currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked && 
                [...Array(5)].map((_, i) => { // Fewer particles
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 0.15 + Math.random() * 0.2; // Smaller radius
                  const offset = -Math.random() * 1.5; // Shorter trail
                  return (
                    <group 
                      key={`fire-particle-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        offset
                      ]}
                    >
                      <mesh>
                        <sphereGeometry args={[0.05 + Math.random() * 0.06, 3, 3]} /> {/* Smaller particles */}
                        <meshStandardMaterial
                          color={i % 2 === 0 ? "#ffcc00" : "#ff4400"}
                          emissive={i % 2 === 0 ? "#ffcc00" : "#ff4400"}
                          emissiveIntensity={2}
                          transparent
                          opacity={0.7 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                          blending={THREE.AdditiveBlending}
                        />
                      </mesh>
                    </group>
                  );
                })
              }

              {/* Venom particles for venom shots - smaller */}
              {currentSubclass === WeaponSubclass.VENOM && 
                [...Array(4)].map((_, i) => { // Fewer particles
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 0.15 + Math.random() * 0.2; // Smaller radius
                  const offset = -Math.random() * 1.5; // Shorter trail
                  return (
                    <group 
                      key={`venom-particle-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        offset
                      ]}
                    >
                      <mesh>
                        <sphereGeometry args={[0.05 + Math.random() * 0.06, 3, 3]} /> {/* Smaller particles */}
                        <meshStandardMaterial
                          color={i % 2 === 0 ? "#00ff40" : "#00aa20"}
                          emissive={i % 2 === 0 ? "#00ff40" : "#00aa20"}
                          emissiveIntensity={2}
                          transparent
                          opacity={0.7 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                          blending={THREE.AdditiveBlending}
                        />
                      </mesh>
                    </group>
                  );
                })
              }

              {/* Reduced ghostly wisps - smaller */}
              {[...Array(4)].map((_, i) => { // Fewer wisps
                const offset = -i * 0.2 - 1.0; // Closer spacing
                const scale = 1 - (i * 0.02);
                return (
                  <group 
                    key={`wisp-${i}`}
                    position={[0, 0, offset]}
                    rotation={[0, Date.now() * 0.001 + i, 0]}
                  >
                    <mesh scale={scale}>
                      <torusGeometry args={[0.25, 0.06, 3, 6]} /> {/* Smaller torus */}
                      <meshStandardMaterial
                        color={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff4400" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00ff50" : "#00ffff"
                        }
                        emissive={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#cc0000" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00aa30" : "#00ffff"
                        }
                        emissiveIntensity={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 1.5 :
                          currentSubclass === WeaponSubclass.VENOM ? 1.3 : 1
                        }
                        transparent
                        opacity={0.3 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* Single light with proper color - smaller intensity */}
              <pointLight
                color={
                  currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff2200" :
                  currentSubclass === WeaponSubclass.VENOM ? "#00ff40" : "#EAC4D5"
                }
                intensity={
                  currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 4 :
                  currentSubclass === WeaponSubclass.VENOM ? 3 : 2.5
                }
                distance={
                  currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 6 :
                  currentSubclass === WeaponSubclass.VENOM ? 5 : 4
                }
                decay={2}
              />
            </group>
          )}
        </group>
      ))}

      {/* Barrage Projectiles */}
      {getBarrageProjectiles && getBarrageProjectiles().map(projectile => (
        <group key={projectile.id}>
          <group
            position={projectile.position.toArray()}
            rotation={[
              0,
              Math.atan2(projectile.direction.x, projectile.direction.z),
              0
            ]}
          >
            {/* Base arrow - slightly smaller than regular bow arrows */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.1, 1.8, 6]} />
              <meshStandardMaterial
                color="#ff8800"
                emissive="#ff8800"
                emissiveIntensity={1.2}
                transparent
                opacity={projectile.opacity !== undefined ? projectile.opacity : 1}
              />
            </mesh>

            {/* Arrow Rings - fewer rings for barrage arrows */}
            {[...Array(2)].map((_, i) => ( 
              <mesh
                key={`barrage-ring-${i}`}
                position={[0, 0, -i * 0.4 + 0.4]}
                rotation={[Math.PI, 0, Date.now() * 0.004 + i * Math.PI / 2]}
              >
                <torusGeometry args={[0.1 + i * 0.03, 0.04, 6, 10]} />
                <meshStandardMaterial
                  color="#ff8800"
                  emissive="#ff8800"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={(0.8 - i * 0.1) * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Single light */}
            <pointLight 
              color="#ff8800" 
              intensity={2.5 * (projectile.opacity !== undefined ? projectile.opacity : 1)} 
              distance={4}
              decay={2}
            />
          </group>
        </group>
      ))}

      {/* Icicle Projectiles */}
      {getIcicleProjectilesRef && getIcicleProjectilesRef.current && getIcicleProjectilesRef.current().map(projectile => (
        <IcicleProjectileWithTrail
          key={projectile.id}
          projectile={projectile}
        />
      ))}
    </>
  );
});

UnitEffectsSystem.displayName = 'UnitEffectsSystem';

export default UnitEffectsSystem;