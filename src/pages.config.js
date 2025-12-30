import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import AgentSettings from './pages/AgentSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Landing": Landing,
    "AgentSettings": AgentSettings,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};