// Configuración de la tienda. Editar con Bloc de notas.
// Número de chat para pedidos: código país + número, sin +, sin espacios.
// Ejemplo Argentina: "5491100000000". Mientras esté vacío, el botón de
// pedido muestra un aviso en vez de abrir el chat.
const TIENDA = {
  nombre: "Emprendimiento de mamá",
  numeroChat: "",
  mensajePlantilla: (producto) => `Hola! Quiero pedir: ${producto.nombre} (código ${producto.id})`
};
