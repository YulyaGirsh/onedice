import React, { useEffect, useRef, useState } from 'react';
import styles from './CubeVideoAnimation.module.css';

interface CubeVideoAnimationProps {
  diceValue: number | null;
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

const CubeVideoAnimation: React.FC<CubeVideoAnimationProps> = ({ 
  diceValue, 
  isVisible, 
  onAnimationComplete 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  console.log('CubeVideoAnimation рендер:', { diceValue, isVisible });

  useEffect(() => {
    if (isVisible && diceValue && videoRef.current) {
      const video = videoRef.current;
      
      // Сброс состояний
      setIsLoading(true);
      setHasError(false);
      
      // Формируем путь с учётом BASE_URL Vite (на случай деплоя не в корень)
      const baseUrl = (import.meta as any)?.env?.BASE_URL ?? '/';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const videoSrc = `${normalizedBase}animations/${diceValue}.mp4`;
      console.log('Загружаем видео из папки animations:', videoSrc);
      video.src = videoSrc;
      video.load();

      // Обработчики событий
      const handleLoadedData = () => {
        console.log('Видео загружено успешно', {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        setIsLoading(false);
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch(error => {
            // Не считаем это критической ошибкой: просто логируем
            console.warn('Автовоспроизведение не удалось, потребуется пользовательское действие:', error);
          });
        }
      };

      const handleEnded = () => {
        console.log('Видео завершено');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      };
      
      const handleError = () => {
        console.error('Ошибка загрузки/декодирования видео:', video.error, 'src:', video.src);
        setHasError(true);
        setIsLoading(false);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
      };
    }
  }, [diceValue, isVisible, onAnimationComplete]);

  if (!isVisible || !diceValue) {
    return null;
  }

  return (
    <div className={styles.cubeVideoContainer}>
      {isLoading && (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
        </div>
      )}
      
      {hasError ? (
        <div className={styles.errorFallback}>
          <div className={styles.diceNumber}>{diceValue}</div>
        </div>
      ) : (
        <video
          key={diceValue || 'dice-video'}
          ref={videoRef}
          className={styles.cubeVideo}
          muted
          playsInline
          autoPlay
          preload="auto"
        />
      )}
    </div>
  );
};

export default CubeVideoAnimation;