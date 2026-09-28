// Lógica pura del stock, sin DOM: se usa desde stock.js (navegador)
// y desde tests/stock.test.js (Node). No agregar document/localStorage acá.

function calcularExistencias(movimientos) {
  const existencias = {};
  for (const m of movimientos || []) {
    if (!m || typeof m.productoId !== "string") continue;
    const cant = Math.floor(Number(m.cantidad));
    if (!Number.isFinite(cant) || cant <= 0) continue;
    if (!(m.productoId in existencias)) existencias[m.productoId] = 0;
    if (m.tipo === "entrada") existencias[m.productoId] += cant;
    else if (m.tipo === "salida") existencias[m.productoId] -= cant;
  }
  return existencias;
}

function validarMovimiento(mov, existencias) {
  if (!mov || typeof mov.productoId !== "string" || !mov.productoId) {
    return "Elegí un producto.";
  }
  if (mov.tipo !== "entrada" && mov.tipo !== "salida") {
    return "El tipo debe ser entrada o salida.";
  }
  const cant = Math.floor(Number(mov.cantidad));
  if (!Number.isFinite(cant) || cant <= 0) {
    return "La cantidad debe ser un número entero mayor a cero.";
  }
  if (mov.tipo === "salida") {
    const hay = (existencias && existencias[mov.productoId]) || 0;
    if (cant > hay) {
      return `No alcanza: hay ${hay} unidad(es) de ese producto.`;
    }
  }
  return null; // válido
}

function crearMovimiento(productoId, tipo, cantidad, nota) {
  return {
    id: "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    fecha: new Date().toISOString(),
    productoId,
    tipo,
    cantidad: Math.floor(Number(cantidad)),
    nota: (nota || "").trim(),
  };
}

function validarRespaldo(datos) {
  if (!datos || !Array.isArray(datos.movimientos)) {
    return "El archivo no es una copia válida de stock.";
  }
  for (const m of datos.movimientos) {
    if (!m || typeof m.productoId !== "string" || (m.tipo !== "entrada" && m.tipo !== "salida")) {
      return "El archivo tiene movimientos inválidos.";
    }
    const cant = Math.floor(Number(m.cantidad));
    if (!Number.isFinite(cant) || cant <= 0) {
      return "El archivo tiene cantidades inválidas.";
    }
  }
  return null; // válido
}

// Respaldo en formato Excel (CSV con separador ";" y BOM para tildes).
// Incluye nombre de producto, fecha legible y sección de totales.
// La columna "producto" y los TOTALES son informativos: al recargar se ignoran.
const CSV_CABECERA = ["fecha", "codigo", "producto", "tipo", "cantidad", "nota"];

function escaparCSV(valor) {
  const t = String(valor === null || valor === undefined ? "" : valor);
  return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

function capitalizar(t) {
  const s = String(t || "");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function fechaLegibleStock(iso) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso || "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(f.getDate())}/${p(f.getMonth() + 1)}/${f.getFullYear()} ${p(f.getHours())}:${p(f.getMinutes())}`;
}

function fechaLegibleAISO(texto) {
  const t = String(texto || "").trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return t; // ya ISO
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return t;
  const f = new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
  return Number.isNaN(f.getTime()) ? t : f.toISOString();
}

function movimientosACSV(movs, productos) {
  const nombres = {};
  for (const p of productos || []) nombres[p.id] = p.nombre;
  const datos = [...(movs || [])].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const lineas = [CSV_CABECERA.join(";")];
  for (const m of datos) {
    lineas.push([fechaLegibleStock(m.fecha), m.productoId || "", nombres[m.productoId] || "",
      capitalizar(m.tipo), m.cantidad ?? "", m.nota || ""].map(escaparCSV).join(";"));
  }
  lineas.push("");
  lineas.push("TOTALES;;;;;");
  const ex = calcularExistencias(movs);
  const lista = (productos && productos.length)
    ? productos
    : [...new Set(datos.map((m) => m.productoId))].map((id) => ({ id, nombre: nombres[id] || "" }));
  for (const p of lista) {
    lineas.push(["TOTAL", p.id, nombres[p.id] || p.nombre || "", ex[p.id] || 0, "", ""]
      .map(escaparCSV).join(";"));
  }
  return "\ufeff" + lineas.join("\r\n");
}

function dividirLineaCSV(linea) {
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

function csvAMovimientos(texto) {
  if (!texto || !String(texto).trim()) {
    return { error: "El archivo está vacío." };
  }
  const lineas = String(texto).replace(/^\ufeff/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  // Mapa de columnas por nombre: acepta formato nuevo (con "producto")
  // y formato anterior (sin "producto").
  const cab = dividirLineaCSV(lineas[0]).map((c) => c.trim().toLowerCase());
  const idx = {};
  cab.forEach((nombre, i) => { idx[nombre] = i; });
  for (const col of ["fecha", "codigo", "tipo", "cantidad", "nota"]) {
    if (!(col in idx)) {
      return { error: "El archivo no es una copia válida de stock (encabezado distinto)." };
    }
  }
  const nCols = cab.length;
  const movs = [];
  for (let i = 1; i < lineas.length; i++) {
    const c = dividirLineaCSV(lineas[i]);
    if (c.length !== nCols) {
      return { error: `Fila ${i + 1} inválida en el archivo.` };
    }
    // Filas informativas (TOTALES): se ignoran al recargar.
    if (/^(total|totales)$/i.test(c[0].trim())) continue;
    movs.push({
      id: "imp" + Date.now().toString(36) + "-" + i,
      fecha: fechaLegibleAISO(c[idx.fecha]),
      productoId: c[idx.codigo].trim(),
      tipo: c[idx.tipo].trim().toLowerCase(),
      cantidad: Number(c[idx.cantidad].trim()),
      nota: c[idx.nota],
    });
  }
  const invalido = validarRespaldo({ movimientos: movs });
  if (invalido) return { error: invalido };
  return { movimientos: movs };
}

// Exportar para Node sin romper el navegador (script clásico).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calcularExistencias, validarMovimiento, crearMovimiento, validarRespaldo, movimientosACSV, csvAMovimientos };
}
