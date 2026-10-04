import { Link } from 'react-router-dom';

/**
 * Logo — reusable LANOVA wordmark.
 * @param {string} to - navigation target (default "/")
 * @param {string} className - extra class names
 */
export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`nav-logo ${className}`} aria-label="LANOVA home">
      LANOVA
    </Link>
  );
}
