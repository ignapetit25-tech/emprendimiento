# Cytrino — Catálogo y gestión

Microemprendimiento familiar (ropa, tazas, carteras, etc.).

Catálogo en línea: https://ignapetit25-tech.github.io/emprendimiento/

Cómo funciona:
- Catálogo estático (HTML/CSS/JS + datos JSON, costo cero, GitHub Pages).
- Pedido por producto vía chat con mensaje prellenado (número configurado solo en local, nunca en este repo).
- Fases posteriores: gestión de stock (existencias + movimientos) y finanzas (costos, gastos, ventas, balance mensual).
- Guía simple en español para persona no técnica: ver `GUIA.md`.

Datos de productos: `data/productos.json`. Fotos: `assets/img/`.

Pruebas: `node --test tests/` (usa el runner incluido en Node, sin dependencias).
