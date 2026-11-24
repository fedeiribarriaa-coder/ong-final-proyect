# ONG Animales Ramallo · V8

Sitio estático (HTML + CSS + JS, sin build) con Supabase y Vercel.

## Qué hay
- `index.html` + `styles.css` + `js/site.js`: web pública (perros, cómo adoptar, novedades, tienda solidaria, donaciones).
- `admin.html` + `admin.css` + `js/admin.js`: panel del equipo (perros, solicitudes, pedidos, tienda, novedades, campañas).
- `js/config.js`: **todo lo configurable** (WhatsApp de pedidos, links de Mercado Pago, alias, perros de respaldo).
- `supabase/01-setup.sql`: políticas originales. `supabase/02-actualizacion-v8.sql`: **nuevo, hay que ejecutarlo**.

## Pasos para publicar
1. Supabase → SQL Editor → pegar y ejecutar `supabase/02-actualizacion-v8.sql`.
2. En `js/config.js`, completar `WHATSAPP` (ej. `5493407123456`). Sin eso, los pedidos se derivan al Instagram.
3. Probar local: en VS Code, clic derecho en `index.html` → *Open with Live Server* (extensión Live Server).
4. Entrar a `admin.html` → Perros → **Importar los 21 perros actuales** (una sola vez).
5. Subir a GitHub / Vercel como siempre.

## Cómo funciona la tienda
El comprador arma el pedido → completa nombre, WhatsApp y entrega → se guarda en la tabla `pedidos` con un código (ej. `ONG-7K2Q`) → se abre WhatsApp con el mensaje armado. En el panel, *Pedidos* muestra quién compró qué y se marca: confirmado → pagado → entregado.

## Formulario de adopción
Sigue llegando por mail con fotos (FormSubmit → celinita3535@gmail.com) y además se guarda un resumen en *Solicitudes* del panel.
