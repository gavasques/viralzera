import React, { memo } from 'react';
import { ThumbsUp, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useConversationVotes } from './hooks/useTitanosData';
import { useVoteMutations } from './hooks/useTitanosMutations';

/**
 * Botão de voto para modelo
 */
function VoteButton({ 
  conversationId, 
  modelId, 
  modelAlias,
  context = 'multi_chat',
  compact = false 
}) {
  const { data: conversationVotes = [], isLoading: checkingVote } = useConversationVotes(conversationId);
  const { vote } = useVoteMutations(conversationId);

  const existingVote = conversationVotes.find(v => v.model_id === modelId);
  const hasVoted = !!existingVote;
  const isLoading = checkingVote || vote.isPending;

  const handleVote = () => {
    vote.mutate({
      modelId,
      modelAlias,
      existingVote,
      allVotes: conversationVotes,
      context,
    });
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleVote}
              disabled={isLoading}
              className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                hasVoted 
                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200" 
                  : "hover:bg-slate-100 text-slate-400 hover:text-amber-500"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : hasVoted ? (
                <Trophy className="w-4 h-4" />
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {hasVoted ? 'Remover voto de melhor' : 'Votar como melhor resposta'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      className={cn(
        "gap-1.5 transition-all",
        hasVoted && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : hasVoted ? (
        <>
          <Trophy className="w-3.5 h-3.5" />
          Melhor
        </>
      ) : (
        <>
          <ThumbsUp className="w-3.5 h-3.5" />
          Votar
        </>
      )}
    </Button>
  );
}

export default memo(VoteButton);