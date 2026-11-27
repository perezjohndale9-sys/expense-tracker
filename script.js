const CATS={Food:['🍔','#BE1E2D'],Transport:['🚌','#FFCC00'],School:['📚','#1E5409'],Bills:['💡','#484645'],Shopping:['🛍️','#8E0B19'],Health:['💊','#d9822b'],Fun:['🎮','#3b7dd8'],Other:['📦','#9a9494'],Allowance:['💵','#1E5409'],Salary:['💼','#1E5409']};
const $=id=>document.getElementById(id);
let S={tx:[],budget:0,theme:'',goals:[],catBud:{},rec:[]};
try{const d=localStorage.getItem('mcc-exp');if(d)S=Object.assign(S,JSON.parse(d))}catch(e){}
let ref=null,pt;
const setSync=t=>{$('sync').textContent=t};
function push(){if(!ref)return;clearTimeout(pt);pt=setTimeout(()=>{ref.set({json:JSON.stringify(S),updated:S.updated}).then(()=>setSync('☁️ Synced to your account')).catch(()=>setSync('⚠️ Sync failed (saved on this device)'))},600)}
const save=()=>{S.updated=Date.now();try{localStorage.setItem('mcc-exp',JSON.stringify(S))}catch(e){}push()};
const peso=n=>'₱'+n.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
function fmt(x){return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
const today=fmt(new Date());
$('date').value=today;$('month').value=today.slice(0,7);$('budget').value=S.budget||'';
if(S.theme)document.documentElement.dataset.theme=S.theme;
function fillCats(){const t=$('type').value;$('cat').innerHTML=Object.keys(CATS).filter(c=>t==='i'?['Allowance','Salary','Other'].includes(c):!['Allowance','Salary'].includes(c)).map(c=>`<option>${c}</option>`).join('')}
fillCats();$('type').onchange=fillCats;
function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(){
const m=$('month').value,q=$('search').value.toLowerCase();
const list=S.tx.filter(t=>(!m||t.date.startsWith(m))&&(!q||(t.title+t.cat).toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
const inc=list.filter(t=>t.type==='i').reduce((a,t)=>a+t.amt,0),exp=list.filter(t=>t.type==='e').reduce((a,t)=>a+t.amt,0);
$('inc').textContent=peso(inc);$('exp').textContent=peso(exp);$('bal').textContent=peso(inc-exp);
const b=S.budget;
if(b>0){const p=Math.min(100,exp/b*100);$('bfill').style.width=p+'%';$('bfill').style.background=p>=100?'#BE1E2D':p>=80?'#FFCC00':'#1E5409';
$('btext').textContent=exp>b?`Over budget by ${peso(exp-b)}!`:`${peso(b-exp)} left (${p.toFixed(0)}% used)`}
else{$('bfill').style.width='0';$('btext').textContent='Set a budget to see your progress.'}
const by={};list.filter(t=>t.type==='e').forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amt);
const ent=Object.entries(by).sort((a,b)=>b[1]-a[1]);let acc=0,g=[];
ent.forEach(([c,v])=>{const s=acc/exp*100;acc+=v;g.push(`${CATS[c][1]} ${s}% ${acc/exp*100}%`)});
$('donut').style.background=ent.length?`conic-gradient(${g.join(',')})`:'var(--line)';
$('donut').dataset.total=peso(exp);
$('leg').innerHTML=ent.length?ent.map(([c,v])=>`<div><i style="background:${CATS[c][1]}"></i>${c}<span>${peso(v)} · ${(v/exp*100).toFixed(0)}%</span></div>`).join(''):'<div class="empty">No expenses yet</div>';
$('list').innerHTML=list.length?list.map(t=>`<div class="tx"><div class="ic">${CATS[t.cat][0]}</div><div class="m"><b>${esc(t.title)}</b><small>${t.cat} · ${t.date}</small></div><span class="amt ${t.type}">${t.type==='e'?'−':'+'}${peso(t.amt)}</span><button class="x" onclick="edit(${t.id})" title="Edit">✏️</button><button class="x" onclick="del(${t.id})" title="Delete">✕</button></div>`).join(''):'<div class="empty">No transactions for this view.</div>';
}
window.del=id=>{S.tx=S.tx.filter(t=>t.id!==id);save();render()};
$('add').onclick=()=>{const amt=parseFloat($('amount').value),title=$('title').value.trim();
if(!title||!(amt>0)){alert('Please enter a description and an amount above 0.');return}
const date=$('date').value||today;const o={type:$('type').value,title,amt,cat:$('cat').value,date};if(editId){Object.assign(S.tx.find(t=>t.id===editId)||{},o)}else{S.tx.push(Object.assign({id:Date.now()},o));const f=$('repeat').value;if(f){S.rec.push(Object.assign({id:Date.now()+1,freq:f,next:adv(date,f)},o));gen()}}resetForm();
$('title').value='';$('amount').value='';$('month').value=date.slice(0,7);save();render()};
$('budget').oninput=e=>{S.budget=parseFloat(e.target.value)||0;save();render()};
$('month').onchange=$('search').oninput=render;
$('theme').onclick=()=>{const d=document.documentElement,dark=getComputedStyle(d).getPropertyValue('--bg').trim()==='#1c1a1a';S.theme=dark?'light':'dark';d.dataset.theme=S.theme;save()};
$('csv').onclick=()=>{const rows=[['Date','Type','Category','Description','Amount']].concat(S.tx.map(t=>[t.date,t.type==='e'?'Expense':'Income',t.cat,'"'+t.title.replace(/"/g,'""')+'"',t.amt]));
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));a.download='mcc-expenses.csv';a.click()};
let editId=null;
function adv(d,f){const x=new Date(d+'T00:00:00');f==='w'?x.setDate(x.getDate()+7):x.setMonth(x.getMonth()+1);return fmt(x)}
function gen(){let ch=false;S.rec.forEach(r=>{while(r.next<=today){S.tx.push({id:Date.now()+Math.floor(Math.random()*1e6),type:r.type,title:r.title,amt:r.amt,cat:r.cat,date:r.next});r.next=adv(r.next,r.freq);ch=true}});if(ch)save()}
function resetForm(){editId=null;$('add').textContent='Add';$('cancel').hidden=true;$('repeat').value=''}
window.edit=id=>{const t=S.tx.find(t=>t.id===id);if(!t)return;editId=id;$('type').value=t.type;fillCats();$('cat').value=t.cat;$('title').value=t.title;$('amount').value=t.amt;$('date').value=t.date;$('repeat').value='';$('add').textContent='Save changes';$('cancel').hidden=false;$('title').scrollIntoView({behavior:'smooth',block:'center'})};
$('cancel').onclick=()=>{resetForm();$('title').value='';$('amount').value=''};
$('cbCat').innerHTML=Object.keys(CATS).filter(c=>!['Allowance','Salary'].includes(c)).map(c=>`<option>${c}</option>`).join('');
$('cbSet').onclick=()=>{const v=parseFloat($('cbAmt').value);if(!(v>=0))return;if(v===0)delete S.catBud[$('cbCat').value];else S.catBud[$('cbCat').value]=v;$('cbAmt').value='';save();render()};
$('gAdd').onclick=()=>{const name=$('gName').value.trim(),target=parseFloat($('gTarget').value);if(!name||!(target>0)){alert('Enter a goal name and a target amount.');return}S.goals.push({id:Date.now(),name,target,saved:0});$('gName').value='';$('gTarget').value='';save();render()};
window.dep=id=>{const g=S.goals.find(g=>g.id===id);if(!g)return;const v=parseFloat(prompt('Amount to add to "'+g.name+'" (₱):'));if(v>0){g.saved+=v;save();render()}};
window.gdel=id=>{S.goals=S.goals.filter(g=>g.id!==id);save();render()};
window.rdel=id=>{S.rec=S.rec.filter(r=>r.id!==id);save();render()};
const pbar=(p,c)=>`<div class="bar"><i style="width:${Math.min(100,p)}%;background:${c}"></i></div>`;
function extras(){
const m=$('month').value,by={};
S.tx.filter(t=>t.type==='e'&&(!m||t.date.startsWith(m))).forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amt);
const cb=Object.entries(S.catBud);
$('cbList').innerHTML=cb.length?cb.map(([c,l])=>{const s=by[c]||0,p=s/l*100;return `<div style="margin-top:10px"><div class="row"><b>${CATS[c][0]} ${c}</b><small style="margin-left:auto;color:var(--muted)">${peso(s)} / ${peso(l)}</small></div>${pbar(p,p>=100?'#BE1E2D':p>=80?'#FFCC00':'#1E5409')}</div>`}).join(''):'<div class="empty">No category limits yet.</div>';
$('gList').innerHTML=S.goals.length?S.goals.map(g=>{const p=g.saved/g.target*100;return `<div style="margin-top:10px"><div class="row"><b>🎯 ${esc(g.name)}</b><small style="margin-left:auto;color:var(--muted)">${peso(g.saved)} / ${peso(g.target)}</small></div>${pbar(p,'#1E5409')}<div class="row"><small style="color:var(--muted)">${p>=100?'Goal reached! 🎉':p.toFixed(0)+'% saved'}</small><button class="btn" style="margin-left:auto;padding:5px 10px" onclick="dep(${g.id})">+ Deposit</button><button class="x" onclick="gdel(${g.id})">✕</button></div></div>`}).join(''):'<div class="empty">No goals yet.</div>';
$('rList').innerHTML=S.rec.length?S.rec.map(r=>`<div class="tx"><div class="ic">🔁</div><div class="m"><b>${esc(r.title)}</b><small>${r.freq==='w'?'Weekly':'Monthly'} · next ${r.next}</small></div><span class="amt ${r.type}">${peso(r.amt)}</span><button class="x" onclick="rdel(${r.id})">✕</button></div>`).join(''):'<div class="empty">No recurring items yet. Use "Repeat" when adding a transaction.</div>';
}
function bkNote(){const d=S.lastBackup,days=d?Math.floor((Date.now()-d)/864e5):null;$('bkmsg').textContent=!S.tx.length?'':d?(days>=7?`⚠️ Last backup was ${days} days ago. Please back up again.`:`✅ Last backup: ${days===0?'today':days+' day(s) ago'}`):'⚠️ No backup yet. Click Backup to save a copy of your data.'}
$('bak').onclick=()=>{S.lastBackup=Date.now();save();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='mcc-expense-backup-'+today+'.json';a.click();render()};
$('rest').onclick=()=>$('file').click();
$('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.tx))throw 0;if(!confirm('Replace your current data with this backup?'))return;S=Object.assign({tx:[],budget:0,theme:'',goals:[],catBud:{},rec:[]},d);save();$('budget').value=S.budget||'';render()}catch(x){alert('That is not a valid backup file.')}};r.readAsText(f);e.target.value=''};
const _r=render;render=function(){_r();extras();bkNote()};
$('month').onchange=$('search').oninput=render;
const FIREBASE_CONFIG={
  apiKey:"AIzaSyDkZ62JrgrRig2g2yRLHIazRGErcnod45A",
  authDomain:"expense-tracker-b86dd.firebaseapp.com",
  databaseURL:"https://expense-tracker-b86dd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"expense-tracker-b86dd",
  storageBucket:"expense-tracker-b86dd.firebasestorage.app",
  messagingSenderId:"199593048597",
  appId:"1:199593048597:web:c21ebf5c95338e3abd2c1c"
};
let stopListen=null;
const blank=()=>({tx:[],budget:0,theme:'',goals:[],catBud:{},rec:[]});
function initCloud(){
if(!window.firebase){setSync('💾 Saved on this device only (cloud unavailable)');return}
firebase.initializeApp(FIREBASE_CONFIG);
const auth=firebase.auth(),db=firebase.database();
const msg=t=>{$('lmsg').textContent=t};
const creds=()=>[$('lemail').value.trim(),$('lpass').value];
const errText=e=>({
'auth/invalid-email':'Please enter a valid email.',
'auth/weak-password':'Password must be at least 6 characters.',
'auth/email-already-in-use':'That email already has an account. Try logging in.',
'auth/user-not-found':'No account found. Try "Create account".',
'auth/wrong-password':'Wrong password.',
'auth/invalid-credential':'Wrong email or password.',
'auth/network-request-failed':'No internet connection.',
'auth/too-many-requests':'Too many attempts. Please wait a moment.'
}[e.code]||'Something went wrong. ('+e.code+')');
$('lin').onclick=()=>{msg('');auth.signInWithEmailAndPassword(...creds()).catch(e=>msg(errText(e)))};
$('lup').onclick=()=>{msg('');auth.createUserWithEmailAndPassword(...creds()).catch(e=>msg(errText(e)))};
$('lpass').onkeydown=e=>{if(e.key==='Enter')$('lin').click()};
$('logout').onclick=()=>auth.signOut();
auth.onAuthStateChanged(u=>{
if(stopListen){stopListen();stopListen=null}
if(!u){
ref=null;S=blank();
try{localStorage.removeItem('mcc-exp');localStorage.removeItem('mcc-uid')}catch(e){}
$('login').hidden=false;$('logout').hidden=true;$('budget').value='';render();return}
let last=null;try{last=localStorage.getItem('mcc-uid')}catch(e){}
if(last!==u.uid){S=blank();try{localStorage.setItem('mcc-uid',u.uid)}catch(e){}}
$('login').hidden=true;$('logout').hidden=false;msg('');
ref=db.ref('users/'+u.uid+'/state');
const apply=d=>{S=Object.assign(blank(),JSON.parse(d.json),{updated:d.updated});try{localStorage.setItem('mcc-exp',JSON.stringify(S))}catch(e){}$('budget').value=S.budget||'';if(S.theme)document.documentElement.dataset.theme=S.theme;gen();render()};
let first=true;
const cb=snap=>{
const d=snap.exists()?snap.val():null;
if(first){first=false;
if(d&&d.updated>(S.updated||0))apply(d);
else if(S.tx.length||S.goals.length||S.budget)push();
else{$('budget').value=S.budget||'';render()}
setSync('☁️ Synced to your account · '+u.email);return}
if(d&&d.updated>(S.updated||0)){apply(d);setSync('☁️ Updated from another device')}};
const bad=()=>setSync('💾 Saved on this device (cloud sync unavailable)');
ref.on('value',cb,bad);
const r=ref;stopListen=()=>r.off('value',cb);
});
}
gen();
render();
initCloud();
