import React, { createContext, useContext, useState, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CanvasSidePanel from './CanvasSidePanel';

const CanvasContext = createContext(null);

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

export function CanvasProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCanvasId, setCurrentCanvasId] = useState(null);
  const queryClient = useQueryClient();

  const openCanvas = useCallback((canvasId = null) => {
    setCurrentCanvasId(canvasId);
    setIsOpen(true);
  }, []);

  const closeCanvas = useCallback(() => {
    setIsOpen(false);
    setCurrentCanvasId(null);
  }, []);

  const toggleCanvas = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const sendToCanvas = useCallback(async (content, title, source = 'manual', sourceChatId = null, focusId = null) => {
    try {
      const canvas = await base44.entities.Canvas.create({
        title: title || `Canvas - ${new Date().toLocaleString('pt-BR')}`,
        content,
        source,
        source_chat_id: sourceChatId,
        focus_id: focusId
      });
      
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
      
      // Open canvas panel with the new item
      setCurrentCanvasId(canvas.id);
      setIsOpen(true);
      
      toast.success("Enviado ao Canvas!");
      return canvas;
    } catch (error) {
      toast.error("Erro ao enviar ao Canvas");
      console.error(error);
      throw error;
    }
  }, [queryClient]);

  const value = {
    isOpen,
    openCanvas,
    closeCanvas,
    toggleCanvas,
    sendToCanvas,
    currentCanvasId
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
      <CanvasSidePanel 
        isOpen={isOpen} 
        onClose={closeCanvas} 
        initialCanvasId={currentCanvasId}
      />
    </CanvasContext.Provider>
  );
}