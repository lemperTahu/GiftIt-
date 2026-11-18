import { sb, $, rp, esc, wa, fmtDate } from './config.js';
let S = { wa_number: '6281328924602', donation_per_package: 0 };
const all = (s, f) => document.querySelectorAll(s).forEach(f);
$('#yr').textContent = new Date().getFullYear();

const orderMsg = (p, q) => `Halo Gift It! 

  Saya ingin melakukan pemesanan paket merchandise dengan detail berikut:

  Nama Pemesan:
  Nama Paket: ${p.name}
  Harga Paket: ${rp(p.price)}
  Jumlah Pesanan: ${q}
  Total Harga: ${rp(p.price * q)}

  Catatan Tambahan:

Mohon informasi lebih lanjut mengenai pemesanan ini. Terima kasih!`;
function applySettings() {
  all('[data-brand]', e => e.textContent = S.brand_name || 'Gift It!');
  all('[data-tagline]', e => e.textContent = S.tagline || '');
  all('[data-contact]', e => e.textContent = S.contact || '');
  all('[data-wa]', e => { e.href = wa(S.wa_number, 'Halo Gift It! Saya ingin bertanya tentang paket merchandise.'); e.target = '_blank'; e.rel = 'noopener'; });
  $('#perPkg').textContent = $('#perPkg2').textContent = rp(S.donation_per_package);
}

function renderProducts(list) {
  const el = $('#products');
  if (!list.length) { el.innerHTML = '<div class="empty">Belum ada paket. Cek lagi nanti ya!</div>'; return; }
  el.innerHTML = list.map(p => `
    <article class="card">
      <div class="ph">${p.photo_url ? `<img src="${esc(p.photo_url)}" alt="${esc(p.name)}" loading="lazy">` : '🎁'}</div>
      <div class="b">
        <h3>${esc(p.name)}</h3>
        <p style="font-size:.92rem">${esc(p.description)}</p>
        <div>${(p.contents || []).map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
        <div class="price">${rp(p.price)}</div>
        <div class="buy"><input type="number" min="1" max="100000" value="1" aria-label="Jumlah" data-q>
        <button class="btn sm" data-id="${esc(p.id)}">Pesan via WhatsApp</button></div>
      </div>
    </article>`).join('');
  el.onclick = e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    const p = list.find(x => x.id === b.dataset.id);
    const q = Math.max(1, Math.min(100000, parseInt(b.parentElement.querySelector('[data-q]').value) || 1));
    window.open(wa(S.wa_number, orderMsg(p, q)), '_blank', 'noopener');
  };
}

function renderGallery(list) {
  const el = $('#gallery');
  if (!list.length) { el.innerHTML = '<div class="empty">Dokumentasi penyaluran akan tampil di sini.</div>'; return; }
  el.innerHTML = list.map(d => `
    <article class="card gal">
      ${(d.photos || []).length ? `<div class="ph">${d.photos.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(d.title)}" loading="lazy"></a>`).join('')}</div>` : ''}
      <div class="b">
        <h3>${esc(d.title)}</h3>
        <div class="meta">${fmtDate(d.activity_date)} · ${esc(d.location)} · untuk ${esc(d.recipient)}</div>
        <p style="font-size:.92rem">${esc(d.description)}</p>
        <div class="price">${rp(d.amount)}</div>
      </div>
    </article>`).join('');
}

$('#customForm').onsubmit = e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const t = `Halo Gift It! Saya ingin memesan paket custom.\n\n Nama Pemesan: ${f.nama.trim()}\nTema acara: ${f.tema.trim()}\nJumlah paket: ${f.jumlah}\nBudget: ${f.budget.trim()}\nIsi merchandise yang diinginkan: ${f.isi.trim()}\n\nMohon informasi lebih lanjut. Terima kasih!`;
  window.open(wa(S.wa_number, t), '_blank', 'noopener');
};

(async () => {
  const [s, st, pr, ds] = await Promise.all([
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.rpc('public_stats'),
    sb.from('products').select('*').eq('visible', true).order('created_at'),
    sb.from('disbursements').select('*').eq('published', true).order('activity_date', { ascending: false })
  ]);
  if (s.data) S = s.data;
  applySettings();
  if (st.data) {
    const v = { sold: st.data.sold, donation: rp(st.data.donation), disbursed: rp(st.data.disbursed), packages: st.data.packages };
    all('[data-s]', e => e.textContent = v[e.dataset.s]);
  }
  if (pr.error) $('#products').innerHTML = '<div class="empty">Katalog belum bisa dimuat. Coba muat ulang halaman.</div>';
  else renderProducts(pr.data);
  if (ds.error) $('#gallery').innerHTML = '<div class="empty">Dokumentasi belum bisa dimuat.</div>';
  else renderGallery(ds.data);
})();
