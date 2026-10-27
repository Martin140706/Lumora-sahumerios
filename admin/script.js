const API_URL = "http://localhost:3000";

const tabla = document.getElementById("tabla-productos");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroStock = document.getElementById("filtro-stock");
const mensaje = document.getElementById("mensaje");

let productos = [];

function mostrarMensaje(texto, tipo = "") {
  mensaje.textContent = texto;
  mensaje.className = "mensaje";

  if (tipo) {
    mensaje.classList.add(tipo);
  }
}

function formatoPrecio(precio) {
  return Number(precio).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  });
}

async function cargarProductos() {
  mostrarMensaje("Cargando productos...");

  try {
    const respuesta = await fetch(`${API_URL}/api/productos`);

    if (!respuesta.ok) {
      throw new Error("La API no pudo devolver los productos.");
    }

    productos = await respuesta.json();

    cargarCategorias();
    actualizarResumen();
    renderizarProductos();

    mostrarMensaje(`Se cargaron ${productos.length} productos.`);
  } catch (error) {
    console.error(error);

    mostrarMensaje(
      "No se pudo conectar con la API. Verificá que Node.js esté funcionando.",
      "error",
    );
  }
}

function cargarCategorias() {
  const seleccionActual = filtroCategoria.value;

  const categorias = [...new Set(productos.map((p) => p.pagina))].filter(
    Boolean,
  );

  filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';

  categorias.sort().forEach((pagina) => {
    const producto = productos.find((p) => p.pagina === pagina);

    const opcion = document.createElement("option");
    opcion.value = pagina;
    opcion.textContent = producto?.categoria || pagina;

    filtroCategoria.appendChild(opcion);
  });

  if (categorias.includes(seleccionActual)) {
    filtroCategoria.value = seleccionActual;
  }
}

function actualizarResumen() {
  document.getElementById("total-productos").textContent = productos.length;

  document.getElementById("disponibles").textContent = productos.filter(
    (p) => Number(p.stock) > 0,
  ).length;

  document.getElementById("agotados").textContent = productos.filter(
    (p) => Number(p.stock) <= 0,
  ).length;
}

function renderizarProductos() {
  tabla.replaceChildren();

  const busqueda = buscador.value.trim().toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;
  const estadoStock = filtroStock.value;

  const filtrados = productos.filter((p) => {
    const coincideBusqueda =
      String(p.nombre).toLowerCase().includes(busqueda) ||
      String(p.categoria).toLowerCase().includes(busqueda) ||
      String(p.id).toLowerCase().includes(busqueda);

    const coincideCategoria =
      !categoriaSeleccionada || p.pagina === categoriaSeleccionada;

    const coincideStock =
      !estadoStock ||
      (estadoStock === "disponible" && Number(p.stock) > 0) ||
      (estadoStock === "agotado" && Number(p.stock) <= 0);

    return coincideBusqueda && coincideCategoria && coincideStock;
  });

  if (filtrados.length === 0) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 5;
    celda.textContent = "No se encontraron productos.";

    fila.appendChild(celda);
    tabla.appendChild(fila);

    return;
  }

  filtrados.forEach((p) => {
    const fila = document.createElement("tr");

    const nombre = document.createElement("td");
    nombre.className = "nombre";
    nombre.textContent = p.nombre;

    const categoria = document.createElement("td");
    categoria.className = "categoria";
    categoria.textContent = p.categoria;

    const celdaPrecio = document.createElement("td");
    const campoPrecio = document.createElement("input");

    campoPrecio.type = "number";
    campoPrecio.min = "0";
    campoPrecio.step = "0.01";
    campoPrecio.value = Number(p.precio);
    campoPrecio.className = "campo";
    campoPrecio.setAttribute("aria-label", `Precio de ${p.nombre}`);

    const celdaStock = document.createElement("td");
    const campoStock = document.createElement("input");

    campoStock.type = "number";
    campoStock.min = "0";
    campoStock.step = "1";
    campoStock.value = Number(p.stock);
    campoStock.className = "campo";
    campoStock.setAttribute("aria-label", `Stock de ${p.nombre}`);

    celdaPrecio.appendChild(campoPrecio);
    celdaStock.appendChild(campoStock);

    const celdaAccion = document.createElement("td");
    const botonGuardar = document.createElement("button");

    botonGuardar.type = "button";
    botonGuardar.className = "boton boton-guardar";
    botonGuardar.textContent = "Guardar";

    botonGuardar.addEventListener("click", async () => {
      const precio = campoPrecio.value;
      const stock = campoStock.value;

      if (
        precio.trim() === "" ||
        stock.trim() === "" ||
        !Number.isFinite(Number(precio)) ||
        !Number.isInteger(Number(stock)) ||
        Number(precio) < 0 ||
        Number(stock) < 0
      ) {
        mostrarMensaje(
          "Ingresá un precio válido y un stock entero igual o mayor que cero.",
          "error",
        );

        return;
      }

      botonGuardar.disabled = true;
      botonGuardar.textContent = "Guardando...";

      try {
        const respuesta = await fetch(
          `${API_URL}/api/productos/${encodeURIComponent(p.id)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              precio: Number(precio),
              stock: Number(stock),
            }),
          },
        );

        const texto = await respuesta.text();

        console.log("URL solicitada:", respuesta.url);
        console.log("Estado HTTP:", respuesta.status);
        console.log("Respuesta recibida:", texto);

        const resultado = JSON.parse(texto);

        if (!respuesta.ok) {
          throw new Error(resultado.error || "No se pudo guardar el producto.");
        }

        mostrarMensaje(`Se guardaron los cambios de "${p.nombre}".`, "exito");

        await cargarProductos();
      } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, "error");
      } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = "Guardar";
      }
    });

    celdaAccion.appendChild(botonGuardar);

    const celdaEstado = document.createElement("td");
    celdaEstado.className =
      Number(p.stock) > 0 ? "stock-disponible" : "stock-agotado";
    celdaEstado.textContent = Number(p.stock) > 0 ? "Disponible" : "Agotado";

    // Se muestra el estado junto al nombre para mantener la tabla compacta.
    nombre.appendChild(document.createElement("br"));
    nombre.appendChild(celdaEstado);

    fila.append(nombre, categoria, celdaPrecio, celdaStock, celdaAccion);
    tabla.appendChild(fila);
  });
}

buscador.addEventListener("input", renderizarProductos);
filtroCategoria.addEventListener("change", renderizarProductos);
filtroStock.addEventListener("change", renderizarProductos);

document.getElementById("recargar").addEventListener("click", cargarProductos);

cargarProductos();
