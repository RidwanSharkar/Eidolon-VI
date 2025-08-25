function handlePlayerEvents(socket, gameRooms) {
  // Handle player position and rotation updates
  socket.on('player-update', (data) => {
    const { roomId, position, rotation, weapon, health, movementDirection } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const playerId = socket.id;
    
    // Update player state
    if (position && rotation) {
      room.updatePlayerPosition(playerId, position, rotation, movementDirection);
    }
    
    if (weapon) {
      room.updatePlayerWeapon(playerId, weapon);
    }
    
    if (typeof health === 'number') {
      room.updatePlayerHealth(playerId, health);
    }
    
    // Broadcast updated position to other players in the room
    socket.to(roomId).emit('player-moved', {
      playerId,
      position,
      rotation,
      weapon,
      health,
      movementDirection
    });
  });

  // Handle weapon selection changes
  socket.on('weapon-changed', (data) => {
    const { roomId, weapon, subclass } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    room.updatePlayerWeapon(socket.id, weapon, subclass);
    
    // Broadcast weapon change to other players
    socket.to(roomId).emit('player-weapon-changed', {
      playerId: socket.id,
      weapon,
      subclass
    });
  });

  // Handle attack animations (visual only)
  socket.on('player-attack', (data) => {
    const { roomId, attackType, position, direction } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    const player = room.getPlayer(socket.id);
    
    // Broadcast attack animation to other players with weapon info
    socket.to(roomId).emit('player-attacked', {
      playerId: socket.id,
      attackType,
      position,
      direction,
      weapon: player ? player.weapon : undefined,
      subclass: player ? player.subclass : undefined,
      timestamp: Date.now()
    });
  });

  // Handle ability usage animations
  socket.on('player-ability', (data) => {
    const { roomId, abilityType, position, direction, target } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    // Broadcast ability usage to other players
    socket.to(roomId).emit('player-used-ability', {
      playerId: socket.id,
      abilityType,
      position,
      direction,
      target,
      timestamp: Date.now()
    });
  });

  // Handle visual effect synchronization (new)
  socket.on('player-effect', (data) => {
    const { roomId, effect } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    // Broadcast effect to other players in the room
    socket.to(roomId).emit('player-effect', {
      playerId: socket.id,
      effect,
      timestamp: Date.now()
    });
  });

  // Handle player health changes
  socket.on('player-health-changed', (data) => {
    const { roomId, health, maxHealth } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    room.updatePlayerHealth(socket.id, health);
    
    // Broadcast health change to other players
    socket.to(roomId).emit('player-health-updated', {
      playerId: socket.id,
      health,
      maxHealth
    });
  });

  // Handle ally healing (Reanimate & Oathstrike)
  socket.on('heal-allies', (data) => {
    const { roomId, healAmount, abilityType, position } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    
    // Heal all players in the room
    room.players.forEach((player, playerId) => {
      const newHealth = Math.min(player.maxHealth, player.health + healAmount);
      room.updatePlayerHealth(playerId, newHealth);
    });
    
    console.log(`[Server] Player ${socket.id} used ${abilityType} to heal all allies for ${healAmount} HP`);
    
    // Broadcast healing event to all players in the room (including the healer)
    room.io.to(roomId).emit('ally-healed', {
      healerId: socket.id,
      healAmount,
      abilityType,
      position,
      timestamp: Date.now()
    });
  });

  // Handle player death
  socket.on('player-died', (data) => {
    const { roomId } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    room.updatePlayerHealth(socket.id, 0);
    
    // Broadcast player death to other players
    socket.to(roomId).emit('player-died', {
      playerId: socket.id
    });
  });

  // Handle player respawn
  socket.on('player-respawned', (data) => {
    const { roomId, health, maxHealth, position } = data;
    
    if (!gameRooms.has(roomId)) return;
    
    const room = gameRooms.get(roomId);
    room.updatePlayerHealth(socket.id, health || maxHealth);
    
    if (position) {
      room.updatePlayerPosition(socket.id, position, { x: 0, y: 0, z: 0 });
    }
    
    // Broadcast player respawn to other players
    socket.to(roomId).emit('player-respawned', {
      playerId: socket.id,
      health: health || maxHealth,
      maxHealth,
      position
    });
  });

  // Handle room preview request (get room info without joining)
  socket.on('preview-room', (data) => {
    const { roomId = 'default' } = data || {};
    
    if (!gameRooms.has(roomId)) {
      // Room doesn't exist yet
      socket.emit('room-preview', {
        roomId,
        exists: false,
        players: [],
        playerCount: 0,
        maxPlayers: 5,
        enemies: []
      });
      return;
    }
    
    const room = gameRooms.get(roomId);
    
    // Get room information without joining
    socket.emit('room-preview', {
      roomId,
      exists: true,
      players: room.getPlayers(),
      playerCount: room.getPlayerCount(),
      maxPlayers: 5,
      enemies: room.getEnemies()
    });
  });

  // Handle ping/latency measurement
  socket.on('ping', () => {
    socket.emit('pong', Date.now());
  });
}

module.exports = { handlePlayerEvents }; 