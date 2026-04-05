import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import IdeasPage from './pages/IdeasPage';
import IdeaDetailPage from './pages/IdeaDetailPage';
import AboutPage from './pages/AboutPage';
import GamePage from './pages/GamePage';
import GameRevealPage from './pages/GameRevealPage';

function App() {
  return (
    <Routes>
      <Route path="/game" element={<GamePage />} />
      <Route path="/game/reveal/:id" element={<GameRevealPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="ideas" element={<IdeasPage />} />
        <Route path="ideas/:id" element={<IdeaDetailPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
