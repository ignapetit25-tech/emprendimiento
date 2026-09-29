# Guía del catálogo (para mamá)

## Abrir el catálogo en tu celular
1. La dirección es: `https://ignapetit25-tech.github.io/emprendimiento/`. Ignacio te la puede mandar por chat: tocás el enlace y se abre.
2. O escaneá el código QR que aparece al final de la página con la cámara del celular.
3. Para guardarlo a mano: en el navegador del celular tocá los 3 puntitos → "Agregar a pantalla principal". Te queda un ícono como una app.
4. En el celular se ve de a un producto por fila, con letras y botones grandes. Todo funciona igual: buscar, filtrar, ampliar fotos y pedir por chat.

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

## Marcar un producto como Nuevo u Oferta
1. En `data/productos.json`, dentro del producto agregá la línea `"etiqueta": "nuevo",` o `"etiqueta": "oferta",`.
2. En el catálogo aparece un sello con esa palabra.
3. Para sacarlo, borrá esa línea.

## PIN de administradora (stock y finanzas)
1. Al pie del catálogo tocá **“Stock (admin)”** o **“Finanzas (admin)”**.
2. La primera vez en cada celular o compu, te pide **crear un PIN** de 4 a 8 números. Elegilo y anotalo en un papel seguro.
3. Las veces siguientes te pide ese PIN para entrar. Sin el PIN nadie ve tus números.
4. Para cambiarlo, entrá y buscá la sección **PIN de administradora** al final de la página.
5. Para salir, tocá **Cerrar sesión** arriba. Si cerrás la pestaña, se bloquea solo.
6. OJO: el PIN se guarda en ese aparato. Si usás otro celular, tenés que crear el PIN ahí también.

## Gestión de stock
1. Al pie del catálogo tocá **“Stock (admin)”** (o abrí `stock.html`) e ingresá tu PIN.
2. En **Existencias** ves cuántas unidades hay de cada producto.
3. Para anotar: en **Anotar movimiento** elegí el producto, el tipo (entrada si te llegaron, salida si vendiste) y la cantidad. Podés agregar una nota.
4. Si te equivocás, en **Historial** tocá **Borrar** en ese movimiento.
5. IMPORTANTE: los datos se guardan en ese navegador. Tocá **Descargar Excel** cada tanto y guardá el archivo (se abre con Excel e incluye nombres de producto, fechas legibles y totales por producto). Si cambiás de compu o navegador, usá **Cargar Excel** para recuperar todo.

## Finanzas
1. Al pie del catálogo tocá **“Finanzas (admin)”** (o abrí `finanzas.html`) e ingresá tu PIN.
2. En **Balance mensual** elegí el mes: ves ventas, gastos, costos y el balance (ventas menos gastos menos costos).
3. Para anotar: elegí el tipo (**venta** si entra plata, **gasto** como luz o alquiler, **costo** como mercadería), escribí el concepto, el monto y la fecha. El producto es opcional.
4. Si te equivocás, en **Movimientos del mes** tocá **Borrar** en ese movimiento.
5. IMPORTANTE: los datos se guardan en ese navegador. Tocá **Descargar Excel** cada tanto y guardá el archivo (se abre con Excel e incluye fechas legibles, montos con coma y totales de ventas, gastos, costos y balance). Si cambiás de compu o navegador, usá **Cargar Excel** para recuperar todo.
6. El stock se anota aparte: vender algo en finanzas NO descuenta el stock solo. Anotalo también en la página de stock.

## Cambiar el número de chat
IMPORTANTE: el número es un dato personal y NO debe subirse a GitHub. Por eso vive en un archivo separado que git ignora.
1. Abrí `assets/js/config.local.js` (solo existe en tu compu, nunca en GitHub).
2. Escribí el número con código país y sin `+` ni espacios. Ejemplo ficticio: `"5491100000000"`.
3. Guardar y recargar la página. A partir de ahí el botón “Pedir por chat” abre ese número.
4. El sitio publicado muestra “Chat en preparación” hasta que decidan qué número público usar.
