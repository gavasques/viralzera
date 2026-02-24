import Layout from "./Layout";
import Login from "./Login";

import AgentSettings from "./AgentSettings";

import AudienceChat from "./AudienceChat";

import Audiences from "./Audiences";

import Canvas from "./Canvas";

import CreateFocus from "./CreateFocus";

import DNACommunication from "./DNACommunication";

import Dashboard from "./Dashboard";



import MaterialBank from "./MaterialBank";

import ModelManagement from "./ModelManagement";

import Modelagem from "./Modelagem";

import ModelagemDetalhe from "./ModelagemDetalhe";

import MultiChatAnalytics from "./MultiChatAnalytics";

import OpenRouterModels from "./OpenRouterModels";

import PersonaGenerator from "./PersonaGenerator";

import Personas from "./Personas";

import PostManagement from "./PostManagement";

import PostTypes from "./PostTypes";

import ProductAnalyzer from "./ProductAnalyzer";

import Products from "./Products";

import Prompts from "./Prompts";



import ThemeMatrix from "./ThemeMatrix";

import TitanosDocumentation from "./TitanosDocumentation";

import TitanosRouter from "./TitanosRouter";

import Trends from "./Trends";

import TwitterGenerator from "./TwitterGenerator";

import TwitterProjects from "./TwitterProjects";

import UsageAnalytics from "./UsageAnalytics";

import UserSettings from "./UserSettings";

import YoutubeScripts from "./YoutubeScripts";

import YoutubeScriptDetail from "./YoutubeScriptDetail";

import AdminScriptTypes from "./AdminScriptTypes";

import UserContent from "./UserContent";

import ContentDossiers from "./ContentDossiers";

import Phrases from "./Phrases";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import AppProviders from '@/components/providers/AppProviders';

const PAGES = {
    
    AgentSettings: AgentSettings,
    
    AudienceChat: AudienceChat,
    
    Audiences: Audiences,
    
    Canvas: Canvas,
    
    CreateFocus: CreateFocus,
    
    DNACommunication: DNACommunication,
    
    Dashboard: Dashboard,
    

    
    MaterialBank: MaterialBank,
    
    ModelManagement: ModelManagement,
    
    Modelagem: Modelagem,
    
    ModelagemDetalhe: ModelagemDetalhe,
    
    MultiChatAnalytics: MultiChatAnalytics,
    
    OpenRouterModels: OpenRouterModels,
    
    PersonaGenerator: PersonaGenerator,
    
    Personas: Personas,
    
    PostManagement: PostManagement,
    
    PostTypes: PostTypes,
    
    ProductAnalyzer: ProductAnalyzer,
    
    Products: Products,
    
    Prompts: Prompts,
    

    
    ThemeMatrix: ThemeMatrix,
    
    TitanosDocumentation: TitanosDocumentation,
    
    TitanosRouter: TitanosRouter,
    
    Trends: Trends,
    
    TwitterGenerator: TwitterGenerator,
    
    TwitterProjects: TwitterProjects,
    
    UsageAnalytics: UsageAnalytics,
    
    UserSettings: UserSettings,
    
    YoutubeScripts: YoutubeScripts,

    YoutubeScriptDetail: YoutubeScriptDetail,

    AdminScriptTypes: AdminScriptTypes,

    UserContent: UserContent,

    ContentDossiers: ContentDossiers,

    Phrases: Phrases,

    }

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
                <Layout currentPageName={currentPage}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/agentsettings" element={<AgentSettings />} />
                        <Route path="/audiencechat" element={<AudienceChat />} />
                        <Route path="/audiences" element={<Audiences />} />
                        <Route path="/canvas" element={<Canvas />} />
                        <Route path="/createfocus" element={<CreateFocus />} />
                        <Route path="/dnacommunication" element={<DNACommunication />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/materialbank" element={<MaterialBank />} />
                        <Route path="/modelmanagement" element={<ModelManagement />} />
                        <Route path="/modelagem" element={<Modelagem />} />
                        <Route path="/modelagemdetalhe" element={<ModelagemDetalhe />} />
                        <Route path="/multichatanalytics" element={<MultiChatAnalytics />} />
                        <Route path="/openroutermodels" element={<OpenRouterModels />} />
                        <Route path="/personagenerator" element={<PersonaGenerator />} />
                        <Route path="/personas" element={<Personas />} />
                        <Route path="/postmanagement" element={<PostManagement />} />
                        <Route path="/posttypes" element={<PostTypes />} />
                        <Route path="/productanalyzer" element={<ProductAnalyzer />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/prompts" element={<Prompts />} />
                        <Route path="/themematrix" element={<ThemeMatrix />} />
                        <Route path="/titanosdocumentation" element={<TitanosDocumentation />} />
                        <Route path="/titanosrouter" element={<TitanosRouter />} />
                        <Route path="/trends" element={<Trends />} />
                        <Route path="/twittergenerator" element={<TwitterGenerator />} />
                        <Route path="/twitterprojects" element={<TwitterProjects />} />
                        <Route path="/usageanalytics" element={<UsageAnalytics />} />
                        <Route path="/usersettings" element={<UserSettings />} />
                        <Route path="/youtubescripts" element={<YoutubeScripts />} />
                        <Route path="/youtubescriptdetail" element={<YoutubeScriptDetail />} />
                        <Route path="/adminscripttypes" element={<AdminScriptTypes />} />
                        <Route path="/usercontent" element={<UserContent />} />
                        <Route path="/contentdossiers" element={<ContentDossiers />} />
                        <Route path="/phrases" element={<Phrases />} />
                    </Routes>
                </Layout>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <AppProviders>
            <Router>
                <PagesContent />
            </Router>
        </AppProviders>
    );
}
