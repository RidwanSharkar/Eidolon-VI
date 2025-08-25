// src/Versus/AggroSystem.ts
import { Vector3 } from 'three';

export interface PlayerInfo {
  id: string;
  position: Vector3;
  name?: string;
  health?: number;
  maxHealth?: number;
}

export interface SummonedUnitInfo {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  type: 'elemental'; // Removed abyssal-abomination - they are no longer targetable
  ownerId?: string; // ID of the player who summoned this unit
}

export type TargetInfo = PlayerInfo | SummonedUnitInfo;

// Type guard to check if a target is a summoned unit
export function isSummonedUnit(target: TargetInfo): target is SummonedUnitInfo {
  return 'type' in target && (target.type === 'elemental');
}

export interface AggroEntry {
  targetId: string; // Changed from playerId to targetId to support both players and summoned units
  aggroValue: number;
  lastDamageTime: number;
  lastSeenTime: number;
  targetType: 'player' | 'summoned'; // Track what type of target this is
}

export class AggroSystem {
  private aggroTable: Map<string, AggroEntry[]> = new Map(); // enemyId -> AggroEntry[]
  private readonly AGGRO_DECAY_RATE = 0.5; // Aggro decays by 50% per second
  private readonly DISTANCE_AGGRO_FACTOR = 0.1; // Closer players get slight aggro bonus
  private readonly DAMAGE_AGGRO_MULTIPLIER = 2.0; // 2 aggro per 1 damage (increased for summoned units to be more attractive targets)
  private readonly INITIAL_AGGRO = 10; // Base aggro when first seen
  private readonly MAX_AGGRO_DISTANCE = 25; // Max distance to maintain aggro
  private readonly AGGRO_SWITCH_THRESHOLD = 5; // Minimum aggro difference to switch targets (reduced for better responsiveness)
  private readonly MEMORY_DURATION = 10000; // 10 seconds to remember players

  /**
   * Initialize aggro for an enemy
   */
  initializeEnemy(enemyId: string): void {
    if (!this.aggroTable.has(enemyId)) {
      this.aggroTable.set(enemyId, []);
    }
  }

  /**
   * Add damage-based aggro
   */
  addDamageAggro(enemyId: string, targetId: string, damage: number, targetType: 'player' | 'summoned' = 'player'): void {
    this.initializeEnemy(enemyId);
    const aggroList = this.aggroTable.get(enemyId)!;
    
    const existingEntry = aggroList.find(entry => entry.targetId === targetId);
    const now = Date.now();
    
    if (existingEntry) {
      existingEntry.aggroValue += damage * this.DAMAGE_AGGRO_MULTIPLIER;
      existingEntry.lastDamageTime = now;
      existingEntry.lastSeenTime = now;
    } else {
      aggroList.push({
        targetId,
        aggroValue: damage * this.DAMAGE_AGGRO_MULTIPLIER + this.INITIAL_AGGRO,
        lastDamageTime: now,
        lastSeenTime: now,
        targetType
      });
    }
  }

  /**
   * Add proximity-based aggro (when target is seen)
   */
  addProximityAggro(enemyId: string, targetId: string, distance: number, targetType: 'player' | 'summoned' = 'player'): void {
    this.initializeEnemy(enemyId);
    const aggroList = this.aggroTable.get(enemyId)!;
    
    const existingEntry = aggroList.find(entry => entry.targetId === targetId);
    const now = Date.now();
    const proximityAggro = Math.max(0, (this.MAX_AGGRO_DISTANCE - distance) * this.DISTANCE_AGGRO_FACTOR);
    
    if (existingEntry) {
      existingEntry.aggroValue += proximityAggro;
      existingEntry.lastSeenTime = now;
    } else {
      aggroList.push({
        targetId,
        aggroValue: this.INITIAL_AGGRO + proximityAggro,
        lastDamageTime: 0,
        lastSeenTime: now,
        targetType
      });
    }
  }

  /**
   * Get the highest aggro target for an enemy
   */
  getHighestAggroTarget(
    enemyId: string, 
    enemyPosition: Vector3, 
    availablePlayers: PlayerInfo[],
    availableSummons: SummonedUnitInfo[] = []
  ): TargetInfo | null {
    this.initializeEnemy(enemyId);
    const aggroList = this.aggroTable.get(enemyId)!;
    
    const allTargets = [...availablePlayers, ...availableSummons];
    
    if (aggroList.length === 0 || allTargets.length === 0) {
      // No aggro entries, target closest target
      return this.getClosestTarget(enemyPosition, allTargets);
    }

    // Update aggro for all visible targets and decay old entries
    this.updateAggro(enemyId, enemyPosition, availablePlayers, availableSummons);

    // Find the target with highest aggro who is still available
    let highestAggroEntry: AggroEntry | null = null;
    let highestAggroTarget: TargetInfo | null = null;

    for (const entry of aggroList) {
      const target = allTargets.find(t => t.id === entry.targetId);
      if (!target) continue; // Target not available

      const distance = enemyPosition.distanceTo(target.position);
      if (distance > this.MAX_AGGRO_DISTANCE) continue; // Too far away

      // Check if summoned unit is still alive
      if (isSummonedUnit(target) && target.health <= 0) continue;

      if (!highestAggroEntry || entry.aggroValue > highestAggroEntry.aggroValue + this.AGGRO_SWITCH_THRESHOLD) {
        highestAggroEntry = entry;
        highestAggroTarget = target;
      }
    }

    // If no valid aggro target, fall back to closest target
    return highestAggroTarget || this.getClosestTarget(enemyPosition, allTargets);
  }

  /**
   * Update aggro values (decay over time, add proximity aggro)
   */
  private updateAggro(enemyId: string, enemyPosition: Vector3, availablePlayers: PlayerInfo[], availableSummons: SummonedUnitInfo[] = []): void {
    const aggroList = this.aggroTable.get(enemyId)!;
    const now = Date.now();
    const deltaTime = 1; // Assume 1 second for simplicity (this should be called regularly)

    // Update aggro for all available players
    for (const player of availablePlayers) {
      const distance = enemyPosition.distanceTo(player.position);
      
      if (distance <= this.MAX_AGGRO_DISTANCE) {
        this.addProximityAggro(enemyId, player.id, distance, 'player');
      }
    }

    // Update aggro for all available summoned units
    for (const summon of availableSummons) {
      if (summon.health > 0) { // Only consider alive summoned units
        const distance = enemyPosition.distanceTo(summon.position);
        
        if (distance <= this.MAX_AGGRO_DISTANCE) {
          this.addProximityAggro(enemyId, summon.id, distance, 'summoned');
        }
      }
    }

    // Decay aggro over time and remove old entries
    for (let i = aggroList.length - 1; i >= 0; i--) {
      const entry = aggroList[i];
      
      // Decay aggro
      entry.aggroValue *= Math.pow(1 - this.AGGRO_DECAY_RATE, deltaTime);
      
      // Remove entries that are too old or have too little aggro
      const timeSinceLastSeen = now - entry.lastSeenTime;
      if (timeSinceLastSeen > this.MEMORY_DURATION || entry.aggroValue < 1) {
        aggroList.splice(i, 1);
      }
    }
  }

  /**
   * Get closest target as fallback
   */
  private getClosestTarget(enemyPosition: Vector3, availableTargets: TargetInfo[]): TargetInfo | null {
    if (availableTargets.length === 0) return null;

    let closestTarget = availableTargets[0];
    let closestDistance = enemyPosition.distanceTo(closestTarget.position);

    for (let i = 1; i < availableTargets.length; i++) {
      const target = availableTargets[i];
      
      // Skip dead summoned units
      if (isSummonedUnit(target) && target.health <= 0) continue;
      
      const distance = enemyPosition.distanceTo(target.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    }

    // If closest target is a dead summoned unit, return null
    if (isSummonedUnit(closestTarget) && closestTarget.health <= 0) {
      return null;
    }

    return closestTarget;
  }

  /**
   * Remove enemy from aggro system (when enemy dies)
   */
  removeEnemy(enemyId: string): void {
    this.aggroTable.delete(enemyId);
  }

  /**
   * Remove target from all aggro tables (when player leaves or summoned unit dies)
   */
  removeTarget(targetId: string): void {
    for (const [enemyId, aggroList] of this.aggroTable.entries()) {
      const filteredList = aggroList.filter(entry => entry.targetId !== targetId);
      this.aggroTable.set(enemyId, filteredList);
    }
  }

  /**
   * Remove player from all aggro tables (when player leaves) - kept for backward compatibility
   */
  removePlayer(playerId: string): void {
    this.removeTarget(playerId);
  }

  /**
   * Get current aggro information for debugging
   */
  getAggroInfo(enemyId: string): AggroEntry[] {
    return this.aggroTable.get(enemyId) || [];
  }

  /**
   * Clear all aggro data
   */
  clear(): void {
    this.aggroTable.clear();
  }
}

// Global aggro system instance
export const globalAggroSystem = new AggroSystem();

