import React from 'react';
import { Bot, Users, TrendingUp, Layers, Zap, Brain, Target, Package, Library } from 'lucide-react';

const features = [
    {
        icon: Bot,
        title: "Multi Chat IA",
        description: "O coração do sistema. Converse simultaneamente com GPT-4, Claude 3, Gemini e outros modelos de ponta. Compare respostas lado a lado e combine o melhor de cada inteligência.",
        color: "text-rose-600",
        bg: "bg-rose-50"
    },
    {
        icon: Users,
        title: "Personas Profundas",
        description: "Crie personas tridimensionais com dores, desejos, medos e crenças. Simule conversas com seu público-alvo para validar ideias antes de criar.",
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        icon: TrendingUp,
        title: "Radar de Tendências",
        description: "Monitore o que está viralizando no seu nicho em tempo real. Nossa IA adapta as trends para a sua voz e contexto automaticamente.",
        color: "text-orange-600",
        bg: "bg-orange-50"
    },
    {
        icon: Brain,
        title: "DNA de Comunicação",
        description: "Clone sua voz e estilo. O sistema aprende como você escreve e fala, garantindo que todo conteúdo gerado soe 100% autêntico e humano.",
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        icon: Zap,
        title: "Gerador de Scripts",
        description: "Crie roteiros magnéticos para Reels, TikToks e YouTube Shorts. Utilize frameworks de retenção comprovados para prender a atenção do início ao fim.",
        color: "text-amber-600",
        bg: "bg-amber-50"
    },
    {
        icon: Layers,
        title: "Matriz de Conteúdo",
        description: "Nunca mais fique sem ideias. Organize seus pilares editoriais e gere um calendário infinito de conteúdo alinhado com sua estratégia.",
        color: "text-green-600",
        bg: "bg-green-50"
    },
    {
        icon: Target,
        title: "Públicos-Alvo",
        description: "Mapeie detalhadamente seus segmentos de audiência. Entenda níveis de consciência e crie funis de conteúdo específicos para cada etapa.",
        color: "text-red-600",
        bg: "bg-red-50"
    },
    {
        icon: Package,
        title: "Análise de Produtos",
        description: "Cadastre seus infoprodutos e deixe a IA analisar a melhor forma de vendê-los. Gere promessas, ganchos e ofertas irresistíveis.",
        color: "text-cyan-600",
        bg: "bg-cyan-50"
    },
    {
        icon: Library,
        title: "Banco de Referências",
        description: "Armazene e organize suas melhores referências. Use o banco de materiais para treinar a IA com conteúdos que você admira.",
        color: "text-violet-600",
        bg: "bg-violet-50"
    }
];

export default function LandingFeatures() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Um ecossistema completo para <br />
                        <span className="text-rose-600">Creators e Estrategistas</span>
                    </h2>
                    <p className="text-lg text-slate-500">
                        O Viralzera não é apenas um chat. É uma central de comando estratégica 
                        que integra todas as etapas da criação de conteúdo viral.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="p-8 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 group hover:-translate-y-1">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.bg} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}