import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Sparkles, Users, FileText, Layers, Dna, TrendingUp, ArrowRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Criador de Conteúdo <span className="text-pink-600">Inteligente</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Crie scripts magnéticos, analise tendências e desenvolva seu DNA de comunicação com IA avançada.
          </p>
          <Link to={createPageUrl('Dashboard')}>
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-6 text-lg">
              Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Sparkles, title: 'Gerador de Scripts', desc: 'Crie roteiros com IA' },
            { icon: Users, title: 'Públicos-Alvo', desc: 'Defina sua audiência' },
            { icon: FileText, title: 'Personas', desc: 'Perfis detalhados' },
            { icon: Layers, title: 'Tipos de Post', desc: 'Formatos otimizados' },
            { icon: Dna, title: 'DNA de Comunicação', desc: 'Sua identidade única' },
            { icon: TrendingUp, title: 'Tendências', desc: 'Pesquise o mercado' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <feature.icon className="w-10 h-10 text-pink-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}