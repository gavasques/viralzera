import React from 'react';
import Markdown from 'react-markdown';
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
                    <article className="prose prose-slate max-w-none 
                        prose-headings:text-slate-900 
                        prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b
                        prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:font-medium prose-h3:mt-6
                        prose-p:text-slate-700 prose-p:leading-relaxed
                        prose-li:text-slate-700
                        prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-slate-900 prose-pre:text-slate-50
                    ">
                        <Markdown>{markdownContent}</Markdown>
                    </article>
                </div>
            </div>
        </div>
    );
}