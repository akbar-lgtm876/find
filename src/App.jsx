import {useState,useEffect} from 'react';
import {NavLink,Routes,Route,useNavigate,useLocation,Navigate} from 'react-router-dom';
import {LayoutDashboard,Search as S,FolderGit2,Bookmark,GitCompare,BarChart3,Settings as Cog,Menu,PanelLeft} from 'lucide-react';
import {StoreProvider,useStore} from './utils/storage.jsx';
import {rate} from './services/githubApi.js';
import {Dashboard,Search,Repositories} from './pages/Discover.jsx';
import {DeveloperDetails,Shortlist,Compare} from './pages/People.jsx';
import {Analytics,Settings} from './pages/Insights.jsx';
const NAV=[['/','Dashboard',LayoutDashboard],['/search','Find developers',S],['/repositories','Repositories',FolderGit2],['/shortlist','Shortlist',Bookmark],['/compare','Compare',GitCompare],['/analytics','Analytics',BarChart3],['/settings','Settings',Cog]];
function Shell(){
  const {toasts,dlg,setDlg,st}=useStore();const [open,setOpen]=useState(false),[col,setCol]=useState(false),[q,setQ]=useState('');const nav=useNavigate(),loc=useLocation();
  useEffect(()=>setOpen(false),[loc.pathname]);
  return <div className={'app'+(col?' col':'')+(open?' open':'')}>
    <aside><div className="brand"><span className="mark">F</span><b>Founder Search</b></div>
      <nav>{NAV.map(([to,l,I])=><NavLink key={to} to={to} end={to==='/'} title={l}><I size={18}/><span>{l}</span></NavLink>)}</nav>
      <button className="btn side" onClick={()=>setCol(!col)} aria-label="Collapse sidebar"><PanelLeft size={16}/></button></aside>
    <div className="main"><header className="top"><button className="btn menu" aria-label="Open menu" onClick={()=>setOpen(!open)}><Menu size={16}/></button>
      <form onSubmit={e=>{e.preventDefault();q.trim()&&nav(`/search?q=${encodeURIComponent(q.trim())}`)}}><input aria-label="Search developers" placeholder="Search developers" value={q} onChange={e=>setQ(e.target.value)}/></form>
      <span className="pill" title="Last known GitHub API quota">API calls left: {rate.remaining??'unknown'}</span>
      <NavLink className="btn" to="/settings">Settings</NavLink></header>
      <main><Routes><Route path="/" element={<Dashboard/>}/><Route path="/search" element={<Search/>}/><Route path="/developer/:login" element={<DeveloperDetails/>}/>
        <Route path="/repositories" element={<Repositories/>}/><Route path="/shortlist" element={<Shortlist/>}/><Route path="/compare" element={<Compare/>}/>
        <Route path="/analytics" element={<Analytics/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></main></div>
    <div className="toasts" role="status" aria-live="polite">{toasts.map(t=><div key={t.id}>{t.m}</div>)}</div>
    {dlg&&<div className="scrim"><div className="card dlg" role="dialog" aria-modal="true" aria-label="Confirm"><p>{dlg.msg}</p><div className="actions"><button className="btn" autoFocus onClick={()=>setDlg(null)}>Cancel</button><button className="btn primary" onClick={()=>{dlg.fn();setDlg(null)}}>Confirm</button></div></div></div>}</div>;
}
export default function App(){return <StoreProvider><Shell/></StoreProvider>}