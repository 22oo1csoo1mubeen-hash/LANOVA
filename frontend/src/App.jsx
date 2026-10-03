import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LandingPage    from './pages/LandingPage';
import AuthPage       from './pages/AuthPage';
import ChatPage       from './pages/ChatPage';
import NetworkPage    from './pages/NetworkPage';
import AppLayout      from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * App — client-side routing with authentication protection.
 *
 * Routes:
 *   /          -> LandingPage (Public)
 *   /login     -> AuthPage (tab: login)
 *   /register  -> AuthPage (tab: register)
 *   /chat      -> ChatPage (Protected)
 *   /network   -> NetworkPage (Protected)
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* Protected application routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/chat"     element={<ChatPage />} />
                <Route path="/network"  element={<NetworkPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
