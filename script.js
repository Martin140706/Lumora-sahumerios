// ========================================
// PRODUCTOS
// ========================================

const tibetanos = [
  "Berry Kiss",
  "Citronella",
  "Coco",
  "Diamante Negro",
  "Dulces Frutillas",
  "Frescura del Bosque",
  "Frutos Rojos",
  "Gardenias Flores Blancas",
  "Incienso Consagrado",
  "Lavandas del Valle",
  "Manzana Canela",
  "Miel Orgánica",
  "Mirra Consagrada",
  "Néctar de los Dioses",
  "Premium Lemon",
  "Protección Energética",
  "Real Champa",
  "Rosa Real",
  "Super Palo Santo",
  "Sándalo Hindú",
  "Canela Mística",
  "Choco Dubai",
  "Cappuccino Italiano",
  "Energía Reiki",
  "Flores de Manzanilla",
  "Titanium",
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
// PÁGINA TIBETANOS
// ========================================

const listaTibetanos = document.getElementById("lista-tibetanos");

if (listaTibetanos) {
  tibetanos.forEach((aroma) => {
    const producto = document.createElement("div");

    producto.classList.add("producto-lista");

    let cantidad = carrito[aroma] || 0;

    producto.innerHTML = `

            <span class="nombre-producto">
                ${aroma}
            </span>

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

    // ========================================
    // SUMAR
    // ========================================

    botonMas.addEventListener("click", () => {
      // Obtener cantidad real
      cantidad = carrito[aroma] || 0;

      cantidad++;

      numero.textContent = cantidad;

      carrito[aroma] = cantidad;

      guardarCarrito();

      mostrarNotificacion(`✓ ${aroma} × ${cantidad}`);

      actualizarBotonCarrito();
    });

    // ========================================
    // RESTAR
    // ========================================

    botonMenos.addEventListener("click", () => {
      // Obtener cantidad real
      cantidad = carrito[aroma] || 0;

      if (cantidad > 0) {
        cantidad--;

        numero.textContent = cantidad;

        if (cantidad === 0) {
          delete carrito[aroma];
        } else {
          carrito[aroma] = cantidad;
        }

        guardarCarrito();

        mostrarNotificacion(`✓ ${aroma} × ${cantidad}`);

        actualizarBotonCarrito();
      }
    });

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
  // MOSTRAR PRODUCTOS
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
      cantidad = carrito[aroma] || 0;

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
// TOTAL
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

    // Carrito vacío

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
