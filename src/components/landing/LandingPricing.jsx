import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LandingPricing() {
    return (
        <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-rose-100/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Acesso Completo <br />
                        <span className="text-rose-600">Sem Limites</span>
                    </h2>
                    <p className="text-lg text-slate-500">
                        Um único plano com todas as ferramentas que você precisa para viralizar.
                        Sem custos ocultos.
                    </p>
                </div>

                <div className="max-w-lg mx-auto">
                    <div className="relative p-10 rounded-3xl bg-white border border-rose-100 shadow-2xl shadow-rose-200/50 overflow-hidden group hover:border-rose-300 transition-all duration-300">
                        <div className="absolute top-0 right-0 bg-rose-600 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm tracking-wide">
                            OFICIAL
                        </div>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
                                Viralzera Pro
                            </h3>
                            <p className="text-slate-500">A suíte definitiva de IA para criadores.</p>
                        </div>

                        <div className="flex items-end gap-2 mb-8">
                            <span className="text-6xl font-extrabold text-slate-900 tracking-tight">R$ 199</span>
                            <span className="text-xl text-slate-500 font-medium mb-2">/mês</span>
                        </div>

                        <div className="space-y-4 mb-10">
                            {[
                                "Acesso Ilimitado ao Multi Chat IA (Todos os modelos)",
                                "Criação Ilimitada de Personas e Públicos",
                                "Gerador de Scripts Virais & Análise de Roteiros",
                                "Radar de Tendências & Adaptação Automática",
                                "DNA de Comunicação Personalizado",
                                "Matriz de Conteúdo & Calendário Editorial",
                                "Banco de Listas & Materiais de Apoio",
                                "Suporte Prioritário & Comunidade Exclusiva"
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 bg-green-100 p-0.5 rounded-full shrink-0">
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <span className="text-slate-600 font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <Link to={createPageUrl('Dashboard')}>
                            <Button className="w-full h-14 rounded-xl text-lg font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-[1.02] transition-all">
                                Assinar Agora
                            </Button>
                        </Link>
                        
                        <p className="text-xs text-slate-400 text-center mt-4">
                            Pagamento seguro via Stripe. Cancele quando quiser.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}