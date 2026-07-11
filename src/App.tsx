import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Plantilla } from './pages/Plantilla';
import { Equipos } from './pages/Equipos';
import { Partidos } from './pages/Partidos';
import { PartidoDetalle } from './pages/PartidoDetalle';
import { Sesiones } from './pages/Sesiones';
import { Scouting } from './pages/Scouting';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plantilla" replace />} />
          <Route path="plantilla" element={<Plantilla />} />
          <Route path="equipos" element={<Equipos />} />
          <Route path="partidos" element={<Partidos />} />
          <Route path="partidos/:id" element={<PartidoDetalle />} />
          <Route path="sesiones" element={<Sesiones />} />
          <Route path="scouting" element={<Scouting />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
