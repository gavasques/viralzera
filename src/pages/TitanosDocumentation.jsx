import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function TitanosDocumentation() {
    const [copied, setCopied] = React.useState(false);

    const markdownContent = `
# 📘 Documentação do Sistema Titanos Router

## 🌟 Visão Geral
O **Titanos Router** é uma aplicação de chat avançada que permite interagir com múltiplos modelos de Inteligência Artificial (LLMs) simultaneamente. O sistema utiliza a API do OpenRouter para conectar-se a diversos provedores (OpenAI, Anthropic, Google, Meta, etc.), permitindo comparação direta de respostas, custos e latência.

## 🚀 Funcionalidades Principais
1.  **Chat Multi-Modelo**: Converse com até 8 IAs ao mesmo tempo na mesma tela.
2.  **Comparação em Tempo Real**: Visualize respostas lado a lado.
3.  **Configuração Granular**: Ajuste temperatura, top_p e outros parâmetros individualmente por modelo.
4.  **Analytics**: Acompanhe consumo de tokens e custos detalhados (USD).
5.  **Gerenciamento de Prompts**: Crie e salve templates de System Prompts (Refiner Prompts).
6.  **Organização**: Agrupe conversas em pastas/grupos e favoritos.
7.  **Ferramentas (Tools)**: Suporte a Web Search e análise de dados via backend.

---

## 📂 Estrutura do Projeto

### 1. Entidades (Banco de Dados)
- **TitanosConversation**: Armazena a sessão de chat.
- **TitanosMessage**: Mensagens individuais.
- **TitanosRefinerPrompt**: Templates de System Prompts reutilizáveis.

### 2. Funções Backend
- **titanosChatSimple.js**: **[CORE]** O cérebro do chat.
- **titanosListModels.js**: Busca lista atualizada de modelos disponíveis no OpenRouter.

### 3. Frontend
- **TitanosRouter.js**: Interface principal de Chat.
- **TitanosDocumentation.js**: Esta página.

---

## 🛠️ Como usar
1. Configure sua chave API do OpenRouter nas configurações.
2. Crie uma nova conversa.
3. Selecione os modelos que deseja comparar.
4. Digite sua mensagem e veja a mágica acontecer!
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(markdownContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Documentação do Sistema</h1>
                        <p className="text-slate-600 mt-1">Guia técnico e funcional do Titanos Router</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to={createPageUrl('TitanosRouter')}>
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Ir para o Chat
                            </Button>
                        </Link>
                        <Button onClick={handleCopy} className="bg-slate-900 text-white hover:bg-slate-800">
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? 'Copiado!' : 'Copiar Markdown'}
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <article className="prose prose-slate max-w-none">
                        <h1 className="text-3xl font-bold text-slate-900 mb-6 pb-4 border-b">📘 Documentação do Sistema Titanos Router</h1>
                        
                        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">🌟 Visão Geral</h2>
                        <p className="text-slate-700 leading-relaxed">
                            O <strong>Titanos Router</strong> é uma aplicação de chat avançada que permite interagir com múltiplos modelos de Inteligência Artificial (LLMs) simultaneamente. O sistema utiliza a API do OpenRouter para conectar-se a diversos provedores (OpenAI, Anthropic, Google, Meta, etc.), permitindo comparação direta de respostas, custos e latência.
                        </p>
                        
                        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">🚀 Funcionalidades Principais</h2>
                        <ol className="list-decimal list-inside text-slate-700 space-y-2">
                            <li><strong>Chat Multi-Modelo</strong>: Converse com até 8 IAs ao mesmo tempo na mesma tela.</li>
                            <li><strong>Comparação em Tempo Real</strong>: Visualize respostas lado a lado.</li>
                            <li><strong>Configuração Granular</strong>: Ajuste temperatura, top_p e outros parâmetros individualmente por modelo.</li>
                            <li><strong>Analytics</strong>: Acompanhe consumo de tokens e custos detalhados (USD).</li>
                            <li><strong>Gerenciamento de Prompts</strong>: Crie e salve templates de System Prompts (Refiner Prompts).</li>
                            <li><strong>Organização</strong>: Agrupe conversas em pastas/grupos e favoritos.</li>
                            <li><strong>Ferramentas (Tools)</strong>: Suporte a Web Search e análise de dados via backend.</li>
                        </ol>
                        
                        <hr className="my-8 border-slate-200" />
                        
                        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">📂 Estrutura do Projeto</h2>
                        
                        <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">1. Entidades (Banco de Dados)</h3>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                            <li><strong>TitanosConversation</strong>: Armazena a sessão de chat.</li>
                            <li><strong>TitanosMessage</strong>: Mensagens individuais.</li>
                            <li><strong>TitanosRefinerPrompt</strong>: Templates de System Prompts reutilizáveis.</li>
                        </ul>
                        
                        <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">2. Funções Backend</h3>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                            <li><strong>titanosChatSimple.js</strong>: <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">[CORE]</span> O cérebro do chat.</li>
                            <li><strong>titanosListModels.js</strong>: Busca lista atualizada de modelos disponíveis no OpenRouter.</li>
                        </ul>
                        
                        <h3 className="text-xl font-medium text-slate-900 mt-6 mb-3">3. Frontend</h3>
                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                            <li><strong>TitanosRouter.js</strong>: Interface principal de Chat.</li>
                            <li><strong>TitanosDocumentation.js</strong>: Esta página.</li>
                        </ul>
                        
                        <hr className="my-8 border-slate-200" />
                        
                        <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">🛠️ Como usar</h2>
                        <ol className="list-decimal list-inside text-slate-700 space-y-2">
                            <li>Configure sua chave API do OpenRouter nas configurações.</li>
                            <li>Crie uma nova conversa.</li>
                            <li>Selecione os modelos que deseja comparar.</li>
                            <li>Digite sua mensagem e veja a mágica acontecer!</li>
                        </ol>
                    </article>
                </div>
            </div>
        </div>
    );
}