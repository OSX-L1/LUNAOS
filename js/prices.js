const DEFAULT_PRICES = {
  pvcPrices: [
    { label: '349 ฉากทึบ', value: 349 },
    { label: '799 ฉากญี่ปุ่น', value: 799 },
    { label: '899 ฉากยูโร LA', value: 899 },
    { label: '999 ฉากยูโร LB', value: 999 }
  ],
  woodBlindPrices: [
    { label: 'ไม้โฟมวู้ด 799', value: 799 },
    { label: 'ไม้บาสวู้ด 820', value: 820 }
  ]
};

function getAllPrices(){
  try {
    const raw = localStorage.getItem('pc_prices');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_PRICES));
    const obj = JSON.parse(raw);
    return {
      pvcPrices: Array.isArray(obj.pvcPrices) && obj.pvcPrices.length ? obj.pvcPrices : DEFAULT_PRICES.pvcPrices,
      woodBlindPrices: Array.isArray(obj.woodBlindPrices) && obj.woodBlindPrices.length ? obj.woodBlindPrices : DEFAULT_PRICES.woodBlindPrices
    };
  } catch(e){
    return JSON.parse(JSON.stringify(DEFAULT_PRICES));
  }
}

function saveAllPrices(obj){ localStorage.setItem('pc_prices', JSON.stringify(obj)); }
