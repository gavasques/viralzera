import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

/**
 * Reusable info/tip card component
 * @param {React.ReactNode} icon - Icon component
 * @param {string} title - Card title
 * @param {string} description - Card description
 * @param {string} variant - Color variant: 'blue', 'purple', 'amber', 'green'
 */
const VARIANTS = {
  blue: {
    card: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    title: "text-blue-900",
    text: "text-blue-700"
  },
  purple: {
    card: "bg-purple-50 border-purple-200",
    icon: "text-purple-600",
    title: "text-purple-900",
    text: "text-purple-700"
  },
  amber: {
    card: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    title: "text-amber-900",
    text: "text-amber-700"
  },
  green: {
    card: "bg-green-50 border-green-200",
    icon: "text-green-600",
    title: "text-green-900",
    text: "text-green-700"
  }
};

export default function InfoCard({ icon: Icon, title, description, variant = "blue" }) {
  const colors = VARIANTS[variant] || VARIANTS.blue;
  
  return (
    <Card className={colors.card}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {Icon && <Icon className={`w-5 h-5 ${colors.icon} mt-0.5 shrink-0`} />}
          <div>
            {title && <h3 className={`font-semibold ${colors.title}`}>{title}</h3>}
            {description && <p className={`text-sm ${colors.text}`}>{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}