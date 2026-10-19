import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Github,Star,GitFork,Bookmark,GitCompare,FolderGit2,ExternalLink,Inbox,AlertTriangle} from 'lucide-react';
import {useStore} from '../utils/storage.jsx';
import {useAsync} from '../hooks/useGithubSearch.js';
import {getUser,safeGithub,safeWeb} from '../services/githubApi.js';
export const fmtDate=d=>d?new Date(d).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'Not available';
export const Skeleton=({n=6})=><div className="grid">{Array.from({length:n},(_,i)=><div key={i} className="card"><div className="skel" style={{height:48,width:48,borderRadius:99}}/><div className="skel" style={{height:14,margin:'14px 0 8px',width:'60%'}}/><div className="skel" style={{height:10,width:'90%'}}/><div className="skel" style={{height:32,marginTop:16}}/></div>)}</div>;
export const Empty=({title,text,children})=><div className="empty"><Inbox size={32}/><h3>{title}</h3><p>{text}</p>{children}</div>;
export const ErrorState=({e,retry})=><div className="empty err" role="alert"><AlertTriangle size={32}/><h3>{e.kind==='rate'?'Rate limit reached':'Something went wrong'}</h3><p>{e.message}</p>{retry&&<button className="btn" onClick={retry}>Retry</button>}</div>;
export function Pager({page,pages,go}){if(pages<=1)return null;
  return <nav className="pager" aria-label="Pagination"><button className="btn" disabled={page<=1} onClick={()=>go(page-1)}>Previous</button><span>Page {page} of {pages}</span><button className="btn" disabled={page>=pages} onClick={()=>go(page+1)}>Next</button></nav>}
export function DevCard({u}){
  const {st,toggleSave,toggleCompare,noteSeen}=useStore();
  const {data:p}=useAsync(s=>getUser(u.login,s),[u.login]);const d={...u,...p};
  useEffect(()=>{if(p)noteSeen(p)},[p]); // eslint-disable-line
  const saved=!!st.saved[u.login],cmp=st.compare.includes(u.login),gh=safeGithub(d.html_url)||`https://github.com/${encodeURIComponent(u.login)}`,web=safeWeb(d.blog);
  return <article className="card dev">
    <header><img src={d.avatar_url} alt="" width="48" height="48"/><div><h3>{d.name||d.login}</h3><span className="muted">@{d.login} · {d.type}</span></div></header>
    {p?<>{d.bio&&<p className="bio">{d.bio}</p>}
      <p className="muted sm">{[d.location,d.company].filter(Boolean).join(' · ')||'No location or company listed'}</p>
      <dl className="stats"><div><dt>Followers</dt><dd>{d.followers}</dd></div><div><dt>Following</dt><dd>{d.following}</dd></div><div><dt>Repos</dt><dd>{d.public_repos}</dd></div></dl>
      <p className="muted sm">Joined {fmtDate(d.created_at)}{web&&<> · <a href={web} target="_blank" rel="noopener noreferrer">Portfolio</a></>}</p></>
      :<div className="skel" style={{height:60,margin:'12px 0'}}/>}
    <div className="actions">
      <a className="btn primary" href={gh} target="_blank" rel="noopener noreferrer"><Github size={14}/>View GitHub</a>
      <Link className="btn" to={`/developer/${u.login}`}>View Details</Link>
      <button className={'btn'+(saved?' on':'')} aria-pressed={saved} onClick={()=>toggleSave(d)}><Bookmark size={14}/>{saved?'Saved':'Save Candidate'}</button>
      <button className={'btn'+(cmp?' on':'')} aria-pressed={cmp} onClick={()=>toggleCompare(u.login)}><GitCompare size={14}/>{cmp?'Selected':'Compare'}</button>
      <Link className="btn" to={`/repositories?user=${u.login}`}><FolderGit2 size={14}/>View Repositories</Link>
    </div></article>;
}
export function RepoCard({r}){
  const url=safeGithub(r.html_url);
  return <article className="card"><h3>{r.name}</h3><p className="muted sm">by {r.owner?.login}</p>
    <p className="bio">{r.description||'No description provided'}</p>
    <p className="sm"><b>{r.language||'Language not available'}</b> · <Star size={12}/> {r.stargazers_count} · <GitFork size={12}/> {r.forks_count} · {r.open_issues_count} open issues (API count)</p>
    <p className="muted sm">Updated {fmtDate(r.pushed_at||r.updated_at)}</p>
    {r.topics?.length>0&&<p className="tags">{r.topics.slice(0,6).map(t=><span key={t}>{t}</span>)}</p>}
    {url&&<a className="btn primary" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>Open on GitHub</a>}</article>;
}