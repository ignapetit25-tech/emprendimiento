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

// Exportar para Node sin romper el navegador (script clásico).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calcularExistencias, validarMovimiento, crearMovimiento, validarRespaldo };
}
