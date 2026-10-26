import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { BrandMark } from './components/ui';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Sports from './pages/Sports';
import SportDetail from './pages/SportDetail';
import Schedule from './pages/Schedule';
import Standings from './pages/Standings';
import Teams from './pages/Teams';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSports from './pages/admin/AdminSports';
import AdminMatches from './pages/admin/AdminMatches';
import AdminTeams from './pages/admin/AdminTeams';

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function BootScreen() {
  return (
    <div className="boot-screen">
      <BrandMark />
      <div>
        <strong>WMSU Intramurals</strong>
        <span>Loading the season…</span>
      </div>
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}

export default function App() {
  const { initializing } = useAuth();

  if (initializing) return <BootScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="sports" element={<Sports />} />
          <Route path="sports/:id" element={<SportDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="standings" element={<Standings />} />
          <Route path="teams" element={<Teams />} />

          <Route
            path="admin"
            element={
              <AdminOnly>
                <AdminDashboard />
              </AdminOnly>
            }
          />
          <Route
            path="admin/sports"
            element={
              <AdminOnly>
                <AdminSports />
              </AdminOnly>
            }
          />
          <Route
            path="admin/matches"
            element={
              <AdminOnly>
                <AdminMatches />
              </AdminOnly>
            }
          />
          <Route
            path="admin/teams"
            element={
              <AdminOnly>
                <AdminTeams />
              </AdminOnly>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
