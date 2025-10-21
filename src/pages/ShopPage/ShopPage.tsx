import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import styles from './ShopPage.module.css';
import { FaShoppingCart, FaGift, FaTrophy, FaStar } from 'react-icons/fa';

const ShopPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className={styles.shopPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.shopIcon}><FaShoppingCart /></div>
          <h1 className={styles.title}>{t('shop.title')}</h1>
          <p className={styles.subtitle}>{t('shop.subtitle')}</p>
          <p className={styles.comingSoon}>{t('shop.comingSoon')}</p>
          
          <div className={styles.comingSoonBadge}>
            <span className={styles.sparkle}><FaStar /></span>
            {t('shop.openingSoon')}
            <span className={styles.sparkle}><FaStar /></span>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaGift /></div>
            <h3 className={styles.featureTitle}>{t('shop.prizeCases')}</h3>
            <p className={styles.featureDescription}>
              {t('shop.prizeCasesDescription')}
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FaTrophy /></div>
            <h3 className={styles.featureTitle}>{t('shop.exclusives')}</h3>
            <p className={styles.featureDescription}>
              {t('shop.exclusivesDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;