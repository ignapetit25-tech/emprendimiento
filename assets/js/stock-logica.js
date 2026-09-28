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
const CSV_CABECERA = ["fecha", "codigo", "tipo", "cantidad", "nota"];

function escaparCSV(valor) {
  const t = String(valor === null || valor === undefined ? "" : valor);
  return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

function movimientosACSV(movs) {
  const lineas = [CSV_CABECERA.join(";")];
  for (const m of movs || []) {
    lineas.push([m.fecha || "", m.productoId || "", m.tipo || "", m.cantidad ?? "", m.nota || ""]
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
  const cab = dividirLineaCSV(lineas[0]).map((c) => c.trim().toLowerCase());
  if (cab.join(";") !== CSV_CABECERA.join(";")) {
    return { error: "El archivo no es una copia válida de stock (encabezado distinto)." };
  }
  const movs = [];
  for (let i = 1; i < lineas.length; i++) {
    const c = dividirLineaCSV(lineas[i]);
    if (c.length !== 5) {
      return { error: `Fila ${i + 1} inválida en el archivo.` };
    }
    movs.push({
      id: "imp" + Date.now().toString(36) + "-" + i,
      fecha: c[0].trim(),
      productoId: c[1].trim(),
      tipo: c[2].trim(),
      cantidad: Number(c[3].trim()),
      nota: c[4],
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
