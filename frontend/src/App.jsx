import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage    from './pages/AuthPage';

/**
 * App — client-side routing.
 *
 * Routes:
 *   /          -> LandingPage
 *   /login     -> AuthPage  (tab: login)
 *   /register  -> AuthPage  (tab: register)
 *
 * Both auth routes share the same AuthPage component so switching
 * between Login and Register tabs is animated in-place, with no
 * full page reload or flash.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
