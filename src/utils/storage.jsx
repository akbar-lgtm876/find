import {createContext,useContext,useState,useEffect,useCallback} from 'react';
const K='fs:state';
const D={saved:{},compare:[],history:[],recent:[],prefs:{theme:'dark',perPage:12,sort:'',token:''}};
const load=()=>{try{const s=JSON.parse(localStorage.getItem(K));return{...D,...s,prefs:{...D.prefs,...(s&&s.prefs)}}}catch{return D}};
const Ctx=createContext();export const useStore=()=>useContext(Ctx);
export function StoreProvider({children}){
  const [st,setSt]=useState(load),[toasts,setT]=useState([]),[dlg,setDlg]=useState(null),[seen,setSeen]=useState({});
  useEffect(()=>{localStorage.setItem(K,JSON.stringify(st));localStorage.setItem('fs:prefs',JSON.stringify(st.prefs))},[st]);
  useEffect(()=>{const m=matchMedia('(prefers-color-scheme: light)');
    const f=()=>{const t=st.prefs.theme;document.documentElement.dataset.theme=t==='system'?(m.matches?'light':'dark'):t};
    f();m.addEventListener('change',f);return()=>m.removeEventListener('change',f)},[st.prefs.theme]);
  const toast=useCallback(m=>{const id=Math.random();setT(t=>[...t,{id,m}]);setTimeout(()=>setT(t=>t.filter(x=>x.id!==id)),3000)},[]);
  const up=f=>setSt(s=>({...s,...f(s)}));
  const value={st,seen,toast,toasts,dlg,setDlg,
    ask:(msg,fn)=>setDlg({msg,fn}),
    setPref:(k,v)=>up(s=>({prefs:{...s.prefs,[k]:v}})),
    toggleSave:u=>{const has=!!st.saved[u.login];
      up(s=>{const saved={...s.saved};if(has)delete saved[u.login];else saved[u.login]={login:u.login,name:u.name||'',avatar_url:u.avatar_url,html_url:u.html_url,location:u.location||'',followers:u.followers??null,public_repos:u.public_repos??null,status:'New',note:'',savedAt:Date.now()};return{saved}});
      toast(has?`Removed ${u.login} from shortlist`:`Saved ${u.login} to shortlist`)},
    updateSaved:(l,p)=>up(s=>s.saved[l]?{saved:{...s.saved,[l]:{...s.saved[l],...p}}}:{}),
    toggleCompare:l=>{if(st.compare.includes(l))up(s=>({compare:s.compare.filter(x=>x!==l)}));
      else if(st.compare.length>=4)toast('Compare up to 4 developers');else up(s=>({compare:[...s.compare,l]}))},
    addHistory:q=>up(s=>({history:[q,...s.history.filter(x=>x!==q)].slice(0,15)})),
    addRecent:u=>up(s=>({recent:[{login:u.login,avatar_url:u.avatar_url},...s.recent.filter(x=>x.login!==u.login)].slice(0,8)})),
    noteSeen:u=>setSeen(s=>s[u.login]?s:{...s,[u.login]:u}),
    clearHistory:()=>{up(()=>({history:[]}));toast('Search history cleared')},
    clearSaved:()=>{up(()=>({saved:{},compare:[]}));toast('Shortlist cleared')},
    reset:()=>{setSt(D);toast('Preferences reset')}};
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
const cell=v=>{let s=String(v??'');if(/^[=+\-@]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`};
export function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
export function exportCsv(rows){
  const h=['login','name','location','followers','public_repos','status','note','profile_url'];
  download('founder-search-shortlist.csv',[h.join(','),...rows.map(r=>[r.login,r.name,r.location,r.followers,r.public_repos,r.status,r.note,r.html_url].map(cell).join(','))].join('\n'),'text/csv');
}