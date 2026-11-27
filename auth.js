firebase.initializeApp(FIREBASE_CONFIG);
const auth=firebase.auth();
const $=id=>document.getElementById(id);
const msg=t=>{$('lmsg').textContent=t};
const errText=e=>({
'auth/invalid-email':'Please enter a valid email.',
'auth/weak-password':'Password must be at least 6 characters.',
'auth/email-already-in-use':'That email already has an account. Please log in instead.',
'auth/user-not-found':'No account found with that email. Create an account first.',
'auth/wrong-password':'Wrong password.',
'auth/invalid-credential':'Wrong email or password.',
'auth/network-request-failed':'No internet connection.',
'auth/too-many-requests':'Too many attempts. Please wait a moment.'
}[e.code]||'Something went wrong. ('+e.code+')');
auth.onAuthStateChanged(u=>{if(u)location.replace('index.html')});
const page=document.body.dataset.page,btn=$('go');
function run(){
const email=$('lemail').value.trim(),pass=$('lpass').value;
msg('');
if(!email||!pass){msg('Enter your email and password.');return}
if(page==='signup'){
if(pass.length<6){msg('Password must be at least 6 characters.');return}
if(pass!==$('lpass2').value){msg('Passwords do not match.');return}}
btn.disabled=true;
(page==='signup'?auth.createUserWithEmailAndPassword(email,pass):auth.signInWithEmailAndPassword(email,pass))
.catch(e=>{msg(errText(e));btn.disabled=false});
}
btn.onclick=run;
document.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')run()});
