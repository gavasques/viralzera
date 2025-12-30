import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, PlayCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import { motion } from 'framer-motion';

export default function LandingHero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-rose-50/50 to-transparent -z-10" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/30 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-[100px] -z-10" />

            <div className="max-w-7xl mx-auto px-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-100 shadow-sm mb-8"
                >
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span className="text-sm font-medium text-slate-600">A Revolução da Criação de Conteúdo com IA</span>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-tight"
                >
                    Crie Conteúdo Viral <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-rose-600 to-orange-500">
                        10x Mais Rápido
                    </span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    Combine o poder de múltiplos modelos de IA para analisar tendências, 
                    gerar personas e criar roteiros magnéticos que engajam sua audiência.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button 
                        size="lg" 
                        className="h-14 px-8 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-lg shadow-xl shadow-rose-200 hover:scale-105 transition-all"
                        onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
                    >
                        Começar Gratuitamente
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300">
                        <PlayCircle className="w-5 h-5 mr-2" />
                        Ver Demo
                    </Button>
                </motion.div>

                {/* Dashboard Preview Mockup */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-20 relative mx-auto max-w-5xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 bottom-0 h-40" />
                    <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl p-2 shadow-2xl shadow-indigo-500/10">
                        <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center relative">
                            {/* Placeholder for actual screenshot */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50" />
                            <div className="text-slate-300 font-medium z-10 flex flex-col items-center">
                                <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                                <span>Dashboard Preview</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}