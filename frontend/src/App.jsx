
import React from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';

import { ModeProvider } from './context/ModeContext';



function App() {

  return (

    <ModeProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/" element={<Home />} />

        </Routes>

      </BrowserRouter>

    </ModeProvider>

  );

}



export default App;

