# KIE.ai Integration - Nano Banana Pro

## Visão Geral

Integração com a API do KIE.ai para geração de imagens usando o modelo Nano Banana Pro.

## Autenticação

Cada usuário deve configurar sua própria API Key nas Configurações da conta.
- Obtenha a API Key em: https://kie.ai/api-key
- A key é salva no UserConfig do usuário

## Backend Function: `kie`

### Actions disponíveis:

#### 1. `createTask` - Criar tarefa de geração
```javascript
const response = await base44.functions.invoke('kie', {
  action: 'createTask',
  prompt: 'Descrição da imagem...',
  aspect_ratio: '1:1',    // opcional
  resolution: '1K',        // opcional: 1K, 2K, 4K
  output_format: 'png',    // opcional: png, jpg
  image_input: []          // opcional: URLs de imagens de referência
});

// Retorna: { success: true, taskId: '...' }
```

#### 2. `checkTask` - Verificar status da tarefa
```javascript
const response = await base44.functions.invoke('kie', {
  action: 'checkTask',
  taskId: '...'
});

// Retorna: { success: true, state: 'waiting'|'success'|'fail', resultUrls: [...] }
```

#### 3. `generateAndWait` - Criar e aguardar resultado (recomendado)
```javascript
const response = await base44.functions.invoke('kie', {
  action: 'generateAndWait',
  prompt: 'Descrição da imagem...',
  aspect_ratio: '1:1',
  resolution: '1K',
  output_format: 'png',
  image_input: []
});

// Retorna: { success: true, resultUrls: ['https://...'] }
// Aguarda até 120 segundos pela geração
```

#### 4. `validateKey` - Validar API Key
```javascript
const response = await base44.functions.invoke('kie', {
  action: 'validateKey',
  apiKey: 'key_opcional'  // se não passar, usa a do userConfig
});

// Retorna: { valid: true/false }
```

## Parâmetros de Geração

### aspect_ratio (proporção)
- `1:1` - Quadrado
- `2:3`, `3:2` - Retrato/Paisagem
- `3:4`, `4:3` - Retrato/Paisagem
- `4:5`, `5:4` - Retrato/Paisagem
- `9:16`, `16:9` - Stories/Widescreen
- `21:9` - Ultra-wide
- `auto` - Automático

### resolution (resolução)
- `1K` - Padrão
- `2K` - Alta
- `4K` - Ultra alta

### output_format (formato)
- `png` - Com transparência
- `jpg` - Mais leve

### image_input (imagens de referência)
- Array de URLs de imagens
- Máximo 8 imagens
- Tamanho máximo: 30MB cada
- Formatos: JPEG, PNG, WebP

## Estados da Tarefa

- `waiting` - Aguardando processamento
- `success` - Concluído com sucesso
- `fail` - Falha na geração

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Parâmetros inválidos |
| 401 | API Key inválida |
| 402 | Saldo insuficiente |
| 404 | Recurso não encontrado |
| 422 | Validação falhou |
| 429 | Rate limit excedido |
| 500 | Erro interno |

## Exemplo de Uso no Frontend

```jsx
import { base44 } from "@/api/base44Client";

const generateImage = async () => {
  setLoading(true);
  try {
    const response = await base44.functions.invoke('kie', {
      action: 'generateAndWait',
      prompt: 'Um gato astronauta em estilo cartoon',
      aspect_ratio: '1:1',
      resolution: '2K'
    });

    if (response.data.success) {
      setImageUrl(response.data.resultUrls[0]);
    } else {
      toast.error(response.data.error);
    }
  } catch (error) {
    toast.error('Erro ao gerar imagem');
  } finally {
    setLoading(false);
  }
};
``