// Catálogo estático: lee data/productos.json y dibuja las tarjetas.
// Rutas relativas para que funcione en GitHub Pages como sitio de proyecto.
(function () {
  const grilla = document.getElementById("grilla");
  const buscador = document.getElementById("buscador");
  const filtros = document.getElementById("filtros");
  const estado = document.getElementById("estado");
  const orden = document.getElementById("orden");
  let productos = [];
  let categoria = "todos";

  // Búsqueda insensible a tildes: "tazon" encuentra "tazón".
  function normalizar(texto) {
    return (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // ---- Lightbox (foto ampliada) ----
  const lb = document.getElementById("lightbox");
  const lbFoto = document.getElementById("lb-foto");
  const lbTexto = document.getElementById("lb-texto");
  const lbPrecio = document.getElementById("lb-precio");
  const lbPedido = document.getElementById("lb-pedido");
  const lbCerrar = lb.querySelector(".lb-cerrar");
  const lbAnt = lb.querySelector(".lb-anterior");
  const lbSig = lb.querySelector(".lb-siguiente");
  let lbProducto = null;
  let lbIndice = 0;
  let lbOrigen = null; // elemento que abrió, para devolver el foco

  function lbMostrar() {
    const fotos = lbProducto.fotos;
    lbFoto.src = fotos[lbIndice];
    lbFoto.alt = lbProducto.nombre + " (foto " + (lbIndice + 1) + " de " + fotos.length + ")";
    lbTexto.textContent = fotos.length > 1
      ? lbProducto.nombre + " — " + (lbIndice + 1) + " / " + fotos.length
      : lbProducto.nombre;
    const varias = fotos.length > 1;
    lbAnt.hidden = !varias;
    lbSig.hidden = !varias;
    lbPrecio.textContent = formatoPrecio(lbProducto);
    // Botón de pedido dentro del modal (misma lógica que la tarjeta).
    lbPedido.innerHTML = "";
    const enlace = enlacePedido(lbProducto);
    if (enlace) {
      const a = document.createElement("a");
      a.className = "boton";
      a.href = enlace;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Pedir por chat";
      lbPedido.appendChild(a);
    } else {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "boton boton-apagado";
      b.textContent = "Pedir por chat";
      b.addEventListener("click", () => {
        alert("Falta configurar el número de chat en assets/js/config.js (campo numeroChat).");
      });
      lbPedido.appendChild(b);
    }
  }

  let lbToken = 0; // evita que un cierre viejo oculte una apertura nueva

  function lbAbrir(producto, indice, origen) {
    lbToken++;
    lbProducto = producto;
    lbIndice = indice;
    lbOrigen = origen || null;
    lbFoto.classList.remove("cambiando");
    lbMostrar();
    lb.hidden = false;
    void lb.offsetWidth; // fuerza el fundido de entrada
    lb.classList.add("visible");
    document.body.classList.add("sin-scroll");
    lbCerrar.focus();
  }

  function lbCerrarFn() {
    const turno = ++lbToken;
    lb.classList.remove("visible");
    document.body.classList.remove("sin-scroll");
    setTimeout(() => {
      if (turno !== lbToken) return;
      lb.hidden = true;
    }, 180);
    if (lbOrigen && document.contains(lbOrigen)) lbOrigen.focus();
  }

  lbCerrar.addEventListener("click", lbCerrarFn);
  lb.addEventListener("click", (e) => { if (e.target === lb) lbCerrarFn(); });
  function lbCambiarFoto(nuevoIndice) {
    lbFoto.classList.add("cambiando");
    lbFoto.onload = () => lbFoto.classList.remove("cambiando");
    lbFoto.onerror = () => lbFoto.classList.remove("cambiando");
    lbIndice = nuevoIndice;
    lbMostrar();
  }
  lbAnt.addEventListener("click", () => {
    lbCambiarFoto((lbIndice - 1 + lbProducto.fotos.length) % lbProducto.fotos.length);
  });
  lbSig.addEventListener("click", () => {
    lbCambiarFoto((lbIndice + 1) % lbProducto.fotos.length);
  });
  // Trampa de foco: Tab cicla dentro del modal abierto.
  lb.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focos = [lbCerrar, lbAnt, lbSig, lbPedido.querySelector("a, button")]
      .filter((el) => el && !el.hidden);
    if (!focos.length) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") lbCerrarFn();
    if (e.key === "ArrowLeft" && lbProducto.fotos.length > 1) lbAnt.click();
    if (e.key === "ArrowRight" && lbProducto.fotos.length > 1) lbSig.click();
  });

  // ---- Pedido por chat ----
  function enlacePedido(p) {
    const numero = (TIENDA.numeroChat || "").trim();
    const texto = encodeURIComponent(TIENDA.mensajePlantilla(p));
    if (!numero) return null;
    return `https://wa.me/${numero}?text=${texto}`;
  }

  function formatoPrecio(p) {
    if (p.precio === null || p.precio === undefined || p.precio === "") {
      return "Consultar precio";
    }
    return "$ " + Number(p.precio).toLocaleString("es-AR");
  }

  const ETIQUETAS = { tazas: "Taza", vasos: "Vaso", sets: "Set" };

  function tarjeta(p) {
    const el = document.createElement("article");
    el.className = "tarjeta";
    el.id = "prod-" + p.id;

    const fotos = p.fotos && p.fotos.length ? p.fotos : [];
    let indice = 0;
    const enlace = enlacePedido(p);

    el.innerHTML = `
      <button type="button" class="foto-boton" aria-label="Ampliar foto de ${p.nombre}">
        <img class="foto" src="${fotos[0] || ""}" alt="${p.nombre}" loading="lazy" decoding="async">
        <span class="lupa" aria-hidden="true">Ampliar</span>
      </button>
      <div class="miniaturas"></div>
      <p class="insignia">${ETIQUETAS[p.categoria] || p.categoria}</p>
      ${p.etiqueta === "nuevo" ? `<p class="sello sello-nuevo">Nuevo</p>` : ""}
      ${p.etiqueta === "oferta" ? `<p class="sello sello-oferta">Oferta</p>` : ""}
      <h3 class="nombre">${p.nombre}</h3>
      <p class="codigo">Código: ${p.id}</p>
      <p class="descripcion">${p.descripcion || ""}</p>
      ${p.variantes && p.variantes.length ? `<p class="variantes">Colores: ${p.variantes.join(" · ")}</p>` : ""}
      <p class="precio">${formatoPrecio(p)}</p>
      ${enlace
        ? `<a class="boton" href="${enlace}" target="_blank" rel="noopener">Pedir por chat</a>`
        : `<button class="boton boton-apagado" type="button" data-pedir="${p.id}">Pedir por chat</button>`}
      <button type="button" class="copiar" data-enlace="${p.id}">Copiar enlace</button>
    `;

    // La foto principal abre el lightbox; las miniaturas cambian la foto.
    const fotoBoton = el.querySelector(".foto-boton");
    const fotoImg = el.querySelector(".foto");
    fotoBoton.addEventListener("click", () => lbAbrir(p, indice, fotoBoton));

    const minis = el.querySelector(".miniaturas");
    if (fotos.length > 1) {
      fotos.forEach((f, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mini" + (i === 0 ? " mini-activa" : "");
        b.setAttribute("aria-label", "Ver foto " + (i + 1) + " de " + p.nombre);
        b.innerHTML = `<img src="${f}" alt="" loading="lazy" decoding="async">`;
        b.addEventListener("click", () => {
          if (indice === i) return;
          indice = i;
          fotoImg.classList.add("cambiando");
          fotoImg.onload = () => fotoImg.classList.remove("cambiando");
          fotoImg.onerror = () => fotoImg.classList.remove("cambiando");
          fotoImg.src = f;
          minis.querySelectorAll(".mini").forEach((m) => m.classList.remove("mini-activa"));
          b.classList.add("mini-activa");
        });
        minis.appendChild(b);
      });
    }

    const apagado = el.querySelector("[data-pedir]");
    if (apagado) {
      apagado.addEventListener("click", () => {
        alert("Falta configurar el número de chat en assets/js/config.js (campo numeroChat).");
      });
    }

    // Copiar enlace directo al producto (sirve para compartir por chat).
    el.querySelector("[data-enlace]").addEventListener("click", (e) => {
      const url = location.href.split("#")[0] + "#prod-" + p.id;
      const boton = e.currentTarget;
      const listo = () => {
        boton.textContent = "¡Enlace copiado!";
        setTimeout(() => { boton.textContent = "Copiar enlace"; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(listo, () => alert(url));
      } else {
        alert(url);
      }
    });

    return el;
  }

  // Contadores en los botones de filtro (Todos, Tazas, Vasos, Sets).
  function actualizarContadores() {
    filtros.querySelectorAll("button[data-cat]").forEach((b) => {
      const cat = b.dataset.cat;
      const n = cat === "todos" ? productos.length : productos.filter((p) => p.categoria === cat).length;
      const base = b.textContent.replace(/\s*\(\d+\)\s*$/, "");
      b.textContent = `${base} (${n})`;
    });
  }

  // Si la dirección trae #prod-<id>, resalta esa tarjeta y la muestra.
  // Al redibujar (buscar/filtrar) se conserva el resaltado sin mover la vista.
  function resaltarDesdeHash(moverVista) {
    grilla.querySelectorAll(".resaltado").forEach((t) => t.classList.remove("resaltado"));
    const id = (location.hash || "").replace("#", "");
    if (!id.startsWith("prod-")) return;
    const t = document.getElementById(id);
    if (!t) return;
    t.classList.add("resaltado");
    if (moverVista !== false) t.scrollIntoView({ block: "center" });
  }
  window.addEventListener("hashchange", () => resaltarDesdeHash(true));

  function dibujar() {
    const q = normalizar(buscador.value).trim();
    grilla.innerHTML = "";
    estado.innerHTML = "";
    const lista = productos.filter((p) => {
      const okCat = categoria === "todos" || p.categoria === categoria;
      const texto = normalizar(p.nombre + " " + (p.descripcion || "") + " " + p.id);
      return okCat && (!q || texto.includes(q));
    });
    if (orden.value === "az") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    if (orden.value === "za") lista.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    if (!lista.length) {
      estado.textContent = "No hay productos que coincidan con la búsqueda. ";
      const limpiar = document.createElement("button");
      limpiar.type = "button";
      limpiar.className = "limpiar";
      limpiar.textContent = "Limpiar búsqueda y filtros";
      limpiar.addEventListener("click", () => {
        buscador.value = "";
        categoria = "todos";
        orden.value = "original";
        filtros.querySelectorAll("button").forEach((x) => x.classList.toggle("activo", x.dataset.cat === "todos"));
        dibujar();
        buscador.focus();
      });
      estado.appendChild(limpiar);
      return;
    }
    estado.textContent = `${lista.length} producto(s)`;
    lista.forEach((p) => grilla.appendChild(tarjeta(p)));
    resaltarDesdeHash(false);
  }

  filtros.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cat]");
    if (!b) return;
    categoria = b.dataset.cat;
    filtros.querySelectorAll("button").forEach((x) => x.classList.remove("activo"));
    b.classList.add("activo");
    dibujar();
  });
  buscador.addEventListener("input", dibujar);
  orden.addEventListener("change", dibujar);

  // Sombra en la barra al hacer scroll.
  const barra = document.querySelector(".barra");
  const actualizarSombra = () => barra.classList.toggle("con-sombra", window.scrollY > 4);
  window.addEventListener("scroll", actualizarSombra, { passive: true });
  actualizarSombra();

  // Nombre de la tienda en marca, portada y título.
  document.getElementById("nombre-tienda").textContent = TIENDA.nombre;
  document.getElementById("marca-tienda").textContent = TIENDA.nombre;
  document.title = TIENDA.nombre + " — Catálogo";

  // Botón de contacto en el pie: abre el chat general si hay número.
  const contactoBoton = document.getElementById("contacto-boton");
  const numero = (TIENDA.numeroChat || "").trim();
  if (numero) {
    contactoBoton.href = `https://wa.me/${numero}?text=` + encodeURIComponent("Hola! Tengo una consulta sobre el catálogo.");
    contactoBoton.target = "_blank";
    contactoBoton.rel = "noopener";
  } else {
    contactoBoton.textContent = "Chat en preparación";
    contactoBoton.classList.add("boton-apagado");
    contactoBoton.removeAttribute("href");
  }

  fetch("data/productos.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => {
      productos = data;
      actualizarContadores();
      const cats = new Set(productos.map((p) => p.categoria)).size;
      document.getElementById("portada-stats").textContent =
        `${productos.length} productos · ${cats} categorías · Pedidos por chat`;
      dibujar();
      resaltarDesdeHash();
    })
    .catch(() => { estado.textContent = "No se pudo cargar el catálogo. Revisá data/productos.json."; });
})();
