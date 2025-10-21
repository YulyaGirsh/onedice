import React from 'react';
import styles from '../GamePlay.module.css';
import { DiceResult } from '../../../types';
import { FaDice, FaTrophy } from 'react-icons/fa';
import { useLanguage } from '../../../hooks/useLanguage';

interface ResultsDisplayProps {
  results: DiceResult[];
  winner: DiceResult | null;
  ratingDelta: number | null;
  currentUserId: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, winner, ratingDelta, currentUserId }) => {
  const { t } = useLanguage();
  const renderDice = (_value?: number) => {
    return (
      <div className={styles.dice}>
        <FaDice />
      </div>
    );
  };

  return (
    <div className={styles.playersSection}>
      <h2 className={styles.sectionTitle}>{t('results.title')}</h2>
      <div className={styles.playersGrid}>
        {results.map((result) => (
          <div 
            key={result.playerId} 
            className={`${styles.playerResult} ${
              winner?.playerId === result.playerId ? styles.winner : ''
            }`}
          >
            <div className={styles.playerName}>{result.playerName}</div>
            {renderDice(result.diceValue)}
            <div className={styles.diceValue}>{result.diceValue}</div>
            {winner?.playerId === result.playerId && (
              <div className={styles.winnerBadge}><FaTrophy /> {t('results.winner')}</div>
            )}
            {ratingDelta !== null && result.playerId === currentUserId && (
              <div className={`${styles.ratingDelta} ${ratingDelta < 0 ? ' '+styles.negative : ''}`}>
                {ratingDelta < 0 ? '' : '+'}{Math.abs(ratingDelta)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;