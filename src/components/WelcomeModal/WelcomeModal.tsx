import React, { useEffect, useState } from 'react';
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './WelcomeModal.module.css';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onClose }) => {
  const { t } = useLanguage();
  const [gifLoaded, setGifLoaded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  
  const webApp = useTelegramWebApp();
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsClosing(false);
      setGifLoaded(false);
      setCountdown(5);
      setCanClose(false);
      document.body.classList.add('modal-open');
      
      // Запускаем отсчет
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanClose(true);
            setShowTimer(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        document.body.classList.remove('modal-open');
      };
    }
  }, [visible]);

  const handleClose = () => {
    if (!canClose) return;
    
    setIsClosing(true);
    webApp?.hapticFeedback?.impactOccurred('light');
    
    setTimeout(() => {
      setIsVisible(false);
      onClose();
      document.body.classList.remove('modal-open');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.modal} ${isClosing ? styles.fadeOut : ''}`}>
      <div className={`${styles.content} ${currentTheme === 'dark' ? styles.dark : styles.light}`}>
        <div className={`${styles.imageWrapper} ${gifLoaded ? styles.loaded : ''}`}>
          <img
            src="/animations/AnimatedEmojies.gif"
            alt="Welcome"
            className={styles.image}
            onLoad={() => setGifLoaded(true)}
          />
        </div>

        <div className={styles.textContent}>
          <h2 className={styles.title}>DICE!</h2>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureHighlight}>{t('welcome.playHighlight')}</span> {t('welcome.playText')}
            </div>
            <div className={styles.feature}>
              <span className={styles.featureHighlight}>{t('welcome.riseHighlight')}</span> {t('welcome.riseText')}
            </div>
            <div className={styles.feature}>
              <span className={styles.featureHighlight}>{t('welcome.winHighlight')}</span> {t('welcome.winText')}
            </div>
            <div className={styles.feature}>
              <span className={styles.featureHighlight}>{t('welcome.earnHighlight')}</span> {t('welcome.earnText')}
            </div>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.closeButton} ${showTimer ? styles.withTimer : ''}`}
            onClick={handleClose}
            disabled={!canClose}
          >
            <span className={styles.buttonText}>
              {t('common.ok')}
            </span>
            {showTimer && (
              <span className={styles.timer}>
                {countdown}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;