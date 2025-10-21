import React from 'react';
import styles from '../GamePlay.module.css';
import { FaDice } from 'react-icons/fa';
import CubeVideoAnimation from '../CubeVideoAnimation';

interface DiceAnimationProps {
  isRolling: boolean;
  diceResult?: number | null;
  showVideoAnimation?: boolean;
  onVideoAnimationComplete?: () => void;
}

const DiceAnimation: React.FC<DiceAnimationProps> = ({ 
  isRolling, 
  diceResult, 
  showVideoAnimation = false,
  onVideoAnimationComplete 
}) => {
  // Показываем видео анимацию если есть результат и флаг установлен
  if (showVideoAnimation && diceResult) {
    return (
      <CubeVideoAnimation 
        diceValue={diceResult}
        isVisible={true}
        onAnimationComplete={onVideoAnimationComplete}
      />
    );
  }
  
  // Показываем CSS анимацию во время броска
  if (!isRolling) return null;
  
  return (
    <div className={styles.diceAnimation}>
      <div className={`${styles.dice} ${styles.diceAnimating}`}>
        <FaDice />
      </div>
    </div>
  );
};

export default DiceAnimation;