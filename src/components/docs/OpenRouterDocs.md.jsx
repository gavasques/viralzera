# Documentação OpenRouter - Referência Interna

## Links Oficiais da Documentação

- **Guia Geral**: https://openrouter.ai/docs/guides/
- **Features**: https://openrouter.ai/docs/guides/features
- **Tool Calling**: https://openrouter.ai/docs/guides/features/tool-calling
- **Web Search Plugin**: https://openrouter.ai/docs/guides/features/plugins/web-search
- **Models API**: https://openrouter.ai/docs/api/api-reference/models/get-models
- **Parameters**: https://openrouter.ai/docs/api/reference/parameters
- **Obter API Key**: https://openrouter.ai/keys
- **Request Builder**: https://openrouter.ai/request-builder

## Endpoints Base

```
BASE_URL: https://openrouter.ai/api/v1
```

### Endpoints Disponíveis
- `GET /models` - Lista todos os modelos disponíveis
- `POST /chat/completions` - Chat completions (compatível com OpenAI)

## Headers Obrigatórios

```javascript
{
  "Authorization": "Bearer {API_KEY}",
  "Content-Type": "application/json",
  "HTTP-Referer": "https://impulsa.app",  // Identificação do app (opcional)
  "X-Title": "Impulsa"                     // Nome do app (opcional)
}
```

## Estrutura de Modelo (Response /models)

```json
{
  "id": "openai/gpt-4o",
  "name": "OpenAI: GPT-4o",
  "context_length": 128000,
  "pricing": {
    "prompt": "0.000005",
    "completion": "0.000015",
    "request": "0",
    "image": "0",
    "web_search": "0"
  },
  "supported_parameters": ["tools", "temperature", "max_tokens", ...],
  "top_provider": {
    "context_length": 128000,
    "max_completion_tokens": 16384
  }
}
```

## Conversas Contínuas (Multi-turn Chat)

### Como Funciona
Para manter o contexto de uma conversa, você deve enviar **todo o histórico de mensagens** em cada request. O OpenRouter não mantém estado entre chamadas.

### Estrutura de Mensagens

```javascript
{
  "model": "openai/gpt-4o",
  "messages": [
    { "role": "system", "content": "Você é um assistente útil." },
    { "role": "user", "content": "Olá, meu nome é João" },
    { "role": "assistant", "content": "Olá João! Como posso ajudar?" },
    { "role": "user", "content": "Qual é o meu nome?" }
    // O modelo vai lembrar: "Seu nome é João"
  ]
}
```

### Roles Disponíveis
| Role | Descrição |
|------|-----------|
| `system` | Instruções iniciais para o modelo (opcional) |
| `user` | Mensagens do usuário |
| `assistant` | Respostas do modelo |
| `tool` | Resultado de chamadas de ferramentas |

### Implementação para Chat Contínuo

```javascript
// Estado do chat (armazenar em state ou banco)
const [messages, setMessages] = useState([
  { role: "system", content: "Você é um assistente do Impulsa..." }
]);

// Enviar nova mensagem
const sendMessage = async (userMessage) => {
  // 1. Adiciona mensagem do usuário ao histórico
  const updatedMessages = [...messages, { role: "user", content: userMessage }];
  setMessages(updatedMessages);

  // 2. Envia todo o histórico para a API
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: updatedMessages  // <-- histórico completo
    })
  });

  const data = await response.json();
  const assistantMessage = data.choices[0].message;

  // 3. Adiciona resposta ao histórico
  setMessages([...updatedMessages, assistantMessage]);
};
```

### Persistência de Conversas no Banco

```javascript
// Entidade sugerida: ChatConversation
{
  "focus_id": "...",            // Foco relacionado
  "title": "Conversa sobre...", // Título auto-gerado
  "messages": [...],            // Array de mensagens JSON
  "model_used": "openai/gpt-4o",
  "total_tokens": 1500
}
```

### Limites de Contexto
⚠️ Cada modelo tem um limite (context_length). Se exceder:

1. **Truncar mensagens antigas** (remover do início, mantendo system)
2. **Resumir conversas anteriores**
3. **Criar nova conversa**

```javascript
// Estimar tokens (1 token ≈ 4 caracteres)
const estimateTokens = (messages) => {
  const text = messages.map(m => m.content).join(' ');
  return Math.ceil(text.length / 4);
};
```

## Tool Calling

### Modelos com Suporte
Filtrar: https://openrouter.ai/models?supported_parameters=tools

### Request com Tools

```javascript
{
  "model": "google/gemini-2.0-flash-001",
  "messages": [...],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Obtém clima de uma cidade",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    }
  ],
  "tool_choice": "auto"  // auto | none | required
}
```

### Fluxo Tool Calling
1. Enviar request com tools
2. Modelo responde com `tool_calls`
3. Executar ferramenta localmente
4. Enviar resultado com `role: "tool"`
5. Modelo gera resposta final

## Web Search

### Ativar Web Search

```javascript
// Opção 1: Sufixo :online
{ "model": "openai/gpt-4o:online" }

// Opção 2: Plugin explícito
{
  "model": "openai/gpt-4o",
  "plugins": [{ 
    "id": "web", 
    "max_results": 5,
    "engine": "native"  // ou "exa"
  }]
}
```

## Parâmetros Principais

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| temperature | float | 1.0 | Criatividade (0-2) |
| max_tokens | int | - | Limite tokens saída |
| top_p | float | 1.0 | Nucleus sampling |
| frequency_penalty | float | 0.0 | Penaliza repetição |
| presence_penalty | float | 0.0 | Penaliza tokens usados |
| tools | array | - | Definição de ferramentas |
| tool_choice | string | auto | none/auto/required |
| response_format | object | - | `{"type": "json_object"}` |
| stop | array | - | Tokens para parar |
| seed | int | - | Resultados determinísticos |
| parallel_tool_calls | bool | true | Chamadas paralelas |

## Implementação no Impulsa

### Entidade UserConfig
- `openrouter_api_key`: API Key
- `default_model`: ID do modelo
- `default_model_name`: Nome amigável

### Backend: openrouter.js
- `listModels`: Lista modelos
- `validateKey`: Valida API Key  
- `chat`: Chat com histórico (messages[])
- `chatWithToolExecution`: Chat + tools

### Componente: OpenRouterSettings.jsx
- Configuração de API Key
- Seletor de modelo padrão

---
*Última atualização: 2025-12-20*