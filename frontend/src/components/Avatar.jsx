/**
 * Avatar — renders a photo/silhouette avatar or letter initial badge
 * with status dot indicator.
 */
export default function Avatar({
  user,
  size = 40,
  showStatus = true,
  className = '',
}) {
  // If user object is passed, extract info
  const initials = user?.initials;
  const isPhoto = user?.avatar ?? true;
  const status = user?.status || 'online';
  const name = user?.username || 'User';

  // Seed-based subtle variation for avatars
  const charCode = name.charCodeAt(0) || 65;
  const hue = (charCode * 37) % 360;

  return (
    <div
      className={`lanova-avatar ${className}`}
      style={{ width: size, height: size, minWidth: size }}
      aria-label={name}
    >
      {initials ? (
        <div
          className="avatar-initials"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        >
          {initials}
        </div>
      ) : isPhoto ? (
        <div
          className="avatar-photo"
          style={{ width: size, height: size }}
        >
          {/* Stylized dark portrait vector matching reference */}
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="avatar-svg">
            <rect width="48" height="48" rx="24" fill={`hsl(${hue}, 18%, 14%)`} />
            {/* Subtle backlight glow */}
            <circle cx="24" cy="20" r="16" fill={`hsl(${hue}, 35%, 22%)`} opacity="0.6" filter="blur(4px)" />
            {/* Silhouette head */}
            <path
              d="M24 10C20.6863 10 18 12.6863 18 16C18 19.3137 20.6863 22 24 22C27.3137 22 30 19.3137 30 16C30 12.6863 27.3137 10 24 10Z"
              fill={`hsl(${hue}, 20%, 65%)`}
            />
            {/* Silhouette shoulders & torso */}
            <path
              d="M13 38C13 30.5 17.5 26.5 24 26.5C30.5 26.5 35 30.5 35 38C35 39.5 34 41 32 41H16C14 41 13 39.5 13 38Z"
              fill={`hsl(${hue}, 22%, 52%)`}
            />
            {/* Shirt collar highlight */}
            <path
              d="M21 26.5L24 31L27 26.5C26 27.2 25 27.5 24 27.5C23 27.5 22 27.2 21 26.5Z"
              fill={`hsl(${hue}, 15%, 85%)`}
              opacity="0.8"
            />
          </svg>
        </div>
      ) : (
        <div
          className="avatar-initials"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {showStatus && (
        <span
          className={`avatar-status-badge ${status}`}
          title={status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline'}
        />
      )}
    </div>
  );
}
