/**
 * Dialog de confirmação para remoção de modelo
 */

import React, { memo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function RemoveModelDialog({ modelId, modelName, onConfirm, onCancel }) {
  const isOpen = !!modelId;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Modelo</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover "{modelName}" deste chat? 
            O histórico de métricas será preservado, mas o modelo não receberá mais mensagens.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default memo(RemoveModelDialog);