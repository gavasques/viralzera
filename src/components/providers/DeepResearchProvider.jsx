import React, { createContext, useContext, useState } from 'react';

const DeepResearchContext = createContext();

export function DeepResearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modelingId, setModelingId] = useState(null);

  const openDeepResearch = (id) => {
    setModelingId(id);
    setIsOpen(true);
  };

  const closeDeepResearch = () => {
    setIsOpen(false);
    // Não limpa o modelingId para manter o contexto se reabrir
  };

  return (
    <DeepResearchContext.Provider value={{ isOpen, modelingId, openDeepResearch, closeDeepResearch }}>
      {children}
    </DeepResearchContext.Provider>
  );
}

export function useDeepResearch() {
  const context = useContext(DeepResearchContext);
  if (!context) {
    throw new Error('useDeepResearch must be used within DeepResearchProvider');
  }
  return context;
}