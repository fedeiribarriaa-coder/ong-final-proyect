# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Vecinos de Ramallo (y alrededores) que entran desde Instagram, mayormente en el celular, para conocer perros en adopción, postularse, donar o comprar merchandising solidario.
- El equipo de la ONG (pocas personas, no técnicas) que usa el panel privado para cargar perros, campañas, novedades, productos y gestionar solicitudes y pedidos.

## Product Purpose
Sitio de ONG Animales Ramallo: conseguir familias responsables para perros rescatados y sostener los rescates con donaciones y venta de merchandising. Éxito = solicitudes de adopción completas, donaciones y pedidos de merch identificables.

## Capabilities and Constraints
- Sitio estático (HTML/CSS/JS sin build) en Vercel, dominio ongramallo.com.
- Datos en Supabase (clave publicable en el front, RLS para permisos). Panel con login de Supabase Auth.
- Formulario de adopción vía FormSubmit (con fotos adjuntas) a celinita3535@gmail.com.
- Donaciones con links fijos de Mercado Pago y alias `ongramallo` (titular Celina Elizabeth Forlino).
- Merch: el pedido se registra en la base con un código y se cierra por WhatsApp con mensaje predeterminado (decidido por el usuario: necesita saber quién compra qué).
- Supuesto (sin confirmar): novedades = noticias propias + reposteos de Instagram embebidos con crédito.
- Supuesto (sin confirmar): los perros pasan a gestionarse desde el panel; si la base está vacía se muestran los 21 del código.

## Brand Commitments
- Mantener identidad actual (confirmado): logo, naranja #F7A921, terracota #CB5128, marrón #573623, crema; Fraunces + DM Sans; tono cálido, voseo rioplatense.

## Evidence on Hand
- Fotos reales de 21 perros en assets/images; historias reales solo de Aaron, Coca, Bad y Anto.
- No hay testimonios, cifras de rescates ni fotos de merch: no inventarlos.

## Product Principles
1. Celular primero: la mayoría llega desde Instagram.
2. Adoptar es un compromiso: el proceso se explica, no se simplifica de más.
3. El panel lo usa gente no técnica: lenguaje simple, pocos pasos, nada que se pueda romper.
4. Cada peso debe ser trazable (campañas, pedidos con código).
