import { createContext, useState } from 'react';

export const TasaCambioContext = createContext();

export const TasaCambioProvider = ({ children }) => {
  const [tasaPromedio, setTasaPromedio] = useState(77.205);

  return (
    <TasaCambioContext.Provider value={{ tasaPromedio, setTasaPromedio }}>
      {children}
    </TasaCambioContext.Provider>
  );
}; 