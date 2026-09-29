// Puerta de administradora para stock.html y finanzas.html.
// Requiere en la página: body.bloqueado, #puerta con #puerta-titulo,
// #puerta-form, #puerta-pin, #puerta-error y #puerta-boton; enlace #salir
// en la barra; y #form-pin con #pin-actual, #pin-nuevo y #aviso-pin.
// La sesión vive en sessionStorage: al cerrar la pestaña se bloquea solo.
(function () {
  const CLAVE_HASH = "cytrino_pin_hash";
  const CLAVE_SESION = "cytrino_admin_v1";

  function listo(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  listo(() => {
    const puerta = document.getElementById("puerta");
    if (!puerta) return; // página sin puerta (catálogo)
    const titulo = document.getElementById("puerta-titulo");
    const form = document.getElementById("puerta-form");
    const pin = document.getElementById("puerta-pin");
    const mensaje = document.getElementById("puerta-error");
    const boton = document.getElementById("puerta-boton");
    const salir = document.getElementById("salir");

    const hayPin = () => !!localStorage.getItem(CLAVE_HASH);

    function preparar() {
      if (hayPin()) {
        titulo.textContent = "Zona de administración";
        boton.textContent = "Entrar";
        mensaje.textContent = "Ingresá tu PIN de administradora.";
      } else {
        titulo.textContent = "Creá tu PIN de administradora";
        boton.textContent = "Guardar PIN y entrar";
        mensaje.textContent = "Es la primera vez acá: elegí un PIN de 4 a 8 números.";
      }
      pin.value = "";
      pin.focus();
    }

    function desbloquear() {
      sessionStorage.setItem(CLAVE_SESION, "1");
      document.body.classList.remove("bloqueado");
      puerta.hidden = true;
      if (salir) salir.hidden = false;
    }

    function bloquear() {
      sessionStorage.removeItem(CLAVE_SESION);
      document.body.classList.add("bloqueado");
      puerta.hidden = false;
      if (salir) salir.hidden = true;
      preparar();
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const valor = pin.value.trim();
      const invalido = validarPin(valor);
      if (invalido) {
        mensaje.textContent = invalido;
        return;
      }
      if (!hayPin()) {
        localStorage.setItem(CLAVE_HASH, hashPin(valor));
        desbloquear();
        return;
      }
      if (verificarPin(valor, localStorage.getItem(CLAVE_HASH))) {
        desbloquear();
      } else {
        mensaje.textContent = "PIN incorrecto. Probá de nuevo.";
        pin.value = "";
        pin.focus();
      }
    });

    if (salir) salir.addEventListener("click", (e) => {
      e.preventDefault();
      bloquear();
    });

    const formPin = document.getElementById("form-pin");
    if (formPin) {
      formPin.addEventListener("submit", (e) => {
        e.preventDefault();
        const actual = document.getElementById("pin-actual").value.trim();
        const nuevo = document.getElementById("pin-nuevo").value.trim();
        const aviso = document.getElementById("aviso-pin");
        if (!verificarPin(actual, localStorage.getItem(CLAVE_HASH))) {
          aviso.textContent = "El PIN actual no es correcto.";
          return;
        }
        const invalido = validarPin(nuevo);
        if (invalido) {
          aviso.textContent = invalido;
          return;
        }
        localStorage.setItem(CLAVE_HASH, hashPin(nuevo));
        aviso.textContent = "PIN cambiado correctamente.";
        formPin.reset();
      });
    }

    if (sessionStorage.getItem(CLAVE_SESION) === "1" && hayPin()) desbloquear();
    else bloquear();
  });
})();
