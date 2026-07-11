import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Plantilla } from './pages/Plantilla';
import { Equipos } from './pages/Equipos';
import { Partidos } from './pages/Partidos';
import { PartidoDetalle } from './pages/PartidoDetalle';
import { Sesiones } from './pages/Sesiones';
import { Scouting } from './pages/Scouting';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/plantilla" replace />} />
              <Route path="plantilla" element={<Plantilla />} />
              <Route path="equipos" element={<Equipos />} />
              <Route path="partidos" element={<Partidos />} />
              <Route path="partidos/:id" element={<PartidoDetalle />} />
              <Route path="sesiones" element={<Sesiones />} />
              <Route path="scouting" element={<Scouting />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
