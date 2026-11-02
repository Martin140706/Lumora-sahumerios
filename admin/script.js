const API_URL = "http://localhost:3000";

const TOKEN_KEY = "lumora_admin_token";

let tokenAdmin = sessionStorage.getItem(TOKEN_KEY);

const loginAdmin = document.getElementById("login-admin");
const contenidoAdmin = document.getElementById("contenido-admin");
const formLogin = document.getElementById("form-login");
const mensajeLogin = document.getElementById("mensaje-login");
const botonCerrarSesion = document.getElementById("cerrar-sesion");

function mostrarPanelAdmin() {
  loginAdmin.hidden = true;
  contenidoAdmin.hidden = false;
  botonCerrarSesion.hidden = false;
}

function mostrarLoginAdmin(mensaje = "") {
  loginAdmin.hidden = false;
  contenidoAdmin.hidden = true;
  botonCerrarSesion.hidden = true;
  mensajeLogin.textContent = mensaje;
}
formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const password = document.getElementById("password-admin").value;
  const boton = formLogin.querySelector('button[type="submit"]');

  boton.disabled = true;
  boton.textContent = "Ingresando...";

  try {
    const respuesta = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo iniciar sesión.");
    }

    tokenAdmin = resultado.token;
    sessionStorage.setItem(TOKEN_KEY, tokenAdmin);

    formLogin.reset();
    mensajeLogin.textContent = "";

    mostrarPanelAdmin();
    await cargarProductos();
    await cargarCategoriasAdmin();
  } catch (error) {
    mensajeLogin.textContent = error.message;
  } finally {
    boton.disabled = false;
    boton.textContent = "Iniciar sesión";
  }
});

botonCerrarSesion.addEventListener("click", async () => {
  try {
    await fetch(`${API_URL}/api/admin/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
      },
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }

  sessionStorage.removeItem(TOKEN_KEY);
  tokenAdmin = null;

  mostrarLoginAdmin("Sesión cerrada correctamente.");
});

async function inicializarSesionAdmin() {
  if (!tokenAdmin) {
    mostrarLoginAdmin();
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/api/admin/verificar`, {
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
      },
    });

    if (!respuesta.ok) {
      throw new Error("La sesión expiró.");
    }

    mostrarPanelAdmin();
    await cargarProductos();
    await cargarCategoriasAdmin();
  } catch (error) {
    sessionStorage.removeItem(TOKEN_KEY);
    tokenAdmin = null;
    mostrarLoginAdmin("Tu sesión expiró. Iniciá sesión nuevamente.");
  }
}

inicializarSesionAdmin();

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
              Authorization: `Bearer ${tokenAdmin}`,
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
    const botonEliminar = document.createElement("button");

    botonEliminar.type = "button";
    botonEliminar.className = "boton boton-eliminar";
    botonEliminar.textContent = "Eliminar";

    botonEliminar.addEventListener("click", async () => {
      const confirmar = confirm(
        `¿Estás seguro de que querés eliminar "${p.nombre}"?\n\nEsta acción no se puede deshacer.`,
      );

      if (!confirmar) return;

      botonEliminar.disabled = true;
      botonEliminar.textContent = "Eliminando...";

      try {
        const respuesta = await fetch(
          `${API_URL}/api/productos/${encodeURIComponent(p.id)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${tokenAdmin}`,
            },
          },
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.error || "No se pudo eliminar el producto.",
          );
        }

        mostrarMensaje(`Se eliminó "${p.nombre}" correctamente.`, "exito");

        await cargarProductos();
      } catch (error) {
        console.error(error);
        mostrarMensaje(error.message, "error");
      } finally {
        botonEliminar.disabled = false;
        botonEliminar.textContent = "Eliminar";
      }
    });

    celdaAccion.appendChild(botonEliminar);

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

/* ========================================
   AGREGAR PRODUCTOS DESDE EL ADMIN
======================================== */

const botonAbrirFormulario = document.getElementById("abrir-formulario");
const formularioProducto = document.getElementById("formulario-producto");
const formAgregarProducto = document.getElementById("form-agregar-producto");
const selectorNuevaCategoria = document.getElementById("nueva-categoria");
const campoNuevoPrecio = document.getElementById("nuevo-precio");
const botonGuardarNuevo = document.getElementById("guardar-nuevo-producto");

async function cargarCategoriasFormulario() {
  try {
    const respuesta = await fetch(`${API_URL}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías.");
    }

    const categorias = await respuesta.json();

    selectorNuevaCategoria.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccioná una categoría";
    selectorNuevaCategoria.appendChild(opcionInicial);

    categorias.forEach((categoria) => {
      const opcion = document.createElement("option");
      opcion.value = categoria.id;
      opcion.textContent = categoria.nombre;

      selectorNuevaCategoria.appendChild(opcion);
    });
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message, "error");
  }
}

function actualizarPrecioSegunCategoria() {
  const categoria = productosCategorias.find(
    (c) => String(c.id) === selectorNuevaCategoria.value,
  );

  if (categoria && categoria.precio_general !== null) {
    campoNuevoPrecio.value = Number(categoria.precio_general);
    campoNuevoPrecio.disabled = true;
    campoNuevoPrecio.title =
      "Esta categoría utiliza un precio general compartido.";
  } else {
    campoNuevoPrecio.disabled = false;
    campoNuevoPrecio.title = "";
  }
}

let productosCategorias = [];

async function inicializarFormularioProducto() {
  try {
    const respuesta = await fetch(`${API_URL}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías.");
    }

    productosCategorias = await respuesta.json();

    selectorNuevaCategoria.replaceChildren();

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccioná una categoría";
    selectorNuevaCategoria.appendChild(opcionInicial);

    productosCategorias.forEach((categoria) => {
      const opcion = document.createElement("option");
      opcion.value = categoria.id;
      opcion.textContent = categoria.nombre;
      selectorNuevaCategoria.appendChild(opcion);
    });
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message, "error");
  }
}

botonAbrirFormulario.addEventListener("click", async () => {
  formularioProducto.hidden = false;
  botonAbrirFormulario.hidden = true;

  await inicializarFormularioProducto();
  actualizarPrecioSegunCategoria();

  document.getElementById("nuevo-nombre").focus();
});

selectorNuevaCategoria.addEventListener(
  "change",
  actualizarPrecioSegunCategoria,
);

document
  .getElementById("cancelar-nuevo-producto")
  .addEventListener("click", () => {
    formAgregarProducto.reset();
    document.getElementById("nuevo-stock").value = "0";
    formularioProducto.hidden = true;
    botonAbrirFormulario.hidden = false;
    mostrarMensaje("Alta de producto cancelada.");
  });

formAgregarProducto.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre = document.getElementById("nuevo-nombre").value.trim();
  const categoriaId = selectorNuevaCategoria.value;
  const id = document.getElementById("nuevo-id").value.trim();
  const precio = campoNuevoPrecio.value;
  const stock = document.getElementById("nuevo-stock").value;

  if (!nombre || !categoriaId || precio === "" || stock === "") {
    mostrarMensaje("Completá todos los campos obligatorios.", "error");
    return;
  }

  if (
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    !Number.isSafeInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    mostrarMensaje("Revisá el precio y el stock ingresados.", "error");
    return;
  }

  botonGuardarNuevo.disabled = true;
  botonGuardarNuevo.textContent = "Guardando...";

  try {
    const respuesta = await fetch(`${API_URL}/api/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        nombre,
        categoria_id: categoriaId,
        id,
        precio: Number(precio),
        stock: Number(stock),
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo crear el producto.");
    }

    mostrarMensaje(
      `¡Producto "${resultado.producto.nombre}" creado correctamente!`,
      "exito",
    );

    formAgregarProducto.reset();
    document.getElementById("nuevo-stock").value = "0";
    formularioProducto.hidden = true;
    botonAbrirFormulario.hidden = false;

    await cargarProductos();
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message, "error");
  } finally {
    botonGuardarNuevo.disabled = false;
    botonGuardarNuevo.textContent = "Guardar producto";
  }
});

/* ========================================
   AGREGAR CATEGORÍAS DESDE EL ADMIN
======================================== */

const botonAbrirCategoria = document.getElementById(
  "abrir-formulario-categoria",
);

const formularioCategoria = document.getElementById("formulario-categoria");

const formAgregarCategoria = document.getElementById("form-agregar-categoria");

const botonGuardarCategoria = document.getElementById(
  "guardar-nueva-categoria",
);

botonAbrirCategoria.addEventListener("click", () => {
  formularioCategoria.hidden = false;
  botonAbrirCategoria.hidden = true;

  document.getElementById("categoria-nombre").focus();
});

document
  .getElementById("cancelar-nueva-categoria")
  .addEventListener("click", () => {
    formAgregarCategoria.reset();
    formularioCategoria.hidden = true;
    botonAbrirCategoria.hidden = false;
    mostrarMensaje("Alta de categoría cancelada.");
  });

formAgregarCategoria.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const nombre = document.getElementById("categoria-nombre").value.trim();

  const pagina = document.getElementById("categoria-pagina").value.trim();

  const paginaPadre = document.getElementById("categoria-pagina-padre").value;

  const detalle = document.getElementById("categoria-detalle").value.trim();

  const precioTexto = document.getElementById("categoria-precio-general").value;

  const precioGeneral = precioTexto === "" ? null : Number(precioTexto);

  if (!nombre || !pagina || !paginaPadre) {
    mostrarMensaje(
      "Completá el nombre, el identificador y la página donde aparecerá la categoría.",
      "error",
    );
    return;
  }

  if (
    precioGeneral !== null &&
    (!Number.isFinite(precioGeneral) || precioGeneral < 0)
  ) {
    mostrarMensaje("Ingresá un precio general válido.", "error");
    return;
  }

  botonGuardarCategoria.disabled = true;
  botonGuardarCategoria.textContent = "Guardando...";

  try {
    const respuesta = await fetch(`${API_URL}/api/categorias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },

      body: JSON.stringify({
        nombre,
        pagina,
        pagina_padre: paginaPadre,
        detalle,
        precio_general: precioGeneral,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo crear la categoría.");
    }

    mostrarMensaje(
      `¡Categoría "${resultado.categoria.nombre}" creada correctamente!`,
      "exito",
    );

    formAgregarCategoria.reset();
    formularioCategoria.hidden = true;
    botonAbrirCategoria.hidden = false;

    // Actualizar el selector del formulario de productos.
    if (typeof inicializarFormularioProducto === "function") {
      await inicializarFormularioProducto();
    }

    // Actualizar el catálogo del administrador.
    await cargarProductos();
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message, "error");
  } finally {
    botonGuardarCategoria.disabled = false;
    botonGuardarCategoria.textContent = "Guardar categoría";
  }
});

/* ========================================
   ADMINISTRAR CATEGORÍAS
======================================== */

const tablaCategorias = document.getElementById("tabla-categorias");
const mensajeCategorias = document.getElementById("mensaje-categorias");
const botonRecargarCategorias = document.getElementById("recargar-categorias");

async function cargarCategoriasAdmin() {
  mensajeCategorias.textContent = "Cargando categorías...";
  tablaCategorias.replaceChildren();

  try {
    const respuesta = await fetch(`${API_URL}/api/categorias`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las categorías.");
    }

    const categorias = await respuesta.json();

    if (categorias.length === 0) {
      mensajeCategorias.textContent = "Todavía no hay categorías creadas.";
      return;
    }

    categorias.forEach((categoria) => {
      const fila = document.createElement("tr");

      const nombre = document.createElement("td");
      nombre.textContent = categoria.nombre;

      const identificador = document.createElement("td");
      identificador.textContent = categoria.id;

      const pagina = document.createElement("td");
      pagina.textContent = categoria.pagina_padre || "Sin página";

      const precio = document.createElement("td");
      precio.textContent =
        categoria.precio_general !== null
          ? `$${Number(categoria.precio_general).toLocaleString("es-AR")}`
          : "Individual";

      const accion = document.createElement("td");

      const botonEliminar = document.createElement("button");
      botonEliminar.type = "button";
      botonEliminar.className = "boton boton-eliminar";
      botonEliminar.textContent = "Eliminar";

      botonEliminar.addEventListener("click", async () => {
        const confirmar = confirm(
          `¿Querés eliminar la categoría "${categoria.nombre}"?\n\nEsta acción no se puede deshacer.`,
        );

        if (!confirmar) return;

        botonEliminar.disabled = true;
        botonEliminar.textContent = "Eliminando...";

        try {
          const respuesta = await fetch(
            `${API_URL}/api/categorias/${encodeURIComponent(categoria.id)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${tokenAdmin}`,
              },
            },
          );

          const resultado = await respuesta.json();

          if (!respuesta.ok) {
            throw new Error(
              resultado.error || "No se pudo eliminar la categoría.",
            );
          }

          mensajeCategorias.textContent = `Categoría "${categoria.nombre}" eliminada correctamente.`;

          await cargarCategoriasAdmin();
          await cargarProductos();
        } catch (error) {
          console.error(error);
          mensajeCategorias.textContent = error.message;
          botonEliminar.disabled = false;
          botonEliminar.textContent = "Eliminar";
        }
      });

      accion.appendChild(botonEliminar);

      fila.append(nombre, identificador, pagina, precio, accion);
      tablaCategorias.appendChild(fila);
    });

    mensajeCategorias.textContent = `Se encontraron ${categorias.length} categorías.`;
  } catch (error) {
    console.error(error);
    mensajeCategorias.textContent = error.message;
  }
}

botonRecargarCategorias.addEventListener("click", cargarCategoriasAdmin);
