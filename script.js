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
  const pagina = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "")
    .toLowerCase();

  return pagina;
}

// ========================================
// CARGAR PRODUCTOS
// ========================================

function cargarProductos() {
  const lista = document.querySelector("[id^='lista-']");

  if (!lista) return;

  const categoria = obtenerCategoria();

  const datos = catalogo[categoria];

  if (!datos) {
    console.warn("No se encontró la categoría:", categoria);

    return;
  }

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

  const producto = document.createElement("div");

  producto.classList.add("producto-lista");

  // Cantidad actual del carrito

  const cantidad = carrito[id] ? carrito[id].cantidad : 0;

  // ========================================
  // AGOTADO
  // ========================================

  if (stock <= 0) {
    producto.innerHTML = `

      <span class="nombre-producto">
        ${nombre}
      </span>

      <span></span>

      <span class="agotado">
        AGOTADO
      </span>

    `;
  }

  // ========================================
  // DISPONIBLE
  // ========================================
  else {
    producto.innerHTML = `

      <span class="nombre-producto">
        ${nombre}
      </span>

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
        precio: datos.precio,
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
  }

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

        precio: datos.precio,

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

      mensaje += `• ${datos.categoria} - ${datos.nombre} × ${item.cantidad} — $${subtotal.toLocaleString("es-AR")}\n`;
    });

    mensaje += `\n💰 Total: $${total.toLocaleString("es-AR")}`;

    // CAMBIAR POR TU NÚMERO
    const numeroWhatsapp = "5491134262043";

    const url = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`;

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

  if (document.getElementById("carrito")) {
    mostrarCarrito();
  }
});

// ========================================
// INICIAR
// ========================================

cargarProductos();

mostrarCarrito();

actualizarBotonCarrito();
