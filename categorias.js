const API_URL_CATEGORIAS = "http://localhost:3000";

async function cargarCategoriasInicio() {
  const contenedor = document.getElementById("categorias-inicio");

  if (!contenedor) return;

  try {
    const respuesta = await fetch(`${API_URL_CATEGORIAS}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías");
    }

    const categorias = await respuesta.json();

    const categoriasInicio = categorias.filter(
      (categoria) => categoria.pagina_padre === "inicio",
    );

    contenedor.innerHTML = "";

    categoriasInicio.forEach((categoria) => {
      const enlace = document.createElement("a");

      enlace.textContent = categoria.nombre;
      enlace.href = `./paginas/producto.html?categoria=${encodeURIComponent(categoria.pagina)}`;

      contenedor.appendChild(enlace);
    });
  } catch (error) {
    console.error("Error al cargar las categorías del inicio:", error);
  }
}

cargarCategoriasInicio();
