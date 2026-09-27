// Configuración pública de la tienda (este archivo SÍ se sube a GitHub).
// El número de chat NO va acá: se configura solo en local en
// assets/js/config.local.js (ignorado por git, ver .gitignore).
const TIENDA = {
  nombre: "Cytrino",
  numeroChat: "",
  mensajePlantilla: (producto) => `Hola! Quiero pedir: ${producto.nombre} (código ${producto.id})`
};
