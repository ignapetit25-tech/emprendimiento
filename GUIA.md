# Guía del catálogo (para mamá)

## Ver el catálogo en el celular o la compu
1. Abrí la dirección del catálogo que te pase Ignacio (termina en `github.io/...`).
2. Para buscar algo, escribí en el cuadro de búsqueda (ejemplo: `osito`).
3. Para ver solo un tipo, tocá los botones: Todos, Tazas, Vasos, Sets.
4. Si un producto tiene varias fotos, tocá las fotitos chicas para cambiar la grande.

## Cómo te piden por chat
1. El cliente toca **“Pedir por chat”** en el producto que le gusta.
2. Se abre el chat con el mensaje ya escrito (nombre y código del producto).
3. Solo tiene que apretar “enviar”. Después coordinás pago y entrega por chat.

## Cambiar un precio
1. Pedile a Ignacio que abra el archivo `data/productos.json`.
2. Buscá el producto por su `nombre`.
3. Donde dice `"precio": null`, escribí el número sin puntos ni comas raras. Ejemplo: `"precio": 5000`.
4. Guardar, y en unos minutos se ve en la página.

## Si un producto dice “Consultar precio”
Significa que todavía no tiene precio cargado. Se cambia como en el punto anterior.

## Agregar un producto nuevo (con ayuda de Ignacio)
1. Copiá la foto nueva a la carpeta `assets/img/`.
2. Agregá un bloque nuevo en `data/productos.json` copiando uno existente y cambiando `id`, `nombre`, `descripcion`, `precio` y `fotos`.
3. El `id` es el código corto sin espacios (ejemplo: `taza-rosa`).

## Cambiar el número de chat
1. Abrí `assets/js/config.js`.
2. Escribí el número en `numeroChat` con código país y sin `+` ni espacios. Ejemplo: `"5491100000000"`.
3. Guardar. A partir de ahí el botón “Pedir por chat” abre ese número.
