// ========================================
// CARRITO
// ========================================

let carrito = JSON.parse(localStorage.getItem("carrito")) || {};

// ========================================
// CATÁLOGO
// ========================================

let catalogo = {};
let cargandoProductos = false;

// ========================================
// URL DE LA API
// ========================================

const API_URL = "http://localhost:3000";

// ========================================
// GUARDAR CARRITO
// ========================================

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// ========================================
// NOTIFICACIÓN
// ========================================

function mostrarNotificacion(mensaje) {
  const notificacion = document.getElementById("notificacion");

  if (!notificacion) return;

  notificacion.textContent = mensaje;

  notificacion.classList.add("mostrar");

  setTimeout(() => {
    notificacion.classList.remove("mostrar");
  }, 2000);
}

// ========================================
// BOTÓN DEL CARRITO
// ========================================

function actualizarBotonCarrito() {
  const boton = document.getElementById("ver-carrito");

  if (!boton) return;

  let cantidadTotal = 0;

  for (const id in carrito) {
    cantidadTotal += carrito[id].cantidad;
  }

  if (cantidadTotal > 0) {
    boton.textContent = `🛒 Mi carrito · ${cantidadTotal}`;
  } else {
    boton.textContent = "🛒 Ver mi carrito";
  }
}

// ========================================
// DETECTAR CATEGORÍA
// ========================================

function obtenerCategoria() {
  const parametros = new URLSearchParams(window.location.search);

  const categoria = parametros.get("categoria");

  if (categoria) {
    return categoria;
  }

  const pagina = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "")
    .toLowerCase();

  return pagina;
}

// ========================================
// OBTENER PRECIO DEL PRODUCTO
// ========================================

function obtenerPrecioProducto(producto, datos) {
  if (producto.precio !== undefined) {
    return producto.precio;
  }

  return datos.precio;
}

// ========================================
// CARGAR PRODUCTOS DESDE LA API
// ========================================

async function cargarProductos() {
  const lista = document.getElementById("lista-productos");

  // Evitar que se carguen los productos dos veces al mismo tiempo
  if (cargandoProductos) return;

  cargandoProductos = true;

  if (lista) {
    lista.innerHTML = "";
  }

  try {
    const respuesta = await fetch(`${API_URL}/api/productos`);

    if (!respuesta.ok) {
      throw new Error("No se pudieron obtener los productos");
    }

    const productos = await respuesta.json();

    // ========================================
    // ARMAR CATÁLOGO
    // ========================================

    catalogo = {};

    productos.forEach((producto) => {
      const claveCategoria = producto.pagina;

      if (!catalogo[claveCategoria]) {
        catalogo[claveCategoria] = {
          nombre: producto.categoria,
          pagina: producto.pagina,
          detalle: producto.detalle || "",

          precio:
            producto.precio_general !== null
              ? Number(producto.precio_general)
              : undefined,

          productos: [],
        };
      }

      catalogo[claveCategoria].productos.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        stock: Number(producto.stock),
      });
    });
    // Si estamos en carrito.html, cargamos el catálogo
    // para poder buscar los productos, sin dibujar la lista.
    if (!lista) return;

    // ========================================
    // DETECTAR CATEGORÍA
    // ========================================

    const categoria = obtenerCategoria();

    const datos = catalogo[categoria];

    if (!datos) {
      console.warn("No se encontró la categoría:", categoria);

      lista.innerHTML = `
        <p>
          No se encontró esta categoría.
        </p>
      `;

      return;
    }

    // ========================================
    // TÍTULO
    // ========================================

    const titulo = document.getElementById("titulo-producto");

    if (titulo) {
      titulo.textContent = datos.nombre;
    }

    // ========================================
    // DESCRIPCIÓN
    // ========================================

    const descripcion = document.getElementById("descripcion-producto");

    if (descripcion) {
      const tienePrecioGeneral = datos.precio !== undefined;

      descripcion.innerHTML = `
        ${datos.productos.length} productos
        ${datos.detalle ? ` · ${datos.detalle}` : ""}
        ${
          tienePrecioGeneral
            ? `
              ·
              <span class="precio-producto">
                $${datos.precio.toLocaleString("es-AR")}
              </span>
            `
            : ""
        }
      `;
    }

    // ========================================
    // CREAR PRODUCTOS
    // ========================================

    datos.productos.forEach((productoDatos) => {
      crearProducto(lista, productoDatos, datos);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);

    if (lista) {
      lista.innerHTML = `
        <p>
          No se pudieron cargar los productos.
        </p>
      `;
    }
  } finally {
    cargandoProductos = false;
  }
}

// ========================================
// CREAR PRODUCTO
// ========================================

function crearProducto(lista, productoDatos, datos) {
  const id = productoDatos.id;
  const nombre = productoDatos.nombre;
  const stock = productoDatos.stock;
  const precio = obtenerPrecioProducto(productoDatos, datos);

  // Si la categoría tiene precio general,
  // no mostramos el precio en cada producto.
  const precioIndividual = datos.precio === undefined;

  const producto = document.createElement("div");

  producto.dataset.productoId = id;
  producto.classList.add("producto-lista");

  // ========================================
  // PRODUCTO AGOTADO
  // ========================================

  if (stock <= 0) {
    producto.innerHTML = `
      <div class="producto-info">

        <span class="nombre-producto">
          ${nombre}
        </span>

        ${
          precioIndividual
            ? `
              <span class="precio-lista">
                $${precio.toLocaleString("es-AR")}
              </span>
            `
            : ""
        }

      </div>

      <span class="agotado">
        AGOTADO
      </span>
    `;

    lista.appendChild(producto);

    return;
  }

  // ========================================
  // CANTIDAD ACTUAL
  // ========================================

  const cantidad = carrito[id] ? carrito[id].cantidad : 0;

  // ========================================
  // PRODUCTO DISPONIBLE
  // ========================================

  producto.innerHTML = `
    <div class="producto-info">

      <span class="nombre-producto">
        ${nombre}
      </span>

      ${
        precioIndividual
          ? `
            <span class="precio-lista">
              $${precio.toLocaleString("es-AR")}
            </span>
          `
          : ""
      }

    </div>

    <div class="producto-controles">

      <span class="mensaje-stock"></span>

      <div class="cantidad">

        <button class="menos">
          −
        </button>

        <span class="numero">
          ${cantidad}
        </span>

        <button class="mas">
          +
        </button>

      </div>

    </div>
  `;

  const botonMenos = producto.querySelector(".menos");
  const botonMas = producto.querySelector(".mas");
  const numero = producto.querySelector(".numero");
  const mensajeStock = producto.querySelector(".mensaje-stock");

  // ========================================
  // MENSAJE DE STOCK
  // ========================================

  function actualizarMensajeStock() {
    const cantidadActual = carrito[id] ? carrito[id].cantidad : 0;

    const restantes = stock - cantidadActual;

    if (restantes > 0 && restantes <= 2) {
      mensajeStock.textContent = "⚠️ Últimas unidades";
      mensajeStock.classList.add("mostrar-stock");
    } else {
      mensajeStock.textContent = "";
      mensajeStock.classList.remove("mostrar-stock");
    }
  }

  actualizarMensajeStock();

  // ========================================
  // SUMAR
  // ========================================

  botonMas.addEventListener("click", () => {
    const cantidadActual = carrito[id] ? carrito[id].cantidad : 0;

    if (cantidadActual >= stock) {
      mostrarNotificacion("⚠️ No hay más unidades disponibles");

      return;
    }

    const nuevaCantidad = cantidadActual + 1;

    carrito[id] = {
      cantidad: nuevaCantidad,
      nombre: nombre,
      precio: precio,
      categoria: datos.nombre,
    };

    numero.textContent = nuevaCantidad;

    guardarCarrito();

    actualizarMensajeStock();

    actualizarBotonCarrito();

    mostrarNotificacion(`✓ ${nombre} × ${nuevaCantidad}`);
  });

  // ========================================
  // RESTAR
  // ========================================

  botonMenos.addEventListener("click", () => {
    const cantidadActual = carrito[id] ? carrito[id].cantidad : 0;

    if (cantidadActual <= 0) {
      return;
    }

    const nuevaCantidad = cantidadActual - 1;

    if (nuevaCantidad === 0) {
      delete carrito[id];
    } else {
      carrito[id] = {
        ...carrito[id],
        cantidad: nuevaCantidad,
      };
    }

    numero.textContent = nuevaCantidad;

    guardarCarrito();

    actualizarMensajeStock();

    actualizarBotonCarrito();

    mostrarNotificacion(`✓ ${nombre} × ${nuevaCantidad}`);
  });

  lista.appendChild(producto);
}

// ========================================
// BUSCAR PRODUCTO POR ID
// ========================================

function buscarProducto(id) {
  for (const categoria in catalogo) {
    const datos = catalogo[categoria];

    const producto = datos.productos.find((producto) => producto.id === id);

    if (producto) {
      return {
        ...producto,

        precio: obtenerPrecioProducto(producto, datos),

        categoria: datos.nombre,
      };
    }
  }

  return null;
}

// ========================================
// MOSTRAR CARRITO
// ========================================

function mostrarCarrito() {
  const lista = document.getElementById("carrito");

  if (!lista) return;

  lista.innerHTML = "";

  let total = 0;

  const productos = Object.keys(carrito);

  // ========================================
  // CARRITO VACÍO
  // ========================================

  if (productos.length === 0) {
    lista.innerHTML = `
      <p class="carrito-vacio">
        Tu carrito está vacío.
      </p>
    `;

    actualizarTotalCarrito(0);

    return;
  }

  // ========================================
  // PRODUCTOS
  // ========================================

  productos.forEach((id) => {
    const item = carrito[id];

    const datosProducto = buscarProducto(id);

    if (!datosProducto) return;

    const cantidad = item.cantidad;
    const precio = datosProducto.precio;

    const subtotal = cantidad * precio;

    total += subtotal;

    const producto = document.createElement("div");

    producto.classList.add("producto-carrito");

    producto.innerHTML = `
      <div class="info-carrito">

        <h3>
          ${datosProducto.nombre}
        </h3>

        <p>
          ${datosProducto.categoria}
        </p>

        <p>
          $${precio.toLocaleString("es-AR")}
          c/u
        </p>

      </div>

      <div class="cantidad-carrito">

        <button class="menos-carrito">
          −
        </button>

        <span class="numero-carrito">
          ${cantidad}
        </span>

        <button class="mas-carrito">
          +
        </button>

      </div>

      <strong class="subtotal-carrito">
        $${subtotal.toLocaleString("es-AR")}
      </strong>
    `;

    // ========================================
    // RESTAR DESDE EL CARRITO
    // ========================================

    producto.querySelector(".menos-carrito").addEventListener("click", () => {
      if (carrito[id].cantidad > 1) {
        carrito[id].cantidad--;
      } else {
        delete carrito[id];
      }

      guardarCarrito();

      mostrarCarrito();

      actualizarBotonCarrito();
    });

    // ========================================
    // SUMAR DESDE EL CARRITO
    // ========================================

    producto.querySelector(".mas-carrito").addEventListener("click", () => {
      const stock = datosProducto.stock;

      if (carrito[id].cantidad >= stock) {
        mostrarNotificacion("⚠️ No hay más unidades disponibles");

        return;
      }

      carrito[id].cantidad++;

      guardarCarrito();

      mostrarCarrito();

      actualizarBotonCarrito();
    });

    lista.appendChild(producto);
  });

  actualizarTotalCarrito(total);
}

// ========================================
// TOTAL DEL CARRITO
// ========================================

function actualizarTotalCarrito(total) {
  const elemento = document.getElementById("total-carrito");

  if (!elemento) return;

  elemento.textContent = total.toLocaleString("es-AR");
}

// ========================================
// VACIAR CARRITO
// ========================================

const botonVaciar = document.getElementById("vaciar-carrito");

if (botonVaciar) {
  botonVaciar.addEventListener("click", () => {
    carrito = {};

    guardarCarrito();

    mostrarCarrito();

    actualizarBotonCarrito();
  });
}

// ========================================
// WHATSAPP Y CONFIRMACIÓN DEL PEDIDO
// ========================================

const botonWhatsapp = document.getElementById("whatsapp");

if (botonWhatsapp) {
  botonWhatsapp.addEventListener("click", async () => {
    const ids = Object.keys(carrito);

    if (ids.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    // Verificar que todos los productos existan en el catálogo
    const items = [];

    for (const id of ids) {
      const item = carrito[id];
      const datos = buscarProducto(id);

      if (!datos || !Number.isSafeInteger(item.cantidad) || item.cantidad < 1) {
        alert(
          "No pudimos verificar todos los productos. " +
            "Recargá la página e intentá nuevamente.",
        );
        return;
      }

      items.push({
        id,
        cantidad: item.cantidad,
        datos,
      });
    }

    let mensaje = "Hola! 👋 Quiero hacer el siguiente pedido:\n\n";
    let total = 0;

    for (const item of items) {
      const subtotal = item.cantidad * item.datos.precio;
      total += subtotal;

      mensaje +=
        `• ${item.datos.categoria} - ${item.datos.nombre}` +
        ` × ${item.cantidad} — ` +
        `$${subtotal.toLocaleString("es-AR")}\n`;
    }

    mensaje += `\n💰 Total: $${total.toLocaleString("es-AR")}`;

    // Mantener el número de WhatsApp de Lumora
    const numeroWhatsapp = "5491134262043";

    const url =
      `https://wa.me/${numeroWhatsapp}?text=` + encodeURIComponent(mensaje);

    // Abrir una pestaña desde el clic para evitar
    // que el navegador bloquee WhatsApp después del fetch.
    const ventanaWhatsapp = window.open("about:blank", "_blank");

    if (!ventanaWhatsapp) {
      alert(
        "El navegador bloqueó la nueva pestaña. " +
          "Permití las ventanas emergentes e intentá nuevamente.",
      );
      return;
    }

    botonWhatsapp.disabled = true;

    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productos: items.map(({ id, cantidad }) => ({
            id,
            cantidad,
          })),
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo procesar el pedido.");
      }

      // Actualizar el stock del catálogo local
      for (const actualizado of resultado.productos) {
        for (const categoria in catalogo) {
          const producto = catalogo[categoria].productos.find(
            (p) => p.id === actualizado.id,
          );

          if (producto) {
            producto.stock = actualizado.stockRestante;
          }
        }
      }

      // Abrir WhatsApp solamente si el stock se descontó
      ventanaWhatsapp.location.href = url;

      // Vaciar el carrito después de confirmar el descuento
      carrito = {};
      guardarCarrito();

      mostrarCarrito();
      actualizarBotonCarrito();

      alert(
        "¡Pedido procesado con éxito! 🎉\n\n" +
          "Se actualizó el stock y se abrió WhatsApp " +
          "para enviar el pedido.",
      );
    } catch (error) {
      ventanaWhatsapp.close();

      console.error("Error al procesar el pedido:", error);

      alert(error.message || "Ocurrió un error al procesar el pedido.");
    } finally {
      botonWhatsapp.disabled = false;
    }
  });
}

// ========================================
// BOTÓN VER CARRITO
// ========================================

const botonCarrito = document.getElementById("ver-carrito");

if (botonCarrito) {
  botonCarrito.addEventListener("click", () => {
    window.location.href = "../../../carrito.html";
  });
}

// ========================================
// ACTUALIZAR AL VOLVER
// ========================================

window.addEventListener("pageshow", async () => {
  carrito = JSON.parse(localStorage.getItem("carrito")) || {};

  actualizarBotonCarrito();

  // ========================================
  // ESPERAR A QUE EL CATÁLOGO ESTÉ CARGADO
  // ========================================

  if (
    (document.getElementById("lista-productos") ||
      document.getElementById("carrito")) &&
    Object.keys(catalogo).length === 0
  ) {
    await cargarProductos();
  }

  // ========================================
  // ACTUALIZAR CANTIDADES
  // ========================================

  const lista = document.querySelector("[id^='lista-'], #lista-productos");

  if (lista) {
    const categoria = obtenerCategoria();

    const datos = catalogo[categoria];

    if (datos) {
      datos.productos.forEach((productoDatos) => {
        const id = productoDatos.id;

        const elemento = lista.querySelector(`[data-producto-id="${id}"]`);

        if (!elemento) return;

        const numero = elemento.querySelector(".numero");

        if (!numero) return;

        const cantidad = carrito[id] ? carrito[id].cantidad : 0;

        numero.textContent = cantidad;

        const mensajeStock = elemento.querySelector(".mensaje-stock");

        if (mensajeStock) {
          const restantes = productoDatos.stock - cantidad;

          if (restantes > 0 && restantes <= 2) {
            mensajeStock.textContent = "⚠️ Últimas unidades";

            mensajeStock.classList.add("mostrar-stock");
          } else {
            mensajeStock.textContent = "";

            mensajeStock.classList.remove("mostrar-stock");
          }
        }
      });
    }
  }

  if (document.getElementById("carrito")) {
    mostrarCarrito();
  }
});

// ========================================
// BOTÓN VOLVER
// ========================================

function crearBotonVolver() {
  const boton = document.createElement("button");

  boton.className = "boton-volver";

  boton.innerHTML = "";

  boton.setAttribute("aria-label", "Volver atrás");

  boton.title = "Volver atrás";

  boton.addEventListener("click", () => {
    window.history.back();
  });

  document.body.appendChild(boton);
}

// ========================================
// BOTÓN VOLVER DE ABAJO
// ========================================

const volverAbajo = document.getElementById("volver-abajo");

if (volverAbajo) {
  volverAbajo.addEventListener("click", () => {
    window.history.back();
  });
}

// ========================================
// INICIAR
// ========================================

async function iniciarTienda() {
  actualizarBotonCarrito();

  await cargarProductos();

  mostrarCarrito();
}

iniciarTienda();

if (
  !window.location.pathname.endsWith("index.html") &&
  window.location.pathname !== "/"
) {
  crearBotonVolver();
}
