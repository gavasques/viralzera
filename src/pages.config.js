import AgentSettings from './pages/AgentSettings';
import AudienceChat from './pages/AudienceChat';
import Audiences from './pages/Audiences';
import Canvas from './pages/Canvas';
import CreateFocus from './pages/CreateFocus';
import DNACommunication from './pages/DNACommunication';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Layout from './pages/Layout';
import MaterialBank from './pages/MaterialBank';
import ModelManagement from './pages/ModelManagement';
import Modelagem from './pages/Modelagem';
import ModelagemDetalhe from './pages/ModelagemDetalhe';
import MultiChatAnalytics from './pages/MultiChatAnalytics';
import OpenRouterModels from './pages/OpenRouterModels';
import PersonaGenerator from './pages/PersonaGenerator';
import Personas from './pages/Personas';
import PostManagement from './pages/PostManagement';
import PostTypes from './pages/PostTypes';
import ProductAnalyzer from './pages/ProductAnalyzer';
import Products from './pages/Products';
import Prompts from './pages/Prompts';
import ScriptGenerator from './pages/ScriptGenerator';
import ThemeMatrix from './pages/ThemeMatrix';
import TitanosDocumentation from './pages/TitanosDocumentation';
import Trends from './pages/Trends';
import TwitterGenerator from './pages/TwitterGenerator';
import TwitterProjects from './pages/TwitterProjects';
import UsageAnalytics from './pages/UsageAnalytics';
import UserSettings from './pages/UserSettings';
import index from './pages/index';
import TitanosRouter from './pages/TitanosRouter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentSettings": AgentSettings,
    "AudienceChat": AudienceChat,
    "Audiences": Audiences,
    "Canvas": Canvas,
    "CreateFocus": CreateFocus,
    "DNACommunication": DNACommunication,
    "Dashboard": Dashboard,
    "Landing": Landing,
    "Layout": Layout,
    "MaterialBank": MaterialBank,
    "ModelManagement": ModelManagement,
    "Modelagem": Modelagem,
    "ModelagemDetalhe": ModelagemDetalhe,
    "MultiChatAnalytics": MultiChatAnalytics,
    "OpenRouterModels": OpenRouterModels,
    "PersonaGenerator": PersonaGenerator,
    "Personas": Personas,
    "PostManagement": PostManagement,
    "PostTypes": PostTypes,
    "ProductAnalyzer": ProductAnalyzer,
    "Products": Products,
    "Prompts": Prompts,
    "ScriptGenerator": ScriptGenerator,
    "ThemeMatrix": ThemeMatrix,
    "TitanosDocumentation": TitanosDocumentation,
    "Trends": Trends,
    "TwitterGenerator": TwitterGenerator,
    "TwitterProjects": TwitterProjects,
    "UsageAnalytics": UsageAnalytics,
    "UserSettings": UserSettings,
    "index": index,
    "TitanosRouter": TitanosRouter,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};