import React, { useEffect, useState, useRef } from 'react';
import { WeaponAbilities, WeaponType } from '@/Weapons/weapons';
import { WeaponInfo } from '@/Unit/UnitProps';
import styles from '@/Interface/Panel.module.css';
import Image from 'next/image';
import DamageNotification from '@/Interface/DamageNotification';
import { WEAPON_ABILITY_TOOLTIPS } from '@/Weapons/weapons';
import Tooltip from '@/Interface/Tooltip';
import { Vector3 } from 'three';


interface PanelProps {
  currentWeapon: WeaponType;
  onWeaponSelect: (weapon: WeaponType) => void;
  playerHealth: number;
  maxHealth: number;
  abilities: WeaponInfo;
  onReset: () => void;
  killCount: number;
  activeEffects?: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetId?: string;
  }>;
}

interface DamageNotificationData {
  id: number;
  damage: number;
  timestamp: number;
}

/**
 * RoundedSquareProgress Component
 * Renders a sweeping cooldown animation around a rounded square.
 */
const RoundedSquareProgress: React.FC<{
  size: number;
  strokeWidth: number;
  percentage: number;
  borderRadius: number;
  isActive?: boolean;
}> = ({ size, strokeWidth, percentage, borderRadius, isActive }) => {
  const halfStroke = strokeWidth / 2;
  const adjustedSize = size - strokeWidth;
  const perimeter = 4 * adjustedSize;
  const dashOffset = perimeter - (perimeter * percentage) / 100;

  return (
    <svg
      width={size}
      height={size}
      className={styles.roundedSquareProgress}
    >
      <rect
        x={halfStroke}
        y={halfStroke}
        width={adjustedSize}
        height={adjustedSize}
        rx={borderRadius}
        ry={borderRadius}
        stroke={isActive ? "#ff3333" : "#39ff14"}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={perimeter}
        strokeDashoffset={dashOffset}
        className={styles.progressForeground}
      />
    </svg>
  );
};

export default function Panel({ 
  currentWeapon, 
  playerHealth, 
  maxHealth, 
  abilities, 
  killCount,
  activeEffects 
}: PanelProps) {
  const [damageNotifications, setDamageNotifications] = useState<DamageNotificationData[]>([]);
  const nextNotificationId = useRef(0);
  const prevHealth = useRef(playerHealth);
  const [tooltipContent, setTooltipContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });


  useEffect(() => {
    if (playerHealth < prevHealth.current) {
      const damage = prevHealth.current - playerHealth;
      setDamageNotifications(prev => [
        ...prev,
        { 
          id: nextNotificationId.current++, 
          damage,
          timestamp: Date.now()
        }
      ].slice(-3)); // Keep only the last 3 notifications
    }
    
    prevHealth.current = playerHealth;
  }, [playerHealth]);

  const handleNotificationComplete = (id: number) => {
    setDamageNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getLevel = (kills: number) => {
    if (kills < 10) return 1;      // Level 1: 0-12 kills
     if (kills < 25) return 2;      // Level 2: 13-29 kills
    if (kills < 45) return 3;      // Level 3: 30-49 kills
    if (kills < 70) return 4;      // Level 4: 50-99 kills
    return 5;                      // Level 5: 100+ kills
  };

  const getExpProgress = (kills: number) => {
    const level = getLevel(kills);
    
    if (level === 1) {
      return (kills / 13) * 100;  // 13 kills for level 1
    } else if (level === 2) {
      return ((kills - 13) / 17) * 100;  // 17 kills for level 2
    }
    return ((kills - 30) / 20) * 100;  // 20 kills for level 3 (changed from 23)
  };


  // Ability Tooltip
  const handleAbilityHover = (
    e: React.MouseEvent,
    abilityKey: keyof WeaponAbilities
  ) => {
    const tooltip = WEAPON_ABILITY_TOOLTIPS[currentWeapon][abilityKey];
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipContent(tooltip);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleAbilityLeave = () => {
    setTooltipContent(null);
  };

  return (
    <>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.controlsSection}>




          <div className={styles.controlGroup}>
            <div className={styles.controlKey}>W</div>
            <div className={styles.controlKey}>A</div>
            <div className={styles.controlKey}>S</div>
            <div className={styles.controlKey}>D</div>
            <div className={styles.controlLabel}>Move</div>
          </div>

          <div className={styles.controlDivider} />
          
          <div className={styles.controlGroup}>
            <div className={styles.controlLabel}>Zoom</div>
            <div className={styles.controlKey}>Scroll Wheel</div>
          </div>

        </div>



        {/* Mouse Controls Row */}
        <div className={styles.controlsSection}>
          <div className={styles.controlGroup}>
            <div className={styles.controlKey}>L-Click Hold</div>
            <div className={styles.controlLabel}>Auto Attack</div>
          </div>

          <div className={styles.controlDivider} />

          <div className={styles.controlGroup}>

            <div className={styles.controlLabel}>Camera</div>
            <div className={styles.controlKey}>R-Click Hold</div>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className={styles.bottomPanel}>
        {/* Abilities Section - Movement Keys First */}
        {abilities[currentWeapon] && (
          <div className={styles.abilitiesContainer}>
            {/* Top Row: W */}
            <div className={styles.abilitiesRowTop}>
              {Object.entries(abilities[currentWeapon])
                .filter(([, ability]) => ['W'].includes(ability.key.toUpperCase()))
                .map(([key, ability]) => (
                <div 
                  key={key}
                  className={`${styles.abilityMovement} ${!ability.isUnlocked ? styles.locked : ''}`}
                  onMouseEnter={(e) => handleAbilityHover(e, key as keyof WeaponAbilities)}
                  onMouseLeave={handleAbilityLeave}
                >
                  <div className={styles.keyBind}>{ability.key.toUpperCase()}</div>
                  <Image 
                    src={ability.icon} 
                    alt={`${key} ability`} 
                    width={28}
                    height={28}
                    className={styles.abilityMovementIcon}
                  />
                  {key === 'active' && 
                   currentWeapon === WeaponType.SCYTHE && 
                   abilities[WeaponType.SCYTHE].active.isUnlocked &&
                   activeEffects?.some(effect => effect.type === 'summon') ? (
                    <div className={styles.activeOverlay}>
                      <RoundedSquareProgress
                        size={35}
                        strokeWidth={3}
                        percentage={100}
                        borderRadius={6}
                        isActive={true}
                      />
                    </div>
                  ) : (key === 'active' && currentWeapon === WeaponType.BOW) ? (
                    // No cooldown overlay for Bow's passive ability
                    null
                  ) : ability.currentCooldown > 0 && (
                    <div className={styles.cooldownOverlay}>
                      <RoundedSquareProgress
                        size={35}
                        strokeWidth={3}
                        percentage={(ability.currentCooldown / ability.cooldown) * 100}
                        borderRadius={6}
                      />
                      <span className={styles.cooldownText}>
                        {Math.ceil(ability.currentCooldown)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Middle Row: A, S, D */}
            <div className={styles.abilitiesRowMiddle}>
              {Object.entries(abilities[currentWeapon])
                .filter(([, ability]) => ['A', 'S', 'D'].includes(ability.key.toUpperCase()))
                .sort((a, b) => {
                  const order = ['A', 'S', 'D'];
                  return order.indexOf(a[1].key.toUpperCase()) - order.indexOf(b[1].key.toUpperCase());
                })
                .map(([key, ability]) => (
                <div 
                  key={key}
                  className={`${styles.abilityMovement} ${!ability.isUnlocked ? styles.locked : ''}`}
                  onMouseEnter={(e) => handleAbilityHover(e, key as keyof WeaponAbilities)}
                  onMouseLeave={handleAbilityLeave}
                >
                  <div className={styles.keyBind}>{ability.key.toUpperCase()}</div>
                  <Image 
                    src={ability.icon} 
                    alt={`${key} ability`} 
                    width={28}
                    height={28}
                    className={styles.abilityMovementIcon}
                  />
                  {key === 'active' && 
                   currentWeapon === WeaponType.SCYTHE && 
                   abilities[WeaponType.SCYTHE].active.isUnlocked &&
                   activeEffects?.some(effect => effect.type === 'summon') ? (
                    <div className={styles.activeOverlay}>
                      <RoundedSquareProgress
                        size={35}
                        strokeWidth={3}
                        percentage={100}
                        borderRadius={6}
                        isActive={true}
                      />
                    </div>
                  ) : (key === 'active' && currentWeapon === WeaponType.BOW) ? (
                    // No cooldown overlay for Bow's passive ability
                    null
                  ) : ability.currentCooldown > 0 && (
                    <div className={styles.cooldownOverlay}>
                      <RoundedSquareProgress
                        size={35}
                        strokeWidth={3}
                        percentage={(ability.currentCooldown / ability.cooldown) * 100}
                        borderRadius={6}
                      />
                      <span className={styles.cooldownText}>
                        {Math.ceil(ability.currentCooldown)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Bottom Row: Q, E, R, T, 1, 2 */}
            <div className={styles.abilitiesRowBottom}>
              {Object.entries(abilities[currentWeapon])
                .filter(([, ability]) => ['Q', 'E', 'R', 'T', '1', '2'].includes(ability.key.toUpperCase()))
                .sort((a, b) => {
                  const order = ['Q', 'E', 'R', 'T', '1', '2'];
                  return order.indexOf(a[1].key.toUpperCase()) - order.indexOf(b[1].key.toUpperCase());
                })
                .map(([key, ability]) => (
                <div 
                  key={key}
                  className={`${styles.ability} ${!ability.isUnlocked ? styles.locked : ''}`}
                  onMouseEnter={(e) => handleAbilityHover(e, key as keyof WeaponAbilities)}
                  onMouseLeave={handleAbilityLeave}
                >
                  <div className={styles.keyBind}>{ability.key.toUpperCase()}</div>
                  <Image 
                    src={ability.icon} 
                    alt={`${key} ability`} 
                    width={40}
                    height={40}
                    className={styles.abilityIcon}
                  />
                  {key === 'active' && 
                   currentWeapon === WeaponType.SCYTHE && 
                   abilities[WeaponType.SCYTHE].active.isUnlocked &&
                   activeEffects?.some(effect => effect.type === 'summon') ? (
                    <div className={styles.activeOverlay}>
                      <RoundedSquareProgress
                        size={50}
                        strokeWidth={4}
                        percentage={100}
                        borderRadius={8}
                        isActive={true}
                      />
                    </div>
                  ) : (key === 'active' && currentWeapon === WeaponType.BOW) ? (
                    // No cooldown overlay for Bow's passive ability
                    null
                  ) : ability.currentCooldown > 0 && (
                    <div className={styles.cooldownOverlay}>
                      <RoundedSquareProgress
                        size={50}
                        strokeWidth={4}
                        percentage={(ability.currentCooldown / ability.cooldown) * 100}
                        borderRadius={8}
                      />
                      <span className={styles.cooldownText}>
                        {Math.ceil(ability.currentCooldown)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Bar Section */}
        <div className={styles.healthBarSection}>
          {damageNotifications.map((notification, index) => (
            <DamageNotification
              key={notification.id}
              damage={notification.damage}
              index={index}
              timestamp={notification.timestamp}
              onComplete={() => handleNotificationComplete(notification.id)}
            />
          ))}
          
          {/* Health Bar */}
          <div className={styles.healthBarContainer}>
            <div className={styles.healthBar}>
              <div className={styles.healthBarBackground} />
              <div 
                className={styles.healthBarInner} 
                style={{ width: `${(playerHealth / maxHealth) * 100}%` }}
              />
              <div className={styles.healthBarShine} />
              <div className={styles.healthBarPulse} />
            </div>
            <span className={styles.healthText}>
              <span className={styles.healthCurrent}>{playerHealth}</span>
              <span className={styles.healthSeparator}>/</span>
              <span className={styles.healthMax}>{maxHealth}</span>
            </span>
          </div>

          {/* Experience Bar */}
          <div className={styles.experienceBarContainer}>
            <div className={styles.experienceBarOrnamentLeft}>

              <span className={styles.levelText}>{getLevel(killCount)}</span>
            </div>
            <div className={styles.experienceBar}>
              <div 
                className={styles.xpFill} 
                style={{ width: `${getExpProgress(killCount)}%` }} 
              />
            </div>
            <div className={styles.experienceBarOrnamentRight}>
              <span className={styles.killCountText}>{killCount}</span>
            </div>
          </div>
        </div>

        <Tooltip 
          content={tooltipContent!}
          visible={!!tooltipContent}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      </div>
    </>
  );
}