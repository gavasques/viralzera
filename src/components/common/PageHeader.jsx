import React from 'react';
import { Button } from "@/components/ui/button";

/**
 * Reusable page header component
 * @param {string} title - Page title
 * @param {string} subtitle - Page subtitle/description
 * @param {React.ReactNode} icon - Icon component
 * @param {React.ReactNode} actions - Action buttons
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-pink-600" />}
          {title}
        </h1>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}