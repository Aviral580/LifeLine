import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Navbar from './components/layout/Navbar';
import { ModeProvider } from './context/ModeContext';
import SearchPage from "./features/search/screens/SearchPage";

function App() {
  return (
    <ModeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </BrowserRouter>
    </ModeProvider>
  );
}

export default App;
