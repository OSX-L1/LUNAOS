// js/app.js
import { db } from "./firebase-init.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const pricePreset = document.getElementById('pricePreset');
const customPrice = document.getElementById('customPrice');
const quoteCode = document.getElementById('quoteCode');
const discountPct = document.getElementById('discountPct');
const vatMode = document.getElementById('vatMode');
const note = document.getElementById('note');

const linesEl = document.getElementById('lines');
const sumSubtotal = document.getElementById('sumSubtotal');
const sumDiscount = document.getElementById('sumDiscount');
const sumVat = document.getElementById('sumVat');
const sumGrand = document.getElementById('sumGrand');
const printMeta = document.getElementById('printMeta');

const SETTINGS_REF = doc(db, 'site', 'settings');

let SETTINGS = {
  minWidth: 1, minHeight: 2, multiplier: 1.2, vatPct: 7,
  heightBrackets: [],
  pricePresets: [
    {label:'349 — ฉากทึบ', value:349},
    {label:'799 — ฉากญี่ปุ่น', value:799},
    {label:'899 — ฉากยูโร LA', value:899},
    {label:'999 — ฉากยูโร LB', value:999}
  ],
  openers: ['เปิดข้างเดียว','เปิดกลาง','เปิดข้างอิสระ','เปิดอิสระ 4ด้าน']
};

function fmt(n){ return (isFinite(n)?n:0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function getUnitPrice(){ const p=pricePreset.value; if(p==='custom'){ const v=parseFloat(customPrice.value); return isFinite(v)&&v>0?v:0; } return parseFloat(p); }
function normalizeHeight(h){ const x=parseFloat(h); if(!isFinite(x)||x<=0) return 0; if(x<SETTINGS.minHeight) return SETTINGS.minHeight; for(const b of SETTINGS.heightBrackets){ if(x>b.gtMin && x<=b.leMax) return b.useH; } return x; }
function effectiveWidth(w){ const x=parseFloat(w); if(!isFinite(x)||x<=0) return 0; return x<SETTINGS.minWidth?SETTINGS.minWidth:x; }

function lineTemplate(){
  const div=document.createElement('div'); div.className='rows row';
  div.innerHTML=`
    <input type="text" placeholder="SKU/รหัส" class="sku">
    <input type="number" step="0.01" min="0" placeholder="เช่น 1.50" class="w">
    <input type="number" step="0.01" min="0" placeholder="เช่น 2.46" class="h">
    <input type="number" step="1" min="1" value="1" class="q">
    <select class="opener"></select>
    <input type="text" placeholder="หมายเหตุ" class="memo">
    <div class="mono lineTotal" style="text-align:right">0.00</div>
    <button class="btn danger" type="button">ลบ</button>`;
  div.querySelector('button').onclick=()=>{ div.remove(); recalc(); };
  return div;
}
function bindRow(row){
  row.addEventListener('input', recalc);
  row.addEventListener('change', recalc);
  row.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); addLine(); linesEl.lastElementChild?.querySelector('input,select')?.focus(); } });
}
function computeLineTotal(w,h,q,unitPrice){
  const W=effectiveWidth(w), H=normalizeHeight(h); const Q=isFinite(q)&&q>0?q:0; if(!(W>0&&H>0&&Q>0&&unitPrice>0)) return 0; return W*H*SETTINGS.multiplier*unitPrice*Q;
}
function recalc(){
  const unitPrice=getUnitPrice(); let subtotal=0;
  [...linesEl.children].forEach(row=>{
    const w=parseFloat(row.querySelector('.w').value);
    const h=parseFloat(row.querySelector('.h').value);
    const q=parseFloat(row.querySelector('.q').value);
    const t=computeLineTotal(w,h,q,unitPrice);
    row.querySelector('.lineTotal').textContent=fmt(t);
    subtotal+=t;
  });
  const discPct=Math.min(Math.max(parseFloat(discountPct.value||0),0),100);
  const discount=subtotal*(discPct/100);
  const after=subtotal-discount;
  const vat=(vatMode.value==='exclude')? after*(SETTINGS.vatPct/100):0;
  const grand=after+vat;
  sumSubtotal.textContent=fmt(subtotal);
  sumDiscount.textContent='-'+fmt(discount);
  sumVat.textContent='+'+fmt(vat);
  sumGrand.textContent=fmt(grand);
  const now=new Date();
  printMeta.textContent=`เลขที่: ${quoteCode.value||'-'} • วันที่พิมพ์: ${now.toLocaleString('th-TH')} • ราคา/ตร.ม.: ${fmt(unitPrice)} บาท • ส่วนลด: ${fmt(discount)} • VAT: ${fmt(vat)} • รวมสุทธิ: ${fmt(grand)}`;
}
function addLine(){ if(linesEl.children.length>=10) return; const r=lineTemplate(); const sel=r.querySelector('.opener'); sel.innerHTML=SETTINGS.openers.map(o=>`<option>${o}</option>`).join(''); linesEl.appendChild(r); bindRow(r); recalc(); }
function clearAll(){ linesEl.innerHTML=''; addLine(); }
function fillPresets(){ pricePreset.innerHTML=SETTINGS.pricePresets.map(p=>`<option value="${p.value}">${p.label}</option>`).join('')+`<option value="custom">กำหนดเอง…</option>`; }

document.getElementById('addLine').onclick=addLine;
document.getElementById('clearAll').onclick=clearAll;
['pricePreset','customPrice','quoteCode','discountPct','vatMode','note'].forEach(id=>{ const el=document.getElementById(id); el.addEventListener('input', recalc); el.addEventListener('change', recalc); });
document.getElementById('exportBtn').onclick=()=>window.print();
document.getElementById('copyBtn').onclick=()=>{ const txt=sumGrand.textContent.replace(/[,]/g,''); navigator.clipboard?.writeText(txt); };

onSnapshot(SETTINGS_REF,(snap)=>{
  if(!snap.exists()){ fillPresets(); recalc(); return; }
  const s=snap.data();
  SETTINGS={ minWidth:s.minWidth??1, minHeight:s.minHeight??2, multiplier:s.multiplier??1.2, vatPct:s.vatPct??7, invoiceNote:s.invoiceNote||'', heightBrackets:s.heightBrackets||[], pricePresets:(s.pricePresets&&s.pricePresets.length?s.pricePresets:SETTINGS.pricePresets), openers:(s.openers&&s.openers.length?s.openers:SETTINGS.openers) };
  fillPresets();
  [...linesEl.children].forEach(r=>{ r.querySelector('.opener').innerHTML=SETTINGS.openers.map(o=>`<option>${o}</option>`).join(''); });
  recalc();
});

addLine(); addLine(); fillPresets(); recalc();
