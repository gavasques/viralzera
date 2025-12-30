import React from 'react';
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

/**
 * Reusable confirmation dialog
 * @param {boolean} open - Dialog open state
 * @param {Function} onOpenChange - Open state change handler
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {string} confirmLabel - Confirm button label
 * @param {string} cancelLabel - Cancel button label
 * @param {Function} onConfirm - Confirm action handler
 * @param {string} variant - 'danger' or 'default'
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Tem certeza?",
  description = "Esta ação não pode ser desfeita.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "danger"
}) {
  const confirmClass = variant === "danger" 
    ? "bg-red-600 hover:bg-red-700" 
    : "bg-indigo-600 hover:bg-indigo-700";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}