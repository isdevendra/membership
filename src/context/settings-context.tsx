
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  casinoName: string;
  logoUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const defaultSettings: Settings = {
  casinoName: 'Membership Manager',
  logoUrl: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('casinoSettings');
      if (storedSettings) {
        setSettingsState(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const setSettings = (newSettings: Settings) => {
    try {
      setSettingsState(newSettings);
      localStorage.setItem('casinoSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  };
  
  if (!isLoaded) {
      return null; // Or a loading spinner
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
