import React from 'react';
import { Rocket, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export default function LandingFooter() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                             <div className="bg-white p-1.5 rounded-lg">
                                <img 
                                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69405b4dfc2b80b38d51b395/689d504d8_LogoViralzera.png" 
                                    alt="Viralzera" 
                                    className="h-12 w-auto"
                                />
                             </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            A plataforma definitiva para criadores de conteúdo que buscam escala e qualidade com Inteligência Artificial.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Produto</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Recursos</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Comunidade</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Ajuda</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2024 Viralzera. Todos os direitos reservados.</p>
                    <p>Feito com ❤️ para criadores.</p>
                </div>
            </div>
        </footer>
    );
}