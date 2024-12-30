import React, { useEffect, useState, useRef } from 'react';
import { WeaponAbilities, WeaponType } from '../Weapons/weapons';
import { WeaponInfo } from '../Unit/UnitProps';
import styles from './Panel.module.css';
import Image from 'next/image';
import DamageNotification from './DamageNotification';
import { WEAPON_ABILITY_TOOLTIPS } from '../Weapons/weapons';
import Tooltip from './Tooltip';


interface PanelProps {
  currentWeapon: WeaponType;
  onWeaponSelect: (weapon: WeaponType) => void;
  playerHealth: number;
  maxHealth: number;
  abilities: WeaponInfo;
  onReset: () => void;
  killCount: number;
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
  percentage: number; // 0 to 100
  borderRadius: number;
}> = ({ size, strokeWidth, percentage, borderRadius }) => {
  const halfStroke = strokeWidth / 2;
  const adjustedSize = size - strokeWidth;
  const perimeter = 4 * adjustedSize; // Approximate perimeter for a rounded square
  const dashOffset = perimeter - (perimeter * percentage) / 100;

  return (
    <svg
      width={size}
      height={size}
      className={styles.roundedSquareProgress}
    >
      {/* Foreground Rect for Sweeping Animation */}
      <rect
        x={halfStroke}
        y={halfStroke}
        width={adjustedSize}
        height={adjustedSize}
        rx={borderRadius}
        ry={borderRadius}
        stroke="#39ff14"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={perimeter}
        strokeDashoffset={dashOffset}
        className={styles.progressForeground}
      />
    </svg>
  );
};

export default function Panel({ currentWeapon, playerHealth, maxHealth, abilities, killCount }: PanelProps) {
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
      ].slice(-4)); // Keep only the last 3 notifications
    }
    
    prevHealth.current = playerHealth;
  }, [playerHealth]);

  const handleNotificationComplete = (id: number) => {
    setDamageNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getLevel = (kills: number) => {
    if (kills < 15) return 1;
    if (kills < 40) return 2;  // 15 kills for level 1-> 2, then need 25 more for 2->3
    return 3;
  };

  const getExpProgress = (kills: number) => {
    const level = getLevel(kills);
    
    if (level === 1) {
      return (kills / 15) * 100;
    } else if (level === 2) {
      return ((kills - 15) / 25) * 100;
    }
    return 100;
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
        {/* Abilities Section - Moved up */}
        {abilities[currentWeapon] && (
          <div className={styles.abilitiesSection}>
            {Object.entries(abilities[currentWeapon]).map(([key, ability]) => (
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
                {ability.currentCooldown > 0 && (
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