// Money format (Thai)
const formatMoney = (num) => (num||0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Render quote preview HTML (shared)
const renderQuoteTable = ({ title, subtitle, rows, grand }) => {
  const rowsHtml = rows.map(r=>`
    <tr>
      <td>${r.index}</td>
      <td>${r.code}</td>
      <td>${(r.w||0).toFixed(2)} x ${(r.h||r.hAdj||0).toFixed(2)}</td>
      <td class="text-center">${r.qty||1}</td>
      <td class="text-end">${formatMoney(r.price||0)}</td>
      <td class="text-end fw-semibold">${formatMoney(r.total||0)}</td>
    </tr>`).join('');

  return `
  <div class="p-3">
    <div class="mb-3">
      <h4 class="fw-bold mb-1">${title}</h4>
      <div class="text-secondary">${subtitle||''}</div>
    </div>
    <div class="border rounded">
      <table class="table m-0">
        <thead class="table-light">
          <tr>
            <th style="width:60px">ลำดับ</th>
            <th>รหัสสินค้า</th>
            <th>ขนาดที่คำนวณ (กว้าง x สูง)</th>
            <th class="text-center">จำนวนชุด</th>
            <th class="text-end">ราคา/ตร.ม.</th>
            <th class="text-end">ราคารวม</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="p-3 text-end fw-bold">ยอดรวมสุทธิ: THB ${formatMoney(grand||0)}</div>
    </div>
  </div>`;
};
