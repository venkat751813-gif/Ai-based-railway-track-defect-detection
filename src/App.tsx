import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inspection from './pages/Inspection';
import TrackSections from './pages/TrackSections';
import Defects from './pages/Defects';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inspect" element={<Inspection />} />
        <Route path="sections" element={<TrackSections />} />
        <Route path="defects" element={<Defects />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
