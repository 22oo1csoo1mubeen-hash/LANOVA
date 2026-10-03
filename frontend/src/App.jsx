import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage    from './pages/AuthPage';
import ChatPage    from './pages/ChatPage';
import NetworkPage from './pages/NetworkPage';

/**
 * App — client-side routing.
 *
 * Routes:
 *   /          -> LandingPage
 *   /login     -> AuthPage  (tab: login)
 *   /register  -> AuthPage  (tab: register)
 *   /chat      -> ChatPage
 *   /network   -> NetworkPage
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/chat"     element={<ChatPage />} />
        <Route path="/network"  element={<NetworkPage />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
