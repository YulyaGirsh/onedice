import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

// Компонент отладочной страницы для тестирования Safe Areas
// Эта страница используется для диагностики перекрытий интерфейса Telegram на мобильных устройствах
// Тестирование рейтинговой системы перенесено в ProfilePage
function DebugPage({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [debugInfo, setDebugInfo] = useState({
    windowHeight: window.innerHeight,
    windowWidth: window.innerWidth,
    viewportHeight: 0,
    viewportStableHeight: 0,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    safeAreaLeft: 0,
    safeAreaRight: 0,
    contentSafeAreaTop: 0,
    contentSafeAreaBottom: 0,
    isFullscreen: false,
    // CSS переменные
    cssVarSafeTop: '0px',
    cssVarSafeRight: '0px',
    cssVarSafeBottom: '0px',
    cssVarSafeLeft: '0px',
    // Определение устройства
    isMobile: false,
    userAgent: navigator.userAgent,
    // JavaScript принудительные значения
    isJsForced: false,
  });

  // Определение мобильного устройства
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Проверка, установлены ли safe areas принудительно JavaScript'ом
  const checkJsForced = (cssVarSafeTop: string) => {
    const isMobile = isMobileDevice();
    if (!isMobile) return false;
    
    // Если на мобильном и safe-top больше или равен 90px, то это наши принудительные значения
    const topValue = parseInt(cssVarSafeTop);
    
    return topValue >= 90;
  };

  useEffect(() => {
    const updateDebugInfo = () => {
      const tg = window.Telegram?.WebApp;
      
      // Получаем вычисленные CSS переменные
      const computedStyle = getComputedStyle(document.documentElement);
      const cssVarSafeTop = computedStyle.getPropertyValue('--safe-top').trim();
      const cssVarSafeRight = computedStyle.getPropertyValue('--safe-right').trim();
      const cssVarSafeBottom = computedStyle.getPropertyValue('--safe-bottom').trim();
      const cssVarSafeLeft = computedStyle.getPropertyValue('--safe-left').trim();
      
      const isMobile = isMobileDevice();
      const isJsForced = checkJsForced(cssVarSafeTop);
      
      if (tg) {
        setDebugInfo({
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
          viewportHeight: tg.viewportHeight || 0,
          viewportStableHeight: tg.viewportStableHeight || 0,
          safeAreaTop: tg.safeAreaInset?.top || 0,
          safeAreaBottom: tg.safeAreaInset?.bottom || 0,
          safeAreaLeft: tg.safeAreaInset?.left || 0,
          safeAreaRight: tg.safeAreaInset?.right || 0,
          contentSafeAreaTop: tg.contentSafeAreaInset?.top || 0,
          contentSafeAreaBottom: tg.contentSafeAreaInset?.bottom || 0,
          isFullscreen: tg.isFullscreen || false,
          cssVarSafeTop,
          cssVarSafeRight,
          cssVarSafeBottom,
          cssVarSafeLeft,
          isMobile,
          userAgent: navigator.userAgent,
          isJsForced,
        });
      }
    };

    updateDebugInfo();
    
    // Обновляем каждые 500мс чтобы отслеживать изменения от JavaScript
    const interval = setInterval(updateDebugInfo, 500);
    window.addEventListener('resize', updateDebugInfo);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateDebugInfo);
    };
  }, []);

  const containers = Array.from({length: 12}, (_, i) => i + 1);

  return (
    <div className="debug-page">
      <div className="debug-info">
        <div><strong>🔍 {t('debug.safeAreasDiagnostics')}:</strong></div>
        <hr style={{margin: '8px 0', border: '1px solid rgba(255,255,255,0.2)'}} />
        
        <div><strong>📱 {t('debug.device')}:</strong></div>
        <div>Mobile: {debugInfo.isMobile ? `✅ ${t('debug.yes')}` : `❌ ${t('debug.no')}`}</div>
        <div>UA: {debugInfo.userAgent.slice(0, 50)}...</div>
        
        {debugInfo.isMobile && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            background: debugInfo.isJsForced ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 107, 107, 0.2)',
            borderRadius: '4px',
            border: `1px solid ${debugInfo.isJsForced ? '#51cf66' : '#ff6b6b'}`
          }}>
            <div style={{fontWeight: 'bold', fontSize: '12px'}}>
              {debugInfo.isJsForced ? `🔧 ${t('debug.jsForced')}` : `⚠️ ${t('debug.sdkCssVariables')}`}
            </div>
            <div style={{fontSize: '10px', marginTop: '4px'}}>
              {debugInfo.isJsForced 
                ? t('debug.jsForcedDescription') 
                : t('debug.sdkCssDescription')
              }
            </div>
          </div>
        )}
        
        <hr style={{margin: '8px 0', border: '1px solid rgba(255,255,255,0.2)'}} />
        
        <div><strong>🖥️ {t('debug.dimensions')}:</strong></div>
        <div>{t('debug.window')}: {debugInfo.windowWidth}×{debugInfo.windowHeight}</div>
        <div>Viewport: {debugInfo.viewportHeight}px ({t('debug.stable')}: {debugInfo.viewportStableHeight}px)</div>
        <div>Fullscreen: {debugInfo.isFullscreen ? `✅ ${t('debug.yes')}` : `❌ ${t('debug.no')}`}</div>
        <hr style={{margin: '8px 0', border: '1px solid rgba(255,255,255,0.2)'}} />
        
        <div><strong>🛡️ {t('debug.telegramSafeAreas')} (SDK):</strong></div>
        <div>safeAreaInset: top:{debugInfo.safeAreaTop} right:{debugInfo.safeAreaRight} bottom:{debugInfo.safeAreaBottom} left:{debugInfo.safeAreaLeft}</div>
        <div>contentSafeAreaInset: top:{debugInfo.contentSafeAreaTop} bottom:{debugInfo.contentSafeAreaBottom}</div>
        <hr style={{margin: '8px 0', border: '1px solid rgba(255,255,255,0.2)'}} />
        
        <div><strong>🎨 {t('debug.cssVariables')} ({t('debug.final')}):</strong></div>
        <div style={{color: debugInfo.cssVarSafeTop === '0px' ? '#ff6b6b' : '#51cf66'}}>
          --safe-top: {debugInfo.cssVarSafeTop || t('debug.notDefined')} 
          {debugInfo.isMobile && debugInfo.isJsForced && ' 🔧'}
        </div>
        <div style={{color: debugInfo.cssVarSafeRight === '0px' ? '#51cf66' : '#ffd700'}}>
          --safe-right: {debugInfo.cssVarSafeRight || t('debug.notDefined')}
        </div>
        <div style={{color: debugInfo.cssVarSafeBottom === '0px' ? '#51cf66' : '#ffd700'}}>
          --safe-bottom: {debugInfo.cssVarSafeBottom || t('debug.notDefined')}
        </div>
        <div style={{color: debugInfo.cssVarSafeLeft === '0px' ? '#51cf66' : '#ff6b6b'}}>
          --safe-left: {debugInfo.cssVarSafeLeft || t('debug.notDefined')}
        </div>
        
        <div style={{marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.6)'}}>
          {t('debug.colorLegend')}
        </div>
      </div>

      <div className="debug-zones">
        <div className="debug-zone top">{t('debug.safeAreaTop')}</div>
        <div className="debug-zone bottom">{t('debug.safeAreaBottom')}</div>
        <div className="debug-zone left">{t('debug.left')}</div>
        <div className="debug-zone right">{t('debug.right')}</div>
      </div>

      <div className="debug-grid">
        {containers.map((num) => (
          <div key={num} className="debug-container">
            <div className="debug-label">
              {t('debug.container')} {num}<br/>
              {t('debug.height')}: {60 + (num * 10)}px
            </div>
          </div>
        ))}
      </div>



      <button className="debug-back-btn" onClick={onBack}>
        ← {t('debug.backToMain')}
      </button>
    </div>
  );
}

export default DebugPage;