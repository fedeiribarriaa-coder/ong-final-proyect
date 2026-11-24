# Design · ONG Animales Ramallo (V11 "Cálido + terroso")

## Origen
Basado en `paleta de colores.jpeg` (Paleta 4 · Cálido + terroso, la de la tienda). Cada color tiene la función que la paleta le asigna. El verde azulado de V10 se retiró: no estaba en la paleta, y su rol de "confianza" lo toma el marrón ("Estabilidad, confianza, naturaleza").

## Paleta (tokens en `styles.css :root`)
| Familia | Base | Tonos | Función |
|---|---|---|---|
| Amarillo | #F2B233 | #F5C671 · #F9D597 · #F5E6D1 | Energía, alegría → donar, ayudar, resaltar |
| Terracota | #C65D3B (botón #B4502F, texto #A9472A) | #D8815C · #E5A88B · #F0D2BF | Calidez, conexión → adoptar, acción principal |
| Marrón | #5A3E2B (profundo #3A2719) | #896245 · #B38A67 · #E4CEBC | Estabilidad, confianza → proceso, panel, texto |

- Fondo #F9F3ED · Papel #FFFCF8 · Texto #2A1C12 · Secundario #6E5140 (6.5:1).
- Funcionales: éxito #3E7D4F, error #B23A2A, aviso #9A6A00.
- Texto blanco solo sobre #B4502F o más oscuro (≥ 5:1).

## Tipografía
- Fraunces (SOFT 50, opsz alto, peso 600): títulos editoriales. Itálica terracota para la palabra clave del hero.
- DM Sans: interfaz y texto. Base 17px web, 15px panel.
- Caveat: solo notas manuscritas del hero.

## Forma y profundidad
- Radios: 12 / 18 / 26 / 38 px. Fotos de perros en arco (puerta = hogar). Retrato del hero circular sobre el sol.
- Sombras con desplazamiento y tinte marrón; nunca halos de color.
- Transiciones entre secciones: cinta terracota, olas marrones, horizontes curvos.

## Web pública
Hero (título en movimiento + trazo amarillo + marcador + composición que sigue al mouse) → cinta → adopciones (destacado editorial grande + arcos con color) → proceso (marrón con línea que se dibuja) → tienda (terracota) → donar (amarillo) → Instagram (terracota claro) → footer (marrón profundo).

## Panel
- Escritorio: barra lateral marrón agrupada (Adopciones · Tienda solidaria · Comunicación), indicador amarillo en la sección activa, usuario abajo.
- Celular: barra superior con título + navegación inferior de 5 (Inicio, Perros, Solicitudes, Pedidos, Más) con contadores; "Más" abre una hoja.
- Resumen: "Para hacer hoy", 4 indicadores, tabla de últimas solicitudes, estado de perros (barra apilada), campañas, últimos pedidos.
- Solicitudes y pedidos: tabla en escritorio, tarjetas en celular; el detalle se abre en un panel lateral (hoja inferior en celular) con estado y WhatsApp.
- Perros: filtros + búsqueda + tarjetas con foto.

## V12 · Terminación
- Adopciones: buscador por nombre y filtros por sexo, tamaño y edad leídos de la ficha real ("5 años · mediana · hembra"); solo aparecen opciones que existen; aviso de cuántos perros no tienen datos cargados; estado vacío con "Ver todos".
- Ficha: zoom suave en la foto, etiqueta de estado y "Otros que esperan familia" (mismo tamaño primero).
- Panel: gráfico de solicitudes por semana (8 semanas, de `creado_en`), barras de perros y pedidos por estado. Un solo color por gráfico + etiquetas de texto (la paleta de marca no pasa la validación como categórica).
- Estados: skeletons con la forma de cada vista, actualizar con ícono girando, guardando (selector pulsando), borrando (fila que se va), notificaciones de éxito y error, aviso "Sin conexión" en web y panel.
- Login: composición propia (foto en arco, sol, forma terracota, frase y caras) con hoja hueso para el acceso; en celular, banda corta y formulario a la vista. Validación por campo, ver/ocultar contraseña, aviso de mayúsculas, carga y "¡Bienvenido!".

## V14 · Menú
- Encabezado amarillo (sol) con borde orgánico: logo de 64 px derecho (sin rotación), "ONG Animales Ramallo" en una línea, frase de la ONG, botón de cierre marrón que gira.
- Navegación en hueso: Adoptar como acción principal en terracota; Cómo funciona (marrón), Tienda solidaria (amarillo), Donar (terracota claro), Instagram (externo). Íconos SVG propios, descripción, flecha indicadora, estado "Estás acá" según la sección visible.
- Bloque editorial marrón: "Hay alguien esperando conocerte" con un perro real disponible (cambia en cada apertura) y "Ver su historia".
- Pie: Panel del equipo con candado, en segundo plano.
- Toque: filas que se hunden, ícono que gira, flecha que avanza. Cierre con botón, tocando afuera, deslizando a la derecha o con Escape; foco atrapado dentro y devuelto al botón del menú.
- El carrito salió del encabezado: "Ver tu pedido" aparece dentro de la Tienda cuando hay productos agregados.

## V15 · Menú final (basado en el menú original de ongramallo.com)
- Encabezado: logo, "ONG Animales Ramallo" en una línea y "Pequeñas acciones, grandes cambios ♡"; cierre blanco redondo.
- "¿Qué querés hacer?" + "Cada acción ayuda a cambiar una vida."
- Tarjetas de color con las ilustraciones propias (`assets/images/menu/` y `dog.png`): Adoptar (terracota claro), Cómo funciona (hueso cálido), Tienda solidaria (amarillo claro), Donar (amarillo), Instagram (papel).
- Separador con huella, "Panel administrativo" en marrón, cierre "Gracias por ser parte ♡ · Más huellas, más historias".
- Todo entra sin desplazar: las tarjetas se reparten la altura (54–84 px); en pantallas bajas se ocultan textos secundarios; con el celular acostado, dos columnas.
- Hero: "Rescate · Cuidado · Segundas oportunidades" arriba del título, separado del encabezado.

## Movimiento
Entrada palabra por palabra, iris del carrusel, aparición escalonada al hacer scroll, brillo en botones, contadores, barras que crecen, paneles que se deslizan. Todo respeta `prefers-reduced-motion`.

## Reglas
- No inventar testimonios, cifras ni productos.
- Números de pasos sin cero adelante.
- No tocar FormSubmit, Mercado Pago, WhatsApp ni Supabase.
- Respaldos: `_respaldo/v9-2026-11-24/`, `_respaldo/v10-2026-11-24/`, `_respaldo/v11-2026-11-24/`.
