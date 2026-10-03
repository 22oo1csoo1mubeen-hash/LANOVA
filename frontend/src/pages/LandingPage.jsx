import { useNavigate, Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Logo from '../components/Logo';
import '../styles/landing.css';

/**
 * LandingPage — hero-only landing matching the reference design.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Background */}
      <div className="landing-bg" aria-hidden="true" />

      {/* Navbar */}
      <nav className="landing-nav anim-fade-down delay-0" aria-label="Primary navigation">
        <Logo to="/" />

        <ul className="nav-links" role="list">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#network">Network</a></li>
        </ul>

        <button
          className="nav-open-btn"
          onClick={() => navigate('/login')}
          aria-label="Open the LANOVA app"
        >
          OPEN APP
          <ArrowUpRight aria-hidden="true" />
        </button>
      </nav>

      {/* Hero */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        {/* Eyebrow */}
        <p className="hero-eyebrow anim-fade-up delay-1">
          Private.&nbsp; Local.&nbsp; Instant.
        </p>

        {/* Main Heading */}
        <h1 id="hero-heading" className="hero-title anim-fade-up delay-2">
          <span className="hero-title-white">MESSAGING, BUILT</span>
          <span className="hero-title-green">FOR YOUR NETWORK.</span>
        </h1>

        {/* Description */}
        <p className="hero-desc anim-fade-up delay-3">
          Connect locally. Communicate instantly.<br />
          A simple, real-time chat that works across your LAN.
        </p>

        {/* CTA */}
        <Link
          to="/login"
          className="hero-cta anim-fade-up delay-4"
          aria-label="Explore LANOVA — go to login"
        >
          Explore LANOVA
          <ArrowUpRight aria-hidden="true" />
        </Link>

        {/* Tagline */}
        <p className="hero-tagline anim-fade-up delay-5">
          No cloud. No clutter. Just your local network.
        </p>
      </section>
    </div>
  );
}
