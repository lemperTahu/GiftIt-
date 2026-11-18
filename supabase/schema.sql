-- Jalankan seluruh file ini di Supabase > SQL Editor
create table settings (
  id int primary key default 1 check (id = 1),
  brand_name text default 'Gift It!',
  tagline text default 'Little Gifts, Bigger Impact.',
  wa_number text default '6281328924602',
  contact text default '',
  donation_per_package int default 1000 check (donation_per_package >= 0)
);
insert into settings (id) values (1);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  category text default 'Lainnya',
  description text default '',
  contents text[] default '{}',
  price int not null check (price >= 0),
  photo_url text,
  visible boolean default true,
  created_at timestamptz default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text,
  qty int not null check (qty > 0),
  sale_date date not null default current_date,
  donation int not null check (donation >= 0), -- qty x nominal donasi saat transaksi dicatat
  created_at timestamptz default now()
);

create table disbursements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  activity_date date not null,
  location text, recipient text,
  amount int not null check (amount >= 0),
  description text,
  photos text[] default '{}',
  published boolean default true,
  created_at timestamptz default now()
);

create table admins (user_id uuid primary key references auth.users(id) on delete cascade);

create function is_admin() returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from admins where user_id = auth.uid()) $$;

-- Statistik publik tanpa membuka tabel penjualan mentah
create function public_stats() returns json language sql security definer stable set search_path = public
as $$ select json_build_object(
  'sold', coalesce((select sum(qty) from sales), 0),
  'donation', coalesce((select sum(donation) from sales), 0),
  'disbursed', coalesce((select sum(amount) from disbursements where published), 0),
  'packages', (select count(*) from products where visible)) $$;
grant execute on function public_stats() to anon, authenticated;

alter table settings enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table disbursements enable row level security;
alter table admins enable row level security; -- tanpa policy = tidak bisa diakses via API

create policy "publik baca settings" on settings for select using (true);
create policy "admin settings" on settings for all using (is_admin()) with check (is_admin());
create policy "publik baca produk" on products for select using (visible);
create policy "admin produk" on products for all using (is_admin()) with check (is_admin());
create policy "admin penjualan" on sales for all using (is_admin()) with check (is_admin());
create policy "publik baca dokumentasi" on disbursements for select using (published);
create policy "admin dokumentasi" on disbursements for all using (is_admin()) with check (is_admin());

-- Storage foto (publik baca, hanya admin tulis; maks 2 MB; JPG/PNG/WEBP)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "admin kelola foto" on storage.objects for all
  using (bucket_id = 'photos' and is_admin()) with check (bucket_id = 'photos' and is_admin());

-- DATA CONTOH (bisa diubah/dihapus admin)
insert into products (name, category, description, contents, price) values
('Contoh Paket Jajanan', 'Jajanan', 'Contoh data, ganti lewat dashboard admin.', array['Camilan','Permen','Stiker'], 10000),
('Contoh Paket Gantungan Kunci', 'Gantungan kunci', 'Contoh data, ganti lewat dashboard admin.', array['Gantungan kunci','Stiker'], 15000),
('Contoh Paket Alat Tulis', 'Alat tulis', 'Contoh data, ganti lewat dashboard admin.', array['Pulpen','Buku kecil','Stiker'], 20000);
