// Lógica pura de finanzas, sin DOM: se usa desde finanzas.js (navegador)
// y desde tests/finanzas.test.js (Node). No agregar document/localStorage acá.

const TIPOS_FINANZAS = ["venta", "gasto", "costo"];

function redondear2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function esFechaValida(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(fecha + "T00:00:00");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

function validarMovimientoFin(mov) {
  if (!mov || !TIPOS_FINANZAS.includes(mov.tipo)) {
    return "El tipo debe ser venta, gasto o costo.";
  }
  if (typeof mov.concepto !== "string" || !mov.concepto.trim()) {
    return "Escribí un concepto (ej: venta taza osito).";
  }
  const monto = Number(mov.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    return "El monto debe ser un número mayor a cero.";
  }
  if (!esFechaValida(mov.fecha)) {
    return "La fecha no es válida.";
  }
  if (mov.productoId !== undefined && mov.productoId !== null && mov.productoId !== "" &&
      typeof mov.productoId !== "string") {
    return "El producto no es válido.";
  }
  return null; // válido
}

function crearMovimientoFin(tipo, concepto, monto, fecha, productoId) {
  return {
    id: "f" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    fecha,
    tipo,
    concepto: concepto.trim(),
    monto: redondear2(monto),
    productoId: productoId || "",
  };
}

// Resumen de un mes "AAAA-MM": totales por tipo y balance.
function resumenMensual(movs, mes) {
  const r = { ventas: 0, gastos: 0, costos: 0, cantidad: 0 };
  for (const m of movs || []) {
    if (!m || typeof m.fecha !== "string" || !m.fecha.startsWith(mes)) continue;
    if (!TIPOS_FINANZAS.includes(m.tipo)) continue;
    const monto = Number(m.monto);
    if (!Number.isFinite(monto) || monto <= 0) continue;
    r.cantidad++;
    if (m.tipo === "venta") r.ventas += monto;
    else if (m.tipo === "gasto") r.gastos += monto;
    else r.costos += monto;
  }
  r.ventas = redondear2(r.ventas);
  r.gastos = redondear2(r.gastos);
  r.costos = redondear2(r.costos);
  r.balance = redondear2(r.ventas - r.gastos - r.costos);
  return r;
}

function validarRespaldoFin(datos) {
  if (!datos || !Array.isArray(datos.movimientos)) {
    return "El archivo no es una copia válida de finanzas.";
  }
  for (const m of datos.movimientos) {
    const error = validarMovimientoFin(m);
    if (error) return error;
  }
  return null; // válido
}

// Respaldo en formato Excel (CSV con separador ";" y BOM para tildes).
// Incluye nombre de producto, fecha legible y sección de totales.
// La columna "producto" y los TOTALES son informativos: al recargar se ignoran.
const CSV_CABECERA_FIN = ["fecha", "tipo", "concepto", "monto", "codigo", "producto"];

function escaparCSVFin(valor) {
  const t = String(valor === null || valor === undefined ? "" : valor);
  return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

function capitalizarFin(t) {
  const s = String(t || "");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function fechaCortaFin(iso) {
  const partes = String(iso || "").split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : (iso || "");
}

function fechaCortaAISO(texto) {
  const t = String(texto || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; // ya ISO corta
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return t;
  return `${m[3]}-${String(+m[2]).padStart(2, "0")}-${String(+m[1]).padStart(2, "0")}`;
}

function montoExcel(n) {
  // Excel argentino usa coma decimal y 2 decimales: 1500,50.
  const v = Number(n);
  const t = Number.isFinite(v) ? v.toFixed(2) : String(n ?? "");
  return t.replace(".", ",");
}

function movimientosACSVFin(movs, productos) {
  const nombres = {};
  for (const p of productos || []) nombres[p.id] = p.nombre;
  const datos = [...(movs || [])].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const lineas = [CSV_CABECERA_FIN.join(";")];
  for (const m of datos) {
    lineas.push([fechaCortaFin(m.fecha), capitalizarFin(m.tipo), m.concepto || "",
      montoExcel(m.monto), m.productoId || "", nombres[m.productoId] || ""]
      .map(escaparCSVFin).join(";"));
  }
  lineas.push("");
  lineas.push("TOTALES;;;;;");
  const tot = { venta: 0, gasto: 0, costo: 0 };
  for (const m of datos) {
    if (m.tipo in tot) tot[m.tipo] = redondear2(tot[m.tipo] + Number(m.monto));
  }
  const balance = redondear2(tot.venta - tot.gasto - tot.costo);
  for (const [etiqueta, valor] of [["Ventas", tot.venta], ["Gastos", tot.gasto], ["Costos", tot.costo], ["Balance", balance]]) {
    lineas.push(["TOTAL", etiqueta, montoExcel(valor), "", "", ""].map(escaparCSVFin).join(";"));
  }
  return "\ufeff" + lineas.join("\r\n");
}

function dividirLineaCSVFin(linea) {
  const campos = [];
  let actual = "";
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (comillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') { actual += '"'; i++; }
        else comillas = false;
      } else actual += c;
    } else if (c === '"') {
      comillas = true;
    } else if (c === ";") {
      campos.push(actual);
      actual = "";
    } else actual += c;
  }
  campos.push(actual);
  return campos;
}

function csvAMovimientosFin(texto) {
  if (!texto || !String(texto).trim()) {
    return { error: "El archivo está vacío." };
  }
  const lineas = String(texto).replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  // Mapa de columnas por nombre: acepta formato nuevo (con "producto")
  // y formato anterior (sin "producto").
  const cab = dividirLineaCSVFin(lineas[0]).map((c) => c.trim().toLowerCase());
  const idx = {};
  cab.forEach((nombre, i) => { idx[nombre] = i; });
  for (const col of ["fecha", "tipo", "concepto", "monto", "codigo"]) {
    if (!(col in idx)) {
      return { error: "El archivo no es una copia válida de finanzas (encabezado distinto)." };
    }
  }
  const nCols = cab.length;
  const movs = [];
  for (let i = 1; i < lineas.length; i++) {
    const c = dividirLineaCSVFin(lineas[i]);
    if (c.length !== nCols) {
      return { error: `Fila ${i + 1} inválida en el archivo.` };
    }
    // Filas informativas (TOTALES): se ignoran al recargar.
    if (/^(total|totales)$/i.test(c[0].trim())) continue;
    movs.push({
      id: "imp" + Date.now().toString(36) + "-" + i,
      fecha: fechaCortaAISO(c[idx.fecha]),
      tipo: c[idx.tipo].trim().toLowerCase(),
      concepto: c[idx.concepto],
      monto: redondear2(Number(c[idx.monto].trim().replace(",", "."))),
      productoId: c[idx.codigo].trim(),
    });
  }
  const invalido = validarRespaldoFin({ movimientos: movs });
  if (invalido) return { error: invalido };
  return { movimientos: movs };
}

// Exportar para Node sin romper el navegador (script clásico).
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validarMovimientoFin, crearMovimientoFin, resumenMensual,
    validarRespaldoFin, movimientosACSVFin, csvAMovimientosFin,
  };
}
