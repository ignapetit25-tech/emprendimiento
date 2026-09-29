// Lógica pura del PIN de administradora, sin DOM.
// Se usa desde admin.js (navegador) y tests/admin.test.js (Node).
//
// LÍMITE HONESTO: esto es ofuscación, no seguridad real. El hash evita que
// el PIN se lea a simple vista, pero sin servidor que verifique, un técnico
// puede saltear la puerta. Frena a curiosos, que es el caso de uso.

function validarPin(pin) {
  if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
    return "El PIN debe tener de 4 a 8 números.";
  }
  return null; // válido
}

function hashPin(pin) {
  const t = "cytrino|" + pin;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < t.length; i++) {
    const ch = t.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function verificarPin(pin, hashGuardado) {
  if (!hashGuardado) return false;
  return hashPin(pin) === hashGuardado;
}

// Exportar para Node sin romper el navegador (script clásico).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validarPin, hashPin, verificarPin };
}
