import React from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from "@/api/base44Client";

export default function LandingNavbar() {
    const handleLogin = () => {
        base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69405b4dfc2b80b38d51b395/689d504d8_LogoViralzera.png" 
                        alt="Viralzera" 
                        className="h-20 w-auto"
                    />
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#features" className="hover:text-rose-600 transition-colors">Recursos</a>
                    <a href="#how-it-works" className="hover:text-rose-600 transition-colors">Como Funciona</a>
                    <a href="#pricing" className="hover:text-rose-600 transition-colors">Planos</a>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        className="text-slate-600 hover:text-rose-600 font-medium"
                        onClick={handleLogin}
                    >
                        Já sou cliente
                    </Button>
                    <Button 
                        className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 font-bold transition-transform hover:scale-105"
                        onClick={handleLogin}
                    >
                        Assinar Agora
                    </Button>
                </div>
            </div>
        </nav>
    );
}