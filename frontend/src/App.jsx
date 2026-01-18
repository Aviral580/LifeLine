import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Navbar from './components/layout/Navbar';
import { ModeProvider } from './context/ModeContext';

function App() {
  return (
    <ModeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ModeProvider>
  );
}

export default App;
