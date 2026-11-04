import "./style.css";
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged,
  signOut, updateProfile
} from "firebase/auth";
import {
  collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Timestamp, updateDoc
} from "firebase/firestore";

const root = document.querySelector("#view");
const langBtn = document.querySelector("#langBtn");
let user = null, activeChat = null, stopMessages = null, stopChats = null, stopStories = null;
let lang = "ar";
const tr = (ar,en) => lang === "ar" ? ar : en;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => auth.currentUser?.uid;

langBtn.onclick = () => { lang = lang === "ar" ? "en" : "ar"; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; langBtn.textContent = lang === "ar" ? "English" : "العربية"; if(user) dashboard(); else authScreen(); };

function authScreen(){
  root.innerHTML = `<section class="auth card"><div class="hero"><div class="logo big">A</div><h1>Ahmed alkholy</h1><p>${tr("دردشة بسيطة وآمنة مع أصدقائك","Simple private chat with friends")}</p></div>
  <div class="tabs"><button id="loginTab" class="active">${tr("تسجيل الدخول","Sign in")}</button><button id="signupTab">${tr("حساب جديد","Create account")}</button></div>
  <form id="authForm"><label>${tr("الاسم (للحساب الجديد)","Name (for new account)")}</label><input id="name" placeholder="${tr("اسمك","Your name")}" />
  <label>${tr("البريد الإلكتروني","Email")}</label><input id="email" type="email" required placeholder="name@example.com"/>
  <label>${tr("كلمة المرور","Password")}</label><input id="password" type="password" minlength="6" required placeholder="••••••••"/>
  <button class="primary" type="submit" id="submitBtn">${tr("دخول","Sign in")}</button><p id="notice" class="notice"></p></form>
  <p class="muted">${tr("تحتاج إلى تفعيل Email/Password من Firebase Authentication.","Enable Email/Password in Firebase Authentication.")}</p></section>`;
  let mode="login";
  const loginTab=document.querySelector("#loginTab"), signupTab=document.querySelector("#signupTab");
  function setMode(m){mode=m;loginTab.classList.toggle("active",m==="login");signupTab.classList.toggle("active",m==="signup");document.querySelector("#name").style.display=m==="signup"?"block":"none";document.querySelector("#submitBtn").textContent=m==="signup"?tr("إنشاء الحساب","Create account"):tr("دخول","Sign in");}
  setMode("login"); loginTab.onclick=()=>setMode("login"); signupTab.onclick=()=>setMode("signup");
  document.querySelector("#authForm").onsubmit=async e=>{e.preventDefault(); const notice=document.querySelector("#notice"); const email=document.querySelector("#email").value.trim(); const password=document.querySelector("#password").value; const name=document.querySelector("#name").value.trim(); const btn=document.querySelector("#submitBtn"); btn.disabled=true; notice.textContent=tr("جارٍ التنفيذ...","Working...");
    try{
      if(mode==="signup"){
        if(!name) throw new Error(tr("اكتب اسمك أولاً","Enter your name"));
        const cred=await createUserWithEmailAndPassword(auth,email,password); await updateProfile(cred.user,{displayName:name});
        await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,name,email,about:"",createdAt:serverTimestamp()});
      } else { await signInWithEmailAndPassword(auth,email,password); }
    }catch(err){notice.textContent=friendly(err);}finally{btn.disabled=false;}
  };
}
function friendly(err){const code=err?.code||""; const map={"auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة","auth/email-already-in-use":"البريد مستخدم بالفعل","auth/weak-password":"كلمة المرور يجب أن تكون 6 أحرف على الأقل","auth/operation-not-allowed":"فعّل Email/Password من Firebase Authentication","auth/network-request-failed":"تحقق من اتصال الإنترنت","permission-denied":"راجع قواعد Firestore في Firebase"}; return map[code]||err.message||"حدث خطأ";}
function dashboard(){
  root.innerHTML=`<section class="welcome"><div><h2>${tr("أهلاً","Welcome")}، ${esc(user.displayName||user.email)}</h2><p>${tr("معرّفك لإضافتك كصديق:","Your friend ID:")} <b class="uid">${esc(uid())}</b></p></div><button id="logout" class="ghost">${tr("خروج","Sign out")}</button></section>
  <div class="grid"><section class="card"><h3>${tr("إضافة صديق","Add a friend")}</h3><p class="muted">${tr("أدخل UID الخاص بصديقك","Enter your friend's UID")}</p><form id="friendForm" class="inline"><input id="friendUid" required placeholder="UID"/><button class="primary">${tr("إضافة","Add")}</button></form><p id="friendNotice" class="notice"></p></section>
  <section class="card"><h3>${tr("حالة نصية لمدة 24 ساعة","24-hour text story")}</h3><form id="storyForm"><input id="storyText" maxlength="240" required placeholder="${tr("ماذا تريد أن تشارك؟","What would you like to share?")}"/><button class="primary">${tr("نشر الحالة","Post story")}</button></form><div id="stories" class="stories"></div></section>
  <section class="card"><h3>${tr("ملفي الشخصي","My profile")}</h3><form id="profileForm"><input id="profileName" value="${esc(user.displayName||"")}" placeholder="${tr("الاسم","Name")}"/><input id="about" placeholder="${tr("نبذة عنك","About you")}"/><button class="secondary">${tr("حفظ","Save")}</button></form><p id="profileNotice" class="notice"></p></section></div>
  <section class="card chats"><h3>${tr("المحادثات","Chats")}</h3><div class="chat-layout"><div id="chatList" class="chat-list">${tr("جارٍ تحميل المحادثات...","Loading chats...")}</div><div id="chatPanel" class="chat-panel"><div class="empty">${tr("اختر محادثة لبدء الدردشة","Choose a chat to start messaging")}</div></div></div></section>`;
  document.querySelector("#logout").onclick=()=>signOut(auth);
  document.querySelector("#friendForm").onsubmit=addFriend;
  document.querySelector("#storyForm").onsubmit=postStory;
  document.querySelector("#profileForm").onsubmit=saveProfile;
  loadChats(); loadStories();
}
async function addFriend(e){e.preventDefault();const n=document.querySelector("#friendNotice");const friendUid=document.querySelector("#friendUid").value.trim();try{if(friendUid===uid())throw new Error("لا يمكنك إضافة نفسك");const snap=await getDoc(doc(db,"users",friendUid));if(!snap.exists())throw new Error("لم يتم العثور على مستخدم بهذا UID");const ids=[uid(),friendUid].sort();const chatId=ids.join("_");await setDoc(doc(db,"chats",chatId),{members:ids,updatedAt:serverTimestamp(),lastMessage:""},{merge:true});n.textContent="تم إنشاء المحادثة بنجاح";document.querySelector("#friendUid").value="";}catch(err){n.textContent=friendly(err);}}
async function postStory(e){e.preventDefault();const text=document.querySelector("#storyText").value.trim();try{await addDoc(collection(db,"stories"),{uid:uid(),name:user.displayName||user.email,text,createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+86400000)});document.querySelector("#storyText").value="";}catch(err){alert(friendly(err));}}
function loadStories(){if(stopStories)stopStories();const q=query(collection(db,"stories"),where("expiresAt",">",Timestamp.now()),orderBy("expiresAt","asc"));stopStories=onSnapshot(q,s=>{document.querySelector("#stories").innerHTML=s.docs.map(d=>`<div class="story"><b>${esc(d.data().name)}</b><p>${esc(d.data().text)}</p></div>`).join("")||`<span class="muted">${tr("لا توجد حالات بعد","No stories yet")}</span>`;},e=>console.error(e));}
async function saveProfile(e){e.preventDefault();const name=document.querySelector("#profileName").value.trim();const about=document.querySelector("#about").value.trim();try{await updateProfile(auth.currentUser,{displayName:name});await setDoc(doc(db,"users",uid()),{name,about,email:user.email,uid:uid()},{merge:true});user=auth.currentUser;document.querySelector("#profileNotice").textContent="تم الحفظ";}catch(err){document.querySelector("#profileNotice").textContent=friendly(err);}}
function loadChats(){if(stopChats)stopChats();const q=query(collection(db,"chats"),where("members","array-contains",uid()));stopChats=onSnapshot(q,async s=>{const list=document.querySelector("#chatList");if(!list)return;const chats=await Promise.all(s.docs.map(async d=>{const other=d.data().members.find(x=>x!==uid());let name=other;try{const u=await getDoc(doc(db,"users",other));if(u.exists())name=u.data().name||other;}catch{}return {id:d.id,name,other};}));list.innerHTML=chats.map(c=>`<button class="chat-item ${activeChat===c.id?"selected":""}" data-id="${esc(c.id)}"><b>${esc(c.name)}</b><small>${esc(c.other)}</small></button>`).join("")||`<p class="muted">${tr("أضف صديقاً باستخدام UID لبدء محادثة","Add a friend by UID to start chatting")}</p>`;list.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>openChat(chats.find(c=>c.id===b.dataset.id)));});}
function openChat(chat){activeChat=chat.id;document.querySelectorAll(".chat-item").forEach(b=>b.classList.toggle("selected",b.dataset.id===chat.id));const panel=document.querySelector("#chatPanel");panel.innerHTML=`<div class="chat-head"><b>${esc(chat.name)}</b><small>${esc(chat.other)}</small></div><div id="messages" class="messages"></div><form id="sendForm" class="send"><input id="messageText" maxlength="4000" required placeholder="${tr("اكتب رسالة...","Write a message...")}"/><button class="primary">${tr("إرسال","Send")}</button></form>`;if(stopMessages)stopMessages();const q=query(collection(db,"chats",chat.id,"messages"),orderBy("createdAt","asc"));stopMessages=onSnapshot(q,s=>{const box=document.querySelector("#messages");if(!box)return;box.innerHTML=s.docs.map(d=>{const m=d.data();return `<div class="bubble ${m.sender===uid()?"mine":""}"><p>${esc(m.text)}</p><small>${esc(m.senderName||"")}</small></div>`;}).join("");box.scrollTop=box.scrollHeight;});document.querySelector("#sendForm").onsubmit=async e=>{e.preventDefault();const input=document.querySelector("#messageText");const text=input.value.trim();if(!text)return;input.value="";try{await addDoc(collection(db,"chats",chat.id,"messages"),{text,sender:uid(),senderName:user.displayName||user.email,createdAt:serverTimestamp()});await updateDoc(doc(db,"chats",chat.id),{lastMessage:text,updatedAt:serverTimestamp()});}catch(err){alert(friendly(err));}};}
onAuthStateChanged(auth,async u=>{user=u;if(u){try{const ref=doc(db,"users",u.uid);const snap=await getDoc(ref);if(!snap.exists())await setDoc(ref,{uid:u.uid,name:u.displayName||"",email:u.email,about:"",createdAt:serverTimestamp()},{merge:true});dashboard();}catch(e){root.innerHTML=`<section class="card"><h3>Firebase</h3><p class="notice">${esc(friendly(e))}</p></section>`;}}else{if(stopMessages)stopMessages();if(stopChats)stopChats();if(stopStories)stopStories();authScreen();}});
