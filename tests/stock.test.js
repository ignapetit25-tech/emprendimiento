// Pruebas de la lógica de stock. Correr con: node --test tests/
// Usa solo módulos incluidos en Node (node:test, node:assert).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  calcularExistencias,
  validarMovimiento,
  crearMovimiento,
  validarRespaldo,
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
