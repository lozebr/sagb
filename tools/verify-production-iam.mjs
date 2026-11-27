// Guard the production artifact, never log credentials.
const expected='https://txyuwaffzgsjndqsralg.supabase.co';
const env=process.env;
const dedicated=Boolean(env.VITE_SAGB_IAM_URL||env.VITE_SAGB_IAM_PUBLIC_KEY);
const url=dedicated?env.VITE_SAGB_IAM_URL:env.VITE_SUPABASE_URL;
const key=dedicated?env.VITE_SAGB_IAM_PUBLIC_KEY:env.VITE_SUPABASE_ANON_KEY;
let valid=false;
if(typeof key==='string'){
 if(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))valid=true;
 else try{const p=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString('utf8'));valid=p.role==='anon'&&p.ref==='txyuwaffzgsjndqsralg';}catch{}
}
if((url!==expected&&url!==expected+'/')||!valid||env.SAGB_DEMO_BUILD==='true'||env.VITE_SAGB_PUBLIC_DEMO==='true'){
 console.error('SagB: produção bloqueada; configure URL e chave pública do IAM oficial no contexto production. Nenhum valor foi exibido.');
 process.exit(1);
}
// Read-only public endpoint verifies that the configured key is accepted by the expected project.
try{const res=await fetch(expected+'/auth/v1/settings',{headers:{apikey:key},signal:AbortSignal.timeout(10000)});
 if(!res.ok)throw new Error('HTTP '+res.status);
 console.log('SagB: configuração pública do IAM oficial verificada.');
}catch(e){console.error('SagB: não foi possível validar a configuração de produção. '+(e instanceof Error&&/^HTTP \d+$/.test(e.message)?e.message:'Falha de rede ou autorização.'));process.exit(1);}
