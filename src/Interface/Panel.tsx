import React, { useEffect, useState, useRef } from 'react';
import { WeaponType } from '../Weapons/weapons';
import { WeaponInfo } from '../Unit/UnitProps';
import styles from './Panel.module.css';
import Image from 'next/image';
import DamageNotification from './DamageNotification';


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

  return (
    <>
      <div className={styles.bottomPanel}>
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

        {/* Abilities Section */}
        {abilities[currentWeapon] && (
          <div className={styles.abilitiesSection}>


            {/* Q Ability - Always unlocked */}
            <div className={styles.ability}>
              <div className={styles.keyBind}>Q</div>
              <Image 
                src={abilities[currentWeapon].q.icon} 
                alt="Q ability" 
                width={40}
                height={40}
                className={styles.abilityIcon}
              />
              {abilities[currentWeapon].q.currentCooldown > 0 && (
                <div className={styles.cooldownOverlay}>
                  <RoundedSquareProgress
                    size={50}
                    strokeWidth={4}
                    percentage={(abilities[currentWeapon].q.currentCooldown / abilities[currentWeapon].q.cooldown) * 100}
                    borderRadius={8}
                  />
                  <span className={styles.cooldownText}>
                    {Math.ceil(abilities[currentWeapon].q.currentCooldown)}
                  </span>
                </div>
              )}
            </div>

            {/* E Ability - Always unlocked */}
            <div className={styles.ability}>
              <div className={styles.keyBind}>E</div>
              <Image 
                src={abilities[currentWeapon].e.icon} 
                alt="E ability" 
                width={40}
                height={40}
                className={styles.abilityIcon}
              />
              {abilities[currentWeapon].e.currentCooldown > 0 && (
                <div className={styles.cooldownOverlay}>
                  <RoundedSquareProgress
                    size={50}
                    strokeWidth={4}
                    percentage={(abilities[currentWeapon].e.currentCooldown / abilities[currentWeapon].e.cooldown) * 100}
                    borderRadius={8}
                  />
                  <span className={styles.cooldownText}>
                    {Math.ceil(abilities[currentWeapon].e.currentCooldown)}
                  </span>
                </div>
              )}
            </div>

            {/* R Ability */}
            <div className={`${styles.ability} ${!abilities[currentWeapon].r.isUnlocked ? styles.locked : ''}`}>
              <div className={styles.keyBind}>R</div>
              <Image 
                src={abilities[currentWeapon].r.icon} 
                alt="R ability" 
                width={40}
                height={40}
                className={styles.abilityIcon}
              />
              {abilities[currentWeapon].r.currentCooldown > 0 && abilities[currentWeapon].r.isUnlocked && (
                <div className={styles.cooldownOverlay}>
                  <RoundedSquareProgress
                    size={50}
                    strokeWidth={4}
                    percentage={(abilities[currentWeapon].r.currentCooldown / abilities[currentWeapon].r.cooldown) * 100}
                    borderRadius={8}
                  />
                  <span className={styles.cooldownText}>
                    {Math.ceil(abilities[currentWeapon].r.currentCooldown)}
                  </span>
                </div>
              )}
            </div>
            
              {/* Passive Ability */}
              <div className={`${styles.ability} ${!abilities[currentWeapon].passive.isUnlocked ? styles.locked : ''}`}>
              <div className={styles.keyBind}>1</div>
              <Image 
                src={abilities[currentWeapon].passive.icon} 
                alt="Ability Slot 1" 
                width={40}
                height={40}
                className={styles.abilityIcon}
              />
            </div>
          </div>
        )}

       
      </div>
    </>
  );
}