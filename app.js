const $=s=>document.querySelector(s),STORE="algisk_pro_accounts_v2",SESSION="algisk_pro_session";
function users(){try{return JSON.parse(localStorage.getItem(STORE)||"[]")}catch{return[]}}
function save(list){localStorage.setItem(STORE,JSON.stringify(list))}
function activeAccount(){const username=localStorage.getItem(SESSION);return users().find(x=>x.username===username)}
function protect(){const account=activeAccount();if(!account){location.replace("index.html");return null}return account}
const account=protect();
if(account){
 const initials=(account.name||account.username).trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
 $("#sideAvatar").textContent=initials;$("#sideName").textContent=account.name||account.username;$("#sideEmail").textContent=account.email;
 $("#welcomeName").textContent=(account.name||account.username).split(" ")[0];$("#profileName").value=account.name||"";$("#profileUsername").value=account.username;$("#profileEmail").value=account.email;
 $("#joinedDate").textContent=account.createdAt?new Date(account.createdAt).toLocaleDateString():"Earlier";
 $("#dateLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
}
function go(section){["overview","profile","security"].forEach(key=>{$("#"+key+"Section").classList.toggle("hidden",key!==section);document.querySelectorAll("[data-section]").forEach(a=>a.classList.toggle("active",a.dataset.section===section))});$("#pageTitle").textContent=section==="overview"?"Overview":section==="profile"?"My profile":"Security";location.hash=section}
document.querySelectorAll("[data-section]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();go(a.dataset.section)}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("#viewProfile").addEventListener("click",()=>go("profile"));
function logout(){localStorage.removeItem(SESSION);location.replace("index.html")}
["logoutBtn","topLogout","quickLogout"].forEach(id=>$("#"+id).addEventListener("click",logout));
$("#profileForm").addEventListener("submit",e=>{e.preventDefault();const list=users(),u=list.find(x=>x.username===account.username);u.name=$("#profileName").value.trim();save(list);$("#sideName").textContent=u.name;$("#welcomeName").textContent=u.name.split(" ")[0];$("#sideAvatar").textContent=u.name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();$("#profileMessage").textContent="Your profile has been updated.";$("#profileMessage").classList.add("success")});
async function derive(password,salt){const enc=new TextEncoder(),key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]),bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:180000,hash:"SHA-256"},key,256);return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function randomSalt(){return [...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("")}
document.querySelectorAll("[data-toggle-password]").forEach(button=>button.addEventListener("click",()=>{const field=document.getElementById(button.dataset.togglePassword);if(!field)return;const visible=field.type==="password";field.type=visible?"text":"password";button.textContent=visible?"Hide":"Show";button.setAttribute("aria-label",visible?"Hide password":"Show password");button.setAttribute("aria-pressed",String(visible));}));
$("#passwordForm").addEventListener("submit",async e=>{e.preventDefault();const msg=$("#securityMessage"),old=$("#currentPassword").value,next=$("#newPassword").value,repeat=$("#repeatPassword").value;msg.classList.remove("success");msg.textContent="";if(next.length<8){msg.textContent="Use at least 8 characters.";return}if(next!==repeat){msg.textContent="The new passwords do not match.";return}const list=users(),u=list.find(x=>x.username===account.username);if(!u||!u.passwordHash||await derive(old,u.salt)!==u.passwordHash){msg.textContent="Current password is incorrect.";return}u.salt=randomSalt();u.passwordHash=await derive(next,u.salt);save(list);$("#passwordForm").reset();msg.textContent="Password updated successfully on this browser.";msg.classList.add("success")});
if(location.hash==="#profile")go("profile");else if(location.hash==="#security")go("security");