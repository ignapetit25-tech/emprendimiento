// Gestión de stock de Cytrino. Los datos viven en localStorage de este
// navegador (clave cytrino_stock_v1). Sin backend: costo cero.
(function () {
  const CLAVE = "cytrino_stock_v1";
  const cuerpoStock = document.querySelector("#tabla-stock tbody");
  const cuerpoMovs = document.querySelector("#tabla-movs tbody");
  const estadoStock = document.getElementById("estado-stock");
  const form = document.getElementById("form-mov");
  const selProducto = document.getElementById("mov-producto");
  const selTipo = document.getElementById("mov-tipo");
  const inpCantidad = document.getElementById("mov-cantidad");
  const inpNota = document.getElementById("mov-nota");
  const avisoMov = document.getElementById("aviso-mov");
  const sinMovs = document.getElementById("sin-movs");
  const avisoRespaldo = document.getElementById("aviso-respaldo");

  let productos = [];
  let movimientos = [];

  function nombreProducto(id) {
    const p = productos.find((x) => x.id === id);
    return p ? p.nombre : id;
  }

  function cargar() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE));
      movimientos = datos && Array.isArray(datos.movimientos) ? datos.movimientos : [];
    } catch {
      movimientos = [];
    }
  }

  function guardar() {
    localStorage.setItem(CLAVE, JSON.stringify({ movimientos }));
  }

  function formatoFecha(iso) {
    const f = new Date(iso);
    return Number.isNaN(f.getTime()) ? "—" : f.toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function dibujar() {
    const existencias = calcularExistencias(movimientos);

    // Tabla de existencias (un producto por fila, aunque tenga 0).
    cuerpoStock.innerHTML = "";
    for (const p of productos) {
      const cant = existencias[p.id] || 0;
      const tr = document.createElement("tr");
      if (cant <= 0) tr.className = "sin-stock";
      tr.innerHTML = `<td>${p.nombre}</td><td>${p.id}</td>` +
        `<td><strong>${cant}</strong>${cant <= 0 ? " (sin stock)" : ""}</td>`;
      cuerpoStock.appendChild(tr);
    }
    const total = Object.values(existencias).reduce((a, b) => a + b, 0);
    estadoStock.textContent = `${productos.length} producto(s), ${total} unidad(es) en total, ${movimientos.length} movimiento(s).`;

    // Historial, más nuevos primero.
    cuerpoMovs.innerHTML = "";
    const ordenados = [...movimientos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    sinMovs.hidden = ordenados.length > 0;
    for (const m of ordenados) {
      const tr = document.createElement("tr");
      const tipoTexto = m.tipo === "entrada" ? "Entrada" : "Salida";
      tr.innerHTML = `<td>${formatoFecha(m.fecha)}</td><td>${nombreProducto(m.productoId)}</td>` +
        `<td>${tipoTexto}</td><td>${m.cantidad}</td><td>${m.nota || "—"}</td>`;
      const tdAccion = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "borrar";
      btn.textContent = "Borrar";
      btn.setAttribute("aria-label", `Borrar movimiento de ${nombreProducto(m.productoId)} del ${formatoFecha(m.fecha)}`);
      btn.addEventListener("click", () => {
        if (!confirm("¿Borrar este movimiento? Las existencias se recalculan.")) return;
        movimientos = movimientos.filter((x) => x.id !== m.id);
        guardar();
        dibujar();
      });
      tdAccion.appendChild(btn);
      tr.appendChild(tdAccion);
      cuerpoMovs.appendChild(tr);
    }
  }

  function mostrarAviso(texto) {
    avisoMov.textContent = texto;
    avisoMov.hidden = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    avisoMov.hidden = true;
    const mov = {
      productoId: selProducto.value,
      tipo: selTipo.value,
      cantidad: inpCantidad.value,
      nota: inpNota.value,
    };
    const error = validarMovimiento(mov, calcularExistencias(movimientos));
    if (error) {
      mostrarAviso(error);
      return;
    }
    movimientos.push(crearMovimiento(mov.productoId, mov.tipo, mov.cantidad, mov.nota));
    guardar();
    dibujar();
    inpCantidad.value = "1";
    inpNota.value = "";
    mostrarAviso("Movimiento guardado.");
  });

  // Respaldo: descargar y cargar JSON.
  document.getElementById("btn-exportar").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ movimientos }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cytrino-stock-respaldo.json";
    a.click();
    URL.revokeObjectURL(a.href);
    avisoRespaldo.textContent = "Copia descargada.";
  });

  document.getElementById("importar").addEventListener("change", (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      let datos = null;
      try {
        datos = JSON.parse(lector.result);
      } catch {
        datos = null;
      }
      const error = validarRespaldo(datos);
      if (error) {
        avisoRespaldo.textContent = error;
        e.target.value = "";
        return;
      }
      if (!confirm(`Reemplazar los ${movimientos.length} movimiento(s) actuales por los ${datos.movimientos.length} de la copia?`)) {
        e.target.value = "";
        return;
      }
      movimientos = datos.movimientos;
      guardar();
      dibujar();
      avisoRespaldo.textContent = "Copia cargada correctamente.";
      e.target.value = "";
    };
    lector.readAsText(archivo);
  });

  // Productos del catálogo para nombres y el desplegable.
  fetch("data/productos.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => {
      productos = data;
      selProducto.innerHTML = "";
      for (const p of productos) {
        const op = document.createElement("option");
        op.value = p.id;
        op.textContent = `${p.nombre} (${p.id})`;
        selProducto.appendChild(op);
      }
      cargar();
      dibujar();
    })
    .catch(() => { estadoStock.textContent = "No se pudo cargar el catálogo. Revisá data/productos.json."; });
})();
