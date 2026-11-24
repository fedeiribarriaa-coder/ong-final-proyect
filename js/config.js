/* =====================================================================
   CONFIGURACIÓN GENERAL · ONG Animales Ramallo
   Todo lo que se puede cambiar sin tocar el resto del código.
   ===================================================================== */
window.ONG = {
  SUPABASE_URL: 'https://ymfnjqueeijlbngbkzue.supabase.co',
  SUPABASE_KEY: 'sb_publishable_m0Flyr-F5ufagmxwlcGZKA_w16bhIfT', // clave pública (es segura en el front)

  // WhatsApp que recibe los pedidos de la tienda. Formato internacional SIN + ni espacios.
  // Ejemplo Ramallo: 549 3407 123456  →  '5493407123456'
  WHATSAPP: '',

  INSTAGRAM: 'onganimalesramallo',
  ALIAS: 'ongramallo',
  TITULAR: 'Celina Elizabeth Forlino',
  SITE_URL: 'https://ongramallo.com',
  FORM_EMAIL: 'celinita3535@gmail.com',

  MP: {
    mensual: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=2c938084806ff3b701806ffba6f40001',
    100000: 'https://www.mercadopago.com.ar/checkout/v1/payment/redirect/5d620248-b247-41b9-87af-e25c0c67e3a4/payment-option-form-v2/?p=185938ee32ba8056ca464ba62d3ff88d&preference-id=529159148-fb4f69e1-91c4-4134-9568-99d370de8f5f&router-request-id=324064f7-607d-4bbd-b2d8-86e9df65cf1c&source=link',
    50000: 'https://www.mercadopago.com.ar/checkout/v1/payment/redirect/39c7ad4a-2226-4afe-95a0-a588981fbc03/payment-option-form-v2/?p=185938ee32ba8056ca464ba62d3ff88d&preference-id=529159148-7c6a8d4d-d4c4-4630-9e39-abc182e634d5&router-request-id=482632a9-7909-4631-be87-bf89855a904e&source=link',
    10000: 'https://mpago.la/2ipb2a3',
    5000: 'https://mpago.la/2Y41ryF',
    2000: 'https://mpago.la/1F1Mvhu',
    1000: 'https://mpago.la/2jGANSg',
    500: 'https://www.mercadopago.com.ar/checkout/v1/payment/redirect/44ccbb95-fd5a-4ce9-9929-7038b445291a/payment-option-form-v2/?p=185938ee32ba8056ca464ba62d3ff88d&preference-id=529159148-51c3b5d2-0291-4e27-9436-02a0fc82a77b&router-request-id=0bd92ea1-6a13-495e-a009-90cdfb6906cf&source=link',
    otro: 'https://link.mercadopago.com.ar/donarotromonto'
  },

  /* Perros de respaldo: se muestran solo si la tabla "animales" está vacía
     o no se puede leer. Desde el panel se pueden importar con un botón. */
  PERROS_RESPALDO: [
    { nombre: 'Aaron', ficha: '6 años · grande · macho', foto_url: 'assets/images/aaron.jpg',
      historia: 'Aaron es macho, está castrado, tiene las vacunas al día, unos 6 años y es de tamaño grande.\n\nEs muy cariñoso con las personas y se lleva bien con perras hembras.\n\nLo encontramos en grave estado de abandono, con una bichera en la cabeza. Con los cuidados necesarios se recuperó por completo y hoy está excelente.' },
    { nombre: 'Anto', ficha: '3 años · grande · hembra', foto_url: 'assets/images/anto.jpg',
      historia: 'Anto tiene unos 3 años, está castrada, tiene las vacunas al día y es de tamaño grande.\n\nEs muy cariñosa, le encantan los mimos y se lleva bien con otros perros.\n\nLa encontramos en un baldío junto a sus bebés, que lamentablemente ya habían fallecido. Anto también estaba delicada y tuvo que luchar contra una fuerte infección. Salió adelante y hoy está lista para encontrar una familia.' },
    { nombre: 'Bad', ficha: '3 años · XXL · macho', foto_url: 'assets/images/bad.jpg',
      historia: 'Bad tiene unos 3 años, está castrado, tiene las vacunas al día y es de tamaño XXL.\n\nEs súper juguetón, extremadamente bueno y se lleva muy bien con otros perros.\n\nLo encontramos en pleno invierno, durmiendo entre las hojas y con una fuerte neumonía.' },
    { nombre: 'Carballito', ficha: '', foto_url: 'assets/images/carballito.jpg' },
    { nombre: 'Choky', ficha: '', foto_url: 'assets/images/choky.jpg' },
    { nombre: 'Coca', ficha: '5 años · mediana · hembra', foto_url: 'assets/images/coca.jpg', destacado: true,
      historia: 'Coca es hembra, está castrada, tiene las vacunas al día, unos 5 años y es de tamaño mediano.\n\nEs súper amorosa con las personas y se lleva bien tanto con hembras como con machos.\n\nLa encontramos junto a sus bebés en el cementerio. Todos ellos encontraron una familia, pero Coca todavía sigue esperando la suya. Ya pasaron 3 años desde su rescate.' },
    { nombre: 'Estrellita', ficha: '', foto_url: 'assets/images/estrellita.jpg' },
    { nombre: 'Gal', ficha: '', foto_url: 'assets/images/gal.jpg' },
    { nombre: 'Harper', ficha: '', foto_url: 'assets/images/harper.jpg' },
    { nombre: 'Lisa', ficha: '', foto_url: 'assets/images/lisa.jpg' },
    { nombre: 'Lobito', ficha: '', foto_url: 'assets/images/lobito.jpg' },
    { nombre: 'Maya', ficha: '', foto_url: 'assets/images/maya.jpg' },
    { nombre: 'Pancho', ficha: '', foto_url: 'assets/images/pancho.jpg' },
    { nombre: 'Pit', ficha: '', foto_url: 'assets/images/pit.jpg' },
    { nombre: 'Polo', ficha: '', foto_url: 'assets/images/polo.jpg' },
    { nombre: 'Rody', ficha: '', foto_url: 'assets/images/rody.jpg' },
    { nombre: 'Sandy', ficha: '', foto_url: 'assets/images/sandy.jpg' },
    { nombre: 'Scooby', ficha: '', foto_url: 'assets/images/scooby.jpg' },
    { nombre: 'Simpa', ficha: '', foto_url: 'assets/images/simpa.jpg' },
    { nombre: 'Thor', ficha: '', foto_url: 'assets/images/thor.jpg' },
    { nombre: 'Tuli', ficha: '', foto_url: 'assets/images/tuli.jpg' }
  ]
};
