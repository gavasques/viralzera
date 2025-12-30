import React, { memo } from 'react';
import { Settings } from 'lucide-react';

/**
 * Estado quando nenhum modelo está selecionado
 */
function NoModelsState() {
  return (
    <div className="flex-1 flex items-center justify-center flex-col text-slate-400 w-full">
      <Settings className="w-12 h-12 mb-4 opacity-10" />
      <p>Selecione pelo menos um modelo para começar.</p>
    </div>
  );
}

export default memo(NoModelsState);