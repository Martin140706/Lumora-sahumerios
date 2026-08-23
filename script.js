// ========================================
// CARRITO
// ========================================

let carrito = JSON.parse(localStorage.getItem("carrito")) || {};

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
// ¿MUESTRA PRECIO INDIVIDUAL?
// ========================================

function muestraPrecioIndividual(producto, datos) {
  return datos.precioIndividual === true || producto.precio !== undefined;
}

// ========================================
// CARGAR PRODUCTOS
// ========================================

function cargarProductos() {
  const lista = document.getElementById("lista-productos");

  if (!lista) return;

  lista.innerHTML = "";

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
}
// ========================================
// CREAR PRODUCTO
// ========================================

function crearProducto(lista, productoDatos, datos) {
  const id = productoDatos.id;
  const nombre = productoDatos.nombre;
  const stock = productoDatos.stock;
  const precio = obtenerPrecioProducto(productoDatos, datos);

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
          productoDatos.precio !== undefined
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
        productoDatos.precio !== undefined
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
// WHATSAPP
// ========================================

const botonWhatsapp = document.getElementById("whatsapp");

if (botonWhatsapp) {
  botonWhatsapp.addEventListener("click", () => {
    const productos = Object.keys(carrito);

    if (productos.length === 0) {
      alert("Tu carrito está vacío.");

      return;
    }

    let mensaje = "Hola! 👋 Quiero hacer el siguiente pedido:\n\n";

    let total = 0;

    productos.forEach((id) => {
      const item = carrito[id];

      const datos = buscarProducto(id);

      if (!datos) return;

      const subtotal = item.cantidad * datos.precio;

      total += subtotal;

      mensaje += `• ${datos.categoria} - ${datos.nombre} × ${item.cantidad} — $${subtotal.toLocaleString(
        "es-AR",
      )}\n`;
    });

    mensaje += `\n💰 Total: $${total.toLocaleString("es-AR")}`;

    const numeroWhatsapp = "5491134262043";

    const url = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(
      mensaje,
    )}`;

    window.open(url, "_blank");
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

window.addEventListener("pageshow", () => {
  carrito = JSON.parse(localStorage.getItem("carrito")) || {};

  actualizarBotonCarrito();

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

cargarProductos();

mostrarCarrito();

actualizarBotonCarrito();

if (
  !window.location.pathname.endsWith("index.html") &&
  window.location.pathname !== "/"
) {
  crearBotonVolver();
}
