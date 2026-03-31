import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const openShare  = () => setIsShareOpen(true);
  const closeShare = () => setIsShareOpen(false);

  return (
    <UIContext.Provider value={{ isShareOpen, openShare, closeShare }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
