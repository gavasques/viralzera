import React, { useState } from 'react';
import { ThumbsUp, Trophy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function VoteButton({ 
    conversationId, 
    modelId, 
    modelAlias,
    context = 'multi_chat',
    compact = false 
}) {
    const queryClient = useQueryClient();

    // Check if user already voted in this conversation (any model)
    const { data: conversationVotes, isLoading: checkingVote } = useQuery({
        queryKey: ['conversationVotes', conversationId],
        queryFn: async () => {
            const votes = await base44.entities.ModelVote.filter({
                conversation_id: conversationId
            });
            return votes;
        },
        enabled: !!conversationId
    });

    // Check if THIS model has the vote
    const existingVote = conversationVotes?.find(v => v.model_id === modelId);
    // Check if ANY model in this conversation has a vote
    const hasAnyVote = conversationVotes?.length > 0;

    const voteMutation = useMutation({
        mutationFn: async () => {
            // If this model already has the vote, remove it
            if (existingVote) {
                await base44.entities.ModelVote.delete(existingVote.id);
                return { action: 'removed' };
            }
            
            // If another model has the vote, remove it first
            if (hasAnyVote && conversationVotes) {
                for (const vote of conversationVotes) {
                    await base44.entities.ModelVote.delete(vote.id);
                }
            }
            
            // Create new vote for this model
            await base44.entities.ModelVote.create({
                conversation_id: conversationId,
                model_id: modelId,
                model_alias: modelAlias,
                vote_type: 'best',
                context
            });
            return { action: 'voted' };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['conversationVotes', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['modelVotes'] });
            
            if (result.action === 'voted') {
                toast.success(`Você votou em ${modelAlias} como melhor resposta!`);
            } else {
                toast.success('Voto removido');
            }
        },
        onError: () => {
            toast.error('Erro ao registrar voto');
        }
    });

    const hasVoted = !!existingVote;
    const isLoading = checkingVote || voteMutation.isPending;

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => voteMutation.mutate()}
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
            onClick={() => voteMutation.mutate()}
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