import React, { useState } from 'react';
import './AvatarSelection.css';
// import { useLanguage } from '../../hooks/useLanguage'; // Пока не используется

interface AvatarSelectionProps {
  onAvatarSelect: (avatarId: string) => void;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ onAvatarSelect }) => {
  // const { t } = useLanguage(); // Пока не используется
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const avatars = ['A1', 'A2', 'A3', 'A4', 'A5'];

  const handleAvatarClick = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = async () => {
    if (!selectedAvatar) return;
    
    setIsLoading(true);
    try {
      await onAvatarSelect(selectedAvatar);
    } catch (error) {
      console.error('Ошибка при выборе аватарки:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // const getUserName = () => {
  //   if (user?.first_name) {
  //     return user.first_name;
  //   }
  //   if (user?.username) {
  //     return user.username;
  //   }
  //   return 'Игрок';
  // };

  return (
    <div className="avatar-selection-overlay">
      <div className="avatar-selection-container">
        <img 
          src="/img/pre/cub.jpg" 
          alt="Cube Game Logo" 
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            marginBottom: '20px',
            borderRadius: '10px'
          }}
        />
        <h1 className="welcome-title">
          Добро пожаловать в игру "Cube-Game"
        </h1>
        
        <h2 className="avatar-selection-title">
          Выберите аватарку
        </h2>
        
        <div className="avatars-grid">
          {avatars.map((avatarId) => (
            <div
              key={avatarId}
              className={`avatar-option ${
                selectedAvatar === avatarId ? 'selected' : ''
              }`}
              onClick={() => handleAvatarClick(avatarId)}
            >
              <img
                src={`/img/ava/${avatarId}.jpg`}
                alt={`Avatar ${avatarId}`}
                className="avatar-image"
              />
              {selectedAvatar === avatarId && (
                <div className="avatar-checkmark">✓</div>
              )}
            </div>
          ))}
        </div>

        <button
          className={`confirm-button ${
            !selectedAvatar || isLoading ? 'disabled' : ''
          }`}
          onClick={handleConfirm}
          disabled={!selectedAvatar || isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner">⏳</span>
          ) : (
            'Выбрать'
          )}
        </button>
      </div>
    </div>
  );
};

export default AvatarSelection;