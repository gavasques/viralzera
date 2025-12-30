import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AgentCard({ agent, onClick }) {
  const IconComponent = agent.icon;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${agent.color} text-white shrink-0`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {agent.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {agent.description}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t flex justify-end">
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}