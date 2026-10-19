import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {Github,ExternalLink,Download,Trash2} from 'lucide-react';
import {useStore,exportCsv} from '../utils/storage.jsx';
import {useAsync} from '../hooks/useGithubSearch.js';
import {getUser,getRepos,safeGithub,safeWeb} from '../services/githubApi.js';
import {RepoCard,Skeleton,Empty,ErrorState,fmtDate} from '../components/ui.jsx';
export const langCount=repos=>{const c={};repos.forEach(r=>r.language&&(c[r.language]=(c[r.language]||0)+1));return Object.entries(c).sort((a,b)=>b[1]-a[1])};
const load=(l,s)=>Promise.all([getUser(l,s),getRepos(l,s)]);

export function DeveloperDetails(){
  const {login}=useParams();const {st,toggleSave,addRecent,updateSaved}=useStore();
  const {data,error,loading,retry}=useAsync(s=>load(login,s),[login,st.prefs.token]);
  const u=data?.[0],repos=data?.[1];
  useEffect(()=>{if(u){addRecent(u);if(st.saved[login]&&!st.saved[login].langs)updateSaved(login,{langs:langCount(repos).map(x=>x[0])})}},[data]); // eslint-disable-line
  if(error)return <ErrorState e={error} retry={retry}/>;if(loading&&!data)return <Skeleton n={2}/>;if(!u)return null;
  const web=safeWeb(u.blog),gh=safeGithub(u.html_url),langs=langCount(repos);
  return <div><header className="profile"><img src={u.avatar_url} alt="" width="88" height="88"/><div><h1>{u.name||u.login}</h1><p className="muted">@{u.login} · {u.type}</p>{u.bio&&<p>{u.bio}</p>}</div></header>
    <div className="actions">{gh&&<a className="btn primary" href={gh} target="_blank" rel="noopener noreferrer"><Github size={14}/>Open GitHub Profile</a>}
      {web&&<a className="btn" href={web} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>Open Portfolio</a>}
      <button className="btn" onClick={()=>toggleSave(u)}>{st.saved[login]?'Remove from shortlist':'Save Candidate'}</button></div>
    <dl className="card info">{[['Location',u.location],['Company',u.company],['Public email',u.email],['Followers',u.followers],['Following',u.following],['Public repositories',u.public_repos],['Account created',fmtDate(u.created_at)]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||'Not available'}</dd></div>)}</dl>
    <p className="muted sm">Languages and repositories below come from the {repos.length} most recently updated public repositories.</p>
    <p className="tags">{langs.length?langs.map(([l,n])=><span key={l}>{l} · {n}</span>):'No primary languages available'}</p>
    <h2>Recently updated repositories</h2>{repos.length?<div className="grid">{repos.map(r=><RepoCard key={r.id} r={r}/>)}</div>:<Empty title="No public repositories" text="This account has no public repositories."/>}</div>;
}

const STATUS=['New','Contacted','Interested','Archived'];
export function Shortlist(){
  const {st,updateSaved,toggleSave,ask,clearSaved}=useStore();
  const [q,setQ]=useState(''),[status,setStatus]=useState(''),[loc,setLoc]=useState(''),[lang,setLang]=useState(''),[sort,setSort]=useState('');
  let rows=Object.values(st.saved).filter(r=>(!q||(r.login+r.name+r.note).toLowerCase().includes(q.toLowerCase()))&&(!status||r.status===status)&&(!loc||r.location.toLowerCase().includes(loc.toLowerCase()))&&(!lang||(r.langs||[]).some(l=>l.toLowerCase()===lang.toLowerCase())));
  if(sort)rows=[...rows].sort((a,b)=>(b[sort]??-1)-(a[sort]??-1));
  const total=Object.keys(st.saved).length;
  return <div><h1>Candidate shortlist</h1><p className="muted sm">Notes and statuses are stored only in this browser. They are not synced across devices. Nobody is contacted automatically.</p>
    <div className="filters card"><label>Search<input value={q} onChange={e=>setQ(e.target.value)}/></label><label>Location<input value={loc} onChange={e=>setLoc(e.target.value)}/></label>
      <label>Language<input value={lang} onChange={e=>setLang(e.target.value)} placeholder="From viewed profiles"/></label>
      <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All</option>{STATUS.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Sort<select value={sort} onChange={e=>setSort(e.target.value)}><option value="">Date saved</option><option value="followers">Followers</option><option value="public_repos">Repositories</option></select></label>
      <div className="row end"><button className="btn" disabled={!rows.length} onClick={()=>exportCsv(rows)}><Download size={14}/>Export CSV</button><button className="btn" disabled={!total} onClick={()=>ask('Remove all saved candidates?',clearSaved)}>Clear all</button></div></div>
    {!rows.length?<Empty title={total?'No matches':'No saved candidates yet'} text={total?'Adjust the filters.':'Save developers from search results to build a shortlist.'}>{!total&&<Link className="btn primary" to="/search">Find developers</Link>}</Empty>
    :<div className="grid">{rows.map(r=><article className="card" key={r.login}><header className="dev"><img src={r.avatar_url} alt="" width="48" height="48"/><div><h3><Link to={`/developer/${r.login}`}>{r.name||r.login}</Link></h3><span className="muted">@{r.login}</span></div></header>
      <p className="muted sm">{r.location||'Location not available'} · {r.followers??'Not available'} followers · {r.public_repos??'Not available'} repos</p>
      <label>Status<select value={r.status} onChange={e=>updateSaved(r.login,{status:e.target.value})}>{STATUS.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Private note<textarea rows="3" value={r.note} onChange={e=>updateSaved(r.login,{note:e.target.value})}/></label>
      <div className="actions"><a className="btn primary" href={safeGithub(r.html_url)||'#'} target="_blank" rel="noopener noreferrer"><Github size={14}/>View GitHub</a><button className="btn" onClick={()=>ask(`Remove ${r.login}?`,()=>toggleSave(r))}><Trash2 size={14}/>Remove</button></div></article>)}</div>}</div>;
}

export function Compare(){
  const {st,toggleCompare}=useStore();const L=st.compare;
  const {data,error,retry,loading}=useAsync(s=>L.length?Promise.all(L.map(l=>load(l,s))):null,[L.join(),st.prefs.token]);
  if(L.length<2)return <div><h1>Compare</h1><Empty title="Select 2 to 4 developers" text={`${L.length} selected. Use Compare on a developer card.`}><Link className="btn primary" to="/search">Find developers</Link></Empty></div>;
  if(error)return <ErrorState e={error} retry={retry}/>;if(loading&&!data)return <Skeleton n={2}/>;if(!data)return null;
  const yrs=d=>d?((Date.now()-new Date(d))/31557600000).toFixed(1)+' years':'Not available';
  const cut=Date.now()-90*864e5;
  const rows=[['Followers',([u])=>u.followers],['Public repositories',([u])=>u.public_repos],['Following',([u])=>u.following],['Account age',([u])=>yrs(u.created_at)],
    ['Stars (latest 30 repos)',([,r])=>r.reduce((a,x)=>a+x.stargazers_count,0)],['Top languages (latest 30 repos)',([,r])=>langCount(r).slice(0,3).map(x=>x[0]).join(', ')||'Not available'],
    ['Last push',([,r])=>fmtDate(r.map(x=>x.pushed_at).sort().pop())],['Repos pushed in last 90 days',([,r])=>r.filter(x=>new Date(x.pushed_at)>cut).length]];
  return <div><h1>Compare</h1><p className="muted sm">Repository figures use each developer's 30 most recently updated public repositories. No overall score is calculated.</p>
    <div className="scroll"><table><thead><tr><th/>{data.map(([u])=><th key={u.login}><Link to={`/developer/${u.login}`}>{u.login}</Link> <button className="btn sm" onClick={()=>toggleCompare(u.login)}>Remove</button></th>)}</tr></thead>
    <tbody>{rows.map(([k,f])=><tr key={k}><th scope="row">{k}</th>{data.map((d,i)=><td key={i}>{f(d)??'Not available'}</td>)}</tr>)}</tbody></table></div></div>;
}