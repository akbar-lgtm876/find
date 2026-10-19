const BASE='https://api.github.com';const cache=new Map();
export const rate={remaining:null,limit:null,reset:null};
export class ApiError extends Error{constructor(m,kind,reset){super(m);this.kind=kind;this.reset=reset}}
const token=()=>{try{return JSON.parse(localStorage.getItem('fs:prefs')||'{}').token||''}catch{return ''}};
export async function api(path,params={},{signal,ttl=300000}={}){
  const u=new URL(BASE+path);
  Object.entries(params).forEach(([k,v])=>{if(v!==''&&v!=null)u.searchParams.set(k,v)});
  const hit=cache.get(u.href);if(hit&&Date.now()-hit.t<ttl)return hit.d;
  let r;
  try{r=await fetch(u,{signal,headers:{Accept:'application/vnd.github+json',...(token()?{Authorization:`Bearer ${token()}`}:{})}})}
  catch(e){if(e.name==='AbortError')throw e;throw new ApiError('Network error. Check your connection and retry.','network')}
  const h=r.headers;
  if(h.get('x-ratelimit-remaining')!=null){rate.remaining=+h.get('x-ratelimit-remaining');rate.limit=+h.get('x-ratelimit-limit');rate.reset=+h.get('x-ratelimit-reset')*1000}
  if(!r.ok){
    if((r.status===403||r.status===429)&&rate.remaining===0)throw new ApiError(`GitHub rate limit reached. It resets at ${new Date(rate.reset).toLocaleTimeString()}. Adding a token in Settings raises the limit.`,'rate',rate.reset);
    if(r.status===404)throw new ApiError('Not found on GitHub.','notfound');
    if(r.status===401)throw new ApiError('The saved token was rejected. Remove or replace it in Settings.','auth');
    if(r.status===422)throw new ApiError('GitHub could not process this search. Adjust the filters and try again.','invalid');
    throw new ApiError(`GitHub returned an error (${r.status}).`,'http');
  }
  const d=await r.json();cache.set(u.href,{t:Date.now(),d});return d;
}
export const cachedRepos=()=>[...cache].filter(([k])=>/\/users\/[^/]+\/repos/.test(k)).map(([,v])=>v.d);
export const searchUsers=(p,signal)=>api('/search/users',p,{signal});
export const getUser=(l,signal)=>api(`/users/${encodeURIComponent(l)}`,{},{signal,ttl:900000});
export const getRepos=(l,signal)=>api(`/users/${encodeURIComponent(l)}/repos`,{sort:'updated',per_page:30},{signal,ttl:900000});
export const searchRepos=(p,signal)=>api('/search/repositories',p,{signal});
export const getRateLimit=signal=>api('/rate_limit',{},{signal,ttl:0});
export const safeGithub=s=>{try{const u=new URL(s);return u.protocol==='https:'&&(u.hostname==='github.com'||u.hostname==='www.github.com')?u.href:null}catch{return null}};
export const safeWeb=s=>{if(!s)return null;try{const u=new URL(/^https?:\/\//i.test(s)?s:`https://${s}`);return['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}};