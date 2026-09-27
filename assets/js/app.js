// Catálogo estático: lee data/productos.json y dibuja las tarjetas.
// Rutas relativas para que funcione en GitHub Pages como sitio de proyecto.
(function () {
  const grilla = document.getElementById("grilla");
  const buscador = document.getElementById("buscador");
  const filtros = document.getElementById("filtros");
  const estado = document.getElementById("estado");
  let productos = [];
  let categoria = "todos";

  // ---- Lightbox (foto ampliada) ----
  const lb = document.getElementById("lightbox");
  const lbFoto = document.getElementById("lb-foto");
  const lbTexto = document.getElementById("lb-texto");
  const lbCerrar = lb.querySelector(".lb-cerrar");
  const lbAnt = lb.querySelector(".lb-anterior");
  const lbSig = lb.querySelector(".lb-siguiente");
  let lbFotos = [];
  let lbIndice = 0;
  let lbNombre = "";
  let lbOrigen = null; // elemento que abrió, para devolver el foco

  function lbMostrar() {
    lbFoto.src = lbFotos[lbIndice];
    lbFoto.alt = lbNombre + " (foto " + (lbIndice + 1) + " de " + lbFotos.length + ")";
    lbTexto.textContent = lbFotos.length > 1
      ? lbNombre + " — " + (lbIndice + 1) + " / " + lbFotos.length
      : lbNombre;
    const varias = lbFotos.length > 1;
    lbAnt.hidden = !varias;
    lbSig.hidden = !varias;
  }

  function lbAbrir(fotos, indice, nombre, origen) {
    lbFotos = fotos;
    lbIndice = indice;
    lbNombre = nombre;
    lbOrigen = origen || null;
    lbMostrar();
    lb.hidden = false;
    document.body.classList.add("sin-scroll");
    lbCerrar.focus();
  }

  function lbCerrarFn() {
    lb.hidden = true;
    document.body.classList.remove("sin-scroll");
    if (lbOrigen && document.contains(lbOrigen)) lbOrigen.focus();
  }

  lbCerrar.addEventListener("click", lbCerrarFn);
  lb.addEventListener("click", (e) => { if (e.target === lb) lbCerrarFn(); });
  lbAnt.addEventListener("click", () => {
    lbIndice = (lbIndice - 1 + lbFotos.length) % lbFotos.length;
    lbMostrar();
  });
  lbSig.addEventListener("click", () => {
    lbIndice = (lbIndice + 1) % lbFotos.length;
    lbMostrar();
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") lbCerrarFn();
    if (e.key === "ArrowLeft" && lbFotos.length > 1) lbAnt.click();
    if (e.key === "ArrowRight" && lbFotos.length > 1) lbSig.click();
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
        <img class="foto" src="${fotos[0] || ""}" alt="${p.nombre}" loading="lazy">
        <span class="lupa" aria-hidden="true">Ampliar</span>
      </button>
      <div class="miniaturas"></div>
      <p class="insignia">${ETIQUETAS[p.categoria] || p.categoria}</p>
      <h3 class="nombre">${p.nombre}</h3>
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
    fotoBoton.addEventListener("click", () => lbAbrir(fotos, indice, p.nombre, fotoBoton));

    const minis = el.querySelector(".miniaturas");
    if (fotos.length > 1) {
      fotos.forEach((f, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mini" + (i === 0 ? " mini-activa" : "");
        b.setAttribute("aria-label", "Ver foto " + (i + 1) + " de " + p.nombre);
        b.innerHTML = `<img src="${f}" alt="" loading="lazy">`;
        b.addEventListener("click", () => {
          indice = i;
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
    const q = (buscador.value || "").toLowerCase().trim();
    grilla.innerHTML = "";
    const lista = productos.filter((p) => {
      const okCat = categoria === "todos" || p.categoria === categoria;
      const okQ = !q || (p.nombre + " " + (p.descripcion || "")).toLowerCase().includes(q);
      return okCat && okQ;
    });
    if (!lista.length) {
      estado.textContent = "No hay productos que coincidan con la búsqueda.";
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
    .then((data) => { productos = data; actualizarContadores(); dibujar(); resaltarDesdeHash(); })
    .catch(() => { estado.textContent = "No se pudo cargar el catálogo. Revisá data/productos.json."; });
})();
