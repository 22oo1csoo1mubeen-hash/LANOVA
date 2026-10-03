import { useState, useEffect, useRef } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

/**
 * AppLayout — shared outer shell for Chat and Network pages.
 * Renders the full-screen glowing background, outer glass card container,
 * top AppHeader bar with logo and sliding user controls, and smoothly
 * animates route transitions with directional fade + optical blur.
 */
export default function AppLayout() {
  const location = useLocation();
  const isNetwork = location.pathname.startsWith('/network');
  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState('');

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setDirection(isNetwork ? 'forward' : 'backward');
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname, isNetwork]);

  return (
    <div className="lanova-app-viewport">
      {/* Glowing dark background */}
      <div className="lanova-app-bg" aria-hidden="true" />

      {/* Main Glass Application Container */}
      <main
        className="lanova-app-card"
        role="region"
        aria-label="LANOVA Application"
      >
        <AppHeader />
        <div
          className={`lanova-card-body${direction ? ` anim-${direction}` : ''}`}
          key={location.pathname}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
