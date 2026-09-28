// Pruebas de la lógica de stock. Correr con: node --test tests/
// Usa solo módulos incluidos en Node (node:test, node:assert).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  calcularExistencias,
  validarMovimiento,
  crearMovimiento,
  validarRespaldo,
  movimientosACSV,
  csvAMovimientos,
} = require("../assets/js/stock-logica.js");

describe("calcularExistencias", () => {
  it("suma entradas y resta salidas por producto", () => {
    const movs = [
      { productoId: "a", tipo: "entrada", cantidad: 10 },
      { productoId: "a", tipo: "salida", cantidad: 3 },
      { productoId: "b", tipo: "entrada", cantidad: 5 },
    ];
    assert.deepEqual(calcularExistencias(movs), { a: 7, b: 5 });
  });

  it("ignora movimientos inválidos sin romper el cálculo", () => {
    const movs = [
      null,
      { productoId: "a", tipo: "entrada", cantidad: 4 },
      { productoId: "a", tipo: "invalido", cantidad: 99 },
      { productoId: "a", tipo: "salida", cantidad: 0 },
      { productoId: "a", tipo: "salida", cantidad: -2 },
    ];
    assert.deepEqual(calcularExistencias(movs), { a: 4 });
  });

  it("lista vacía da existencias vacías", () => {
    assert.deepEqual(calcularExistencias([]), {});
  });
});

describe("validarMovimiento", () => {
  it("acepta una entrada válida", () => {
    assert.equal(validarMovimiento({ productoId: "a", tipo: "entrada", cantidad: 2 }, {}), null);
  });

  it("rechaza cantidad cero o negativa", () => {
    assert.match(validarMovimiento({ productoId: "a", tipo: "entrada", cantidad: 0 }, {}), /mayor a cero/);
    assert.match(validarMovimiento({ productoId: "a", tipo: "entrada", cantidad: -1 }, {}), /mayor a cero/);
  });

  it("rechaza salida mayor al stock", () => {
    assert.match(validarMovimiento({ productoId: "a", tipo: "salida", cantidad: 5 }, { a: 2 }), /No alcanza/);
  });

  it("acepta salida igual al stock", () => {
    assert.equal(validarMovimiento({ productoId: "a", tipo: "salida", cantidad: 2 }, { a: 2 }), null);
  });

  it("rechaza producto y tipo inválidos", () => {
    assert.match(validarMovimiento({ productoId: "", tipo: "entrada", cantidad: 1 }, {}), /producto/);
    assert.match(validarMovimiento({ productoId: "a", tipo: "otro", cantidad: 1 }, {}), /tipo/);
  });
});

describe("crearMovimiento", () => {
  it("genera id, fecha ISO y cantidad entera", () => {
    const m = crearMovimiento("a", "entrada", "3", "  nota  ");
    assert.equal(m.productoId, "a");
    assert.equal(m.tipo, "entrada");
    assert.equal(m.cantidad, 3);
    assert.equal(m.nota, "nota");
    assert.ok(m.id.startsWith("m"));
    assert.ok(!Number.isNaN(new Date(m.fecha).getTime()));
  });
});

describe("validarRespaldo", () => {
  it("acepta una copia válida", () => {
    const datos = { movimientos: [{ productoId: "a", tipo: "entrada", cantidad: 1 }] };
    assert.equal(validarRespaldo(datos), null);
  });

  it("rechaza formas inválidas", () => {
    assert.match(validarRespaldo(null), /no es una copia válida/);
    assert.match(validarRespaldo({}), /no es una copia válida/);
    assert.match(validarRespaldo({ movimientos: [{ productoId: "a" }] }), /inválidos/);
    assert.match(validarRespaldo({ movimientos: [{ productoId: "a", tipo: "entrada", cantidad: 0 }] }), /cantidades/);
  });
});

describe("respaldo Excel (CSV)", () => {
  const prods = [{ id: "a", nombre: "Taza Osito" }];

  it("exporta cabecera con producto, fecha legible y totales", () => {
    const csv = movimientosACSV(
      [{ fecha: "2026-02-01T10:00:00.000Z", productoId: "a", tipo: "entrada", cantidad: 5, nota: "" }],
      prods
    );
    assert.ok(csv.startsWith("\ufefffecha;codigo;producto;tipo;cantidad;nota"));
    assert.ok(csv.includes("Taza Osito"));
    assert.ok(csv.includes("Entrada"));
    assert.ok(!csv.includes("2026-02-01T10:00:00.000Z"), "la fecha ISO no debe aparecer cruda");
    assert.ok(csv.includes("TOTALES"));
    assert.ok(csv.includes("TOTAL;a;Taza Osito;5;;"));
  });

  it("escapa notas con punto y coma o comillas", () => {
    const csv = movimientosACSV(
      [{ fecha: "2026-01-01T00:00:00.000Z", productoId: "a", tipo: "entrada", cantidad: 1, nota: 'compra "mayorista"; urgente' }],
      prods
    );
    const back = csvAMovimientos(csv);
    assert.equal(back.error, undefined);
    assert.equal(back.movimientos[0].nota, 'compra "mayorista"; urgente');
  });

  it("importa lo exportado (ida y vuelta, totales ignorados)", () => {
    const original = [
      { fecha: "2026-02-01T10:00:00.000Z", productoId: "a", tipo: "entrada", cantidad: 5, nota: "llegó" },
      { fecha: "2026-02-02T10:00:00.000Z", productoId: "a", tipo: "salida", cantidad: 2, nota: "" },
    ];
    const back = csvAMovimientos(movimientosACSV(original, prods));
    assert.equal(back.error, undefined);
    assert.equal(back.movimientos.length, 2);
    assert.deepEqual(
      back.movimientos.map((m) => [m.productoId, m.tipo, m.cantidad, m.nota]),
      [["a", "entrada", 5, "llegó"], ["a", "salida", 2, ""]]
    );
    assert.deepEqual(calcularExistencias(back.movimientos), { a: 3 });
  });

  it("acepta formato anterior sin columna producto y fechas ISO", () => {
    const viejo = "fecha;codigo;tipo;cantidad;nota\n2026-02-01T10:00:00.000Z;a;entrada;5;x";
    const back = csvAMovimientos(viejo);
    assert.equal(back.error, undefined);
    assert.equal(back.movimientos[0].productoId, "a");
    assert.equal(back.movimientos[0].fecha, "2026-02-01T10:00:00.000Z");
  });

  it("rechaza archivos que no son copia de stock", () => {
    assert.match(csvAMovimientos("").error, /vacío/);
    assert.match(csvAMovimientos("nombre,apellido\njuan,perez").error, /encabezado/);
    assert.match(csvAMovimientos("fecha;codigo;tipo;cantidad;nota\na;b;c").error, /inválida/);
    assert.match(csvAMovimientos("fecha;codigo;tipo;cantidad;nota\nf;a;salida;0;").error, /cantidades/);
  });
});
