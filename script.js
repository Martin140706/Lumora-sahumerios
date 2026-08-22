// ========================================
// PRODUCTOS - AROMANZA TIBETANOS
// ========================================

const tibetanos = [
  { nombre: "Berry Kiss", stock: 5 },
  { nombre: "Citronella", stock: 5 },
  { nombre: "Coco", stock: 5 },
  { nombre: "Diamante Negro", stock: 5 },
  { nombre: "Dulces Frutillas", stock: 5 },
  { nombre: "Frescura del Bosque", stock: 5 },
  { nombre: "Frutos Rojos", stock: 5 },
  { nombre: "Gardenias Flores Blancas", stock: 5 },
  { nombre: "Incienso Consagrado", stock: 5 },
  { nombre: "Lavandas del Valle", stock: 5 },
  { nombre: "Manzana Canela", stock: 5 },
  { nombre: "Miel Orgánica", stock: 5 },
  { nombre: "Mirra Consagrada", stock: 5 },
  { nombre: "Néctar de los Dioses", stock: 5 },
  { nombre: "Premium Lemon", stock: 5 },
  { nombre: "Protección Energética", stock: 5 },
  { nombre: "Real Champa", stock: 5 },
  { nombre: "Rosa Real", stock: 5 },
  { nombre: "Super Palo Santo", stock: 5 },
  { nombre: "Sándalo Hindú", stock: 5 },
  { nombre: "Canela Mística", stock: 5 },
  { nombre: "Choco Dubai", stock: 5 },
  { nombre: "Cappuccino Italiano", stock: 5 },
  { nombre: "Energía Reiki", stock: 5 },
  { nombre: "Flores de Manzanilla", stock: 5 },
  { nombre: "Titanium", stock: 5 },
];

const precioTibetanos = 2800;

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

  for (const aroma in carrito) {
    cantidadTotal += carrito[aroma];
  }

  if (cantidadTotal > 0) {
    boton.textContent = `🛒 Mi carrito · ${cantidadTotal}`;
  } else {
    boton.textContent = "🛒 Ver mi carrito";
  }
}

// ========================================
// LISTA DE TIBETANOS
// ========================================

const listaTibetanos = document.getElementById("lista-tibetanos");

if (listaTibetanos) {
  tibetanos.forEach((productoTibetano) => {
    const aroma = productoTibetano.nombre;

    const stock = productoTibetano.stock;

    const producto = document.createElement("div");

    producto.classList.add("producto-lista");

    let cantidad = carrito[aroma] || 0;

    // ========================================
    // AGOTADO
    // ========================================

    if (stock <= 0) {
      producto.innerHTML = `

                <span class="nombre-producto">
                    ${aroma}
                </span>

                <span class="agotado">
                    AGOTADO
                </span>

            `;

      // Si estaba en el carrito
      // y ahora está agotado,
      // lo eliminamos.

      if (carrito[aroma]) {
        delete carrito[aroma];

        guardarCarrito();
      }
    }

    // ========================================
    // DISPONIBLE
    // ========================================
    else {
      producto.innerHTML = `

                <span class="nombre-producto">
                    ${aroma}
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
        const cantidadActual = carrito[aroma] || 0;

        const unidadesRestantes = stock - cantidadActual;

        if (unidadesRestantes > 0 && unidadesRestantes <= 2) {
          mensajeStock.textContent = "⚠️ Últimas unidades";

          mensajeStock.classList.add("mostrar-stock");
        } else {
          mensajeStock.textContent = "";

          mensajeStock.classList.remove("mostrar-stock");
        }
      }

      // Mostrar mensaje al cargar

      actualizarMensajeStock();

      // ========================================
      // SUMAR
      // ========================================

      botonMas.addEventListener("click", () => {
        cantidad = carrito[aroma] || 0;

        // No superar stock

        if (cantidad >= stock) {
          mostrarNotificacion("⚠️ No hay más unidades disponibles");

          return;
        }

        cantidad++;

        carrito[aroma] = cantidad;

        numero.textContent = cantidad;

        guardarCarrito();

        actualizarMensajeStock();

        mostrarNotificacion(`✓ ${aroma} × ${cantidad}`);

        actualizarBotonCarrito();
      });

      // ========================================
      // RESTAR
      // ========================================

      botonMenos.addEventListener("click", () => {
        cantidad = carrito[aroma] || 0;

        if (cantidad > 0) {
          cantidad--;

          if (cantidad === 0) {
            delete carrito[aroma];
          } else {
            carrito[aroma] = cantidad;
          }

          numero.textContent = cantidad;

          guardarCarrito();

          actualizarMensajeStock();

          mostrarNotificacion(`✓ ${aroma} × ${cantidad}`);

          actualizarBotonCarrito();
        }
      });
    }

    listaTibetanos.appendChild(producto);
  });
}

// ========================================
// ACTUALIZAR CANTIDADES AL VOLVER
// ========================================

function actualizarCantidadesTibetanos() {
  if (!listaTibetanos) return;

  const productos = listaTibetanos.querySelectorAll(".producto-lista");

  productos.forEach((producto) => {
    const nombre = producto
      .querySelector(".nombre-producto")
      .textContent.trim();

    const numero = producto.querySelector(".numero");

    if (!numero) return;

    const cantidad = carrito[nombre] || 0;

    numero.textContent = cantidad;
  });
}

// ========================================
// PÁGINA DEL CARRITO
// ========================================

const listaCarrito = document.getElementById("carrito");

if (listaCarrito) {
  mostrarCarrito();
}

// ========================================
// MOSTRAR CARRITO
// ========================================

function mostrarCarrito() {
  listaCarrito.innerHTML = "";

  let total = 0;

  const productos = Object.keys(carrito);

  // ========================================
  // CARRITO VACÍO
  // ========================================

  if (productos.length === 0) {
    listaCarrito.innerHTML = `

            <p class="carrito-vacio">
                Tu carrito está vacío.
            </p>

        `;

    actualizarTotalCarrito(0);

    return;
  }

  // ========================================
  // PRODUCTOS DEL CARRITO
  // ========================================

  productos.forEach((aroma) => {
    let cantidad = carrito[aroma];

    const subtotal = cantidad * precioTibetanos;

    total += subtotal;

    const producto = document.createElement("div");

    producto.classList.add("producto-carrito");

    producto.innerHTML = `

            <div class="info-carrito">

                <h3>
                    ${aroma}
                </h3>

                <p>
                    $${precioTibetanos.toLocaleString("es-AR")}
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

    const botonMenos = producto.querySelector(".menos-carrito");

    const botonMas = producto.querySelector(".mas-carrito");

    // ========================================
    // SUMAR DESDE CARRITO
    // ========================================

    botonMas.addEventListener("click", () => {
      const productoStock = tibetanos.find(
        (producto) => producto.nombre === aroma,
      );

      const stock = productoStock ? productoStock.stock : 0;

      cantidad = carrito[aroma] || 0;

      if (cantidad >= stock) {
        mostrarNotificacion("⚠️ No hay más unidades disponibles");

        return;
      }

      cantidad++;

      carrito[aroma] = cantidad;

      guardarCarrito();

      mostrarCarrito();

      actualizarBotonCarrito();
    });

    // ========================================
    // RESTAR DESDE CARRITO
    // ========================================

    botonMenos.addEventListener("click", () => {
      cantidad = carrito[aroma] || 0;

      cantidad--;

      if (cantidad <= 0) {
        delete carrito[aroma];
      } else {
        carrito[aroma] = cantidad;
      }

      guardarCarrito();

      mostrarCarrito();

      actualizarBotonCarrito();
    });

    listaCarrito.appendChild(producto);
  });

  actualizarTotalCarrito(total);
}

// ========================================
// TOTAL DEL CARRITO
// ========================================

function actualizarTotalCarrito(total) {
  const totalCarrito = document.getElementById("total-carrito");

  if (!totalCarrito) return;

  totalCarrito.textContent = total.toLocaleString("es-AR");
}

// ========================================
// VACIAR CARRITO
// ========================================

const botonVaciar = document.getElementById("vaciar-carrito");

const modalVaciar = document.getElementById("modal-vaciar");

const botonCancelar = document.getElementById("cancelar-vaciar");

const botonConfirmar = document.getElementById("confirmar-vaciar");

// Abrir modal

if (botonVaciar) {
  botonVaciar.addEventListener("click", () => {
    modalVaciar.classList.add("mostrar");
  });
}

// Cancelar

if (botonCancelar) {
  botonCancelar.addEventListener("click", () => {
    modalVaciar.classList.remove("mostrar");
  });
}

// Confirmar

if (botonConfirmar) {
  botonConfirmar.addEventListener("click", () => {
    carrito = {};

    guardarCarrito();

    modalVaciar.classList.remove("mostrar");

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

    productos.forEach((aroma) => {
      const cantidad = carrito[aroma];

      const subtotal = cantidad * precioTibetanos;

      total += subtotal;

      mensaje += `• Aromanza Tibetanos - ${aroma} × ${cantidad} — $${subtotal.toLocaleString("es-AR")}\n`;
    });

    mensaje += `\n💰 Total: $${total.toLocaleString("es-AR")}`;

    // ========================================
    // NÚMERO DE WHATSAPP
    // ========================================

    const numeroWhatsapp = "5491134262043";

    const url = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
  });
}

// ========================================
// ACTUALIZAR AL VOLVER A LA PÁGINA
// ========================================

window.addEventListener("pageshow", () => {
  carrito = JSON.parse(localStorage.getItem("carrito")) || {};

  actualizarCantidadesTibetanos();

  actualizarBotonCarrito();
});

// ========================================
// INICIALIZAR
// ========================================

actualizarBotonCarrito();

// ========================================
// BOTÓN VER CARRITO
// ========================================

const botonCarrito = document.getElementById("ver-carrito");

if (botonCarrito) {
  botonCarrito.addEventListener("click", () => {
    window.location.href = "../../../carrito.html";
  });
}
