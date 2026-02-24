import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Wand2, ArrowRight } from 'lucide-react';

/**
 * Modal para selecionar o tipo de conversa a ser criada
 */
export default function ConversationTypeSelector({ 
    open, 
    onOpenChange, 
    onSelectNormal, 
    onSelectMultiScript 
}) {
    const options = [
        {
            id: 'normal',
            title: 'Conversa Normal',
            description: 'Chat livre com múltiplos modelos para comparar respostas',
            icon: MessageSquare,
            color: 'indigo',
            onClick: onSelectNormal
        },
        {
            id: 'multiscript',
            title: 'Gerar Multi Script',
            description: 'Wizard guiado para criar scripts magnéticos com múltiplas IAs',
            icon: Wand2,
            color: 'pink',
            onClick: onSelectMultiScript
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-white">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        Nova Conversa
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Escolha o tipo de conversa que deseja criar
                    </p>
                </DialogHeader>

                <div className="p-6 pt-4 space-y-3">
                    {options.map((option, idx) => {
                        const Icon = option.icon;
                        const colorClasses = {
                            indigo: {
                                bg: 'bg-indigo-50',
                                icon: 'bg-indigo-100 text-indigo-600',
                                border: 'border-indigo-200 hover:border-indigo-300',
                                hover: 'hover:bg-indigo-50/50',
                                arrow: 'text-indigo-400 group-hover:text-indigo-600'
                            },
                            pink: {
                                bg: 'bg-pink-50',
                                icon: 'bg-pink-100 text-pink-600',
                                border: 'border-pink-200 hover:border-pink-300',
                                hover: 'hover:bg-pink-50/50',
                                arrow: 'text-pink-400 group-hover:text-pink-600'
                            }
                        };
                        const colors = colorClasses[option.color];

                        return (
                            <button
                                key={option.id}
                                onClick={() => {
                                    onOpenChange(false);
                                    option.onClick();
                                }}
                                className={`
                                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                                    ${colors.border} ${colors.hover} group cursor-pointer text-left
                                `}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">{option.title}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">{option.description}</p>
                                </div>
                                <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${colors.arrow}`} />
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}