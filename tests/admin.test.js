// Pruebas del PIN de administradora. Correr con: node --test tests/
// Usa solo módulos incluidos en Node (node:test, node:assert).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validarPin, hashPin, verificarPin } = require("../assets/js/admin-logica.js");

describe("validarPin", () => {
  it("acepta de 4 a 8 números", () => {
    assert.equal(validarPin("1234"), null);
    assert.equal(validarPin("12345678"), null);
  });

  it("rechaza formato inválido", () => {
    assert.match(validarPin("123"), /4 a 8/);
    assert.match(validarPin("123456789"), /4 a 8/);
    assert.match(validarPin("abcd"), /4 a 8/);
    assert.match(validarPin(""), /4 a 8/);
    assert.match(validarPin(null), /4 a 8/);
  });
});

describe("hashPin y verificarPin", () => {
  it("es determinista y distingue PINs", () => {
    assert.equal(hashPin("1234"), hashPin("1234"));
    assert.notEqual(hashPin("1234"), hashPin("4321"));
  });

  it("verifica correcto e incorrecto", () => {
    const hash = hashPin("5678");
    assert.equal(verificarPin("5678", hash), true);
    assert.equal(verificarPin("0000", hash), false);
    assert.equal(verificarPin("5678", ""), false);
    assert.equal(verificarPin("5678", null), false);
  });
});
