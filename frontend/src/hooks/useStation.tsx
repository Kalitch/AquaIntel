import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StationContextValue {
  stationId: string | null;
  stationName: string;
  setStation: (id: string, name: string) => void;
}

const StationContext = createContext<StationContextValue>({
  stationId: null,
  stationName: '',
  setStation: () => {},
});

export function StationProvider({ children }: { children: ReactNode }) {
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationName, setStationName] = useState('');

  const setStation = (id: string, name: string) => {
    setStationId(id);
    setStationName(name);
  };

  return (
    <StationContext.Provider value={{ stationId, stationName, setStation }}>
      {children}
    </StationContext.Provider>
  );
}

export const useStation = () => useContext(StationContext);
