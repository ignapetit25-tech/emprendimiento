// Pruebas de la lógica de finanzas. Correr con: node --test tests/
// Usa solo módulos incluidos en Node (node:test, node:assert).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  validarMovimientoFin,
  crearMovimientoFin,
  resumenMensual,
  validarRespaldoFin,
  movimientosACSVFin,
  csvAMovimientosFin,
} = require("../assets/js/finanzas-logica.js");

describe("validarMovimientoFin", () => {
  const base = { tipo: "venta", concepto: "venta taza", monto: 5000, fecha: "2026-03-10", productoId: "" };

  it("acepta un movimiento válido", () => {
    assert.equal(validarMovimientoFin(base), null);
  });

  it("rechaza tipo, concepto, monto y fecha inválidos", () => {
    assert.match(validarMovimientoFin({ ...base, tipo: "otro" }), /tipo/);
    assert.match(validarMovimientoFin({ ...base, concepto: "  " }), /concepto/);
    assert.match(validarMovimientoFin({ ...base, monto: 0 }), /monto/);
    assert.match(validarMovimientoFin({ ...base, monto: -5 }), /monto/);
    assert.match(validarMovimientoFin({ ...base, monto: "abc" }), /monto/);
    assert.match(validarMovimientoFin({ ...base, fecha: "2026-13-01" }), /fecha/);
    assert.match(validarMovimientoFin({ ...base, fecha: "10/03/2026" }), /fecha/);
  });
});

describe("crearMovimientoFin", () => {
  it("redondea el monto a 2 decimales y recorta el concepto", () => {
    const m = crearMovimientoFin("gasto", "  luz  ", "1234.567", "2026-03-01", "");
    assert.equal(m.monto, 1234.57);
    assert.equal(m.concepto, "luz");
    assert.ok(m.id.startsWith("f"));
  });
});

describe("resumenMensual", () => {
  const movs = [
    { fecha: "2026-03-05", tipo: "venta", monto: 10000 },
    { fecha: "2026-03-10", tipo: "gasto", monto: 2000 },
    { fecha: "2026-03-12", tipo: "costo", monto: 3000 },
    { fecha: "2026-04-01", tipo: "venta", monto: 99999 },
  ];

  it("filtra por mes y calcula balance = ventas − gastos − costos", () => {
    assert.deepEqual(resumenMensual(movs, "2026-03"), {
      ventas: 10000, gastos: 2000, costos: 3000, cantidad: 3, balance: 5000,
    });
  });

  it("mes sin movimientos da ceros", () => {
    assert.deepEqual(resumenMensual(movs, "2026-05"), {
      ventas: 0, gastos: 0, costos: 0, cantidad: 0, balance: 0,
    });
  });

  it("ignora movimientos inválidos", () => {
    const raros = [null, { fecha: "2026-03-01", tipo: "venta", monto: "x" }, { fecha: "2026-03-01", tipo: "venta", monto: 100 }];
    assert.deepEqual(resumenMensual(raros, "2026-03"), {
      ventas: 100, gastos: 0, costos: 0, cantidad: 1, balance: 100,
    });
  });
});

describe("validarRespaldoFin", () => {
  it("acepta y rechaza copias", () => {
    assert.equal(validarRespaldoFin({ movimientos: [] }), null);
    assert.match(validarRespaldoFin(null), /no es una copia válida/);
    assert.match(
      validarRespaldoFin({ movimientos: [{ tipo: "venta", concepto: "x", monto: 1, fecha: "mala" }] }),
      /fecha/
    );
  });
});

describe("respaldo Excel (CSV)", () => {
  const prods = [{ id: "vaso-osito", nombre: "Vaso osito" }];

  it("exporta cabecera con producto, fecha legible y totales", () => {
    const original = [
      { fecha: "2026-03-05", tipo: "venta", concepto: "venta taza; osito", monto: 10000, productoId: "vaso-osito" },
      { fecha: "2026-03-10", tipo: "gasto", concepto: "luz", monto: 2000.5, productoId: "" },
    ];
    const csv = movimientosACSVFin(original, prods);
    assert.ok(csv.startsWith("\ufefffecha;tipo;concepto;monto;codigo;producto"));
    assert.ok(csv.includes("Vaso osito"));
    assert.ok(csv.includes("05/03/2026"));
    assert.ok(csv.includes('"2000,50"') || csv.includes("2000,50"));
    assert.ok(csv.includes("TOTALES"));
    assert.ok(csv.includes("TOTAL;Balance;"));
    const back = csvAMovimientosFin(csv);
    assert.equal(back.error, undefined);
    assert.equal(back.movimientos.length, 2);
    assert.deepEqual(
      back.movimientos.map((m) => [m.fecha, m.tipo, m.concepto, m.monto, m.productoId]),
      [
        ["2026-03-05", "venta", "venta taza; osito", 10000, "vaso-osito"],
        ["2026-03-10", "gasto", "luz", 2000.5, ""],
      ]
    );
  });

  it("acepta formato anterior y montos con coma decimal", () => {
    const csv = "fecha;tipo;concepto;monto;codigo\n2026-03-05;venta;x;1500,50;";
    const back = csvAMovimientosFin(csv);
    assert.equal(back.error, undefined);
    assert.equal(back.movimientos[0].monto, 1500.5);
  });

  it("rechaza archivos que no son copia de finanzas", () => {
    assert.match(csvAMovimientosFin("").error, /vacío/);
    assert.match(csvAMovimientosFin("a;b;c").error, /encabezado/);
    assert.match(csvAMovimientosFin("fecha;tipo;concepto;monto;codigo\nf;venta").error, /inválida/);
  });
});
