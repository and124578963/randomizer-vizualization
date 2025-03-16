import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './components/AdminPage';
import VisualizationPage from './components/VisualizationPage';

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/uyqwefgqiuye12iu3gh12h3/" element={<AdminPage />} />
          <Route path="/uyqwefgqiuye12iu3gh12h3/visualization" element={<VisualizationPage />} />
        </Routes>
      </Router>
  );
}

export default App;