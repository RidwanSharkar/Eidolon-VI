import React, { useState, useEffect } from 'react';
import { useMultiplayer } from './MultiplayerContext';
import { WeaponType, WeaponSubclass } from '@/Weapons/weapons';
import styles from './RoomJoin.module.css';

interface RoomJoinProps {
  onJoinSuccess: () => void;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
}

export default function RoomJoin({ onJoinSuccess, currentWeapon, currentSubclass }: RoomJoinProps) {
  const { 
    joinRoom, 
    isConnected, 
    isInRoom, 
    connectionError, 
    players, 
    previewRoom, 
    clearPreview, 
    currentPreview,
    startGame,
    gameStarted
  } = useMultiplayer();
  const [roomId, setRoomId] = useState('default');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Clear preview loading when preview is received
  useEffect(() => {
    if (currentPreview) {
      setPreviewLoading(false);
    }
  }, [currentPreview]);

  const handlePreview = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    
    if (!isConnected) {
      alert('Not connected to server. Please wait for connection.');
      return;
    }
    
    console.log('Previewing room:', roomId.trim());
    setPreviewLoading(true);
    previewRoom(roomId.trim());
    setShowPreview(true);
    
    // Set a timeout to handle non-responsive server
    setTimeout(() => {
      if (previewLoading) {
        setPreviewLoading(false);
        alert('Room preview timed out. Please try again.');
        setShowPreview(false);
      }
    }, 5000);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      alert('Please enter a player name');
      return;
    }

    setIsJoining(true);
    try {
      await joinRoom(roomId, playerName.trim(), currentWeapon, currentSubclass);
      // Clear preview state
      clearPreview();
      setShowPreview(false);
      // Wait a moment for the room join to complete, then just stop joining
      setTimeout(() => {
        setIsJoining(false);
        // Don't automatically start the game - let user click "Start Game" button
      }, 1000);
    } catch (error) {
      console.error('Failed to join room:', error);
      setIsJoining(false);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
    clearPreview();
  };

  const handleStartGame = () => {
    startGame();
    onJoinSuccess(); // Still call this to update UI state
  };

  // If already in room, show room info
  if (isInRoom) {
    return (
      <div className={styles.roomInfo}>
        <h2>Multiplayer Room: {roomId}</h2>
        <p>Players connected: {players.size}/5</p>
        <div className={styles.playerList}>
          {Array.from(players.values()).map(player => (
            <div key={player.id} className={styles.playerItem}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.playerWeapon}>({player.weapon})</span>
              <span className={styles.playerHealth}>{player.health}/{player.maxHealth} HP</span>
            </div>
          ))}
        </div>
        <button 
          className={styles.startButton}
          onClick={handleStartGame}
          disabled={false}
        >
          {gameStarted ? 'Join Game' : 'Start Game'}
        </button>
      </div>
    );
  }

  // Show room preview if requested
  if (showPreview && currentPreview) {
    return (
      <div className={styles.previewPanel}>
        <h2>Room Preview: {currentPreview.roomId}</h2>
        
        {currentPreview.exists ? (
          <div className={styles.previewContent}>
            <div className={styles.roomStats}>
              <p>Players: {currentPreview.playerCount}/{currentPreview.maxPlayers}</p>
              <p>Enemies: {currentPreview.enemies.length}</p>
            </div>
            
            {currentPreview.playerCount > 0 ? (
              <div className={styles.playerList}>
                <h3>Players in Room:</h3>
                {currentPreview.players.map(player => (
                  <div key={player.id} className={styles.playerItem}>
                    <span className={styles.playerName}>{player.name}</span>
                    <span className={styles.playerWeapon}>({player.weapon})</span>
                    <span className={styles.playerHealth}>{player.health}/{player.maxHealth} HP</span>
                  </div>
                ))}
              </div>
            ) : (
                             <div className={styles.emptyRoom}>
                 <p>This room is empty. You&apos;ll be the first player!</p>
               </div>
            )}
            
            <div className={styles.previewActions}>
              <button 
                className={styles.joinButton}
                onClick={handleJoin}
                disabled={isJoining || !playerName.trim() || currentPreview.playerCount >= currentPreview.maxPlayers}
              >
                {isJoining ? 'Joining...' : 
                 currentPreview.playerCount >= currentPreview.maxPlayers ? 'Room Full' : 'Join This Room'}
              </button>
              <button 
                className={styles.backButton}
                onClick={handleBackToForm}
                disabled={isJoining}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.newRoom}>
                         <p>This room doesn&apos;t exist yet. You&apos;ll create it when you join!</p>
            <div className={styles.previewActions}>
              <button 
                className={styles.joinButton}
                onClick={handleJoin}
                disabled={isJoining || !playerName.trim()}
              >
                {isJoining ? 'Creating Room...' : 'Create & Join Room'}
              </button>
              <button 
                className={styles.backButton}
                onClick={handleBackToForm}
                disabled={isJoining}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.joinPanel}>
      <h2>Join Multiplayer Game</h2>
      <p>Play with up to 5 players per room</p>
      
      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="playerName">Your Name:</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            disabled={isJoining}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="roomId">Room ID:</label>
          <input
            id="roomId"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID (e.g., 'default', 'room1')"
            maxLength={50}
            disabled={isJoining}
          />
        </div>

        {connectionError && (
          <div className={styles.error}>
            Error: {connectionError}
          </div>
        )}

        <div className={styles.connectionStatus}>
          Status: {isConnected ? 'Connected' : 'Connecting...'}
        </div>

        <div className={styles.buttonGroup}>
          <button 
            className={styles.previewButton}
            onClick={handlePreview}
            disabled={!isConnected || !roomId.trim() || previewLoading}
          >
            {previewLoading ? 'Loading...' : 'Preview Room'}
          </button>
          
          <button 
            className={styles.joinButton}
            onClick={handleJoin}
            disabled={isJoining || !isConnected || !playerName.trim()}
          >
            {isJoining ? 'Joining...' : 'Join Directly'}
          </button>
        </div>

        <div className={styles.helpText}>
          <p>Tips:</p>
          <ul>
            <li>Use the same Room ID to play with friends</li>
            <li>Maximum 5 players per room</li>
            <li>All players fight the same enemies together</li>
            <li>Damage and kills are shared across all players</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 