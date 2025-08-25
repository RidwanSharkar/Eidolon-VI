function handleEnemyEvents(socket, gameRooms) {
  // Handle enemy damage from players
  socket.on('enemy-damaged', (data) => {
    const { roomId, enemyId, damage, position, damageType, isCritical } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const player = room.getPlayer(socket.id);
    const enemy = room.getEnemy(enemyId);
    
    // Validate that the enemy exists and isn't already dead
    if (!enemy || enemy.isDying || enemy.health <= 0) {
      console.log(`[Server] Damage blocked - enemy ${enemyId} is dead or not found`);
      return;
    }
    
    // More lenient distance validation - only block obviously impossible hits
    if (player && enemy) {
      const playerPos = player.position;
      const enemyPos = enemy.position;
      const distance = Math.sqrt(
        Math.pow(playerPos.x - enemyPos.x, 2) + 
        Math.pow(playerPos.z - enemyPos.z, 2)
      );
      
      // Much more lenient range - account for network latency and interpolation
      const MAX_WEAPON_RANGE = 25; // Increased from 15
      
      if (distance > MAX_WEAPON_RANGE) {
        console.log(`[Server] Damage blocked - player ${socket.id} too far from enemy ${enemyId} (distance: ${distance.toFixed(2)})`);
        return;
      }
    }
    
    const result = room.damageEnemy(enemyId, damage, socket.id);
    
    if (!result) return; // Enemy not found or already dead
    
    // Add damage aggro to enemy AI
    if (room.enemyAI) {
      room.enemyAI.addDamageAggro(enemyId, socket.id, damage);
    }
    
    console.log(`[Server] Received damage request: Player ${socket.id} -> Enemy ${enemyId} (${damage} damage)`);
    console.log(`[Server] Player ${socket.id} dealt ${damage} damage to enemy ${enemyId} (${result.newHealth}/${result.maxHealth} HP remaining)`);
    
    // Broadcast enemy damage to all players in the room (including sender for consistency)
    socket.to(roomId).emit('enemy-health-updated', {
      enemyId: result.enemyId,
      health: result.newHealth,
      maxHealth: result.maxHealth,
      damage: result.damage,
      damagePosition: position,
      damageType,
      isCritical,
      fromPlayerId: result.fromPlayerId,
      wasKilled: result.wasKilled,
      timestamp: Date.now()
    });

    // Also send confirmation back to the player who dealt damage
    socket.emit('enemy-damage-confirmed', {
      enemyId: result.enemyId,
      health: result.newHealth,
      maxHealth: result.maxHealth,
      damage: result.damage,
      wasKilled: result.wasKilled
    });
    
    // If enemy was killed, broadcast death event
    if (result.wasKilled) {
      const killedEnemy = room.getEnemy(enemyId);
      console.log(`[Server] Enemy ${enemyId} killed by player ${socket.id}`);
      socket.to(roomId).emit('enemy-died', {
        enemyId: result.enemyId,
        killedBy: socket.id,
        deathPosition: killedEnemy ? killedEnemy.position : position,
        enemyType: killedEnemy ? killedEnemy.type : 'unknown',
        timestamp: Date.now()
      });

      // Send kill confirmation to the killer
      socket.emit('enemy-killed', {
        enemyId: result.enemyId,
        enemyType: killedEnemy ? killedEnemy.type : 'unknown'
      });
    }
  });

  // Handle enemy spawn events (when server spawns new enemies)
  socket.on('request-enemies', (data) => {
    const { roomId } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const enemies = room.getEnemies();
    
    // Send current enemy state to requesting player
    socket.emit('enemies-state', {
      enemies,
      timestamp: Date.now()
    });
  });

  // Handle enemy position updates (for AI movement synchronization)
  // NOTE: This is now handled by server-side AI, keeping for backward compatibility
  socket.on('enemy-moved', (data) => {
    const { roomId, enemyId, position, rotation } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const enemy = room.getEnemy(enemyId);
    
    if (enemy && !enemy.isDying) {
      enemy.position = position;
      enemy.rotation = rotation;
      
      // Broadcast enemy movement to other players
      socket.to(roomId).emit('enemy-position-updated', {
        enemyId,
        position,
        rotation,
        timestamp: Date.now()
      });
    }
  });

  // Handle requests for current enemy state (for late-joining players)
  socket.on('request-enemy-state', (data) => {
    const { roomId } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const enemies = room.getEnemies();
    
    // Send current enemy state to requesting player
    socket.emit('enemy-state-sync', {
      enemies: enemies.map(enemy => ({
        id: enemy.id,
        type: enemy.type,
        position: enemy.position,
        rotation: enemy.rotation || 0,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        isDying: enemy.isDying,
        isMoving: false,
        isAttacking: false
      })),
      timestamp: Date.now()
    });
  });

  // Handle enemy attack events (when enemies attack players)
  socket.on('enemy-attacked-player', (data) => {
    const { roomId, enemyId, targetPlayerId, damage, attackType } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const enemy = room.getEnemy(enemyId);
    const targetPlayer = room.getPlayer(targetPlayerId);
    
    if (enemy && targetPlayer && !enemy.isDying) {
      // Update player health
      room.updatePlayerHealth(targetPlayerId, targetPlayer.health - damage);
      
      // Broadcast attack to all players
      socket.to(roomId).emit('enemy-attacked', {
        enemyId,
        targetPlayerId,
        damage,
        attackType,
        newPlayerHealth: targetPlayer.health - damage,
        timestamp: Date.now()
      });
    }
  });

  // Handle status effect application to enemies
  socket.on('apply-enemy-status-effect', (data) => {
    const { roomId, enemyId, effectType, duration } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const success = room.applyStatusEffect(enemyId, effectType, duration);
    
    if (success) {
      console.log(`[Server] Player ${socket.id} applied ${effectType} to enemy ${enemyId} for ${duration}ms`);
    } else {
      console.log(`[Server] Failed to apply ${effectType} to enemy ${enemyId} - enemy not found`);
    }
  });

  // Handle status effect queries
  socket.on('get-enemy-status-effects', (data) => {
    const { roomId, enemyId } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const effects = room.getEnemyStatusEffects(enemyId);
    
    socket.emit('enemy-status-effects', {
      enemyId,
      effects,
      timestamp: Date.now()
    });
  });
}

// Broadcast new enemy spawns to all players in a room
function broadcastEnemySpawn(io, roomId, enemyData) {
  io.to(roomId).emit('enemy-spawned', {
    enemy: enemyData,
    timestamp: Date.now()
  });
}

// Broadcast enemy removal to all players in a room
function broadcastEnemyRemoval(io, roomId, enemyId, reason = 'killed') {
  io.to(roomId).emit('enemy-removed', {
    enemyId,
    reason,
    timestamp: Date.now()
  });
}

module.exports = { 
  handleEnemyEvents, 
  broadcastEnemySpawn, 
  broadcastEnemyRemoval 
}; 