import Layout from "./Layout.jsx";

import AgentSettings from "./AgentSettings";

import AudienceChat from "./AudienceChat";

import Audiences from "./Audiences";

import Canvas from "./Canvas";

import CreateFocus from "./CreateFocus";

import DNACommunication from "./DNACommunication";

import Dashboard from "./Dashboard";

import Landing from "./Landing";

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

import ScriptGenerator from "./ScriptGenerator";

import ThemeMatrix from "./ThemeMatrix";

import TitanosDocumentation from "./TitanosDocumentation";

import TitanosRouter from "./TitanosRouter";

import Trends from "./Trends";

import TwitterGenerator from "./TwitterGenerator";

import TwitterProjects from "./TwitterProjects";

import UsageAnalytics from "./UsageAnalytics";

import UserSettings from "./UserSettings";

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
    
    Landing: Landing,
    
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
    
    ScriptGenerator: ScriptGenerator,
    
    ThemeMatrix: ThemeMatrix,
    
    TitanosDocumentation: TitanosDocumentation,
    
    TitanosRouter: TitanosRouter,
    
    Trends: Trends,
    
    TwitterGenerator: TwitterGenerator,
    
    TwitterProjects: TwitterProjects,
    
    UsageAnalytics: UsageAnalytics,
    
    UserSettings: UserSettings,
    
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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AgentSettings />} />
                
                
                <Route path="/AgentSettings" element={<AgentSettings />} />
                
                <Route path="/AudienceChat" element={<AudienceChat />} />
                
                <Route path="/Audiences" element={<Audiences />} />
                
                <Route path="/Canvas" element={<Canvas />} />
                
                <Route path="/CreateFocus" element={<CreateFocus />} />
                
                <Route path="/DNACommunication" element={<DNACommunication />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/MaterialBank" element={<MaterialBank />} />
                
                <Route path="/ModelManagement" element={<ModelManagement />} />
                
                <Route path="/Modelagem" element={<Modelagem />} />
                
                <Route path="/ModelagemDetalhe" element={<ModelagemDetalhe />} />
                
                <Route path="/MultiChatAnalytics" element={<MultiChatAnalytics />} />
                
                <Route path="/OpenRouterModels" element={<OpenRouterModels />} />
                
                <Route path="/PersonaGenerator" element={<PersonaGenerator />} />
                
                <Route path="/Personas" element={<Personas />} />
                
                <Route path="/PostManagement" element={<PostManagement />} />
                
                <Route path="/PostTypes" element={<PostTypes />} />
                
                <Route path="/ProductAnalyzer" element={<ProductAnalyzer />} />
                
                <Route path="/Products" element={<Products />} />
                
                <Route path="/Prompts" element={<Prompts />} />
                
                <Route path="/ScriptGenerator" element={<ScriptGenerator />} />
                
                <Route path="/ThemeMatrix" element={<ThemeMatrix />} />
                
                <Route path="/TitanosDocumentation" element={<TitanosDocumentation />} />
                
                <Route path="/TitanosRouter" element={<TitanosRouter />} />
                
                <Route path="/Trends" element={<Trends />} />
                
                <Route path="/TwitterGenerator" element={<TwitterGenerator />} />
                
                <Route path="/TwitterProjects" element={<TwitterProjects />} />
                
                <Route path="/UsageAnalytics" element={<UsageAnalytics />} />
                
                <Route path="/UserSettings" element={<UserSettings />} />
                
            </Routes>
        </Layout>
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