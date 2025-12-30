import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Reusable empty state component
 * @param {React.ReactNode} icon - Icon component
 * @param {string} title - Empty state title
 * @param {string} description - Empty state description
 * @param {string} actionLabel - Button label
 * @param {Function} onAction - Button click handler
 */
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}) {
  return (
    <Card className={`p-8 text-center ${className}`}>
      {Icon && <Icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />}
      {title && <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>}
      {description && <p className="text-slate-500 mb-6">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}