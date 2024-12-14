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

interface GameOverMessage {
  title: string;
  subtitle: string;
}

// MAKE DEZE BETTER LATER 
const GAME_OVER_MESSAGES: GameOverMessage[] = [
  { title: "The Darkness Claims Another", subtitle: "Your soul joins the eternal dance..." },
  { title: "Fallen to Shadow", subtitle: "The necropolis grows stronger..." },
  { title: "Death's Embrace", subtitle: "The bones welcome their kin..." },
  { title: "The Last Stand", subtitle: "Your light fades into the abyss..." },
  { title: "Eternal Rest", subtitle: "The skeleton army claims victory..." },
  { title: "Denied Ascension", subtitle: "The dragons turn their backs on another unworthy soul..." },
  { title: "Draconic Disappointment", subtitle: "Your flames were not strong enough to join their ranks..." },
  { title: "Failed Wyrm", subtitle: "The ancient dragons scoff at your weakness..." },
  { title: "Wingless One", subtitle: "You'll never know the freedom of dragon flight..." },
  { title: "Mortal Chains", subtitle: "Forever bound to walk while dragons soar above..." },
  { title: "Lost Heritage", subtitle: "The dragon blood within you grows cold..." },
  { title: "Fading Ember", subtitle: "Your draconic spark extinguishes in darkness..." },
  { title: "Rejected by Fire", subtitle: "The dragon's flame finds you unworthy..." }
];

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

export default function Panel({ currentWeapon, onWeaponSelect, playerHealth, maxHealth, abilities, onReset, killCount }: PanelProps) {
  const [damageNotifications, setDamageNotifications] = useState<DamageNotificationData[]>([]);
  const nextNotificationId = useRef(0);
  const prevHealth = useRef(playerHealth);
  const [gameOverMessage, setGameOverMessage] = useState<GameOverMessage | null>(null);

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

  useEffect(() => {
    if (playerHealth <= 0) {
      const randomMessage = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];
      setGameOverMessage(randomMessage);
    } else {
      setGameOverMessage(null);
    }
  }, [playerHealth]);

  const handleNotificationComplete = (id: number) => {
    setDamageNotifications(prev => prev.filter(n => n.id !== id));
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
          <div className={styles.healthBarContainer}>
            <div className={styles.healthBarDecoration}>
              <div className={styles.healthBarOrnamentLeft} />
              <div className={styles.healthBarOrnamentRight}>
                <span className={styles.killCountText}>
                  {killCount}
                </span>
              </div>
            </div>
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
        </div>

        {/* Abilities Section */}
        <div className={styles.abilitiesSection}>
          {abilities[currentWeapon] && (
            <>
              <div className={styles.ability}>
                <div className={styles.keyBind}>Q</div>
                <Image 
                  src={abilities[currentWeapon].q.icon} 
                  alt="Q ability" 
                  width={50}
                  height={50}
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

              <div className={styles.ability}>
                <div className={styles.keyBind}>E</div>
                <Image 
                  src={abilities[currentWeapon].e.icon} 
                  alt="E ability" 
                  width={50}
                  height={50}
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

              <div className={styles.ability}>
                <div className={styles.keyBind}>R</div>
                <Image 
                  src={abilities[currentWeapon].r.icon} 
                  alt="R ability" 
                  width={50}
                  height={50}
                  className={styles.abilityIcon}
                />
                {abilities[currentWeapon].r.currentCooldown > 0 && (
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

              <div className={styles.ability}>
                <div className={styles.keyBind}>P</div>
                <Image 
                  src={abilities[currentWeapon].passive.icon} 
                  alt="Passive ability" 
                  width={50}
                  height={50}
                  className={styles.abilityIcon}
                />
              </div>
            </>
          )}
        </div>

        {/* Weapons Section */}
        <div className={styles.weaponIcons}>
          {Object.values(WeaponType)
            .filter((_, index) => index < 3)
            .map((weapon, index) => (
              <div 
                key={weapon}
                className={`${styles.weaponSlot} ${currentWeapon === weapon ? styles.activeWeapon : ''}`}
                onClick={() => onWeaponSelect(weapon)}
              >
                <div className={styles.keyBind}>{index + 1}</div>
                <Image 
                  src={`/Eidolon/icons/${index + 1}.svg`} 
                  alt={weapon} 
                  width={50} 
                  height={50} 
                  className={styles.weaponIcon}
                />
              </div>
            ))}
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameOverMessage && (
        <div className={styles.gameOverOverlay}>
          <h1 className={styles.gameOverTitle}>{gameOverMessage.title}</h1>
          <p className={styles.gameOverSubtitle}>{gameOverMessage.subtitle}</p>
          <button 
            className={styles.retryButton}
            onClick={onReset}
          >
            RETRY
          </button>
        </div>
      )}
    </>
  );
}