import {useState} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {useStore,download} from '../utils/storage.jsx';
import {useAsync} from '../hooks/useGithubSearch.js';
import {cachedRepos,getRateLimit,rate} from '../services/githubApi.js';
import {Empty} from '../components/ui.jsx';
const Chart=({title,note,data})=><section className="card"><h3>{title}</h3><p className="muted sm">{note}</p>
  <div style={{height:220}}><ResponsiveContainer><BarChart data={data}><XAxis dataKey="name" stroke="#8b90a0" fontSize={11}/><YAxis allowDecimals={false} stroke="#8b90a0" fontSize={11}/><Tooltip contentStyle={{background:'#111318',border:'1px solid #2a2e38'}}/><Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></section>;
export function Analytics(){
  const {st}=useStore();const repos=cachedRepos().flat();
  const lc={};repos.forEach(r=>r.language&&(lc[r.language]=(lc[r.language]||0)+1));
  const langs=Object.entries(lc).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,value])=>({name,value}));
  const bins=[['0',0,0],['1-9',1,9],['10-99',10,99],['100-999',100,999],['1000+',1000,1e9]].map(([name,a,b])=>({name,value:repos.filter(r=>r.stargazers_count>=a&&r.stargazers_count<=b).length}));
  const months={};repos.forEach(r=>{const m=(r.pushed_at||'').slice(0,7);if(m>=new Date(Date.now()-365*864e5).toISOString().slice(0,7))months[m]=(months[m]||0)+1});
  const act=Object.entries(months).sort().map(([name,value])=>({name,value}));
  const saved=Object.values(st.saved),by=['New','Contacted','Interested','Archived'].map(name=>({name,value:saved.filter(s=>s.status===name).length}));
  return <div><h1>Analytics</h1>
    {!repos.length&&<Empty title="No repository data yet" text="Open developer profiles to load repositories. Charts use only data retrieved in this session."/>}
    {repos.length>0&&<div className="grid"><Chart title="Language distribution" note={`Retrieved repositories this session (${repos.length}). Not global GitHub data.`} data={langs}/>
      <Chart title="Stars distribution" note="Same retrieved repositories." data={bins}/><Chart title="Repository pushes by month" note="Last 12 months, retrieved repositories only. Not a contribution count." data={act}/></div>}
    <div className="grid"><Chart title="Shortlist by status" note={`Saved shortlist (${saved.length} candidates).`} data={by}/></div></div>;
}
export function Settings(){
  const {st,setPref,ask,clearHistory,clearSaved,reset,toast}=useStore();const [tok,setTok]=useState(st.prefs.token);
  const {data,error,retry}=useAsync(s=>getRateLimit(s),[st.prefs.token]);
  return <div><h1>Settings</h1><div className="filters card">
    <label>Theme<select value={st.prefs.theme} onChange={e=>setPref('theme',e.target.value)}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>
    <label>Results per page<select value={st.prefs.perPage} onChange={e=>setPref('perPage',+e.target.value)}>{[6,12,24,30].map(n=><option key={n}>{n}</option>)}</select></label>
    <label>Default user sort<select value={st.prefs.sort} onChange={e=>setPref('sort',e.target.value)}><option value="">Best match</option><option value="followers">Followers</option><option value="repositories">Repositories</option><option value="joined">Joined date</option></select></label></div>
    <section className="card"><h3>GitHub API status</h3>
      {error?<p>{error.message} <button className="btn" onClick={retry}>Retry</button></p>:data?<p>Core: {data.resources.core.remaining}/{data.resources.core.limit} left · Search: {data.resources.search.remaining}/{data.resources.search.limit} left (resets {new Date(data.resources.core.reset*1000).toLocaleTimeString()})</p>:<p className="muted">Checking…</p>}
      <label>Personal access token (optional)<input type="password" value={tok} onChange={e=>setTok(e.target.value)} autoComplete="off" placeholder="Leave empty for public mode"/></label>
      <p className="muted sm">The token is sent only to api.github.com. It is stored in this browser's localStorage, so any script running on this origin can read it. Use a token with no scopes. For production, use a backend proxy instead.</p>
      <button className="btn" onClick={()=>{setPref('token',tok.trim());toast('Token saved')}}>Save token</button></section>
    <section className="card"><h3>Your data</h3><div className="actions">
      <button className="btn" onClick={()=>download('founder-search-data.json',JSON.stringify({...st,prefs:{...st.prefs,token:undefined}},null,2),'application/json')}>Export data (no token)</button>
      <button className="btn" onClick={()=>ask('Clear search history?',clearHistory)}>Clear search history</button>
      <button className="btn" onClick={()=>ask('Delete all saved candidates and notes?',clearSaved)}>Clear saved candidates</button>
      <button className="btn" onClick={()=>ask('Reset all preferences, including the token?',reset)}>Reset preferences</button></div></section></div>;
}