
import React, { createContext, useContext, useState, useEffect } from 'react';



const ModeContext = createContext();



export const ModeProvider = ({ children }) => {

  const [isEmergency, setIsEmergency] = useState(false);



  // Simulating Abhay's "Analytics & Mode Comparison" logic

  const toggleEmergency = () => {

    setIsEmergency((prev) => !prev);

  };



  useEffect(() => {

    // Apply styling to body based on mode

    if (isEmergency) {

      document.body.classList.add('emergency-mode');

      document.body.classList.add('dark');

    } else {

      document.body.classList.remove('emergency-mode');

      document.body.classList.remove('dark');

    }

  }, [isEmergency]);



  return (

    <ModeContext.Provider value={{ isEmergency, toggleEmergency }}>

      {children}

    </ModeContext.Provider>

  );

};



export const useMode = () => useContext(ModeContext);

