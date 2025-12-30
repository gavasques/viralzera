import React from "react";
import AgentCard from "./AgentCard";

export default function AgentCardGrid({ agents, onAgentClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard 
          key={agent.key}
          agent={agent}
          onClick={() => onAgentClick(agent)}
        />
      ))}
    </div>
  );
}