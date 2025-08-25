import React, { useEffect, useState, useRef } from 'react';
import styles from './HealthOrb.module.css';
import DamageNotification from './DamageNotification';

interface HealthOrbProps {
  currentHealth: number;
  maxHealth: number;
  killCount: number;
  hasShield?: boolean;
  shieldAbsorption?: number;
}

interface DamageNotificationData {
  id: number;
  damage: number;
  timestamp: number;
}

const HealthOrb: React.FC<HealthOrbProps> = ({
  currentHealth,
  maxHealth,
  killCount,
  hasShield = false,
  shieldAbsorption = 0
}) => {
  // Damage notification state - simplified to match original Panel implementation
  const [damageNotifications, setDamageNotifications] = useState<DamageNotificationData[]>([]);
  const nextNotificationId = useRef(0);
  const prevHealth = useRef(currentHealth);

  // Simple damage detection - exactly like the original Panel implementation
  useEffect(() => {
    if (currentHealth < prevHealth.current) {
      const damage = prevHealth.current - currentHealth;
      setDamageNotifications(prev => [
        ...prev,
        { 
          id: nextNotificationId.current++, 
          damage,
          timestamp: Date.now()
        }
      ].slice(-3)); // Keep only the last 3 notifications
    }
    
    prevHealth.current = currentHealth;
  }, [currentHealth]);

  const handleNotificationComplete = (id: number) => {
    setDamageNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Calculate health percentage for fluid fill
  const healthPercentage = (currentHealth / maxHealth) * 100;
  
  // Calculate shield percentage if present
  const shieldPercentage = hasShield && shieldAbsorption > 0 
    ? (shieldAbsorption / maxHealth) * 100 
    : 0;

  // Level calculation (same as Panel.tsx)
  const getLevel = (kills: number) => {
    if (kills < 10) return 1;    
    if (kills < 25) return 2;     
    if (kills < 45) return 3;    
    if (kills < 70) return 4;   
    return 5;                   
  };

  // Experience progress calculation
  const getExpProgress = (kills: number) => {
    const level = getLevel(kills);
    
    if (level === 1) {
      return (kills / 10) * 100;
    } else if (level === 2) {
      return ((kills - 10) / 15) * 100;
    } else if (level === 3) {
      return ((kills - 25) / 20) * 100;
    } else if (level === 4) {
      return ((kills - 45) / 30) * 100;
    }
    return 100; // Level 5 is max
  };

  const currentLevel = getLevel(killCount);
  const expProgress = getExpProgress(killCount);
  
  // Calculate stroke dash offset for circular progress (circumference = 2 * π * r)
  const radius = 67; // Radius for the experience ring (increased for larger orb)
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (expProgress / 100) * circumference;

  return (
    <div className={styles.healthOrbContainer}>
      {/* Damage Notifications */}
      {damageNotifications.map((notification, index) => (
        <DamageNotification
          key={notification.id}
          damage={notification.damage}
          index={index}
          timestamp={notification.timestamp}
          onComplete={() => handleNotificationComplete(notification.id)}
        />
      ))}
      
      {/* Experience Ring */}
      <svg className={styles.experienceRing} width="180" height="180">
        {/* Background ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgba(57, 255, 20, 0.2)"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#39ff14"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={styles.progressRing}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(57, 255, 20, 0.6))'
          }}
        />
      </svg>

      {/* Health Orb */}
      <div className={styles.orbContainer}>
        {/* Glass orb shell */}
        <div className={styles.glassOrb}>
          {/* Inner fluid container */}
          <div className={styles.fluidContainer}>
            {/* Health fluid */}
            <div 
              className={styles.healthFluid}
              style={{
                height: `${healthPercentage}%`,
                background: healthPercentage > 50 
                  ? 'linear-gradient(0deg, #ff3333, #ff6666)' 
                  : healthPercentage > 25 
                    ? 'linear-gradient(0deg, #ff8800, #ffaa44)'
                    : 'linear-gradient(0deg, #ff0000, #ff4444)',
                boxShadow: `0 0 15px ${healthPercentage > 50 ? '#ff3333' : healthPercentage > 25 ? '#ff8800' : '#ff0000'}60`,
                transition: 'height 0.3s ease-out, background 0.3s ease-out'
              }}
            />
            
            {/* Shield fluid overlay */}
            {hasShield && shieldAbsorption > 0 && (
              <div 
                className={styles.shieldFluid}
                style={{
                  height: `${shieldPercentage}%`,
                  bottom: `${healthPercentage}%`,
                }}
              />
            )}
            
            {/* Fluid surface highlight */}
            {healthPercentage > 0 && (
              <div 
                className={styles.fluidSurface}
                style={{
                  bottom: `${Math.min(healthPercentage + shieldPercentage, 100)}%`,
                }}
              />
            )}
          </div>
          
          {/* Glass highlight and shine effects */}
          <div className={styles.glassHighlight} />
          <div className={styles.glassShine} />
          
          {/* Health text overlay */}
          <div className={styles.healthText}>
            <span className={styles.healthCurrent}>
              {hasShield && shieldAbsorption > 0 ? currentHealth + shieldAbsorption : currentHealth}
            </span>
            <span className={styles.healthSeparator}>/</span>
            <span className={styles.healthMax}>{maxHealth}</span>
          </div>
        </div>
        
        {/* Orb glow effect */}
        <div className={styles.orbGlow} />
      </div>

      {/* Level Badge */}
      <div className={styles.levelBadge}>
        <span className={styles.levelText}>{currentLevel}</span>
      </div>

      {/* Kill Count Display */}
      <div className={styles.killCountBadge}>
        <span className={styles.killCountText}>{killCount}</span>
      </div>
    </div>
  );
};

export default HealthOrb;
