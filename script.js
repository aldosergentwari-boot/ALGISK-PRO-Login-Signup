const $=s=>document.querySelector(s);
const form=$("#authForm"), message=$("#formMessage"), submit=$("#submitBtn");
let mode="login";
const STORE="algisk_pro_accounts_v2",SESSION="algisk_pro_session";
const readUsers=()=>{try{const current=localStorage.getItem(STORE);if(current)return JSON.parse(current);const legacy=JSON.parse(localStorage.getItem("tether_users_v5")||"[]");if(!legacy.length)return[];const migrated=legacy.map(u=>({name:u.username||"ALGISK Member",username:String(u.username||"").toLowerCase(),email:String(u.email||"").toLowerCase(),password:u.password||"",createdAt:new Date().toISOString()}));localStorage.setItem(STORE,JSON.stringify(migrated));return migrated}catch{return[]}};
const saveUsers=users=>localStorage.setItem(STORE,JSON.stringify(users));
const clean=v=>v.trim().toLowerCase();
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function say(text,good=false){message.textContent=text;message.classList.toggle("success",good)}
function setMode(next){
 mode=next;
 $("#loginTab").classList.toggle("active",mode==="login");
 $("#signupTab").classList.toggle("active",mode==="signup");
 $("#nameField").hidden=mode!=="signup";
 $("#usernameField").hidden=mode!=="signup";
 $("#confirmField").hidden=mode!=="signup";
 $("#forgotBtn").hidden=mode!=="login";
 $("#formTitle").innerHTML=mode==="login"?'Welcome back<span>.</span>':'Create your account<span>.</span>';
 $("#formSubtitle").textContent=mode==="login"?"Sign in to continue to your workspace.":"Set up your ALGISK PRO account in a few steps.";
 $("#identifierLabel").textContent=mode==="login"?"Email or username":"Email address";
 $("#identifier").placeholder=mode==="login"?"you@example.com or username":"you@example.com";
 $("#password").autocomplete=mode==="login"?"current-password":"new-password";
 $("#submitText").textContent=mode==="login"?"Sign in":"Create account";
 say("");form.reset();
}
async function derive(password,salt){
 const enc=new TextEncoder(),key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:180000,hash:"SHA-256"},key,256);
 return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function randomSalt(){const b=crypto.getRandomValues(new Uint8Array(16));return [...b].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function submitAuth(e){
 e.preventDefault();say("");
 const identifier=clean($("#identifier").value),password=$("#password").value;
 if(!identifier||!password){say("Please complete the required fields.");return}
 submit.disabled=true;$("#submitText").textContent="Please wait…";
 try{
  const users=readUsers();
  if(mode==="signup"){
   const name=$("#fullName").value.trim(),username=clean($("#username").value),email=clean($("#identifier").value),confirm=$("#confirmPassword").value;
   if(name.length<2){say("Enter your full name.");return}
   if(!/^[a-z0-9._-]{3,24}$/.test(username)){say("Username must be 3–24 characters (letters, numbers, dot, _ or -).");return}
   if(!validEmail(email)){say("Enter a valid email address.");return}
   if(password.length<8){say("Use a password with at least 8 characters.");return}
   if(password!==confirm){say("The passwords do not match.");return}
   if(users.some(u=>u.username===username||u.email===email)){say("That username or email is already registered.");return}
   const salt=randomSalt(),passwordHash=await derive(password,salt);
   users.push({name,username,email,salt,passwordHash,createdAt:new Date().toISOString()});saveUsers(users);
   localStorage.setItem(SESSION,username);location.href="dashboard.html";return;
  }
  const account=users.find(u=>u.username===identifier||u.email===identifier);
  if(!account){say("We couldn't find an account with those details.");return}
  let matches=false;
  if(account.passwordHash&&account.salt)matches=(await derive(password,account.salt))===account.passwordHash;
  else if(account.password)matches=account.password===password;
  if(!matches){say("Incorrect password. Please try again.");return}
  if(account.password){const salt=randomSalt();account.salt=salt;account.passwordHash=await derive(password,salt);delete account.password;saveUsers(users)}
  localStorage.setItem(SESSION,account.username);location.href="dashboard.html";
 }catch(err){console.error(err);say("This browser could not complete secure sign-in. Try a modern browser.");}
 finally{submit.disabled=false;$("#submitText").textContent=mode==="login"?"Sign in":"Create account"}
}
$("#loginTab").addEventListener("click",()=>setMode("login"));
$("#signupTab").addEventListener("click",()=>setMode("signup"));
document.querySelectorAll("[data-toggle-password]").forEach(button=>button.addEventListener("click",()=>{const field=document.getElementById(button.dataset.togglePassword);if(!field)return;const visible=field.type==="password";field.type=visible?"text":"password";button.textContent=visible?"Hide":"Show";button.setAttribute("aria-label",visible?"Hide password":"Show password");button.setAttribute("aria-pressed",String(visible));}));
$("#forgotBtn").addEventListener("click",()=>say("Password reset by email needs a connected backend. This demo stores accounts only in this browser; use account settings after signing in to change a known password."));
form.addEventListener("submit",submitAuth);
setMode("login");