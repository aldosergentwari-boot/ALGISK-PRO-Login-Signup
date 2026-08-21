const $=s=>document.querySelector(s);
const card=$(".card"),form=$("#form"),user=$("#username"),id=$("#identifier"),pass=$("#password"),confirm=$("#confirm");
const btn=$("#submit"),zone=$("#runaway"),line=$("#tetherLine"),hint=$("#hint"),toast=$("#toast");
let mode="login",last=0;
const KEY="tether_users_v5";

function users(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function email(v){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())}
function uname(v){return/^[A-Za-z0-9._-]{3,24}$/.test(v.trim())}

function ok(){
 if(mode==="signup")
   return uname(user.value)&&!users().some(x=>x.username===user.value.trim().toLowerCase())&&
          email(id.value)&&pass.value.length>=8&&confirm.value===pass.value&&confirm.value;
 return id.value.trim().length>=3&&pass.value.length>=8;
}

function validate(){
 const u=mode==="signup"&&uname(user.value)&&!users().some(x=>x.username===user.value.trim().toLowerCase());
 const i=mode==="signup"?email(id.value):id.value.trim().length>=3;
 const p=pass.value.length>=8;
 const c=mode==="signup"&&confirm.value&&confirm.value===pass.value;

 user.closest(".field").classList.toggle("valid",u);
 id.closest(".field").classList.toggle("valid",i);
 pass.closest(".field").classList.toggle("valid",p);
 confirm.closest(".field").classList.toggle("valid",c);

 $("#usernameError").textContent=mode==="signup"&&user.value?
   (!uname(user.value)?"Use 3–24 letters, numbers, dots, _ or -.":!u?"Username already taken.":""):"";
 $("#idError").textContent=mode==="signup"&&id.value&&!i?"Enter a valid email address.":"";
 $("#passError").textContent=pass.value&&!p?"Password must be at least 8 characters.":"";
 $("#confirmError").textContent=mode==="signup"&&confirm.value&&!c?"Passwords do not match.":"";

 btn.classList.toggle("ready",ok());
 hint.innerHTML=ok()
   ?'<span></span> Everything looks good. You can continue.'
   :(mode==="login"
     ?'<span></span> Use your email or username + password.'
     :'<span></span> Complete the required fields to unlock the button.');
 strength();
 if(ok()) resetTether();
}

function strength(){
 const s=$("#strength"),v=pass.value;
 if(!v){s.classList.remove("show");return}
 s.classList.add("show");
 const n=(v.length>=8)+(/[A-Z]/.test(v))+(/[0-9]/.test(v))+(/[^A-Za-z0-9]/.test(v));
 [...s.querySelectorAll("i")].forEach((x,i)=>x.style.background=i<n?"#39ddd5":"#20322f");
 s.querySelector("em").textContent=n<2?"weak":n===2?"fair":n===3?"good":"strong";
}

/*
  IMPORTANT:
  The anchor is FIXED at the exact center of the runaway area.
  Only the button endpoint moves.
  The line is always drawn from that same fixed anchor to the button.
*/
function setTether(x,y){
 const z=zone.getBoundingClientRect();
 const ax=z.width/2, ay=z.height/2;
 line.setAttribute("x1",ax); line.setAttribute("y1",ay);
 line.setAttribute("x2",x); line.setAttribute("y2",y);
}

function setDestination(x,y,angle){
 const z=zone.getBoundingClientRect();
 const d=$("#destination");
 d.style.left=x+"px";
 d.style.top=y+"px";
 d.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;
}

function resetTether(){
 const z=zone.getBoundingClientRect();
 const cx=z.width/2,cy=z.height/2;
 btn.style.left="50%"; btn.style.top="50%";
 btn.style.transform="translate(-50%,-50%) rotate(0deg)";
 setTether(cx,cy);
 setDestination(cx,cy,0);
}

function moveButton(pointerX=null,pointerY=null,force=false){
 if(ok()&&!force)return;
 const now=performance.now();
 if(!force&&now-last<115)return;
 last=now;

 const z=zone.getBoundingClientRect();
 const b=btn.getBoundingClientRect();
 const pad=6;
 const minX=b.width/2+pad, maxX=z.width-b.width/2-pad;
 const minY=b.height/2+pad, maxY=z.height-b.height/2-pad;
 const currentX=parseFloat(btn.style.left)||z.width/2;
 const currentY=parseFloat(btn.style.top)||z.height/2;

 let best=null,bestScore=-Infinity;

 // Pick a genuinely different point from ALL available directions.
 for(let n=0;n<90;n++){
   const x=minX+Math.random()*Math.max(1,maxX-minX);
   const y=minY+Math.random()*Math.max(1,maxY-minY);

   let mouseDistance=9999;
   if(pointerX!==null&&pointerY!==null){
     mouseDistance=Math.hypot(x-(pointerX-z.left),y-(pointerY-z.top));
   }

   const travel=Math.hypot(x-currentX,y-currentY);
   const centerDistance=Math.hypot(x-z.width/2,y-z.height/2);
   const score=mouseDistance*3.5+travel*0.35+centerDistance*0.12+Math.random()*140;

   if(score>bestScore){bestScore=score;best={x,y};}
 }

 if(!best)return;

 // Sometimes make the button visibly tilt/lean while escaping.
 const angle=Math.max(-24,Math.min(24,(best.y-z.height/2)*0.75+(best.x-z.width/2)*0.12));

 btn.style.left=best.x+"px";
 btn.style.top=best.y+"px";
 btn.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;

 // The dashed target shows exactly where the button is trying to go.
 setDestination(best.x,best.y,angle);
 setTether(best.x,best.y);
}

document.addEventListener("pointermove",e=>{
 if(ok())return;
 const b=btn.getBoundingClientRect();
 const distance=Math.hypot(
   e.clientX-(b.left+b.width/2),
   e.clientY-(b.top+b.height/2)
 );
 if(distance<94) moveButton(e.clientX,e.clientY);
});

btn.addEventListener("mouseenter",e=>{
 if(!ok()) moveButton(e.clientX,e.clientY,true);
});

btn.addEventListener("pointerdown",e=>{
 if(!ok()){
   e.preventDefault();
   moveButton(e.clientX,e.clientY,true);
 }
});

form.addEventListener("submit",async e=>{
 e.preventDefault();
 validate();
 if(!ok()){moveButton(null,null,true);return}

 btn.disabled=true;
 btn.classList.add("loading");
 await new Promise(r=>setTimeout(r,650));

 const list=users();

 if(mode==="signup"){
   const nu={
     username:user.value.trim().toLowerCase(),
     email:id.value.trim().toLowerCase(),
     password:pass.value
   };

   if(list.some(x=>x.username===nu.username)||list.some(x=>x.email===nu.email)){
     show("Username or email already registered.");
     btn.disabled=false;btn.classList.remove("loading");return;
   }

   list.push(nu);
   localStorage.setItem(KEY,JSON.stringify(list));
   localStorage.setItem("tether_session",nu.username);
   show("Account created. Welcome, @"+nu.username);
   setTimeout(()=>switchMode(),900);
 }else{
   const k=id.value.trim().toLowerCase();
   const found=list.find(x=>(x.username===k||x.email===k)&&x.password===pass.value);

   if(found){
     localStorage.setItem("tether_session",found.username);
     show("Welcome back, @"+found.username);
   }else{
     $("#passError").textContent="Username/email or password is incorrect.";
     show("Login failed — check your credentials.");
   }
 }

 btn.disabled=false;
 btn.classList.remove("loading");
});

function switchMode(){
 mode=mode==="login"?"signup":"login";
 card.classList.toggle("signup",mode==="signup");

 $("#title").textContent=mode==="login"?"Sign in":"Create account";
 $("#subtitle").textContent=mode==="login"
   ?"Welcome back. Use your email or username to continue."
   :"Create your TETHER account with a username and email.";

 $("#idLabel").textContent=mode==="login"?"Email or username":"Email";
 id.placeholder=mode==="login"?"you@studio.com or username":"you@studio.com";
 $("#idIcon").textContent=mode==="login"?"@":"✉";

 $("#btnText").textContent=mode==="login"?"Log in":"Sign up";
 $("#destinationText").textContent=mode==="login"?"Log in":"Sign up";
 $("#switchText").textContent=mode==="login"?"No account yet?":"Already have an account?";
 $("#switch").textContent=mode==="login"?"Create one":"Sign in";

 $("#forgot").style.visibility=mode==="login"?"visible":"hidden";

 form.reset();
 document.querySelectorAll(".field").forEach(x=>x.classList.remove("valid"));
 document.querySelectorAll("small").forEach(x=>x.textContent="");

 resetTether();
 validate();
}

$("#switch").onclick=switchMode;

$("#eye").onclick=()=>{
 pass.type=pass.type==="password"?"text":"password";
 $("#eye").textContent=pass.type==="password"?"◉":"◌";
};

$("#forgot").onclick=()=>show("Password reset can be connected to your backend.");

[user,id,pass,confirm].forEach(x=>x.addEventListener("input",validate));

window.addEventListener("resize",()=>{
 if(!ok())resetTether();
});

function show(m){
 toast.textContent=m;
 toast.classList.add("show");
 clearTimeout(window.tt);
 window.tt=setTimeout(()=>toast.classList.remove("show"),2500);
}

// Start directly in Login mode.
mode="signup";
switchMode();
