-- =====================================================================
-- ONG Animales Ramallo · Actualización V8
-- Ejecutar UNA vez en Supabase → SQL Editor (se puede volver a correr
-- sin romper nada). Requiere haber corrido antes setup.sql.
-- Agrega: gestión de perros, novedades, tienda (merch), pedidos,
-- solicitudes guardadas en la base y almacenamiento de fotos.
-- =====================================================================

-- ---------- 1. PERROS: columnas para gestionarlos desde el panel ----------
alter table public.animales add column if not exists ficha     text;      -- "5 años · mediana · hembra"
alter table public.animales add column if not exists historia  text;
alter table public.animales add column if not exists foto_url  text;
alter table public.animales add column if not exists orden     int default 100;
alter table public.animales add column if not exists destacado boolean default false;

-- ---------- 2. SOLICITUDES: guardar un resumen además del mail ----------
alter table public.solicitudes_adopcion add column if not exists telefono       text;
alter table public.solicitudes_adopcion add column if not exists localidad      text;
alter table public.solicitudes_adopcion add column if not exists animal_interes text;
alter table public.solicitudes_adopcion add column if not exists respuestas     jsonb;

-- ---------- 3. NOVEDADES (noticias propias + reposteos de Instagram) ----------
create table if not exists public.novedades (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null default 'noticia' check (tipo in ('noticia','instagram')),
  titulo        text,
  texto         text,
  imagen_url    text,
  instagram_url text,
  credito       text,               -- "@usuario" de quien hizo el posteo original
  publicada     boolean not null default true,
  fijada        boolean not null default false,
  creado_en     timestamptz not null default now()
);

-- ---------- 4. TIENDA: productos de merchandising ----------
create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  precio      numeric not null default 0,
  imagen_url  text,
  talles      text,                 -- separados por coma: "S, M, L, XL" (vacío = sin talle)
  stock       int,                  -- vacío = sin control de stock
  activo      boolean not null default true,
  orden       int default 100,
  creado_en   timestamptz not null default now()
);

-- ---------- 5. PEDIDOS: cada compra queda registrada con un código ----------
create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,          -- ej. ONG-7K2Q
  nombre      text not null,
  telefono    text not null,
  entrega     text not null default 'retiro', -- retiro | envio
  direccion   text,
  nota        text,
  items       jsonb not null,                -- [{id,nombre,talle,cantidad,precio}]
  total       numeric not null default 0,
  estado      text not null default 'nuevo'
              check (estado in ('nuevo','confirmado','pagado','entregado','cancelado')),
  creado_en   timestamptz not null default now()
);

-- ---------- 6. Seguridad (RLS) ----------
alter table public.novedades enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos   enable row level security;

drop policy if exists "public_read_novedades" on public.novedades;
drop policy if exists "admin_all_novedades"   on public.novedades;
drop policy if exists "public_read_productos" on public.productos;
drop policy if exists "admin_all_productos"   on public.productos;
drop policy if exists "public_insert_pedidos" on public.pedidos;
drop policy if exists "admin_all_pedidos"     on public.pedidos;

create policy "public_read_novedades" on public.novedades for select using (publicada = true);
create policy "admin_all_novedades"   on public.novedades for all to authenticated using (true) with check (true);

create policy "public_read_productos" on public.productos for select using (activo = true);
create policy "admin_all_productos"   on public.productos for all to authenticated using (true) with check (true);

-- El público solo puede CREAR pedidos nuevos (no leerlos ni modificarlos).
create policy "public_insert_pedidos" on public.pedidos for insert to anon, authenticated
  with check (estado = 'nuevo' and jsonb_typeof(items) = 'array' and length(telefono) between 6 and 30);
create policy "admin_all_pedidos"     on public.pedidos for all to authenticated using (true) with check (true);

-- ---------- 7. Fotos: bucket público "media" ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media_public_read"  on storage.objects;
drop policy if exists "media_admin_write"  on storage.objects;
drop policy if exists "media_admin_update" on storage.objects;
drop policy if exists "media_admin_delete" on storage.objects;

create policy "media_public_read"  on storage.objects for select using (bucket_id = 'media');
create policy "media_admin_write"  on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media_admin_update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'media');
