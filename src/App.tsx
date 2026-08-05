import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Plantilla } from './pages/Plantilla';
import { ObjetivosGrupales } from './pages/ObjetivosGrupales';
import { ModeloJuego } from './pages/ModeloJuego';
import { Equipos } from './pages/Equipos';
import { Partidos } from './pages/Partidos';
import { PartidoDetalle } from './pages/PartidoDetalle';
import { Sesiones } from './pages/Sesiones';
import { Tareas } from './pages/Tareas';
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
              <Route path="objetivos-grupales" element={<ObjetivosGrupales />} />
              <Route path="modelo-juego" element={<ModeloJuego />} />
              <Route path="equipos" element={<Equipos />} />
              <Route path="partidos" element={<Partidos />} />
              <Route path="partidos/:id" element={<PartidoDetalle />} />
              <Route path="sesiones" element={<Sesiones />} />
              <Route path="tareas" element={<Tareas />} />
              <Route path="scouting" element={<Scouting />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
