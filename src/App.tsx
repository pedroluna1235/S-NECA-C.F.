import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Plantilla } from './pages/Plantilla';
import { Equipos } from './pages/Equipos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plantilla" replace />} />
          <Route path="plantilla" element={<Plantilla />} />
          <Route path="equipos" element={<Equipos />} />
          {/* <Route path="partidos" element={<Partidos />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
