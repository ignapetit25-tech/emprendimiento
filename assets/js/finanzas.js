// Finanzas de Cytrino. Los datos viven en localStorage de este navegador
// (clave cytrino_finanzas_v1). Sin backend: costo cero.
(function () {
  const CLAVE = "cytrino_finanzas_v1";
  const TIPOS_TEXTO = { venta: "Venta", gasto: "Gasto", costo: "Costo" };
  const selMes = document.getElementById("mes");
  const estadoFin = document.getElementById("estado-fin");
  const cuerpoBalance = document.querySelector("#tabla-balance tbody");
  const cuerpoMovs = document.querySelector("#tabla-movs tbody");
  const form = document.getElementById("form-mov");
  const selTipo = document.getElementById("mov-tipo");
  const inpConcepto = document.getElementById("mov-concepto");
  const inpMonto = document.getElementById("mov-monto");
  const inpFecha = document.getElementById("mov-fecha");
  const selProducto = document.getElementById("mov-producto");
  const avisoMov = document.getElementById("aviso-mov");
  const sinMovs = document.getElementById("sin-movs");
  const avisoRespaldo = document.getElementById("aviso-respaldo");

  let productos = [];
  let movimientos = [];

  function hoyISO() {
    const f = new Date();
    return f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0") + "-" + String(f.getDate()).padStart(2, "0");
  }

  function formatoDinero(n) {
    return "$ " + Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatoFechaCorta(iso) {
    const partes = String(iso).split("-");
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : iso;
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

  function dibujar() {
    const mes = selMes.value;
    const r = resumenMensual(movimientos, mes);

    cuerpoBalance.innerHTML = "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${formatoDinero(r.ventas)}</td><td>${formatoDinero(r.gastos)}</td>` +
      `<td>${formatoDinero(r.costos)}</td><td><strong>${formatoDinero(r.balance)}</strong></td>`;
    if (r.balance < 0) tr.className = "balance-negativo";
    cuerpoBalance.appendChild(tr);
    estadoFin.textContent = `${r.cantidad} movimiento(s) en ${mes || "—"}.`;

    const delMes = movimientos
      .filter((m) => m.fecha && m.fecha.startsWith(mes))
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    cuerpoMovs.innerHTML = "";
    sinMovs.hidden = delMes.length > 0;
    for (const m of delMes) {
      const fila = document.createElement("tr");
      fila.innerHTML = `<td>${formatoFechaCorta(m.fecha)}</td><td>${TIPOS_TEXTO[m.tipo] || m.tipo}</td>` +
        `<td>${m.concepto}</td><td>${formatoDinero(m.monto)}</td>`;
      const tdAccion = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "borrar";
      btn.textContent = "Borrar";
      btn.setAttribute("aria-label", `Borrar ${TIPOS_TEXTO[m.tipo] || m.tipo} "${m.concepto}" del ${formatoFechaCorta(m.fecha)}`);
      btn.addEventListener("click", () => {
        if (!confirm("¿Borrar este movimiento? El balance se recalcula.")) return;
        movimientos = movimientos.filter((x) => x.id !== m.id);
        guardar();
        dibujar();
      });
      tdAccion.appendChild(btn);
      fila.appendChild(tdAccion);
      cuerpoMovs.appendChild(fila);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    avisoMov.hidden = true;
    const mov = {
      tipo: selTipo.value,
      concepto: inpConcepto.value,
      monto: inpMonto.value,
      fecha: inpFecha.value,
      productoId: selProducto.value,
    };
    const error = validarMovimientoFin(mov);
    if (error) {
      avisoMov.textContent = error;
      avisoMov.hidden = false;
      return;
    }
    movimientos.push(crearMovimientoFin(mov.tipo, mov.concepto, mov.monto, mov.fecha, mov.productoId));
    guardar();
    // Si el movimiento es de otro mes, saltar a ese mes para mostrarlo.
    selMes.value = mov.fecha.slice(0, 7);
    dibujar();
    avisoMov.textContent = "Movimiento guardado.";
    avisoMov.hidden = false;
    inpConcepto.value = "";
    inpMonto.value = "";
    inpFecha.value = hoyISO();
  });

  selMes.addEventListener("change", dibujar);

  // Respaldo en Excel (CSV): descargar y cargar.
  document.getElementById("btn-exportar").addEventListener("click", () => {
    const blob = new Blob([movimientosACSVFin(movimientos, productos)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const hoy = new Date();
    const sello = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    a.download = `cytrino-finanzas-${sello}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    avisoRespaldo.textContent = "Copia descargada (se abre con Excel).";
  });

  document.getElementById("importar").addEventListener("change", (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = csvAMovimientosFin(lector.result);
      if (resultado.error) {
        avisoRespaldo.textContent = resultado.error;
        e.target.value = "";
        return;
      }
      if (!confirm(`Reemplazar los ${movimientos.length} movimiento(s) actuales por los ${resultado.movimientos.length} de la copia?`)) {
        e.target.value = "";
        return;
      }
      movimientos = resultado.movimientos;
      guardar();
      dibujar();
      avisoRespaldo.textContent = "Copia cargada correctamente.";
      e.target.value = "";
    };
    lector.readAsText(archivo, "utf-8");
  });

  // Valores iniciales y productos del catálogo (opcional en el formulario).
  selMes.value = hoyISO().slice(0, 7);
  inpFecha.value = hoyISO();
  fetch("data/productos.json")
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => {
      productos = data;
      selProducto.innerHTML = '<option value="">(ninguno)</option>';
      for (const p of productos) {
        const op = document.createElement("option");
        op.value = p.id;
        op.textContent = `${p.nombre} (${p.id})`;
        selProducto.appendChild(op);
      }
      cargar();
      dibujar();
    })
    .catch(() => { estadoFin.textContent = "No se pudo cargar el catálogo. Revisá data/productos.json."; });
})();
