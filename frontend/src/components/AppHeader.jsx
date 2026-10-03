import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronDown, MessageSquare, Radio, LogOut } from 'lucide-react';
import Avatar from './Avatar';

/**
 * AppHeader — top bar for Chat and Network pages.
 * Displays LANOVA logo on the left, central navigation switcher with a sliding pill indicator,
 * and user profile pill on the right which reveals the Logout option on click.
 */
export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isNetwork = location.pathname.startsWith('/network');

  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const chatRef = useRef(null);
  const networkRef = useRef(null);

  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Update slider position & dimensions dynamically
  useEffect(() => {
    const updateSlider = () => {
      const activeEl = isNetwork ? networkRef.current : chatRef.current;
      if (activeEl) {
        setSliderStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1,
        });
      }
    };

    updateSlider();
    // Re-check after font loads or window resizes
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [isNetwork]);

  const currentUser = {
    username: 'Mubeen',
    avatar: true,
    status: 'online',
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="lanova-header">
      {/* Brand logo on the left */}
      <div
        className="lanova-header-logo"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        aria-label="LANOVA home"
      >
        LANOVA
      </div>

      {/* Central Navigation Switcher with Sliding Indicator */}
      <nav className="lanova-header-nav" aria-label="Main navigation">
        {/* Sliding Pill Indicator */}
        <div
          className="lanova-header-nav-slider"
          style={{
            left: `${sliderStyle.left}px`,
            width: `${sliderStyle.width}px`,
            opacity: sliderStyle.opacity,
          }}
          aria-hidden="true"
        />

        <Link
          to="/chat"
          ref={chatRef}
          className={`lanova-header-nav-link${!isNetwork ? ' active' : ''}`}
        >
          <MessageSquare size={16} strokeWidth={2} />
          <span>Chat</span>
        </Link>
        <Link
          to="/network"
          ref={networkRef}
          className={`lanova-header-nav-link${isNetwork ? ' active' : ''}`}
        >
          <Radio size={16} strokeWidth={2} />
          <span>Network Info</span>
        </Link>
      </nav>

      {/* Right controls: User profile with click-to-open Logout menu */}
      <div className="lanova-header-right" ref={dropdownRef}>
        <div
          className={`lanova-header-user${menuOpen ? ' menu-open' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => setMenuOpen((prev) => !prev)}
          onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((prev) => !prev)}
          aria-label="User profile and menu"
          aria-expanded={menuOpen}
        >
          <Avatar user={currentUser} size={36} showStatus={true} />
          <div className="lanova-user-meta">
            <span className="lanova-username">{currentUser.username}</span>
            <span className="lanova-user-status">
              <span className="status-bullet online" />
              Online
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`lanova-user-chevron${menuOpen ? ' open' : ''}`}
          />
        </div>

        {/* Dropdown Menu on Click */}
        {menuOpen && (
          <div className="lanova-user-dropdown anim-scale-in" role="menu">
            <button
              type="button"
              className="lanova-dropdown-item logout"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                navigate('/login');
              }}
            >
              <LogOut size={16} strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
