import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../db/index.js';

const router = Router();

// Entities that have a user_id field and should be scoped per user
const USER_SCOPED_ENTITIES = new Set([
  'Focus', 'Audience', 'Persona', 'Post', 'Canvas', 'Modeling',
  'TitanosConversation', 'UsageLog', 'UserConfig',
  'YoutubeScript', 'ContentDossier', 'KanbanColumn',
]);

// Entities whose user_id must NOT be auto-injected on create (child records, configs, etc.)
const NO_AUTO_USER_ID = new Set([
  'AudienceChat', 'ProductChat', 'PersonaChat', 'PostTypeConfig', 'PersonaConfig',
  'ProductConfig', 'ScriptChat', 'ScriptConfig', 'AudienceGroup', 'TitanosMessage',
  'DNAConfig', 'CanvasHistory', 'CanvasNote', 'CanvasChatSession', 'ModelingVideo',
  'ModelingText', 'ModelingAnalysis', 'TitanosRefinerPrompt', 'TitanosChatGroup',
  'Prompt', 'PromptFolder', 'RefinerConfig', 'ModelVote', 'CanvasFolder',
  'ModelingConfig', 'ModelingTextAnalyzerConfig', 'CanvasConfig', 'ApprovedModel',
  'Trend', 'TrendConfig', 'TwitterConfig', 'MaterialBankConfig', 'AudienceConfig',
  'DNAContentConfig', 'TwitterProject',
  'YoutubeScriptVersion', 'ModelingLink', 'ModelingChat', 'ScriptNote',
  'YoutubeGeneratorConfig', 'YoutubeRefinerConfig', 'YoutubeScriptEditorConfig',
  'YoutubeTitleConfig', 'YoutubeKitGeneratorConfig', 'YoutubeCreativeDirectiveConfig',
  'YoutubeFormatSelectorConfig', 'YoutubePromptRefinerConfig',
  'ModelingAnalyzerConfig', 'ModelingScraperConfig', 'ModelingLinkAnalyzerConfig',
  'DeepResearchConfig', 'ModelingAssistantConfig', 'DossierGeneratorConfig',
]);

// Entities whose created_by must NOT be auto-injected on create (schema does not have this field)
const NO_AUTO_CREATED_BY = new Set([
  'Modeling', 'ModelingVideo', 'ModelingText', 'ModelingAnalysis',
  'TitanosConversation', 'TitanosMessage',
  'UsageLog', 'ApprovedModel',
  'PromptFolder', 'CanvasFolder',
  'CanvasHistory', 'CanvasNote', 'CanvasChatSession',
  'ModelingChat', 'ModelingLink',
  'User', 'UserConfig',
  'AudienceChat', 'PersonaChat', 'ProductChat',
  'AudienceGroup', 'ScriptChat',
  'TitanosChatGroup',
  'YoutubeScriptChat', 'YoutubeKitVersion',
  'ScriptNote',
]);

// Convert MongoDB-style filter operators to Prisma equivalents
const convertFilters = (filters) => {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return filters;
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => {
      if (key === '$in') return ['in', Array.isArray(value) ? value : [value]];
      if (key === '$nin') return ['notIn', Array.isArray(value) ? value : [value]];
      if (key === '$ne') return ['not', value];
      if (key === '$gt') return ['gt', value];
      if (key === '$gte') return ['gte', value];
      if (key === '$lt') return ['lt', value];
      if (key === '$lte') return ['lte', value];
      if (key === '$contains') return ['contains', value];
      const converted = typeof value === 'object' && value !== null ? convertFilters(value) : value;
      return [key, converted];
    })
  );
};

const entityMap = {
  Focus: prisma.focus,
  PostType: prisma.postType,
  Theme: prisma.theme,
  Material: prisma.material,
  UserConfig: prisma.userConfig,
  Trend: prisma.trend,
  TrendConfig: prisma.trendConfig,
  Audience: prisma.audience,
  Persona: prisma.persona,
  TwitterConfig: prisma.twitterConfig,
  MaterialBankConfig: prisma.materialBankConfig,
  AudienceConfig: prisma.audienceConfig,
  AudienceChat: prisma.audienceChat,
  Product: prisma.product,
  ProductConfig: prisma.productConfig,
  ProductChat: prisma.productChat,
  PersonaConfig: prisma.personaConfig,
  PersonaChat: prisma.personaChat,
  PostTypeConfig: prisma.postTypeConfig,
  ScriptChat: prisma.scriptChat,
  ScriptConfig: prisma.scriptConfig,
  AudienceGroup: prisma.audienceGroup,
  DNAContent: prisma.dNAContent,
  DNAProfile: prisma.dNAProfile,
  Post: prisma.post,
  TwitterProject: prisma.twitterProject,
  Canvas: prisma.canvas,
  DNAConfig: prisma.dNAConfig,
  DNAContentConfig: prisma.dNAContentConfig,
  TitanosConversation: prisma.titanosConversation,
  TitanosMessage: prisma.titanosMessage,
  TitanosRefinerPrompt: prisma.titanosRefinerPrompt,
  TitanosChatGroup: prisma.titanosChatGroup,
  Prompt: prisma.prompt,
  UsageLog: prisma.usageLog,
  ApprovedModel: prisma.approvedModel,
  PromptFolder: prisma.promptFolder,
  RefinerConfig: prisma.refinerConfig,
  ModelVote: prisma.modelVote,
  CanvasFolder: prisma.canvasFolder,
  Modeling: prisma.modeling,
  ModelingVideo: prisma.modelingVideo,
  ModelingText: prisma.modelingText,
  ModelingConfig: prisma.modelingConfig,
  ModelingTextAnalyzerConfig: prisma.modelingTextAnalyzerConfig,
  CanvasConfig: prisma.canvasConfig,
  CanvasHistory: prisma.canvasHistory,
  CanvasNote: prisma.canvasNote,
  CanvasChatSession: prisma.canvasChatSession,
  ModelingAnalysis: prisma.modelingAnalysis,
  Phrase: prisma.phrase,
  PhraseCategory: prisma.phraseCategory,
  KanbanColumn: prisma.kanbanColumn,
  UserIntroduction: prisma.userIntroduction,
  UserCTA: prisma.userCTA,
  DescriptionBlock: prisma.descriptionBlock,
  DescriptionTemplate: prisma.descriptionTemplate,
  ContentDossier: prisma.contentDossier,
  DossierGeneratorConfig: prisma.dossierGeneratorConfig,
  YoutubeScript: prisma.youtubeScript,
  YoutubeScriptVersion: prisma.youtubeScriptVersion,
  YoutubeScriptType: prisma.youtubeScriptType,
  ScriptNote: prisma.scriptNote,
  DeepResearchConfig: prisma.deepResearchConfig,
  ModelingAssistantConfig: prisma.modelingAssistantConfig,
  ModelingChat: prisma.modelingChat,
  ModelingLink: prisma.modelingLink,
  YoutubeScriptChat: prisma.youtubeScriptChat,
  YoutubeKitVersion: prisma.youtubeKitVersion,
  YoutubeGeneratorConfig: prisma.youtubeGeneratorConfig,
  YoutubeRefinerConfig: prisma.youtubeRefinerConfig,
  YoutubeScriptEditorConfig: prisma.youtubeScriptEditorConfig,
  YoutubeTitleConfig: prisma.youtubeTitleConfig,
  YoutubeKitGeneratorConfig: prisma.youtubeKitGeneratorConfig,
  YoutubeCreativeDirectiveConfig: prisma.youtubeCreativeDirectiveConfig,
  YoutubeFormatSelectorConfig: prisma.youtubeFormatSelectorConfig,
  YoutubePromptRefinerConfig: prisma.youtubePromptRefinerConfig,
  ModelingAnalyzerConfig: prisma.modelingAnalyzerConfig,
  ModelingScraperConfig: prisma.modelingScraperConfig,
  ModelingLinkAnalyzerConfig: prisma.modelingLinkAnalyzerConfig,
};

router.use(authenticate);

router.get('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const model = entityMap[entity];

    if (!model) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const where = USER_SCOPED_ENTITIES.has(entity) ? { user_id: req.user.id } : {};
    const items = await model.findMany({ where });
    res.json(items);
  } catch (error) {
    console.error(`GET /api/entities/${req.params.entity} Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = entityMap[entity];

    if (!model) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const item = await model.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error(`GET /api/entities/${req.params.entity}/${req.params.id} Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const model = entityMap[entity];

    if (!model) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Strip fields that should never be set by the client
    const { id: _id, created_at: _ca, updated_at: _ua, ...bodyData } = req.body;
    const data = { ...bodyData };
    if (req.user) {
      if (!NO_AUTO_CREATED_BY.has(entity)) {
        data.created_by = req.user.email;
      }
      if (!NO_AUTO_USER_ID.has(entity) && data.user_id === undefined) {
        data.user_id = req.user.id;
      }
    }

    const item = await model.create({ data });
    res.json(item);
  } catch (error) {
    console.error(`POST /api/entities/${req.params.entity} Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = entityMap[entity];

    if (!model) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const item = await model.update({
      where: { id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    console.error(`PUT /api/entities/${req.params.entity}/${req.params.id} Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const model = entityMap[entity];

    if (!model) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    await model.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/entities/${req.params.entity}/${req.params.id} Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:entity/filter', async (req, res) => {
  try {
    const { entity } = req.params;
    const model = entityMap[entity];

    if (!model) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const userFilter = USER_SCOPED_ENTITIES.has(entity) ? { user_id: req.user.id } : {};
    const clientFilters = convertFilters(req.body);
    const where = { ...userFilter, ...clientFilters };
    const items = await model.findMany({ where });
    res.json(items);
  } catch (error) {
    console.error(`POST /api/entities/${req.params.entity}/filter Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
