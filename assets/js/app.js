// Catálogo estático: lee data/productos.json y dibuja las tarjetas.
// Rutas relativas para que funcione en GitHub Pages como sitio de proyecto.
(function () {
  const grilla = document.getElementById("grilla");
  const buscador = document.getElementById("buscador");
  const filtros = document.getElementById("filtros");
  const estado = document.getElementById("estado");
  let productos = [];
  let categoria = "todos";

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

  function tarjeta(p) {
    const el = document.createElement("article");
    el.className = "tarjeta";

    const fotoPrincipal = p.fotos && p.fotos.length ? p.fotos[0] : "";
    const enlace = enlacePedido(p);

    el.innerHTML = `
      <div class="foto-wrap">
        <img class="foto" src="${fotoPrincipal}" alt="${p.nombre}" loading="lazy">
      </div>
      <div class="miniaturas"></div>
      <h2 class="nombre">${p.nombre}</h2>
      <p class="descripcion">${p.descripcion || ""}</p>
      ${p.variantes && p.variantes.length ? `<p class="variantes">Colores: ${p.variantes.join(" · ")}</p>` : ""}
      <p class="precio">${formatoPrecio(p)}</p>
      ${enlace
        ? `<a class="boton" href="${enlace}" target="_blank" rel="noopener">Pedir por chat</a>`
        : `<button class="boton boton-apagado" type="button" data-pedir="${p.id}">Pedir por chat</button>`}
    `;

    // Miniaturas para cambiar la foto principal.
    const minis = el.querySelector(".miniaturas");
    if (p.fotos && p.fotos.length > 1) {
      p.fotos.forEach((f, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mini" + (i === 0 ? " mini-activa" : "");
        b.innerHTML = `<img src="${f}" alt="Vista ${i + 1} de ${p.nombre}" loading="lazy">`;
        b.addEventListener("click", () => {
          el.querySelector(".foto").src = f;
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

    return el;
  }

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

  document.getElementById("nombre-tienda").textContent = TIENDA.nombre;
  document.title = TIENDA.nombre + " — Catálogo";

  fetch("data/productos.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => { productos = data; dibujar(); })
    .catch(() => { estado.textContent = "No se pudo cargar el catálogo. Revisá data/productos.json."; });
})();
