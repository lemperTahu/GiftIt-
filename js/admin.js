import { sb, $, rp, esc, fmtDate } from './config.js';
const OK = ['image/jpeg', 'image/png', 'image/webp'], MAX = 2 * 1024 * 1024;
let S = {}, P = [], SL = [], D = [], cur = 'overview', editP = null, editD = null;
const V = $('#view');
const toast = (m, err) => { const t = $('#toast'); t.textContent = m; t.className = 'toast show' + (err ? ' err' : ''); setTimeout(() => t.className = 'toast', 2800); };
const num = v => { const n = Number(v); if (!Number.isInteger(n) || n < 0) throw new Error('Angka tidak valid.'); return n; };
const tot = () => { const c = SL.reduce((a, x) => a + x.donation, 0), t = D.reduce((a, x) => a + x.amount, 0); return { sold: SL.reduce((a, x) => a + x.qty, 0), c, t, left: c - t }; };

async function up(file, dir) {
  if (!OK.includes(file.type)) throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  if (file.size > MAX) throw new Error('Ukuran foto maksimal 2 MB.');
  const path = `${dir}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
  const { error } = await sb.storage.from('photos').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
const rm = async urls => { const p = urls.filter(Boolean).map(u => u.split('/photos/')[1]).filter(Boolean); if (p.length) await sb.storage.from('photos').remove(p); };
const run = fn => async e => {
  e.preventDefault(); const b = e.target.querySelector('[type=submit]'); b.disabled = true;
  try { await fn(new FormData(e.target)); await loadAll(); tab(cur); } catch (x) { toast(x.message || 'Gagal menyimpan.', true); b.disabled = false; }
};
const ck = r => { if (r.error) throw r.error; };

async function loadAll() {
  const [s, p, sl, d] = await Promise.all([
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.from('products').select('*').order('created_at', { ascending: false }),
    sb.from('sales').select('*').order('sale_date', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('disbursements').select('*').order('activity_date', { ascending: false })]);
  S = s.data || {}; P = p.data || []; SL = sl.data || []; D = d.data || [];
}

const views = {
  overview() {
    const t = tot();
    const act = [...SL.slice(0, 5).map(x => [x.created_at, `Penjualan ${x.qty}× ${esc(x.product_name)}`]), ...D.slice(0, 5).map(x => [x.created_at, `Penyaluran: ${esc(x.title)} (${rp(x.amount)})`])]
      .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    V.innerHTML = `<h2>Overview</h2><div class="stats mt">${[['Total produk', P.length], ['Paket terjual', t.sold], ['Donasi terkumpul', rp(t.c)], ['Donasi disalurkan', rp(t.t)]].map(([a, b]) => `<div class="stat"><b>${b}</b>${a}</div>`).join('')}</div>
    <h3 class="mt">Aktivitas terbaru</h3><div class="panel tbl"><table>${act.map(r => `<tr><td>${fmtDate(r[0])}</td><td>${r[1]}</td></tr>`).join('') || '<tr><td>Belum ada aktivitas. Mulai dari menu Katalog.</td></tr>'}</table></div>`;
  },
  catalog() {
    const p = editP || {};
    V.innerHTML = `<h2>Katalog merchandise</h2>
    <form class="panel mt" id="f"><div class="row">
      <div><label>Nama paket</label><input name="name" required minlength="2" maxlength="100" value="${esc(p.name)}"></div>
      <div><label>Harga (Rp)</label><input name="price" type="number" min="0" step="1" required value="${p.price ?? ''}"></div>
      <div><label>Foto (JPG/PNG/WEBP, maks 2 MB)</label><input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></div></div>
      <label>Deskripsi</label><textarea name="description" rows="2" maxlength="500">${esc(p.description)}</textarea>
      <label>Isi paket (satu item per baris)</label><textarea name="contents" rows="3">${esc((p.contents || []).join('\n'))}</textarea>
      <label><input type="checkbox" name="visible" style="width:auto" ${p.visible !== false ? 'checked' : ''}> Tampilkan di katalog</label>
      <div class="acts mt"><button class="btn" type="submit">${editP ? 'Simpan perubahan' : 'Tambah produk'}</button>${editP ? '<button class="btn line" type="button" data-a="cancel">Batal</button>' : ''}</div></form>
    <div class="panel mt tbl"><table><tr><th></th><th>Nama</th><th>Harga</th><th>Status</th><th></th></tr>${P.map(x => `<tr><td>${x.photo_url ? `<img src="${esc(x.photo_url)}" alt="">` : '🎁'}</td><td>${esc(x.name)}</td><td>${rp(x.price)}</td><td>${x.visible ? 'Tampil' : 'Tersembunyi'}</td>
      <td><div class="acts"><button class="btn sm line" data-a="p-edit" data-id="${x.id}">Edit</button><button class="btn sm line" data-a="p-vis" data-id="${x.id}">${x.visible ? 'Sembunyikan' : 'Tampilkan'}</button><button class="btn sm danger" data-a="p-del" data-id="${x.id}">Hapus</button></div></td></tr>`).join('') || '<tr><td>Belum ada produk.</td></tr>'}</table></div>`;
    $('#f').onsubmit = run(async f => {
      const row = { name: f.get('name').trim(), price: num(f.get('price')), description: f.get('description').trim(), visible: f.get('visible') === 'on',
        contents: f.get('contents').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 30) };
      const ph = f.get('photo'), old = p.photo_url;
      if (ph && ph.size) row.photo_url = await up(ph, 'products');
      ck(editP ? await sb.from('products').update(row).eq('id', editP.id) : await sb.from('products').insert(row));
      if (row.photo_url && old) await rm([old]);
      editP = null; toast('Produk disimpan.');
    });
  },
  sales() {
    const today = new Date().toISOString().slice(0, 10), n = S.donation_per_package || 0;
V.innerHTML = `<h2>Penjualan</h2>
<form class="panel mt" id="f">
  <div class="row">
    <div>
      <label>Nama Pemesan</label>
      <input name="customer_name" type="text" placeholder="Masukkan nama pemesan" maxlength="100" required>
    </div>
    <div>
      <label>Produk</label>
      <select name="pid" required>
        ${P.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}
      </select>
    </div>
    <div>
      <label>Jumlah paket terjual</label>
      <input name="qty" id="qty" type="number" min="1" max="100000" required value="1">
    </div>
    <div>
      <label>Tanggal transaksi</label>
      <input name="date" type="date" required value="${today}">
    </div>
  </div>

  <p class="mt">Donasi otomatis: <b id="prev">${rp(n)}</b> (${rp(n)} per paket)</p>
  <button class="btn mt" type="submit">Catat penjualan</button>
</form>

<div class="panel mt tbl">
  <table>
    <tr>
      <th>Tanggal</th>
      <th>Nama Pemesan</th>
      <th>Produk</th>
      <th>Jumlah</th>
      <th>Donasi</th>
      <th></th>
    </tr>
    ${SL.map(x => `
      <tr>
        <td>${fmtDate(x.sale_date)}</td>
        <td>${esc(x.customer_name || '-')}</td>
        <td>${esc(x.product_name)}</td>
        <td>${x.qty}</td>
        <td>${rp(x.donation)}</td>
        <td><button class="btn sm danger" data-a="s-del" data-id="${x.id}">Hapus</button></td>
      </tr>
    `).join('') || '<tr><td colspan="6">Belum ada penjualan.</td></tr>'}
  </table>
</div>`;
    $('#qty').oninput = e => $('#prev').textContent = rp((parseInt(e.target.value) || 0) * n);
$('#f').onsubmit = run(async f => {
  const nama = f.get('customer_name').trim();
  if (!nama) throw new Error('Nama pemesan wajib diisi.');

  const p = P.find(x => x.id === f.get('pid'));
  if (!p) throw new Error('Pilih produk dulu.');

  const q = num(f.get('qty'));
  if (q < 1 || q > 100000) throw new Error('Jumlah tidak valid.');

  ck(await sb.from('sales').insert({
    customer_name: nama,
    product_id: p.id,
    product_name: p.name,
    qty: q,
    sale_date: f.get('date'),
    donation: q * n
  }));

  toast('Penjualan dicatat.');
});
  },
  donation() {
    const t = tot();
    V.innerHTML = `<h2>Donasi</h2><div class="stats mt">${[['Donasi terkumpul', rp(t.c)], ['Sudah disalurkan', rp(t.t)], ['Sisa dana', rp(t.left)]].map(([a, b]) => `<div class="stat"><b>${b}</b>${a}</div>`).join('')}</div>
    <form class="panel mt" id="f"><label>Nominal donasi per paket terjual (Rp)</label><input name="n" type="number" min="0" required value="${S.donation_per_package ?? 0}">
    <p class="sub mt">Berlaku untuk penjualan yang dicatat setelah ini. Penjualan lama tidak berubah.</p><button class="btn" type="submit">Simpan nominal</button></form>
    <p class="mt">Untuk mencatat penyaluran dana, buka menu <b>Dokumentasi</b>.</p>`;
    $('#f').onsubmit = run(async f => { ck(await sb.from('settings').update({ donation_per_package: num(f.get('n')) }).eq('id', 1)); toast('Nominal disimpan.'); });
  },
  docs() {
    const d = editD || {}, t = tot();
    V.innerHTML = `<h2>Dokumentasi penyaluran</h2><p class="sub">Sisa dana yang belum disalurkan: <b>${rp(t.left + (d.amount || 0))}</b></p>
    <form class="panel" id="f"><div class="row">
      <div><label>Judul kegiatan</label><input name="title" required maxlength="120" value="${esc(d.title)}"></div>
      <div><label>Tanggal kegiatan</label><input name="date" type="date" required value="${d.activity_date || ''}"></div>
      <div><label>Lokasi</label><input name="location" required maxlength="120" value="${esc(d.location)}"></div>
      <div><label>Penerima donasi</label><input name="recipient" required maxlength="120" value="${esc(d.recipient)}"></div>
      <div><label>Dana disalurkan (Rp)</label><input name="amount" type="number" min="0" required value="${d.amount ?? ''}"></div>
      <div><label>${editD ? 'Tambah foto' : 'Foto'} (bisa pilih banyak, maks 2 MB/foto)</label><input name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp"></div></div>
      <label>Deskripsi kegiatan</label><textarea name="description" rows="3" maxlength="800">${esc(d.description)}</textarea>
      ${editD && d.photos?.length ? `<div class="acts mt">${d.photos.map((u, i) => `<span><img src="${esc(u)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px"><br><button class="btn sm danger" type="button" data-a="d-ph" data-id="${i}">Hapus</button></span>`).join('')}</div>` : ''}
      <label><input type="checkbox" name="pub" style="width:auto" ${d.published !== false ? 'checked' : ''}> Publikasikan di halaman pengunjung</label>
      <div class="acts mt"><button class="btn" type="submit">${editD ? 'Simpan perubahan' : 'Tambah dokumentasi'}</button>${editD ? '<button class="btn line" type="button" data-a="cancel">Batal</button>' : ''}</div></form>
    <div class="panel mt tbl"><table><tr><th>Tanggal</th><th>Kegiatan</th><th>Dana</th><th>Foto</th><th></th></tr>${D.map(x => `<tr><td>${fmtDate(x.activity_date)}</td><td>${esc(x.title)}${x.published ? '' : ' (draf)'}</td><td>${rp(x.amount)}</td><td>${(x.photos || []).length}</td><td><div class="acts"><button class="btn sm line" data-a="d-edit" data-id="${x.id}">Edit</button><button class="btn sm danger" data-a="d-del" data-id="${x.id}">Hapus</button></div></td></tr>`).join('') || '<tr><td>Belum ada dokumentasi.</td></tr>'}</table></div>`;
    $('#f').onsubmit = run(async f => {
      const amount = num(f.get('amount')); if (amount > t.left + (d.amount || 0)) throw new Error('Dana disalurkan melebihi sisa donasi.');
      const files = f.getAll('photos').filter(x => x.size); if (files.length > 10) throw new Error('Maksimal 10 foto sekali unggah.');
      const urls = []; for (const x of files) urls.push(await up(x, 'donations'));
      const row = { title: f.get('title').trim(), activity_date: f.get('date'), location: f.get('location').trim(), recipient: f.get('recipient').trim(), amount, description: f.get('description').trim(), published: f.get('pub') === 'on', photos: [...(d.photos || []), ...urls] };
      ck(editD ? await sb.from('disbursements').update(row).eq('id', editD.id) : await sb.from('disbursements').insert(row));
      editD = null; toast('Dokumentasi disimpan.');
    });
  },
  settings() {
    V.innerHTML = `<h2>Pengaturan website</h2><form class="panel mt" id="f">
      <label>Nama brand</label><input name="brand" required maxlength="60" value="${esc(S.brand_name)}">
      <label>Tagline</label><input name="tag" required maxlength="120" value="${esc(S.tagline)}">
      <label>Nomor WhatsApp (contoh 081328924602)</label><input name="wa" required value="${esc(S.wa_number)}">
      <label>Informasi kontak</label><textarea name="contact" rows="2" maxlength="300">${esc(S.contact)}</textarea>
      <label>Donasi per paket (Rp)</label><input name="n" type="number" min="0" required value="${S.donation_per_package ?? 0}">
      <button class="btn mt" type="submit">Simpan pengaturan</button></form>`;
    $('#f').onsubmit = run(async f => {
      let w = f.get('wa').replace(/\D/g, ''); if (w.startsWith('0')) w = '62' + w.slice(1);
      if (!/^62\d{8,13}$/.test(w)) throw new Error('Nomor WhatsApp tidak valid.');
      ck(await sb.from('settings').update({ brand_name: f.get('brand').trim(), tagline: f.get('tag').trim(), wa_number: w, contact: f.get('contact').trim(), donation_per_package: num(f.get('n')) }).eq('id', 1));
      toast('Pengaturan disimpan.');
    });
  }
};

const A = {
  cancel: () => { editP = editD = null; tab(cur); },
  'p-edit': id => { editP = P.find(x => x.id === id); tab('catalog'); window.scrollTo(0, 0); },
  'p-vis': async id => { const p = P.find(x => x.id === id); ck(await sb.from('products').update({ visible: !p.visible }).eq('id', id)); },
  'p-del': async id => { if (!confirm('Hapus produk ini?')) return; await rm([P.find(x => x.id === id).photo_url]); ck(await sb.from('products').delete().eq('id', id)); },
  's-del': async id => { if (!confirm('Hapus catatan penjualan ini? Donasi terkumpul ikut berkurang.')) return; ck(await sb.from('sales').delete().eq('id', id)); },
  'd-edit': id => { editD = D.find(x => x.id === id); tab('docs'); window.scrollTo(0, 0); },
  'd-del': async id => { if (!confirm('Hapus dokumentasi ini beserta fotonya?')) return; await rm(D.find(x => x.id === id).photos || []); ck(await sb.from('disbursements').delete().eq('id', id)); },
  'd-ph': async i => { const u = editD.photos[i]; ck(await sb.from('disbursements').update({ photos: editD.photos.filter((_, k) => k != i) }).eq('id', editD.id)); await rm([u]); await loadAll(); editD = D.find(x => x.id === editD.id); }
};
V.onclick = async e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  try { await A[b.dataset.a](b.dataset.id); if (!['cancel', 'p-edit', 'd-edit'].includes(b.dataset.a)) { await loadAll(); tab(cur); } } catch (x) { toast(x.message || 'Gagal.', true); }
};

function tab(n) {
  cur = n; document.querySelectorAll('#nav [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === n));
  views[n]();
}
$('#nav').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { editP = editD = null; tab(b.dataset.t); } };
$('#logout').onclick = async () => { await sb.auth.signOut(); location.reload(); };
$('#loginForm').onsubmit = async e => {
  e.preventDefault(); const f = new FormData(e.target);
  const { error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
  if (error) return $('#lerr').textContent = error.message;
  init();
};
async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;
  const { data: ok } = await sb.rpc('is_admin');
  if (!ok) { await sb.auth.signOut(); $('#lerr').textContent = 'Akun ini bukan admin.'; return; }
  $('#login').hidden = true; $('#app').hidden = false;
  await loadAll(); tab('overview');
}
init();
