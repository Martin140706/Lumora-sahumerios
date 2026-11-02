const API_URL_CATEGORIAS = "https://lumora-api-ecb1.onrender.com";

async function cargarCategoriasAromanza() {
  const contenedor = document.getElementById("categorias-iluminarte");

  if (!contenedor) return;

  try {
    const respuesta = await fetch(`${API_URL_CATEGORIAS}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías.");
    }

    const categorias = await respuesta.json();

    const categoriasIluminarte = categorias.filter(
      (categoria) => categoria.pagina_padre === "iluminarte",
    );

    categoriasIluminarte.forEach((categoria) => {
      const enlace = document.createElement("a");

      enlace.href = `../paginas/producto.html?categoria=${encodeURIComponent(
        categoria.pagina,
      )}`;

      enlace.textContent = categoria.nombre;

      contenedor.appendChild(enlace);
    });
  } catch (error) {
    console.error("Error al cargar las categorías de Aromanza:", error);
  }
}

cargarCategoriasAromanza();
