# Gift It! — Little Gifts, Bigger Impact.

Website katalog merchandise dan transparansi donasi. Frontend menggunakan HTML, CSS, dan JavaScript; data, autentikasi admin, serta penyimpanan foto menggunakan Supabase.

## Struktur folder

```text
giftit/
├── index.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── public.js
│   └── admin.js
└── supabase/
    └── schema.sql
```

## 1. Menyiapkan Supabase

1. Buat project gratis di [Supabase](https://supabase.com/).
2. Buka **SQL Editor**, lalu jalankan seluruh isi `supabase/schema.sql`.
3. Buka **Authentication → Users → Add user** untuk membuat akun admin. Aktifkan *Auto Confirm User*.
4. Jadikan akun tersebut admin dengan menjalankan SQL berikut (ganti email):

   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'EMAIL-ADMIN';
   ```
5. Pada **Authentication → Sign In / Providers → Email**, matikan **Allow new users to sign up**.
6. Buka **Project Settings → API**, salin **Project URL** dan **anon public key** ke `js/config.js`.

   ```js
   export const SUPABASE_URL = 'https://PROJECT-ID.supabase.co';
   export const SUPABASE_ANON_KEY = 'ANON-PUBLIC-KEY';
   ```

   Jangan pernah menaruh `service_role` key di frontend.

## 2. Menjalankan website

Karena JavaScript menggunakan ES Modules, jalankan melalui web server (jangan membuka `index.html` langsung dengan `file://`). Untuk pengujian lokal, bisa memakai ekstensi Live Server di VS Code.

## 3. Deploy gratis

1. Buat repository GitHub dan unggah **isi folder `giftit/`** ke root repository.
2. Buka **Settings → Pages → Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu simpan.
3. Setelah deploy selesai, website dapat diakses melalui `https://USERNAME.github.io/NAMA-REPO/`.
4. Dashboard admin berada di `https://USERNAME.github.io/NAMA-REPO/admin.html`.

## 4. QR Code

Setelah website publik aktif, buat QR Code statis dari URL website. Uji dengan memindainya menggunakan ponsel sebelum dicetak. QR akan tetap berlaku selama URL website tidak berubah.

## Fitur

- Katalog produk publik dan pemesanan melalui WhatsApp.
- Permintaan paket custom melalui WhatsApp.
- Statistik penjualan dan transparansi donasi.
- Dokumentasi penyaluran donasi dengan beberapa foto.
- Dashboard admin untuk mengelola katalog, penjualan, donasi, dokumentasi, dan pengaturan.
- Nominal donasi disimpan per transaksi; perubahan nominal hanya berlaku untuk transaksi berikutnya.

## Catatan keamanan dan batasan

- RLS Supabase digunakan untuk membatasi data dan operasi admin.
- Bucket foto publik menerima JPG, PNG, dan WEBP maksimal 2 MB per foto.
- Data contoh produk di `supabase/schema.sql` dapat diedit atau dihapus melalui dashboard.
- Isi `js/config.js` harus diisi dengan kredensial project Supabase milikmu sebelum website dapat terhubung ke database.
