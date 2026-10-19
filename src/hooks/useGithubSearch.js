import {useEffect,useState} from 'react';
export function useAsync(fn,deps){
  const [s,set]=useState({loading:true});const [n,setN]=useState(0);
  useEffect(()=>{const ac=new AbortController();set(p=>({data:p.data,loading:true}));
    Promise.resolve(fn(ac.signal)).then(data=>set({data,loading:false}),error=>{if(error.name!=='AbortError')set({error,loading:false})});
    return()=>ac.abort()},[...deps,n]); // eslint-disable-line
  return {...s,retry:()=>setN(x=>x+1)};
}