import React, { useState, useEffect } from 'react';
import { ChatSettingsModal } from '@/components/chat';

const DEFAULT_TRANSCRIPTION_PROMPT = `You are a Transcript Normalizer.

Output language: Brazilian Portuguese (pt-BR).
Return ONLY valid transcript, normalized. 

Task:
- First Transcribe the Video/Audio
- After, Normalize transcript to this standard:
- Keep slang/filler words (tipo, mano, tá ligado, etc.)
- Do NOT rewrite into formal Portuguese. Preserve the voice.
- Mark [RISOS], [PAUSA], [CORTA] if present; do not invent them.
- If timestamps are missing, set a flag "sem_timestamp": true and add to "lacunas".`;

const DEFAULT_ANALYSIS_PROMPT = `You are a Communication Forensics Analyst.

Output language: Brazilian Portuguese (pt-BR).
Return ONLY valid JSON.

Rules:
- Evidence-first: every extraction must be backed by a short excerpt (<= 12 words) copied from transcript + timestamp.
- Do NOT invent facts. If you infer something, mark as "inferido" and keep it minimal.
- If not enough items are found, fill with "NAO ENCONTRADO".
- Keep all text in pt-BR.

Fixed sizes:
- bordoes: 6
- frases_de_efeito: 8
- palavras_e_expressoes: 10
- estruturas_retoricas: 6
- mini_historias: 3
- ctas: 5
- crencas: 4
- anti_herois: 4

Return schema:
{
  "digest": {
    "id": "",
    "url": "",
    "platform": "",
    "title": "",
    "qualidade": { "clareza": "ALTA|MEDIA|BAIXA", "sem_timestamp": false, "obs": "" },
    "bordoes": [
      { "texto": "", "trecho": "", "timestamp": "" }
    ],
    "frases_de_efeito": [
      { "texto": "", "categoria": "provocacao|autoridade|motivacao|alerta|realismo", "trecho": "", "timestamp": "" }
    ],
    "palavras_e_expressoes": [
      { "texto": "", "funcao": "enfase|didatica|conexao|humor|pressao|quebra_objecao", "trecho": "", "timestamp": "" }
    ],
    "estruturas_retoricas": [
      { "padrao": "", "descricao": "", "trecho": "", "timestamp": "" }
    ],
    "mini_historias": [
      { "tipo": "antes_depois|confissao|caso_real", "resumo": "", "trecho": "", "timestamp": "" }
    ],
    "ctas": [
      { "cta": "", "estilo": "direto|racional|emocional|urgente", "trecho": "", "timestamp": "" }
    ],
    "crencas": [
      { "crenca": "", "observado_ou_inferido": "observado|inferido", "trecho": "", "timestamp": "" }
    ],
    "anti_herois": [
      { "alvo": "", "tom": "calmo|duro|ironico|didatico", "trecho": "", "timestamp": "" }
    ],
    "observacoes": "",
    "lacunas": []
  }
}`;

const DEFAULT_AGGREGATION_PROMPT = `You are a Communication Pattern Miner.

Output language: Brazilian Portuguese (pt-BR).
Return ONLY valid JSON.

Task:
Aggregate across all digests and extract the stable communication fingerprint:
- what repeats most (core bordões, core structures, core vocabulary)
- what varies by context (intensity, humor, CTA style)
- build a practical style guide to imitate the speaker

Hard rules:
- Do not attack protected groups or politics. Keep "anti-heróis" in neutral terms (burocracia, promessas fáceis, cultura de distração, chefia abusiva, etc.).
- If evidence is weak (few items / low clarity), flag in lacunas.

Fixed sizes:
- bordoes_centrais: 12
- frases_de_efeito_centrais: 15
- palavras_assinatura: 25
- estruturas_assinatura: 12
- ctas_assinatura: 12
- anti_herois_centrais: 10
- crencas_centrais: 10
- regras_do_tom: 15
- do: 12
- dont: 12

Return schema:
{
  "assinatura_global": {
    "resumo_em_1_linha": "",
    "tom": {
      "energia": "BAIXA|MEDIA|ALTA",
      "direto": "BAIXO|MEDIO|ALTO",
      "humor": "NENHUM|LEVE|SARCASTICO|FORTE",
      "formalidade": "BAIXA|MEDIA|ALTA",
      "empatia": "BAIXA|MEDIA|ALTA"
    },
    "bordoes_centrais": [],
    "frases_de_efeito_centrais": [],
    "palavras_assinatura": [],
    "estruturas_assinatura": [],
    "ctas_assinatura": [],
    "anti_herois_centrais": [],
    "crencas_centrais": [],
    "regras_do_tom": [],
    "do": [],
    "dont": [],
    "template_script": {
      "hook": "",
      "desenvolvimento": "",
      "fechamento": "",
      "cta": ""
    }
  },
  "lacunas": []
}`;

export default function DNASettingsModal({ open, onOpenChange }) {
  return (
    <ChatSettingsModal
      open={open}
      onOpenChange={onOpenChange}
      title="Configurações do DNA de Comunicação"
      configEntityName="DNAConfig"
      defaultPrompt={DEFAULT_AGGREGATION_PROMPT}
      promptLabel="Prompt de Agregação (Geração do DNA)"
      promptPlaceholders={[]}
      enableReasoning={true}
      enableWebSearch={false}
    />
  );
}