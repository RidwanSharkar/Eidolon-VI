const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// CORS configuration for both Express and Socket.io
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://eidolon-flame.vercel.app'] // Updated with actual Vercel domain
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const io = socketIo(server, {
  cors: corsOptions,
  pingTimeout: 15000,  // Very aggressive timeout (15 seconds)
  pingInterval: 5000   // Ping every 5 seconds for fast disconnect detection
});

const PORT = process.env.PORT || 8080;

// Game state management
const gameRooms = new Map();
const playerSockets = new Map();
const playerHeartbeats = new Map(); // Track last heartbeat for each player

// Import game modules
const GameRoom = require('./gameRoom');
const { handlePlayerEvents } = require('./playerHandler');
const { handleEnemyEvents } = require('./enemyHandler');

// Health check endpoint
app.get('/health', (req, res) => {
  const roomDetails = {};
  let totalPlayersInRooms = 0;
  
  for (const [roomId, room] of gameRooms) {
    const playerCount = room.getPlayerCount();
    roomDetails[roomId] = {
      players: playerCount,
      enemies: room.getEnemies().length
    };
    totalPlayersInRooms += playerCount;
  }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rooms: gameRooms.size,
    totalSockets: playerSockets.size,
    playersInRooms: totalPlayersInRooms,
    roomDetails
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Store socket reference and initialize heartbeat
  playerSockets.set(socket.id, socket);
  playerHeartbeats.set(socket.id, Date.now());

  // Handle room joining
  socket.on('join-room', (data) => {
    const { roomId = 'default', playerName = `Player${Math.floor(Math.random() * 1000)}`, weapon = 'scythe', subclass } = data || {};
    
    // Leave any existing rooms first
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Get or create room
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, new GameRoom(roomId, io));
    }
    
    const room = gameRooms.get(roomId);
    
    // Check room capacity (max 5 players)
    if (room.getPlayerCount() >= 5) {
      socket.emit('room-full');
      return;
    }

    // Join room
    socket.join(roomId);
    room.addPlayer(socket.id, playerName, weapon, subclass);
    
    console.log(`Player ${socket.id} joined room ${roomId} as ${playerName} with weapon ${weapon}`);
    
    // Send room state to new player
    socket.emit('room-joined', {
      roomId,
      playerId: socket.id,
      players: room.getPlayers(),
      enemies: room.getEnemies(),
      killCount: room.getKillCount(),
      gameStarted: room.getGameStarted()
    });
    
    // Notify other players
    socket.to(roomId).emit('player-joined', {
      playerId: socket.id,
      playerName,
      players: room.getPlayers()
    });
  });

  // Register player event handlers
  handlePlayerEvents(socket, gameRooms);
  
  // Register enemy event handlers
  handleEnemyEvents(socket, gameRooms);

  // Handle heartbeat from client
  socket.on('heartbeat', () => {
    playerHeartbeats.set(socket.id, Date.now());
  });

  // Handle start game event
  socket.on('start-game', (data) => {
    const { roomId } = data;
    console.log(`Player ${socket.id} requesting to start game in room ${roomId}`);
    
    if (!gameRooms.has(roomId)) {
      socket.emit('start-game-failed', { error: 'Room not found' });
      return;
    }
    
    const room = gameRooms.get(roomId);
    
    // Only allow starting if the player is in the room
    if (!room.getPlayer(socket.id)) {
      socket.emit('start-game-failed', { error: 'Player not in room' });
      return;
    }
    
    // Start the game
    const started = room.startGame(socket.id);
    
    if (started) {
      console.log(`🎮 Game started in room ${roomId} by player ${socket.id}`);
      socket.emit('start-game-success', { 
        roomId, 
        killCount: room.getKillCount(),
        timestamp: Date.now() 
      });
    } else {
      socket.emit('start-game-failed', { error: 'Game already started' });
    }
  });

  // Handle manual disconnect (when user intentionally leaves)
  socket.on('leave-room', () => {
    console.log(`Player manually left: ${socket.id}`);
    cleanupPlayer(socket.id);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Player disconnected: ${socket.id}, reason: ${reason}`);
    cleanupPlayer(socket.id);
  });
});

// Player cleanup function
function cleanupPlayer(playerId) {
  console.log(`Cleaning up player: ${playerId}`);
  
  // Remove from all rooms
  for (const [roomId, room] of gameRooms) {
    if (room.getPlayer(playerId)) {
      room.removePlayer(playerId);
      
      // Notify remaining players in room
      const socket = playerSockets.get(playerId);
      if (socket) {
        socket.to(roomId).emit('player-left', {
          playerId,
          players: room.getPlayers()
        });
      }
      
      // Clean up empty rooms
      if (room.getPlayerCount() === 0) {
        console.log(`Cleaning up empty room: ${roomId}`);
        room.destroy(); // Clean up timers
        gameRooms.delete(roomId);
      }
      
      break; // Player should only be in one room
    }
  }
  
  // Remove references
  playerSockets.delete(playerId);
  playerHeartbeats.delete(playerId);
}

// Periodic cleanup of stale connections (every 30 seconds)
setInterval(() => {
  const now = Date.now();
  const STALE_THRESHOLD = 60000; // 60 seconds without heartbeat = stale
  
  console.log(`Running cleanup check. Active connections: ${playerSockets.size}`);
  
  for (const [playerId, lastHeartbeat] of playerHeartbeats) {
    if (now - lastHeartbeat > STALE_THRESHOLD) {
      console.log(`Cleaning up stale connection: ${playerId}, last heartbeat: ${Math.floor((now - lastHeartbeat) / 1000)}s ago`);
      cleanupPlayer(playerId);
    }
  }
}, 30000);

// Start server
server.listen(PORT, () => {
  console.log(`Towers multiplayer server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 