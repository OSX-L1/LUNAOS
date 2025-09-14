// public/js/admin.js
import { auth, db } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];
const num = (v,d=0)=>{const n=parseFloat(v);return Number.isFinite(n)?n:d;};
const SETTINGS_REF = doc(db,"site","settings");

function el(tag, attrs={}, html=""){
  const e=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>e[k]=v);
  if(html) e.innerHTML=html;
  return e;
}

function buildHeightRow({gtMin="",leMax="",useH=""}={}){
  return el("div",{className:"rows row hdr-4"},`
    <input class="gtMin" type="number" step="0.01" placeholder="> Min" value="${gtMin}">
    <input class="leMax" type="number" step="0.01" placeholder="≤ Max" value="${leMax}">
    <input class="useH" type="number" step="0.01" placeholder="ใช้สูง" value="${useH}">
    <button class="btn danger act-del" type="button">ลบ</button>
  `);
}
function buildPriceRow({label="",value=""}={}){
  return el("div",{className:"rows row hdr-3"},`
    <input class="label" placeholder="เช่น 349 — ฉากทึบ" value="${label}">
    <input class="value" type="number" step="0.01" placeholder="ราคา/ตร.ม." value="${value}">
    <button class="btn danger act-del" type="button">ลบ</button>
  `);
}
function buildOpenerRow(name=""){
  return el("div",{className:"rows row hdr-2"},`
    <input class="name" placeholder="เช่น เปิดข้างเดียว" value="${name}">
    <button class="btn danger act-del" type="button">ลบ</button>
  `);
}

function bindUI(){
  const loginBox=$("#loginBox");
  const adminBox=$("#adminBox");

  const btnLogin=$("#btnLogin");
  const btnSignOut=$("#btnSignOut");
  const loginUser=$("#loginUser");
  const loginPass=$("#loginPass");
  const loginMsg=$("#loginMsg");

  const minWidth=$("#minWidth");
  const minHeight=$("#minHeight");
  const multiplier=$("#multiplier");
  const vatPct=$("#vatPct");
  const invoiceNote=$("#invoiceNote");

  const heightRows=$("#heightRows");
  const priceRows=$("#priceRows");
  const openerRows=$("#openerRows");

  const addHeight=$("#addHeight");
  const addPrice=$("#addPrice");
  const addOpener=$("#addOpener");

  const btnSave=$("#btnSave");
  const saveMsg=$("#saveMsg");

  // ปุ่มเพิ่มแถว
  addHeight?.addEventListener("click", ()=> heightRows.appendChild(buildHeightRow()));
  addPrice?.addEventListener("click", ()=> priceRows.appendChild(buildPriceRow()));
  addOpener?.addEventListener("click", ()=> openerRows.appendChild(buildOpenerRow()));

  // ลบแถวแบบ delegated (ใช้ได้กับแถวที่เพิ่งเพิ่มใหม่)
  document.addEventListener("click",(e)=>{
    const b=e.target.closest(".act-del");
    if(!b) return;
    b.closest(".row")?.remove();
  });

  // เข้าสู่ระบบ
  btnLogin?.addEventListener("click", async ()=>{
    loginMsg.textContent="";
    const u=(loginUser.value||"").trim();
    const p=loginPass.value||"";
    if(u!=="admin"){ loginMsg.textContent="ผู้ใช้ไม่ถูกต้อง"; return; }
    try{ await signInWithEmailAndPassword(auth,"admin@local",p); }
    catch(err){ console.error(err); loginMsg.textContent="เข้าสู่ระบบไม่ได้"; }
  });
  btnSignOut?.addEventListener("click", ()=> signOut(auth));

  async function loadSettings(){
    const snap=await getDoc(SETTINGS_REF);
    // เคลียร์ก่อนกันซ้อน
    heightRows.querySelectorAll(".row").forEach(n=>n.remove());
    priceRows.querySelectorAll(".row").forEach(n=>n.remove());
    openerRows.querySelectorAll(".row").forEach(n=>n.remove());

    if(!snap.exists()){
      minWidth.value=1; minHeight.value=2; multiplier.value=1.2; vatPct.value=7; invoiceNote.value="";
      [
        {gtMin:2.02,leMax:2.20,useH:2.20},
        {gtMin:2.22,leMax:2.40,useH:2.40},
        {gtMin:2.42,leMax:2.60,useH:2.60},
        {gtMin:2.62,leMax:2.80,useH:2.80},
        {gtMin:2.82,leMax:3.00,useH:3.00},
        {gtMin:3.02,leMax:3.30,useH:3.30},
        {gtMin:3.32,leMax:3.50,useH:3.50},
      ].forEach(b=>heightRows.appendChild(buildHeightRow(b)));
      [
        {label:"349 — ฉากทึบ",value:349},
        {label:"799 — ฉากญี่ปุ่น",value:799},
        {label:"899 — ฉากยูโร LA",value:899},
        {label:"999 — ฉากยูโร LB",value:999},
      ].forEach(p=>priceRows.appendChild(buildPriceRow(p)));
      ["เปิดข้างเดียว","เปิดกลาง","เปิดข้างอิสระ","เปิดอิสระ 4ด้าน"]
        .forEach(n=>openerRows.appendChild(buildOpenerRow(n)));
      return;
    }
    const s=snap.data();
    minWidth.value=s.minWidth ?? 1;
    minHeight.value=s.minHeight ?? 2;
    multiplier.value=s.multiplier ?? 1.2;
    vatPct.value=s.vatPct ?? 7;
    invoiceNote.value=s.invoiceNote || "";
    (s.heightBrackets||[]).forEach(b=>heightRows.appendChild(buildHeightRow(b)));
    (s.pricePresets||[]).forEach(p=>priceRows.appendChild(buildPriceRow(p)));
    (s.openers||[]).forEach(n=>openerRows.appendChild(buildOpenerRow(n)));
  }

  async function saveSettings(){
    const heightBrackets = $$(".row",heightRows).map(r=>({
      gtMin:num($(".gtMin",r)?.value),
      leMax:num($(".leMax",r)?.value),
      useH:num($(".useH",r)?.value),
    })).filter(b=>b.useH>0);

    const pricePresets = $$(".row",priceRows).map(r=>({
      label: $(".label",r)?.value.trim()||"",
      value: num($(".value",r)?.value),
    })).filter(p=>p.label && p.value>0);

    const openers = $$(".row",openerRows)
      .map(r=>$(".name",r)?.value.trim()||"")
      .filter(Boolean);

    await setDoc(SETTINGS_REF,{
      minWidth:num(minWidth.value,1),
      minHeight:num(minHeight.value,2),
      multiplier:num(multiplier.value,1.2),
      vatPct:num(vatPct.value,7),
      invoiceNote: invoiceNote.value||"",
      heightBrackets, pricePresets, openers,
      updatedAt: Date.now(),
    },{merge:true});

    saveMsg.textContent="บันทึกแล้ว";
    setTimeout(()=>saveMsg.textContent="",1500);
  }

  $("#btnSave")?.addEventListener("click", saveSettings);

  onAuthStateChanged(auth, async (user)=>{
    const ok=!!user && user.email==="admin@local";
    $("#loginBox").style.display = ok? "none":"block";
    $("#adminBox").style.display = ok? "block":"none";
    if(ok) await loadSettings();
  });
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", bindUI);
}else{ bindUI(); }
