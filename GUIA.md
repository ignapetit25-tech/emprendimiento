# Guía del catálogo (para mamá)

## Ver el catálogo en el celular o la compu
1. Abrí la dirección del catálogo que te pase Ignacio (termina en `github.io/...`).
2. Para buscar algo, escribí en el cuadro de búsqueda (ejemplo: `osito`). No importan las tildes: `tazon` también encuentra "tazón". Podés buscar por código (ejemplo: `vaso-osito`).
3. Para ver solo un tipo, tocá los botones: Todos, Tazas, Vasos, Sets. Cada botón muestra cuántos hay.
4. Con "Ordenar" podés ver los productos de la A a la Z.
5. Si un producto tiene varias fotos, tocá las fotitos chicas para cambiar la grande. Tocá la foto grande para verla ampliada.
6. Cada producto muestra su código y un botón "Copiar enlace" para compartirlo por chat.

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

## Gestión de stock
1. Al pie del catálogo tocá **“Gestión de stock”** (o abrí `stock.html`).
2. En **Existencias** ves cuántas unidades hay de cada producto.
3. Para anotar: en **Anotar movimiento** elegí el producto, el tipo (entrada si te llegaron, salida si vendiste) y la cantidad. Podés agregar una nota.
4. Si te equivocás, en **Historial** tocá **Borrar** en ese movimiento.
5. IMPORTANTE: los datos se guardan en ese navegador. Tocá **Descargar Excel** cada tanto y guardá el archivo (se abre con Excel). Si cambiás de compu o navegador, usá **Cargar Excel** para recuperar todo.

## Cambiar el número de chat
IMPORTANTE: el número es un dato personal y NO debe subirse a GitHub. Por eso vive en un archivo separado que git ignora.
1. Abrí `assets/js/config.local.js` (solo existe en tu compu, nunca en GitHub).
2. Escribí el número con código país y sin `+` ni espacios. Ejemplo ficticio: `"5491100000000"`.
3. Guardar y recargar la página. A partir de ahí el botón “Pedir por chat” abre ese número.
4. El sitio publicado muestra “Chat en preparación” hasta que decidan qué número público usar.
