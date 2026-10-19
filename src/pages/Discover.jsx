import {useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {Search as SearchIcon} from 'lucide-react';
import {useStore} from '../utils/storage.jsx';
import {useAsync} from '../hooks/useGithubSearch.js';
import {searchUsers,searchRepos} from '../services/githubApi.js';
import {DevCard,RepoCard,Skeleton,Empty,ErrorState,Pager} from '../components/ui.jsx';
const qv=v=>{v=v.replace(/"/g,'');return /\s/.test(v)?`"${v}"`:v};
const pagesOf=(total,pp)=>Math.max(1,Math.min(Math.ceil(total/pp),Math.floor(1000/pp))); // GitHub search exposes at most 1000 results

export function Dashboard(){
  const {st,seen}=useStore();const nav=useNavigate();const [q,setQ]=useState('');
  const found=Object.values(seen);const langs={};
  found.forEach(u=>{});
  return <div><h1>Dashboard</h1>
    <form className="row" onSubmit={e=>{e.preventDefault();q.trim()&&nav(`/search?q=${encodeURIComponent(q.trim())}`)}}>
      <input aria-label="Quick search" placeholder="Quick search by username or name" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn primary">Search</button></form>
    <div className="grid kpis">
      <div className="card"><h2>{found.length}</h2><p className="muted sm">Developers loaded this session (session only)</p></div>
      <div className="card"><h2>{Object.keys(st.saved).length}</h2><p className="muted sm">Saved candidates</p><Link to="/shortlist">Open shortlist</Link></div>
      <div className="card"><h2>{st.compare.length}</h2><p className="muted sm">Selected for comparison</p><Link to="/compare">Open comparison</Link></div></div>
    <div className="grid">
      <section className="card"><h3>Recently viewed profiles</h3>{st.recent.length?<div className="chips">{st.recent.map(u=><Link key={u.login} to={`/developer/${u.login}`}><img src={u.avatar_url} alt="" width="20" height="20"/>{u.login}</Link>)}</div>:<p className="muted sm">Profiles you open will appear here.</p>}</section>
      <section className="card"><h3>Recent searches</h3>{st.history.length?<div className="chips">{st.history.slice(0,8).map(h=><Link key={h} to={`/search?${h}`}>{new URLSearchParams(h).get('q')||h.replace(/&?per=\d+/,'').replaceAll('=',':').replaceAll('&',' ')}</Link>)}</div>:<p className="muted sm">Run a search to build your history.</p>}</section>
      <section className="card"><h3>Discovered this session</h3>{found.length?<div className="chips">{found.slice(-8).reverse().map(u=><Link key={u.login} to={`/developer/${u.login}`}><img src={u.avatar_url} alt="" width="20" height="20"/>{u.login}</Link>)}</div>:<p className="muted sm">Nothing yet.</p>}</section>
      <section className="card"><h3>Trending languages</h3><p className="muted sm">Language data comes from repositories you open. See <Link to="/analytics">Analytics</Link> for charts based on retrieved data.</p></section></div></div>;
}

export function Search(){
  const {st,addHistory}=useStore();const [sp,setSp]=useSearchParams();const g=k=>sp.get(k)||'';
  const keys=['q','location','language','repos','followers','type','sort'];
  const [f,setF]=useState(()=>Object.fromEntries(keys.map(k=>[k,g(k)])));
  const per=+g('per')||st.prefs.perPage,sort=g('sort')||st.prefs.sort,page=+g('page')||1;
  const parts=[g('q'),g('location')&&`location:${qv(g('location'))}`,g('language')&&`language:${qv(g('language'))}`,+g('repos')>0&&`repos:>=${+g('repos')}`,+g('followers')>0&&`followers:>=${+g('followers')}`,`type:${g('type')||'user'}`].filter(Boolean);
  const active=keys.some(k=>k!=='type'&&k!=='sort'&&g(k));
  const {data,error,loading,retry}=useAsync(s=>active?searchUsers({q:parts.join(' '),sort:sort||'',order:'desc',per_page:per,page},s):null,[sp.toString(),st.prefs.token,st.prefs.perPage,st.prefs.sort]);
  const submit=e=>{e.preventDefault();const n=new URLSearchParams();keys.forEach(k=>f[k]&&n.set(k,f[k]));n.set('per',per);
    const s=n.toString();if(s)addHistory(s);setSp(n)};
  const clear=()=>{setF(Object.fromEntries(keys.map(k=>[k,''])));setSp({})};
  const go=p=>{const n=new URLSearchParams(sp);n.set('page',p);setSp(n)};
  const set=k=>e=>setF({...f,[k]:e.target.value});
  return <div><h1>Find developers</h1>
    <form className="filters card" onSubmit={submit}>
      <label>Name or username<input list="hist" value={f.q} onChange={set('q')} placeholder="e.g. alice"/></label>
      <label>Location<input value={f.location} onChange={set('location')} placeholder="e.g. Uzbekistan"/></label>
      <label>Language<input value={f.language} onChange={set('language')} placeholder="e.g. JavaScript"/></label>
      <label>Min repositories<input type="number" min="0" value={f.repos} onChange={set('repos')}/></label>
      <label>Min followers<input type="number" min="0" value={f.followers} onChange={set('followers')}/></label>
      <label>Account type<select value={f.type||'user'} onChange={set('type')}><option value="user">User</option><option value="org">Organization</option></select></label>
      <label>Sort by<select value={f.sort} onChange={set('sort')}><option value="">Best match</option><option value="followers">Followers</option><option value="repositories">Repositories</option><option value="joined">Joined date</option></select></label>
      <div className="row end"><button className="btn primary"><SearchIcon size={14}/>Search</button><button type="button" className="btn" onClick={clear}>Clear filters</button></div>
      <datalist id="hist">{st.history.map(h=>new URLSearchParams(h).get('q')).filter(Boolean).map(x=><option key={x} value={x}/>)}</datalist></form>
    <p className="muted sm">Query sent to GitHub: <code>{active?parts.join(' '):'—'}</code>. GitHub search shows at most 1,000 results per query.</p>
    {!active?<Empty title="Start with a search" text="Enter a name, location, or language to find developers."/>
     :error?<ErrorState e={error} retry={retry}/>
     :loading&&!data?<Skeleton n={Math.min(per,6)}/>
     :data&&!data.items.length?<Empty title="No developers match" text="Loosen a filter, such as the minimum followers, and search again."><button className="btn" onClick={clear}>Clear filters</button></Empty>
     :data&&<><p>{data.total_count.toLocaleString()} developers found</p><div className="grid">{data.items.map(u=><DevCard key={u.login} u={u}/>)}</div><Pager page={page} pages={pagesOf(data.total_count,per)} go={go}/></>}
  </div>;
}

export function Repositories(){
  const {st}=useStore();const [sp,setSp]=useSearchParams();const g=k=>sp.get(k)||'';
  const [f,setF]=useState({q:g('q'),user:g('user'),language:g('language'),sort:g('sort')});
  const per=st.prefs.perPage,page=+g('page')||1;
  const parts=[g('q'),g('user')&&`user:${qv(g('user'))}`,g('language')&&`language:${qv(g('language'))}`].filter(Boolean);
  const q=parts.length?parts.join(' '):'stars:>1000';
  const {data,error,loading,retry}=useAsync(s=>searchRepos({q,sort:g('sort'),order:'desc',per_page:per,page},s),[sp.toString(),st.prefs.token,per]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const submit=e=>{e.preventDefault();const n=new URLSearchParams();Object.entries(f).forEach(([k,v])=>v&&n.set(k,v));setSp(n)};
  return <div><h1>Repository explorer</h1>
    <form className="filters card" onSubmit={submit}>
      <label>Keywords<input value={f.q} onChange={set('q')}/></label><label>Owner<input value={f.user} onChange={set('user')}/></label>
      <label>Language<input value={f.language} onChange={set('language')}/></label>
      <label>Sort by<select value={f.sort} onChange={set('sort')}><option value="">Best match</option><option value="stars">Stars</option><option value="updated">Last update</option></select></label>
      <div className="row end"><button className="btn primary">Search repositories</button><button type="button" className="btn" onClick={()=>{setF({q:'',user:'',language:'',sort:''});setSp({})}}>Clear filters</button></div></form>
    {!parts.length&&<p className="muted sm">No filters set. Showing repositories with more than 1,000 stars.</p>}
    {error?<ErrorState e={error} retry={retry}/>:loading&&!data?<Skeleton/>
     :data&&!data.items.length?<Empty title="No repositories found" text="Try different keywords or remove the language filter."/>
     :data&&<><p>{data.total_count.toLocaleString()} repositories</p><div className="grid">{data.items.map(r=><RepoCard key={r.id} r={r}/>)}</div><Pager page={page} pages={pagesOf(data.total_count,per)} go={p=>{const n=new URLSearchParams(sp);n.set('page',p);setSp(n)}}/></>}</div>;
}