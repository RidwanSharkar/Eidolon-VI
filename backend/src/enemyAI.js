class EnemyAI {
  constructor(roomId, io) {
    this.roomId = roomId;
    this.io = io;
    this.aggroTable = new Map(); // enemyId -> Map<playerId, aggroValue>
    this.lastUpdate = Date.now();
    this.updateInterval = 1000 / 20; // 20 FPS server updates
    this.gameLoop = null;
    
    // Enemy AI constants - speeds adjusted to match single player feel
    this.ENEMY_CONFIGS = {
      skeleton: {
        attackRange: 2.65, // Match single player ATTACK_RANGE
        attackCooldown: 2000, // Match single player ATTACK_COOLDOWN
        chargeDuration: 1000, // Match single player CHARGE_DURATION
        movementSpeed: 0.0363, // 2.6 / 60 = 0.0433 (matches single player BASE_MOVEMENT_SPEED = 2.6)
        attackDamage: 6, // Match single player ATTACK_DAMAGE
        separationRadius: 2.5, // Match single player SEPARATION_RADIUS
        separationForce: 0.175,
        wanderRadius: 6,
        wanderSpeed: 0.0108, // 2.6 * 0.25 / 60 = 0.0108 (matches single player wander speed)
        wanderDuration: 4500 // Match single player WANDER_DURATION
      },
      mage: {
        attackRange: 20,
        attackCooldown: 6750,
        movementSpeed: 0.0275, // 2.25 / 60 = 0.0375 (matches single player BASE_MOVEMENT_SPEED = 2.25)
        attackDamage: 3,
        separationRadius: 1.25,
        separationForce: 0.125,
        wanderRadius: 5,
        wanderSpeed: 0.01125, // 2.25 * 0.3 / 60 = 0.01125 (matches single player wander speed)
        wanderDuration: 1500,
        // Fireball special ability
        fireballCooldown: 4550,
        fireballSpeed: 0.15,
        fireballDamage: 6,
        // Lightning strike special ability
        lightningCooldown: 12000,
        lightningDamage: 8,
        lightningWarningDuration: 2.0,
        lightningDamageRadius: 2.0
      },
      abomination: {
        attackRange: 3.05,
        attackCooldown: 2100,
        movementSpeed: 0.0295, // 2.25 / 60 = 0.0375 (matches single player BASE_MOVEMENT_SPEED = 2.25)
        attackDamage: 7,
        separationRadius: 3,
        separationForce: 0.25,
        wanderRadius: 6,
        wanderSpeed: 0.01125, // 2.25 * 0.3 / 60 = 0.01125 (matches single player wander speed)
        wanderDuration: 1500,
        // Multi-arm attack special ability
        totalArms: 6,
        armDelay: 300,
        armDamage: 3,
        // Leap special ability
        leapCooldown: 12000,
        leapRange: 8.0,
        leapDamage: 10
      },
      reaper: {
        attackRange: 3.5,
        attackCooldown: 2500,
        movementSpeed: 0.0185, // 1.35 / 60 = 0.0225 (matches single player BASE_MOVEMENT_SPEED = 1.35)
        attackDamage: 6,
        separationRadius: 2.25,
        separationForce: 0.25,
        wanderRadius: 7,
        wanderSpeed: 0.005625, // 1.35 * 0.25 / 60 = 0.005625 (matches single player wander speed)
        wanderDuration: 1500,
        // Re-emerge special ability
        reEmergeCooldown: 8000,
        reEmergeRange: 0, // Distance behind player to emerge
        backstabDamage: 12
      },
      'death-knight': {
        attackRange: 3.0,
        attackCooldown: 2000,
        movementSpeed: 0.0333, // 2.5 / 60 = 0.0417 (matches single player BASE_MOVEMENT_SPEED = 2.5)
        attackDamage: 5,
        separationRadius: 2.0,
        separationForce: 0.2,
        wanderRadius: 6,
        wanderSpeed: 0.00833, // 2.5 * 0.2 / 60 = 0.00833 (matches single player wander speed)
        wanderDuration: 1500,
        // Death Grasp special ability
        deathGraspCooldown: 6000,
        deathGraspRange: 8.0,
        deathGraspDamage: 8,
        // Frost Strike special ability
        frostStrikeCooldown: 8000,
        frostStrikeRange: 6.0,
        frostStrikeDamage: 7
      },
      ascendant: {
        attackRange: 4.0,
        attackCooldown: 1800,
        movementSpeed: 0.02, // 2.4 / 60 = 0.04 (matches single player BASE_MOVEMENT_SPEED = 2.4)
        attackDamage: 6,
        separationRadius: 2.5,
        separationForce: 0.225,
        wanderRadius: 7,
        wanderSpeed: 0.012, // 2.4 * 0.3 / 60 = 0.012 (matches single player wander speed)
        wanderDuration: 1500,
        // Archon Lightning special ability
        archonLightningCooldown: 7000,
        archonLightningRange: 12.0,
        archonLightningDamage: 9,
        // Blink special ability
        blinkCooldown: 10000,
        blinkRange: 15.0,
        // Force Pulse special ability
        forcePulseCooldown: 5000,
        forcePulseRange: 8.0,
        forcePulseDamage: 8
      },
      'fallen-titan': {
        attackRange: 4.0,
        attackCooldown: 2500,
        movementSpeed: 0.02, // 2.1 / 60 = 0.035 (matches single player BASE_MOVEMENT_SPEED = 2.1)
        attackDamage: 52,
        separationRadius: 2.5,
        separationForce: 0.15,
        wanderRadius: 6,
        wanderSpeed: 0.00525, // 2.1 * 0.15 / 60 = 0.00525 (matches single player wander speed)
        wanderDuration: 1500
      }
    };
  }

  startAI() {
    if (this.gameLoop) return;
    
    this.gameLoop = setInterval(() => {
      this.updateEnemies();
    }, this.updateInterval);
    
    console.log(`🧠 Enemy AI started for room ${this.roomId}`);
  }

  stopAI() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
      console.log(`🧠 Enemy AI stopped for room ${this.roomId}`);
    }
  }

  updateEnemies() {
    const room = this.getRoom();
    if (!room) return;

    const enemies = room.getEnemies();
    const players = room.getPlayers();
    
    if (enemies.length === 0 || players.length === 0) return;

    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    const updatedEnemies = [];

    enemies.forEach(enemy => {
      if (enemy.isDying) return;

      const config = this.ENEMY_CONFIGS[enemy.type];
      if (!config) return;

      // Check status effects
      const room = this.getRoom();
      const isStunned = room && room.isEnemyAffectedBy(enemy.id, 'stun');
      const isFrozen = room && room.isEnemyAffectedBy(enemy.id, 'freeze');
      const isSlowed = room && room.isEnemyAffectedBy(enemy.id, 'slow');

      // Find target player using aggro system
      const targetPlayer = this.getHighestAggroPlayer(enemy.id, enemy.position, players);
      if (!targetPlayer) return;

      const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
      
      // Check if any player is stealthed (simplified - in real game would check stealth system)
      const isPlayerStealthed = false; // TODO: Implement stealth detection
      
      // Update enemy state
      const enemyUpdate = {
        id: enemy.id,
        position: { ...enemy.position },
        rotation: enemy.rotation || 0,
        targetPlayerId: targetPlayer.id,
        isMoving: false,
        isAttacking: false,
        isCharging: false,
        isStunned: isStunned || false,
        isFrozen: isFrozen || false,
        isSlowed: isSlowed || false,
        timestamp: now
      };

      // Skip AI updates if stunned or frozen
      if (isStunned || isFrozen) {
        enemyUpdate.isMoving = false;
        enemyUpdate.isAttacking = false;
      } else if (isPlayerStealthed) {
        // Wander behavior when player is stealthed
        this.handleWandering(enemy, config, deltaTime, enemyUpdate);
      } else {
        // Check if enemy is currently charging (for enemies that use charging system)
        const isCurrentlyCharging = enemy.chargingState && enemy.chargingState.isCharging;
        
        // Check for special abilities first
        const shouldUseSpecialAbility = this.checkSpecialAbility(enemy, targetPlayer, config, now, enemyUpdate);
        
        if (!shouldUseSpecialAbility) {
          // Normal AI behavior - but don't move if currently charging
          if (distanceToPlayer > config.attackRange && !isCurrentlyCharging) {
            // Move towards player (with slow effect if applicable)
            this.handleMovement(enemy, targetPlayer, config, deltaTime, enemyUpdate, enemies, isSlowed);
          } else {
            // Attack player (this handles charging logic internally)
            this.handleAttack(enemy, targetPlayer, config, now, enemyUpdate);
          }
        }
      }

      updatedEnemies.push(enemyUpdate);
    });

    // Broadcast enemy updates to all players in the room
    if (updatedEnemies.length > 0) {
      this.io.to(this.roomId).emit('enemies-updated', {
        enemies: updatedEnemies,
        timestamp: now
      });
    }
  }

  // Aggro system methods
  addDamageAggro(enemyId, playerId, damage) {
    if (!this.aggroTable.has(enemyId)) {
      this.aggroTable.set(enemyId, new Map());
    }
    
    const enemyAggro = this.aggroTable.get(enemyId);
    const currentAggro = enemyAggro.get(playerId) || 0;
    enemyAggro.set(playerId, currentAggro + damage * 2); // 2 aggro per damage
  }

  addProximityAggro(enemyId, playerId, distance) {
    if (!this.aggroTable.has(enemyId)) {
      this.aggroTable.set(enemyId, new Map());
    }
    
    const enemyAggro = this.aggroTable.get(enemyId);
    const currentAggro = enemyAggro.get(playerId) || 0;
    const proximityAggro = Math.max(0, (25 - distance) * 0.1); // Closer = more aggro
    enemyAggro.set(playerId, currentAggro + proximityAggro);
  }

  getHighestAggroPlayer(enemyId, enemyPosition, players) {
    if (!this.aggroTable.has(enemyId) || players.length === 0) {
      return this.findClosestPlayer(enemyPosition, players);
    }
    
    const enemyAggro = this.aggroTable.get(enemyId);
    let highestAggroPlayer = null;
    let highestAggro = 0;
    
    // Add proximity aggro for all players
    for (const player of players) {
      const distance = this.calculateDistance(enemyPosition, player.position);
      this.addProximityAggro(enemyId, player.id, distance);
    }
    
    // Find player with highest aggro
    for (const player of players) {
      const aggro = enemyAggro.get(player.id) || 0;
      if (aggro > highestAggro) {
        highestAggro = aggro;
        highestAggroPlayer = player;
      }
    }
    
    // If no aggro found, fall back to closest player
    return highestAggroPlayer || this.findClosestPlayer(enemyPosition, players);
  }

  removeEnemyAggro(enemyId) {
    this.aggroTable.delete(enemyId);
  }

  findClosestPlayer(enemyPosition, players) {
    let closestPlayer = null;
    let closestDistance = Infinity;

    players.forEach(player => {
      const distance = this.calculateDistance(enemyPosition, player.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlayer = player;
      }
    });

    return closestPlayer;
  }

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  handleMovement(enemy, targetPlayer, config, deltaTime, enemyUpdate, allEnemies, isSlowed = false) {
    enemyUpdate.isMoving = true;

    // Calculate direction to player
    const direction = this.normalize({
      x: targetPlayer.position.x - enemy.position.x,
      z: targetPlayer.position.z - enemy.position.z
    });

    // Calculate separation force from other enemies
    const separationForce = this.calculateSeparationForce(enemy, allEnemies, config);

    // Combine forces
    const finalDirection = this.normalize({
      x: direction.x + separationForce.x,
      z: direction.z + separationForce.z
    });

    // Update position with slow effect
    let speed = config.movementSpeed * 60 * deltaTime; // Convert to per-second
    if (isSlowed) {
      speed *= 0.5; // Reduce speed by 50% when slowed
    }
    enemy.position.x += finalDirection.x * speed;
    enemy.position.z += finalDirection.z * speed;
    enemy.position.y = 0; // Keep on ground

    // Update rotation
    enemy.rotation = Math.atan2(finalDirection.x, finalDirection.z);

    // Copy to update object
    enemyUpdate.position = { ...enemy.position };
    enemyUpdate.rotation = enemy.rotation;
  }

  handleWandering(enemy, config, deltaTime, enemyUpdate) {
    enemyUpdate.isMoving = true;

    // Initialize wander target if needed
    if (!enemy.wanderTarget || !enemy.wanderStartTime) {
      enemy.wanderTarget = this.generateWanderTarget(enemy.position, config.wanderRadius);
      enemy.wanderStartTime = Date.now();
    }

    // Check if need new wander target
    if (Date.now() - enemy.wanderStartTime > config.wanderDuration) {
      enemy.wanderTarget = this.generateWanderTarget(enemy.position, config.wanderRadius);
      enemy.wanderStartTime = Date.now();
    }

    // Move towards wander target
    const direction = this.normalize({
      x: enemy.wanderTarget.x - enemy.position.x,
      z: enemy.wanderTarget.z - enemy.position.z
    });

    const speed = config.wanderSpeed * 60 * deltaTime;
    enemy.position.x += direction.x * speed;
    enemy.position.z += direction.z * speed;
    enemy.position.y = 0;

    enemy.rotation = Math.atan2(direction.x, direction.z);

    enemyUpdate.position = { ...enemy.position };
    enemyUpdate.rotation = enemy.rotation;
  }

  generateWanderTarget(currentPosition, radius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    return {
      x: currentPosition.x + Math.cos(angle) * distance,
      z: currentPosition.z + Math.sin(angle) * distance,
      y: 0
    };
  }

  handleAttack(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    enemyUpdate.isAttacking = false;

    // Check attack cooldown
    if (!enemy.lastAttackTime) {
      enemy.lastAttackTime = currentTime - config.attackCooldown; // Allow immediate first attack
    }

    // Handle charging system for enemies that use it (matches single player)
    if (enemy.type === 'skeleton') {
      this.handleSkeletonAttack(enemy, targetPlayer, config, currentTime, enemyUpdate);
    } else if (enemy.type === 'death-knight') {
      this.handleDeathKnightAttack(enemy, targetPlayer, config, currentTime, enemyUpdate);
    } else if (enemy.type === 'ascendant') {
      this.handleAscendantAttack(enemy, targetPlayer, config, currentTime, enemyUpdate);
    } else {
      // Other enemy types use the original attack system
      if (currentTime - enemy.lastAttackTime >= config.attackCooldown) {
        enemyUpdate.isAttacking = true;
        enemy.lastAttackTime = currentTime;

        // Schedule damage after animation delay
        setTimeout(() => {
          this.performSingleTargetAttack(enemy, targetPlayer, config);
        }, this.getAttackDelay(enemy.type));
      }
    }
  }

  handleSkeletonAttack(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Initialize charging state if not present
    if (!enemy.chargingState) {
      enemy.chargingState = {
        isCharging: false,
        chargeStartTime: 0,
        targetPosition: null
      };
    }

    const { isCharging, chargeStartTime } = enemy.chargingState;

    // Start charging if not already charging and cooldown is ready
    if (!isCharging && !enemyUpdate.isAttacking && currentTime - enemy.lastAttackTime >= config.attackCooldown) {
      // Start charging phase
      enemy.chargingState.isCharging = true;
      enemy.chargingState.chargeStartTime = currentTime;
      enemy.chargingState.targetPosition = { ...targetPlayer.position };
      enemy.lastAttackTime = currentTime;
      
      // Broadcast charging indicator to all players
      this.io.to(this.roomId).emit('enemy-charging', {
        enemyId: enemy.id,
        startPosition: { ...enemy.position },
        targetPosition: { ...targetPlayer.position },
        chargeDuration: config.chargeDuration,
        attackRange: config.attackRange,
        timestamp: currentTime
      });
      
      console.log(`⚡ Skeleton ${enemy.id} started charging attack`);
    }
    
    // Handle charging completion
    if (isCharging && currentTime - chargeStartTime >= config.chargeDuration) {
      // Charging complete, start attack animation
      enemy.chargingState.isCharging = false;
      enemyUpdate.isAttacking = true;
      
      // Store target position before it gets cleared
      const attackTargetPosition = enemy.chargingState.targetPosition;
      
      // Broadcast attack start (for slash effect) - only if we have a valid target
      if (attackTargetPosition) {
        this.io.to(this.roomId).emit('enemy-attack-start', {
          enemyId: enemy.id,
          attackType: 'skeleton',
          startPosition: { ...enemy.position },
          targetPosition: attackTargetPosition,
          timestamp: currentTime
        });
      }
      
      // Perform immediate damage check with avoidance logic (matches single player timing)
      setTimeout(() => {
        // Get all players in the room at the moment of impact
        const room = this.getRoom();
        if (!room) return;
        
        // Check if we still have a valid target position
        if (!attackTargetPosition) {
          console.log(`⚔️ Skeleton ${enemy.id} attack cancelled - no valid target position`);
          return;
        }
        
        const allPlayers = room.getPlayers();
        const attackAngle = Math.PI * 0.6; // 60 degree cone attack (matches single player)
        const attackStartPosition = { ...enemy.position };
        
        // Calculate attack direction towards the original target
        const attackDirection = this.normalize({
          x: attackTargetPosition.x - attackStartPosition.x,
          z: attackTargetPosition.z - attackStartPosition.z
        });
        
        let playersHit = 0;
        
        // Check all players for cone damage at the precise moment of impact
        allPlayers.forEach(player => {
          // Get CURRENT player position (not position from when attack started)
          const currentPlayer = room.getPlayer(player.id);
          if (!currentPlayer) return;

          const distanceToPlayer = this.calculateDistance(attackStartPosition, currentPlayer.position);
          
          // Check if player is within attack range at the moment of impact
          if (distanceToPlayer <= config.attackRange) {
            // Calculate direction to current player position
            const playerDirection = this.normalize({
              x: currentPlayer.position.x - attackStartPosition.x,
              z: currentPlayer.position.z - attackStartPosition.z
            });
            
            // Calculate angle between attack direction and current player direction
            const dotProduct = attackDirection.x * playerDirection.x + attackDirection.z * playerDirection.z;
            const angleToPlayer = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
            
            // Check if player is within the attack cone at the moment of impact
            if (angleToPlayer <= attackAngle / 2) {
              // Deal damage to this player
              room.updatePlayerHealth(player.id, currentPlayer.health - config.attackDamage);
              
              // Broadcast attack event for this player
              this.io.to(this.roomId).emit('enemy-attacked-player', {
                enemyId: enemy.id,
                targetPlayerId: player.id,
                damage: config.attackDamage,
                attackType: 'skeleton-area',
                newPlayerHealth: currentPlayer.health - config.attackDamage,
                timestamp: Date.now(),
                startPosition: attackStartPosition,
                targetPosition: { ...currentPlayer.position }
              });
              
              console.log(`⚔️ Skeleton ${enemy.id} area attack hit player ${player.id} for ${config.attackDamage} damage (distance: ${distanceToPlayer.toFixed(2)}, angle: ${(angleToPlayer * 180 / Math.PI).toFixed(1)}°)`);
              playersHit++;
            } else {
              console.log(`⚔️ Skeleton ${enemy.id} area attack avoided by player ${player.id} - moved outside cone (angle: ${(angleToPlayer * 180 / Math.PI).toFixed(1)}°)`);
            }
          } else {
            console.log(`⚔️ Skeleton ${enemy.id} area attack avoided by player ${player.id} - moved out of range (distance: ${distanceToPlayer.toFixed(2)})`);
          }
        });
        
        if (playersHit === 0) {
          console.log(`⚔️ Skeleton ${enemy.id} area attack completely avoided - all players evaded successfully`);
        }
        
        // Reset attack state after damage is processed
        setTimeout(() => {
          // Reset the enemy's internal state (not enemyUpdate which is temporary)
          if (enemy.chargingState) {
            enemy.chargingState.targetPosition = null;
          }
          // Mark that attack animation is complete
          enemy.attackAnimationComplete = true;
        }, 500); // Additional time for attack animation to complete
      }, this.getAttackDelay(enemy.type));
      
      console.log(`⚔️ Skeleton ${enemy.id} completed charge, starting attack`);
    }
    
    // Check if attack animation completed and reset state
    if (enemy.attackAnimationComplete) {
      enemy.attackAnimationComplete = false;
      enemyUpdate.isAttacking = false;
    }
    
    // Update enemy state based on charging
    if (isCharging) {
      enemyUpdate.isMoving = false; // Stop moving while charging
      enemyUpdate.isCharging = true;
    }
  }

  handleDeathKnightAttack(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Initialize charging state if not present
    if (!enemy.chargingState) {
      enemy.chargingState = {
        isCharging: false,
        chargeStartTime: 0,
        targetPosition: null
      };
    }

    const { isCharging, chargeStartTime } = enemy.chargingState;

    // Start charging if not already charging and cooldown is ready
    if (!isCharging && !enemyUpdate.isAttacking && currentTime - enemy.lastAttackTime >= config.attackCooldown) {
      // Start charging phase
      enemy.chargingState.isCharging = true;
      enemy.chargingState.chargeStartTime = currentTime;
      enemy.chargingState.targetPosition = { ...targetPlayer.position };
      enemy.lastAttackTime = currentTime;
      
      // Set enemy as charging for movement stopping
      enemyUpdate.isCharging = true;
      enemyUpdate.isMoving = false; // Stop movement during charge
      
      // Broadcast charging indicator to all players
      this.io.to(this.roomId).emit('enemy-charging', {
        enemyId: enemy.id,
        startPosition: { ...enemy.position },
        targetPosition: { ...targetPlayer.position },
        chargeDuration: 1100, // Death Knight charge duration
        attackRange: config.attackRange,
        timestamp: currentTime
      });
      
      console.log(`⚡ Death Knight ${enemy.id} started charging attack with damage avoidance`);
    }
    
    // Handle charging completion
    if (isCharging && currentTime - chargeStartTime >= 1100) { // Death Knight charge duration
      // Charging complete, start attack animation
      enemy.chargingState.isCharging = false;
      enemyUpdate.isAttacking = true;
      
      // Store target position before it gets cleared
      const attackTargetPosition = enemy.chargingState.targetPosition;
      
      // Broadcast attack start (for slash effect) - only if we have a valid target
      if (attackTargetPosition) {
        this.io.to(this.roomId).emit('enemy-attack-start', {
          enemyId: enemy.id,
          attackType: 'death-knight',
          startPosition: { ...enemy.position },
          targetPosition: attackTargetPosition,
          timestamp: currentTime
        });
      }
      
      // Perform damage check with avoidance logic after attack delay
      setTimeout(() => {
        // Get all players in the room at the moment of impact
        const room = this.getRoom();
        if (!room) return;
        
        const allPlayers = room.getPlayers();
        const attackAngle = Math.PI * 0.7; // 70 degree cone attack (wider than skeleton)
        const attackStartPosition = { ...enemy.position };
        
        // Calculate attack direction towards the original target
        const attackDirection = this.normalize({
          x: attackTargetPosition.x - attackStartPosition.x,
          z: attackTargetPosition.z - attackStartPosition.z
        });
        
        let playersHit = 0;
        
        // Check all players for cone damage at the precise moment of impact
        allPlayers.forEach(player => {
          // Get CURRENT player position (not position from when attack started)
          const currentPlayer = room.getPlayer(player.id);
          if (!currentPlayer) return;

          const distanceToPlayer = this.calculateDistance(attackStartPosition, currentPlayer.position);
          
          // Check if player is within attack range at the moment of impact
          if (distanceToPlayer <= config.attackRange) {
            // Calculate direction to current player position
            const playerDirection = this.normalize({
              x: currentPlayer.position.x - attackStartPosition.x,
              z: currentPlayer.position.z - attackStartPosition.z
            });
            
            // Calculate angle between attack direction and current player direction
            const dotProduct = attackDirection.x * playerDirection.x + attackDirection.z * playerDirection.z;
            const angleToPlayer = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
            
            // Check if player is within the attack cone at the moment of impact
            if (angleToPlayer <= attackAngle / 2) {
              // Deal damage to this player
              room.updatePlayerHealth(player.id, currentPlayer.health - config.attackDamage);
              
              // Broadcast attack event for this player
              this.io.to(this.roomId).emit('enemy-attacked-player', {
                enemyId: enemy.id,
                targetPlayerId: player.id,
                damage: config.attackDamage,
                attackType: 'death-knight-area',
                newPlayerHealth: currentPlayer.health - config.attackDamage,
                timestamp: Date.now(),
                startPosition: attackStartPosition,
                targetPosition: { ...currentPlayer.position }
              });
              
              console.log(`⚔️ Death Knight ${enemy.id} area attack hit player ${player.id} for ${config.attackDamage} damage (distance: ${distanceToPlayer.toFixed(2)}, angle: ${(angleToPlayer * 180 / Math.PI).toFixed(1)}°)`);
              playersHit++;
            } else {
              console.log(`⚔️ Death Knight ${enemy.id} area attack avoided by player ${player.id} - moved outside cone (angle: ${(angleToPlayer * 180 / Math.PI).toFixed(1)}°)`);
            }
          } else {
            console.log(`⚔️ Death Knight ${enemy.id} area attack avoided by player ${player.id} - moved out of range (distance: ${distanceToPlayer.toFixed(2)})`);
          }
        });
        
        if (playersHit === 0) {
          console.log(`⚔️ Death Knight ${enemy.id} area attack completely avoided - all players evaded successfully`);
        }
        
        // Reset attack state after damage is processed
        setTimeout(() => {
          // Reset the enemy's internal state (not enemyUpdate which is temporary)
          if (enemy.chargingState) {
            enemy.chargingState.targetPosition = null;
          }
          // Mark that attack animation is complete
          enemy.attackAnimationComplete = true;
        }, 500); // Additional time for attack animation to complete
      }, 1100); // Death Knight attack delay
      
      console.log(`⚔️ Death Knight ${enemy.id} completed charge, starting attack`);
    }
    
    // Check if attack animation completed and reset state
    if (enemy.attackAnimationComplete) {
      enemy.attackAnimationComplete = false;
      enemyUpdate.isAttacking = false;
    }
    
    // Update enemy state based on charging
    if (isCharging) {
      enemyUpdate.isMoving = false; // Stop moving while charging
      enemyUpdate.isCharging = true;
    }
  }

  handleAscendantAttack(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Initialize charging state if not present
    if (!enemy.chargingState) {
      enemy.chargingState = {
        isCharging: false,
        chargeStartTime: 0,
        targetPosition: null
      };
    }

    const { isCharging, chargeStartTime } = enemy.chargingState;

    // Start charging if not already charging and cooldown is ready
    if (!isCharging && !enemyUpdate.isAttacking && currentTime - enemy.lastAttackTime >= config.attackCooldown) {
      // Start charging phase
      enemy.chargingState.isCharging = true;
      enemy.chargingState.chargeStartTime = currentTime;
      enemy.chargingState.targetPosition = { ...targetPlayer.position };
      enemy.lastAttackTime = currentTime;
      
      // Set enemy as charging for movement stopping
      enemyUpdate.isCharging = true;
      enemyUpdate.isMoving = false; // Stop movement during charge
      
      // Broadcast charging indicator to all players
      this.io.to(this.roomId).emit('enemy-charging', {
        enemyId: enemy.id,
        startPosition: { ...enemy.position },
        targetPosition: { ...targetPlayer.position },
        chargeDuration: 1000, // Ascendant charge duration
        attackRange: config.attackRange,
        timestamp: currentTime
      });
      
      console.log(`⚡ Ascendant ${enemy.id} started charging attack with damage avoidance`);
    }
    
    // Handle charging completion
    if (isCharging && currentTime - chargeStartTime >= 1000) { // Ascendant charge duration
      // Charging complete, start attack animation
      enemy.chargingState.isCharging = false;
      enemyUpdate.isAttacking = true;
      
      // Store target position before it gets cleared
      const attackTargetPosition = enemy.chargingState.targetPosition;
      
      // Broadcast attack start (for lightning effect) - only if we have a valid target
      if (attackTargetPosition) {
        this.io.to(this.roomId).emit('enemy-attack-start', {
          enemyId: enemy.id,
          attackType: 'ascendant',
          startPosition: { ...enemy.position },
          targetPosition: attackTargetPosition,
          timestamp: currentTime
        });
      }
      
      // Perform single target attack with avoidance logic after attack delay
      setTimeout(() => {
        // Get the target player at the moment of impact
        const room = this.getRoom();
        if (!room) return;
        
        const currentPlayer = room.getPlayer(targetPlayer.id);
        if (!currentPlayer) return;

        const attackStartPosition = { ...enemy.position };
        const distanceToPlayer = this.calculateDistance(attackStartPosition, currentPlayer.position);
        
        // Check if player is within attack range at the moment of impact
        if (distanceToPlayer <= config.attackRange) {
          // Deal damage to player
          room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.attackDamage);
          
          // Broadcast attack event
          this.io.to(this.roomId).emit('enemy-attacked-player', {
            enemyId: enemy.id,
            targetPlayerId: targetPlayer.id,
            damage: config.attackDamage,
            attackType: 'ascendant-lightning',
            newPlayerHealth: currentPlayer.health - config.attackDamage,
            timestamp: Date.now(),
            startPosition: attackStartPosition,
            targetPosition: { ...currentPlayer.position }
          });
          
          console.log(`⚔️ Ascendant ${enemy.id} lightning attack hit player ${targetPlayer.id} for ${config.attackDamage} damage (distance: ${distanceToPlayer.toFixed(2)})`);
        } else {
          console.log(`⚔️ Ascendant ${enemy.id} lightning attack avoided by player ${targetPlayer.id} - moved out of range (distance: ${distanceToPlayer.toFixed(2)})`);
        }
        
        // Reset attack state after damage is processed
        setTimeout(() => {
          // Reset the enemy's internal state (not enemyUpdate which is temporary)
          if (enemy.chargingState) {
            enemy.chargingState.targetPosition = null;
          }
          // Mark that attack animation is complete
          enemy.attackAnimationComplete = true;
        }, 500); // Additional time for attack animation to complete
      }, 1000); // Ascendant attack delay
      
      console.log(`⚔️ Ascendant ${enemy.id} completed charge, starting lightning attack`);
    }
    
    // Check if attack animation completed and reset state
    if (enemy.attackAnimationComplete) {
      enemy.attackAnimationComplete = false;
      enemyUpdate.isAttacking = false;
    }
    
    // Update enemy state based on charging
    if (isCharging) {
      enemyUpdate.isMoving = false; // Stop moving while charging
      enemyUpdate.isCharging = true;
    }
  }

  checkSpecialAbility(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    switch (enemy.type) {
      case 'reaper':
        return this.handleReaperReEmerge(enemy, targetPlayer, config, currentTime, enemyUpdate);
      case 'mage':
        return this.handleMageAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate);
      case 'abomination':
        return this.handleAbominationAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate);
      case 'death-knight':
        return this.handleDeathKnightAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate);
      case 'ascendant':
        return this.handleAscendantAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate);
      default:
        return false;
    }
  }

  handleReaperReEmerge(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Initialize re-emerge timer if needed
    if (!enemy.lastReEmergeTime) {
      enemy.lastReEmergeTime = currentTime - config.reEmergeCooldown; // Allow immediate first re-emerge
    }

    // Check if re-emerge is ready
    if (currentTime - enemy.lastReEmergeTime >= config.reEmergeCooldown) {
      console.log(`🌪️ Reaper ${enemy.id} using Re-emerge ability`);
      
      enemy.lastReEmergeTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Calculate position behind closest player
      const behindPosition = this.calculatePositionBehindPlayer(targetPlayer, config.reEmergeRange);
      
      // Teleport to behind player
      enemy.position = { ...behindPosition };
      enemyUpdate.position = { ...behindPosition };
      
      // Face the player for backstab
      const directionToPlayer = this.normalize({
        x: targetPlayer.position.x - behindPosition.x,
        z: targetPlayer.position.z - behindPosition.z
      });
      enemy.rotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      enemyUpdate.rotation = enemy.rotation;

      // Broadcast re-emerge event to all clients
      this.io.to(this.roomId).emit('reaper-re-emerged', {
        enemyId: enemy.id,
        newPosition: behindPosition,
        targetPlayerId: targetPlayer.id,
        timestamp: currentTime
      });
      
      // Also emit mist effect at the original position
      this.io.to(this.roomId).emit('reaper-mist-effect', {
        enemyId: enemy.id,
        startPosition: { ...enemy.position }, // Original position before teleport
        timestamp: currentTime
      });

      // Schedule backstab attack after brief emergence animation
      setTimeout(() => {
        this.performReaperBackstab(enemy, targetPlayer, config);
      }, 600); // 600ms emergence animation

      return true; // Used special ability
    }

    return false; // Special ability not ready
  }

  calculatePositionBehindPlayer(player, distance) {
    // Calculate a position directly behind the player
    // Use a simple offset approach - place reaper 1 unit behind in negative Z direction
    return {
      x: player.position.x,
      y: 0,
      z: player.position.z - distance
    };
  }

  performReaperBackstab(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Check if still in backstab range
    const currentDistance = this.calculateDistance(enemy.position, currentPlayer.position);
    if (currentDistance <= config.attackRange * 1.1) { // Slightly larger range for backstab
      // Deal backstab damage
      room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.backstabDamage);
      
      // Broadcast backstab attack
      this.io.to(this.roomId).emit('enemy-attacked-player', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        damage: config.backstabDamage,
        attackType: 'reaper-backstab',
        newPlayerHealth: currentPlayer.health - config.backstabDamage,
        timestamp: Date.now(),
        startPosition: { ...enemy.position },
        targetPosition: { ...currentPlayer.position }
      });

      console.log(`🗡️ Reaper ${enemy.id} backstab hit player ${targetPlayer.id} for ${config.backstabDamage} damage`);
    }
  }

  handleMageAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Check if either ability is ready
    const canCastFireball = this.canCastFireball(enemy, config, currentTime);
    const canCastLightning = this.canCastLightning(enemy, config, currentTime);
    
    if (!canCastFireball && !canCastLightning) {
      return false; // No abilities ready
    }
    
    // If both are ready, choose randomly (50/50 chance)
    if (canCastFireball && canCastLightning) {
      if (Math.random() < 0.5) {
        return this.handleMageFireball(enemy, targetPlayer, config, currentTime, enemyUpdate);
      } else {
        return this.handleMageLightningStrike(enemy, targetPlayer, config, currentTime, enemyUpdate);
      }
    }
    
    // Use whichever ability is ready
    if (canCastFireball) {
      return this.handleMageFireball(enemy, targetPlayer, config, currentTime, enemyUpdate);
    } else {
      return this.handleMageLightningStrike(enemy, targetPlayer, config, currentTime, enemyUpdate);
    }
  }

  canCastFireball(enemy, config, currentTime) {
    if (!enemy.lastFireballTime) {
      enemy.lastFireballTime = currentTime - config.fireballCooldown;
    }
    return currentTime - enemy.lastFireballTime >= config.fireballCooldown;
  }

  canCastLightning(enemy, config, currentTime) {
    if (!enemy.lastLightningTime) {
      enemy.lastLightningTime = currentTime - config.lightningCooldown;
    }
    return currentTime - enemy.lastLightningTime >= config.lightningCooldown;
  }

  handleMageFireball(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Initialize fireball timer if needed
    if (!enemy.lastFireballTime) {
      enemy.lastFireballTime = currentTime - config.fireballCooldown; // Allow immediate first fireball
    }

    // Check if fireball is ready and in range
    const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
    if (currentTime - enemy.lastFireballTime >= config.fireballCooldown && distanceToPlayer <= config.attackRange) {
      console.log(`🔥 Mage ${enemy.id} casting fireball at player ${targetPlayer.id}`);
      
      enemy.lastFireballTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Broadcast fireball cast event
      this.io.to(this.roomId).emit('mage-fireball-cast', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        startPosition: { ...enemy.position },
        targetPosition: { ...targetPlayer.position },
        timestamp: currentTime
      });

      // Calculate fireball travel time
      const fireballTravelTime = (distanceToPlayer / config.fireballSpeed) * 1000; // Convert to milliseconds
      
      // Schedule fireball impact
      setTimeout(() => {
        this.performFireballImpact(enemy, targetPlayer, config);
      }, Math.max(1000, fireballTravelTime)); // Minimum 1 second for telegraph + travel

      return true; // Used special ability
    }

    return false; // Special ability not ready
  }

  performFireballImpact(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Calculate where the fireball would hit based on player position at cast time
    // In a real implementation, you'd track the fireball projectile
    // For now, we'll do a simplified range check
    const currentDistance = this.calculateDistance(enemy.position, currentPlayer.position);
    if (currentDistance <= config.attackRange + 2) { // Some tolerance for movement
      // Deal fireball damage
      room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.fireballDamage);
      
      // Broadcast fireball impact
      this.io.to(this.roomId).emit('enemy-attacked-player', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        damage: config.fireballDamage,
        attackType: 'mage-fireball',
        newPlayerHealth: currentPlayer.health - config.fireballDamage,
        timestamp: Date.now(),
        startPosition: { ...enemy.position },
        targetPosition: { ...currentPlayer.position }
      });

      console.log(`🔥 Mage ${enemy.id} fireball hit player ${targetPlayer.id} for ${config.fireballDamage} damage`);
    }
  }

  handleMageLightningStrike(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    // Initialize lightning timer if needed
    if (!enemy.lastLightningTime) {
      enemy.lastLightningTime = currentTime - config.lightningCooldown; // Allow immediate first lightning
    }

    // Check if lightning is ready and in range
    const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
    if (currentTime - enemy.lastLightningTime >= config.lightningCooldown && distanceToPlayer <= config.attackRange) {
      console.log(`⚡ Mage ${enemy.id} casting lightning strike at player ${targetPlayer.id}`);
      
      enemy.lastLightningTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Broadcast lightning strike cast event
      this.io.to(this.roomId).emit('mage-lightning-strike', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        targetPosition: { ...targetPlayer.position },
        warningDuration: config.lightningWarningDuration || 2.0,
        timestamp: currentTime
      });

      // Schedule lightning strike impact after warning duration
      setTimeout(() => {
        this.performLightningStrikeImpact(enemy, targetPlayer, config);
      }, (config.lightningWarningDuration || 2.0) * 1000);

      return true; // Used special ability
    }

    return false; // Special ability not ready
  }

  performLightningStrikeImpact(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    // Get all players in the room for area damage
    const allPlayers = room.getPlayers();
    const strikePosition = targetPlayer.position; // Position where lightning was targeted
    const lightningRadius = config.lightningDamageRadius || 2.0;
    
    let playersHit = 0;
    
    // Check all players for area damage
    allPlayers.forEach(player => {
      const currentDistance = this.calculateDistance(strikePosition, player.position);
      
      if (currentDistance <= lightningRadius) {
        // Deal lightning damage to this player
        room.updatePlayerHealth(player.id, player.health - config.lightningDamage);
        
        // Broadcast lightning strike impact for this player
        this.io.to(this.roomId).emit('enemy-attacked-player', {
          enemyId: enemy.id,
          targetPlayerId: player.id,
          damage: config.lightningDamage,
          attackType: 'mage-lightning',
          newPlayerHealth: player.health - config.lightningDamage,
          timestamp: Date.now(),
          startPosition: { ...enemy.position },
          targetPosition: { ...player.position }
        });

        console.log(`⚡ Mage ${enemy.id} lightning strike hit player ${player.id} for ${config.lightningDamage} damage`);
        playersHit++;
      }
    });
    
    if (playersHit === 0) {
      console.log(`⚡ Mage ${enemy.id} lightning strike missed - no players within radius ${lightningRadius}`);
    }
  }

  handleAbominationAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const canUseMultiArm = this.canUseMultiArm(enemy, config, currentTime);
    const canUseLeap = this.canUseLeap(enemy, config, currentTime);

    if (!canUseMultiArm && !canUseLeap) {
      return false; // No abilities ready
    }

    // Prioritize Multi-arm if ready
    if (canUseMultiArm) {
      return this.handleMultiArm(enemy, targetPlayer, config, currentTime, enemyUpdate);
    }

    // Use Leap if ready and in range
    if (canUseLeap) {
      const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
      if (distanceToPlayer < config.attackRange) {
        return this.handleLeap(enemy, targetPlayer, config, currentTime, enemyUpdate);
      }
    }

    return false;
  }

  canUseMultiArm(enemy, config, currentTime) {
    if (!enemy.lastMultiArmTime) {
      enemy.lastMultiArmTime = currentTime - config.attackCooldown; // Use regular attack cooldown
    }
    return currentTime - enemy.lastMultiArmTime >= config.attackCooldown;
  }

  canUseLeap(enemy, config, currentTime) {
    if (!enemy.lastLeapTime) {
      enemy.lastLeapTime = currentTime - config.leapCooldown;
    }
    return currentTime - enemy.lastLeapTime >= config.leapCooldown;
  }

  handleMultiArm(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    console.log(`👹 Abomination ${enemy.id} performing multi-arm attack on player ${targetPlayer.id}`);
    
    enemy.lastMultiArmTime = currentTime;
    enemyUpdate.isAttacking = true;

    // Broadcast multi-arm attack start
    this.io.to(this.roomId).emit('abomination-multi-arm-start', {
      enemyId: enemy.id,
      targetPlayerId: targetPlayer.id,
      totalArms: config.totalArms,
      timestamp: currentTime
    });

    // Schedule each arm attack with delays
    for (let armIndex = 0; armIndex < config.totalArms; armIndex++) {
      setTimeout(() => {
        this.performArmAttack(enemy, targetPlayer, config, armIndex);
      }, 800 + (armIndex * config.armDelay)); // 800ms wind-up + staggered arms
    }

    return true; // Used special ability
  }

  handleLeap(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    console.log(`👹 Abomination ${enemy.id} using Leap ability towards player ${targetPlayer.id}`);
    
    enemy.lastLeapTime = currentTime;
    enemyUpdate.isAttacking = true;

    // Calculate leap position (towards player)
    const directionToPlayer = this.normalize({
      x: targetPlayer.position.x - enemy.position.x,
      z: targetPlayer.position.z - enemy.position.z
    });

    const leapPosition = {
      x: enemy.position.x + directionToPlayer.x * config.leapRange,
      z: enemy.position.z + directionToPlayer.z * config.leapRange,
      y: 0
    };

    // Update enemy position
    enemy.position = { ...leapPosition };
    enemyUpdate.position = { ...leapPosition };

    // Broadcast Leap event
    this.io.to(this.roomId).emit('abomination-leaped', {
      enemyId: enemy.id,
      newPosition: leapPosition,
      targetPlayerId: targetPlayer.id,
      timestamp: currentTime
    });

    return true;
  }

  performArmAttack(enemy, targetPlayer, config, armIndex) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Check if still in attack range (allow slight movement)
    const currentDistance = this.calculateDistance(enemy.position, currentPlayer.position);
    if (currentDistance <= config.attackRange + 0.5) {
      // Deal arm damage
      room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.armDamage);
      
      // Broadcast arm attack
      this.io.to(this.roomId).emit('enemy-attacked-player', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        damage: config.armDamage,
        attackType: `abomination-arm-${armIndex + 1}`,
        newPlayerHealth: currentPlayer.health - config.armDamage,
        timestamp: Date.now(),
        startPosition: { ...enemy.position },
        targetPosition: { ...currentPlayer.position }
      });

      console.log(`👹 Abomination ${enemy.id} arm ${armIndex + 1} hit player ${targetPlayer.id} for ${config.armDamage} damage`);
    }
  }

  // New helper function for skeleton area attacks with damage avoidance
  performSkeletonAreaAttack(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    // Store attack start position and target position (like single player)
    const attackStartPosition = { ...enemy.position };
    const chargedTargetPosition = { ...targetPlayer.position };
    
    // Calculate attack direction towards the original target
    const attackDirection = this.normalize({
      x: chargedTargetPosition.x - attackStartPosition.x,
      z: chargedTargetPosition.z - attackStartPosition.z
    });

    // Broadcast charging indicator first (gives players time to evade)
    this.io.to(this.roomId).emit('enemy-charging', {
      enemyId: enemy.id,
      startPosition: attackStartPosition,
      targetPosition: chargedTargetPosition,
      chargeDuration: config.chargeDuration || 1000,
      attackRange: config.attackRange,
      timestamp: Date.now()
    });

    console.log(`⚡ Skeleton ${enemy.id} started charging - players can evade`);

    // After charge duration, start the attack animation
    setTimeout(() => {
      // Broadcast attack start for visual effects
      this.io.to(this.roomId).emit('enemy-attack-start', {
        enemyId: enemy.id,
        attackType: 'skeleton',
        startPosition: attackStartPosition,
        targetPosition: chargedTargetPosition,
        timestamp: Date.now()
      });

      console.log(`⚔️ Skeleton ${enemy.id} attack animation started`);

      // Delay damage check to match single player timing (500ms after attack animation starts)
      setTimeout(() => {
        // Get all players in the room at the moment of impact
        const allPlayers = room.getPlayers();
        const attackAngle = Math.PI * 0.6; // 60 degree cone attack (matches single player)
        let playersHit = 0;
        
        // Check all players for cone damage at the precise moment of impact
        allPlayers.forEach(player => {
          // Get CURRENT player position (not position from when attack started)
          const currentPlayer = room.getPlayer(player.id);
          if (!currentPlayer) return;

          const distanceToPlayer = this.calculateDistance(attackStartPosition, currentPlayer.position);
          
          // Check if player is within attack range at the moment of impact
          if (distanceToPlayer <= config.attackRange) {
            // Calculate direction to current player position
            const playerDirection = this.normalize({
              x: currentPlayer.position.x - attackStartPosition.x,
              z: currentPlayer.position.z - attackStartPosition.z
            });
            
            // Calculate angle between attack direction and current player direction
            const dotProduct = attackDirection.x * playerDirection.x + attackDirection.z * playerDirection.z;
            const angleToPlayer = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
            
            // Check if player is within the attack cone at the moment of impact
            if (angleToPlayer <= attackAngle / 2) {
              // Deal damage to this player
              room.updatePlayerHealth(player.id, currentPlayer.health - config.attackDamage);
              
              // Broadcast attack event for this player
              this.io.to(this.roomId).emit('enemy-attacked-player', {
                enemyId: enemy.id,
                targetPlayerId: player.id,
                damage: config.attackDamage,
                attackType: 'skeleton-area',
                newPlayerHealth: currentPlayer.health - config.attackDamage,
                timestamp: Date.now(),
                startPosition: attackStartPosition,
                targetPosition: { ...currentPlayer.position }
              });
              
              console.log(`⚔️ Skeleton ${enemy.id} area attack hit player ${player.id} for ${config.attackDamage} damage (distance: ${distanceToPlayer.toFixed(2)}, angle: ${(angleToPlayer * 180 / Math.PI).toFixed(1)}°)`);
              playersHit++;
            } else {
              console.log(`⚔️ Skeleton ${enemy.id} area attack avoided by player ${player.id} - moved outside cone (angle: ${(angleToPlayer * 180 / Math.PI).toFixed(1)}°)`);
            }
          } else {
            console.log(`⚔️ Skeleton ${enemy.id} area attack avoided by player ${player.id} - moved out of range (distance: ${distanceToPlayer.toFixed(2)})`);
          }
        });
        
        if (playersHit === 0) {
          console.log(`⚔️ Skeleton ${enemy.id} area attack completely avoided - all players evaded successfully`);
        }
      }, config.attackDelay || 500); // Match single player damage timing
    }, config.chargeDuration || 1000);
  }

  // Helper function for single target attacks
  performSingleTargetAttack(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    const currentDistance = this.calculateDistance(enemy.position, currentPlayer.position);
    if (currentDistance <= config.attackRange) {
      // Deal damage to player
      room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.attackDamage);
      
      // Broadcast attack event
      this.io.to(this.roomId).emit('enemy-attacked-player', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        damage: config.attackDamage,
        attackType: enemy.type,
        newPlayerHealth: currentPlayer.health - config.attackDamage,
        timestamp: Date.now(),
        startPosition: { ...enemy.position },
        targetPosition: { ...currentPlayer.position }
      });
      
      console.log(`⚔️ ${enemy.type} ${enemy.id} single attack hit player ${targetPlayer.id} for ${config.attackDamage} damage`);
    }
  }

  getAttackDelay(enemyType) {
    // Attack animation delays for different enemy types (match single player timing)
    const delays = {
      skeleton: 500, // Match single player damage timing (500ms after attack starts)
      mage: 0, // Instant fireball
      abomination: 800,
      reaper: 1350,
      'death-knight': 1100,
      ascendant: 1000
    };
    return delays[enemyType] || 1000;
  }

  // Death Knight special abilities
  handleDeathKnightAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const canUseDeathGrasp = this.canUseDeathGrasp(enemy, config, currentTime);
    const canUseFrostStrike = this.canUseFrostStrike(enemy, config, currentTime);

    if (!canUseDeathGrasp && !canUseFrostStrike) {
      return false;
    }

    // Prioritize Death Grasp if both are ready
    if (canUseDeathGrasp && canUseFrostStrike) {
      return this.handleDeathGrasp(enemy, targetPlayer, config, currentTime, enemyUpdate);
    }

    if (canUseDeathGrasp) {
      return this.handleDeathGrasp(enemy, targetPlayer, config, currentTime, enemyUpdate);
    }

    return this.handleFrostStrike(enemy, targetPlayer, config, currentTime, enemyUpdate);
  }

  canUseDeathGrasp(enemy, config, currentTime) {
    if (!enemy.lastDeathGraspTime) {
      enemy.lastDeathGraspTime = currentTime - config.deathGraspCooldown;
    }
    return currentTime - enemy.lastDeathGraspTime >= config.deathGraspCooldown;
  }

  canUseFrostStrike(enemy, config, currentTime) {
    if (!enemy.lastFrostStrikeTime) {
      enemy.lastFrostStrikeTime = currentTime - config.frostStrikeCooldown;
    }
    return currentTime - enemy.lastFrostStrikeTime >= config.frostStrikeCooldown;
  }

  handleDeathGrasp(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
    
    if (distanceToPlayer <= config.deathGraspRange) {
      console.log(`💀 Death Knight ${enemy.id} using Death Grasp on player ${targetPlayer.id}`);
      
      enemy.lastDeathGraspTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Broadcast Death Grasp cast event
      this.io.to(this.roomId).emit('deathknight-death-grasp-cast', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        startPosition: enemy.position,
        targetPosition: targetPlayer.position,
        timestamp: currentTime
      });

      // Schedule Death Grasp damage after animation
      setTimeout(() => {
        this.performDeathGrasp(enemy, targetPlayer, config);
      }, 1200); // 1.2 second animation

      return true;
    }

    return false;
  }

  handleFrostStrike(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
    
    if (distanceToPlayer <= config.frostStrikeRange) {
      console.log(`❄️ Death Knight ${enemy.id} using Frost Strike on player ${targetPlayer.id}`);
      
      enemy.lastFrostStrikeTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Broadcast Frost Strike cast event
      this.io.to(this.roomId).emit('deathknight-frost-strike-cast', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        startPosition: enemy.position,
        targetPosition: targetPlayer.position,
        timestamp: currentTime
      });

      // Schedule Frost Strike damage after animation
      setTimeout(() => {
        this.performFrostStrike(enemy, targetPlayer, config);
      }, 1000); // 1 second animation

      return true;
    }

    return false;
  }

  performDeathGrasp(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Deal Death Grasp damage
    room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.deathGraspDamage);
    
    // Broadcast Death Grasp damage
    this.io.to(this.roomId).emit('enemy-attacked-player', {
      enemyId: enemy.id,
      targetPlayerId: targetPlayer.id,
      damage: config.deathGraspDamage,
      attackType: 'deathknight-death-grasp',
      newPlayerHealth: currentPlayer.health - config.deathGraspDamage,
      timestamp: Date.now(),
      startPosition: { ...enemy.position },
      targetPosition: { ...currentPlayer.position }
    });

    console.log(`💀 Death Knight ${enemy.id} Death Grasp hit player ${targetPlayer.id} for ${config.deathGraspDamage} damage`);
  }

  performFrostStrike(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Deal Frost Strike damage
    room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.frostStrikeDamage);
    
    // Broadcast Frost Strike damage
    this.io.to(this.roomId).emit('enemy-attacked-player', {
      enemyId: enemy.id,
      targetPlayerId: targetPlayer.id,
      damage: config.frostStrikeDamage,
      attackType: 'deathknight-frost-strike',
      newPlayerHealth: currentPlayer.health - config.frostStrikeDamage,
      timestamp: Date.now(),
      startPosition: { ...enemy.position },
      targetPosition: { ...currentPlayer.position }
    });

    console.log(`❄️ Death Knight ${enemy.id} Frost Strike hit player ${targetPlayer.id} for ${config.frostStrikeDamage} damage`);
  }

  // Ascendant special abilities
  handleAscendantAbilities(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const canUseArchonLightning = this.canUseArchonLightning(enemy, config, currentTime);
    const canUseBlink = this.canUseBlink(enemy, config, currentTime);
    const canUseForcePulse = this.canUseForcePulse(enemy, config, currentTime);

    if (!canUseArchonLightning && !canUseBlink && !canUseForcePulse) {
      return false;
    }

    // Prioritize Archon Lightning if ready
    if (canUseArchonLightning) {
      return this.handleArchonLightning(enemy, targetPlayer, config, currentTime, enemyUpdate);
    }

    // Use Blink if player is too close
    if (canUseBlink) {
      const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
      if (distanceToPlayer < config.attackRange) {
        return this.handleBlink(enemy, targetPlayer, config, currentTime, enemyUpdate);
      }
    }

    // Use Force Pulse if ready and in range
    if (canUseForcePulse) {
      const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
      if (distanceToPlayer <= config.forcePulseRange) {
        return this.handleForcePulse(enemy, targetPlayer, config, currentTime, enemyUpdate);
      }
    }

    return false;
  }

  canUseArchonLightning(enemy, config, currentTime) {
    if (!enemy.lastArchonLightningTime) {
      enemy.lastArchonLightningTime = currentTime - config.archonLightningCooldown;
    }
    return currentTime - enemy.lastArchonLightningTime >= config.archonLightningCooldown;
  }

  canUseBlink(enemy, config, currentTime) {
    if (!enemy.lastBlinkTime) {
      enemy.lastBlinkTime = currentTime - config.blinkCooldown;
    }
    return currentTime - enemy.lastBlinkTime >= config.blinkCooldown;
  }

  canUseForcePulse(enemy, config, currentTime) {
    if (!enemy.lastForcePulseTime) {
      enemy.lastForcePulseTime = currentTime - config.forcePulseCooldown;
    }
    return currentTime - enemy.lastForcePulseTime >= config.forcePulseCooldown;
  }

  handleArchonLightning(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
    
    if (distanceToPlayer <= config.archonLightningRange) {
      console.log(`⚡ Ascendant ${enemy.id} using Archon Lightning on player ${targetPlayer.id}`);
      
      enemy.lastArchonLightningTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Broadcast Archon Lightning cast event
      this.io.to(this.roomId).emit('ascendant-archon-lightning-cast', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        startPosition: enemy.position,
        targetPosition: targetPlayer.position,
        timestamp: currentTime
      });

      // Schedule Archon Lightning damage after animation
      setTimeout(() => {
        this.performArchonLightning(enemy, targetPlayer, config);
      }, 1500); // 1.5 second animation

      return true;
    }

    return false;
  }

  handleBlink(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    console.log(`✨ Ascendant ${enemy.id} using Blink away from player ${targetPlayer.id}`);
    
    enemy.lastBlinkTime = currentTime;
    enemyUpdate.isAttacking = true;

    // Calculate blink position (away from player)
    const directionFromPlayer = this.normalize({
      x: enemy.position.x - targetPlayer.position.x,
      z: enemy.position.z - targetPlayer.position.z
    });

    const blinkPosition = {
      x: enemy.position.x + directionFromPlayer.x * config.blinkRange,
      z: enemy.position.z + directionFromPlayer.z * config.blinkRange,
      y: 0
    };

    // Update enemy position
    enemy.position = { ...blinkPosition };
    enemyUpdate.position = { ...blinkPosition };

    // Broadcast Blink event
    this.io.to(this.roomId).emit('ascendant-blinked', {
      enemyId: enemy.id,
      newPosition: blinkPosition,
      targetPlayerId: targetPlayer.id,
      timestamp: currentTime
    });

    return true;
  }

  handleForcePulse(enemy, targetPlayer, config, currentTime, enemyUpdate) {
    const distanceToPlayer = this.calculateDistance(enemy.position, targetPlayer.position);
    
    if (distanceToPlayer <= config.forcePulseRange) {
      console.log(`💥 Ascendant ${enemy.id} using Force Pulse on player ${targetPlayer.id}`);
      
      enemy.lastForcePulseTime = currentTime;
      enemyUpdate.isAttacking = true;

      // Broadcast Force Pulse cast event
      this.io.to(this.roomId).emit('ascendant-force-pulse-cast', {
        enemyId: enemy.id,
        targetPlayerId: targetPlayer.id,
        startPosition: enemy.position,
        targetPosition: targetPlayer.position,
        timestamp: currentTime
      });

      // Schedule Force Pulse damage after animation
      setTimeout(() => {
        this.performForcePulse(enemy, targetPlayer, config);
      }, 800); // 0.8 second animation

      return true;
    }

    return false;
  }

  performArchonLightning(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Deal Archon Lightning damage
    room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.archonLightningDamage);
    
    // Broadcast Archon Lightning damage
    this.io.to(this.roomId).emit('enemy-attacked-player', {
      enemyId: enemy.id,
      targetPlayerId: targetPlayer.id,
      damage: config.archonLightningDamage,
      attackType: 'ascendant-archon-lightning',
      newPlayerHealth: currentPlayer.health - config.archonLightningDamage,
      timestamp: Date.now(),
      startPosition: { ...enemy.position },
      targetPosition: { ...currentPlayer.position }
    });

    console.log(`⚡ Ascendant ${enemy.id} Archon Lightning hit player ${targetPlayer.id} for ${config.archonLightningDamage} damage`);
  }

  performForcePulse(enemy, targetPlayer, config) {
    const room = this.getRoom();
    if (!room) return;

    const currentPlayer = room.getPlayer(targetPlayer.id);
    if (!currentPlayer) return;

    // Deal Force Pulse damage
    room.updatePlayerHealth(targetPlayer.id, currentPlayer.health - config.forcePulseDamage);
    
    // Broadcast Force Pulse damage
    this.io.to(this.roomId).emit('enemy-attacked-player', {
      enemyId: enemy.id,
      targetPlayerId: targetPlayer.id,
      damage: config.forcePulseDamage,
      attackType: 'ascendant-force-pulse',
      newPlayerHealth: currentPlayer.health - config.forcePulseDamage,
      timestamp: Date.now(),
      startPosition: { ...enemy.position },
      targetPosition: { ...currentPlayer.position }
    });

    console.log(`💥 Ascendant ${enemy.id} Force Pulse hit player ${targetPlayer.id} for ${config.forcePulseDamage} damage`);
  }

  calculateSeparationForce(enemy, allEnemies, config) {
    const separationForce = { x: 0, z: 0 };

    allEnemies.forEach(otherEnemy => {
      if (otherEnemy.id === enemy.id) return;

      const distance = this.calculateDistance(enemy.position, otherEnemy.position);
      if (distance < config.separationRadius && distance > 0) {
        const diff = this.normalize({
          x: enemy.position.x - otherEnemy.position.x,
          z: enemy.position.z - otherEnemy.position.z
        });

        const force = config.separationForce / Math.max(0.1, distance);
        separationForce.x += diff.x * force;
        separationForce.z += diff.z * force;
      }
    });

    return separationForce;
  }

  normalize(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
    if (length === 0) return { x: 0, z: 0 };
    return {
      x: vector.x / length,
      z: vector.z / length
    };
  }

  getRoom() {
    // This will be injected by the game room
    return this.room;
  }

  setRoom(room) {
    this.room = room;
  }
}

module.exports = EnemyAI; 