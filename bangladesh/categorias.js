const API_URL_BANGLADESH = "https://lumora-api-ecb1.onrender.com";

async function cargarCategoriasBangladesh() {
  const contenedor = document.getElementById("categorias-bangladesh");

  if (!contenedor) return;

  try {
    const respuesta = await fetch(`${API_URL_BANGLADESH}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías");
    }

    const categorias = await respuesta.json();

    const subcategorias = categorias.filter(
      (categoria) => categoria.pagina_padre === "bangladesh",
    );

    contenedor.innerHTML = "";

    subcategorias.forEach((categoria) => {
      const enlace = document.createElement("a");

      enlace.textContent = categoria.nombre;

      enlace.href = `../paginas/producto.html?categoria=${encodeURIComponent(categoria.pagina)}`;

      contenedor.appendChild(enlace);
    });
  } catch (error) {
    console.error("Error al cargar categorías Bangladesh:", error);
  }
}

cargarCategoriasBangladesh();
