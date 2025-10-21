import React, { useRef, useEffect, useState } from 'react';
import { BsFillDice6Fill } from 'react-icons/bs';
import './BottomNavigation.css';
import { PageType } from '../types';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useLanguage } from '../hooks/useLanguage';

interface BottomNavigationProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPage, setCurrentPage }) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);
  
  const [indicatorStyle, setIndicatorStyle] = useState({ left: '50%' });
  
  // Получаем доступ к расширенному Telegram WebApp API
  const webApp = useTelegramWebApp();
  const { t } = useLanguage();

  // Функция для тактильной обратной связи
  const triggerHapticFeedback = (page: PageType) => {
    if (webApp?.hapticFeedback) {
      // Используем мягкую вибрацию при переключении вкладок
      webApp.hapticFeedback.impactOccurred('light');
      console.log('🎯 Haptic feedback triggered for:', page);
    }
  };

  // Обработчик смены страницы с вибрацией
  const handlePageChange = (page: PageType) => {
    if (page !== currentPage) {
      // Сначала вибрация, потом смена страницы
      triggerHapticFeedback(page);
      setCurrentPage(page);
    }
  };

  // Функция для обновления позиции индикатора
  const updateIndicatorPosition = () => {
    if (!tabsRef.current) return;

    const tabsRect = tabsRef.current.getBoundingClientRect();
    let activeTab: HTMLDivElement | null = null;

    switch (currentPage) {
      case 'rating':
        activeTab = ratingRef.current;
        break;
      case 'play':
        activeTab = playRef.current;
        break;
      case 'shop':
        activeTab = shopRef.current;
        break;
    }

    if (activeTab) {
      const activeTabRect = activeTab.getBoundingClientRect();
      const tabsLeft = tabsRect.left;
      const activeTabCenter = activeTabRect.left + activeTabRect.width / 2 - tabsLeft;
      
      setIndicatorStyle({
        left: `${activeTabCenter}px`
      });
    }
  };

  // Обновляем позицию при изменении активной страницы
  useEffect(() => {
    updateIndicatorPosition();
  }, [currentPage]);

  // Обновляем позицию при ресайзе окна
  useEffect(() => {
    const handleResize = () => {
      updateIndicatorPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage]);

  return (
    <div className="navbar">
      <div className="tabs" ref={tabsRef}>
        {/* Общий анимированный индикатор на бордере меню */}
        <div 
          className="floating-indicator" 
          style={{ 
            left: indicatorStyle.left,
            transform: 'translateX(-50%)', // Центрируем индикатор
            transformOrigin: 'center top'
          }}
        ></div>

        {/* Рейтинг */}
        <div 
          ref={ratingRef}
          className={`tab ${currentPage === 'rating' ? 'active' : ''}`}
          onClick={() => handlePageChange('rating')}
        >
          <div className="wrapper">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2L17.4 8.9L25 10.1L19.5 15.4L20.8 23L14 19.4L7.2 23L8.5 15.4L3 10.1L10.6 8.9L14 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="tab-label">{t('navigation.rating')}</div>
        </div>

        {/* Играть */}
        <div 
          ref={playRef}
          className={`tab ${currentPage === 'play' ? 'active' : ''}`}
          onClick={() => handlePageChange('play')}
        >
          <div className="wrapper">
            <BsFillDice6Fill className="dice-icon" />
          </div>
          <div className="tab-label">{t('navigation.play')}</div>
        </div>

        {/* Магазин */}
        <div 
          ref={shopRef}
          className={`tab ${currentPage === 'shop' ? 'active' : ''}`}
          onClick={() => handlePageChange('shop')}
        >
          <div className="wrapper">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.5 7L8.5 4H19.5L21.5 7H25C25.5523 7 26 7.44772 26 8C26 8.55228 25.5523 9 25 9H24V20C24 21.6569 22.6569 23 21 23H7C5.34315 23 4 21.6569 4 20V9H3C2.44772 9 2 8.55228 2 8C2 7.44772 2.44772 7 3 7H6.5ZM10.5 6L9.5 7H18.5L17.5 6H10.5ZM6 9V20C6 20.5523 6.44772 21 7 21H21C21.5523 21 22 20.5523 22 20V9H6Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="tab-label">{t('navigation.shop')}</div>
        </div>


      </div>
    </div>
  );
};

export default BottomNavigation;