import AppHeader from './AppHeader';

/**
 * AppLayout — shared outer shell for Chat and Network pages.
 * Renders the full-screen glowing background, outer glass card container,
 * and top AppHeader bar with logo and user controls.
 */
export default function AppLayout({ children, pageType = 'chat' }) {
  return (
    <div className="lanova-app-viewport">
      {/* Glowing dark background */}
      <div className="lanova-app-bg" aria-hidden="true" />

      {/* Main Glass Application Container */}
      <main
        className={`lanova-app-card card-page-${pageType} anim-scale-in delay-0`}
        role="region"
        aria-label="LANOVA Application"
      >
        <AppHeader />
        <div className="lanova-card-body">
          {children}
        </div>
      </main>
    </div>
  );
}
