import { useState, useCallback } from 'react';
import { AGENT_CONFIGS } from "@/components/constants/agentConfigs";

export function useAgentSettings() {
  const [openModal, setOpenModal] = useState(null);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);

  const handleOpenSettings = useCallback((agent) => {
    if (agent.customModal) {
      if (agent.key === 'postType') {
        setShowPostTypeModal(true);
      }
    } else {
      setOpenModal(agent.key);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(null);
  }, []);

  const currentConfig = openModal ? AGENT_CONFIGS[openModal] : null;

  return {
    openModal,
    showPostTypeModal,
    setShowPostTypeModal,
    currentConfig,
    handleOpenSettings,
    handleCloseModal
  };
}