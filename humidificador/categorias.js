const API_URL_HUMIDIFICADORES = "http://localhost:3000";

async function cargarCategoriasHumidificadores() {
  const contenedor = document.getElementById("categorias-humidificadores");

  if (!contenedor) return;

  try {
    const respuesta = await fetch(`${API_URL_HUMIDIFICADORES}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías");
    }

    const categorias = await respuesta.json();

    const subcategorias = categorias.filter(
      (categoria) => categoria.pagina_padre === "humidificadores",
    );

    contenedor.innerHTML = "";

    subcategorias.forEach((categoria) => {
      const enlace = document.createElement("a");

      enlace.textContent = categoria.nombre;
      enlace.href = `../paginas/producto.html?categoria=${encodeURIComponent(categoria.pagina)}`;

      contenedor.appendChild(enlace);
    });
  } catch (error) {
    console.error("Error al cargar subcategorías:", error);
  }
}

cargarCategoriasHumidificadores();
