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
  const [canClose, setCanClose] = useState(true); // Сразу доступна для закрытия
  
  const webApp = useTelegramWebApp();
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsClosing(false);
      setGifLoaded(false);
      setCanClose(true); // Кнопка сразу активна
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
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
            className={styles.closeButton}
            onClick={handleClose}
            disabled={!canClose}
          >
            <span className={styles.buttonText}>
              {t('common.ok')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;