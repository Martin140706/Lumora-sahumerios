// ========================================
// CONFIGURACIÓN
// ========================================

const path = require("path");

const { rateLimit } = require("express-rate-limit");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");

const db = require("./db");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

// ========================================
// LÍMITE DE INTENTOS DE LOGIN
// ========================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Demasiados intentos fallidos. Esperá 15 minutos antes de volver a intentar.",
  },
});

// ========================================
// AUTENTICACIÓN DE ADMINISTRADOR
// ========================================

const sesionesAdmin = new Map();

const DURACION_SESION_MS = 2 * 60 * 60 * 1000;

function verificarAdmin(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "No autorizado. Iniciá sesión como administrador.",
    });
  }

  const token = autorizacion.slice(7);
  const expiraEn = sesionesAdmin.get(token);

  if (!expiraEn) {
    return res.status(401).json({
      error: "Sesión inválida. Iniciá sesión nuevamente.",
    });
  }

  if (Date.now() >= expiraEn) {
    sesionesAdmin.delete(token);

    return res.status(401).json({
      error: "Tu sesión expiró. Iniciá sesión nuevamente.",
    });
  }

  next();
}

// ========================================
// LOGIN DE ADMINISTRADOR
// ========================================

app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password || typeof password !== "string") {
    return res.status(400).json({
      error: "Ingresá una contraseña.",
    });
  }

  const passwordCorrecta = process.env.ADMIN_PASSWORD;

  if (!passwordCorrecta) {
    return res.status(500).json({
      error: "La contraseña de administrador no está configurada.",
    });
  }

  const passwordIngresada = Buffer.from(password);
  const passwordGuardada = Buffer.from(passwordCorrecta);

  if (
    passwordIngresada.length !== passwordGuardada.length ||
    !crypto.timingSafeEqual(passwordIngresada, passwordGuardada)
  ) {
    return res.status(401).json({
      error: "Contraseña incorrecta.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  const expiraEn = Date.now() + DURACION_SESION_MS;

  sesionesAdmin.set(token, expiraEn);

  res.json({
    mensaje: "Inicio de sesión exitoso.",
    token,
    expiraEn: new Date(expiraEn).toISOString(),
  });
});

// ========================================
// LOGOUT DE ADMINISTRADOR
// ========================================

app.post("/api/admin/logout", verificarAdmin, (req, res) => {
  const token = req.headers.authorization.slice(7);

  sesionesAdmin.delete(token);

  res.json({
    mensaje: "Sesión cerrada correctamente.",
  });
});

app.get("/api/admin/verificar", verificarAdmin, (req, res) => {
  res.json({
    autorizado: true,
    mensaje: "Sesión de administrador válida.",
  });
});

// ========================================
// RUTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
  res.send("🚀 API de Lumora funcionando");
});

// ========================================
// OBTENER CATEGORÍAS
// ========================================

app.get("/api/categorias", async (req, res) => {
  try {
    const [categorias] = await db.execute(
      `SELECT id, nombre, pagina, pagina_padre, detalle, precio_general
   FROM categorias`,
    );

    res.json(categorias);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);

    res.status(500).json({
      error: "Error al obtener las categorías",
    });
  }
});

/* ========================================
   AGREGAR UNA CATEGORÍA
======================================== */

app.post("/api/categorias", verificarAdmin, async (req, res) => {
  const paginaPadre =
    typeof req.body.pagina_padre === "string"
      ? req.body.pagina_padre.trim()
      : "";
  const nombre =
    typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";

  const pagina =
    typeof req.body.pagina === "string" ? req.body.pagina.trim() : "";

  const detalle =
    typeof req.body.detalle === "string" ? req.body.detalle.trim() : "";

  const precioRecibido = req.body.precio_general;

  if (!nombre || nombre.length > 150) {
    return res.status(400).json({
      error: "Ingresá un nombre válido.",
    });
  }

  if (!pagina || pagina.length > 150) {
    return res.status(400).json({
      error: "Ingresá un identificador de página válido.",
    });
  }

  if (
    precioRecibido !== undefined &&
    precioRecibido !== null &&
    precioRecibido !== "" &&
    (!Number.isFinite(Number(precioRecibido)) || Number(precioRecibido) < 0)
  ) {
    return res.status(400).json({
      error: "El precio general debe ser un número igual o mayor que cero.",
    });
  }

  const precioGeneral =
    precioRecibido === undefined ||
    precioRecibido === null ||
    precioRecibido === ""
      ? null
      : Number(precioRecibido);

  try {
    // Evitar duplicados por nombre o identificador.
    const [existentes] = await db.execute(
      `SELECT id
       FROM categorias
       WHERE nombre = ? OR pagina = ?
       LIMIT 1`,
      [nombre, pagina],
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        error: "Ya existe una categoría con ese nombre o identificador.",
      });
    }

    const [resultado] = await db.execute(
      `INSERT INTO categorias
   (nombre, pagina, pagina_padre, detalle, precio_general)
   VALUES (?, ?, ?, ?, ?)`,
      [nombre, pagina, paginaPadre || null, detalle || null, precioGeneral],
    );

    res.status(201).json({
      mensaje: "Categoría creada correctamente.",
      categoria: {
        id: resultado.insertId,
        nombre,
        pagina,
        pagina_padre: paginaPadre || null,
        detalle: detalle || null,
        precio_general: precioGeneral,
      },
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);

    res.status(500).json({
      error: "No se pudo crear la categoría.",
    });
  }
});

/* ========================================
   ELIMINAR UNA CATEGORÍA
======================================== */

app.delete("/api/categorias/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: "Ingresá un ID de categoría válido.",
    });
  }

  let conexion;
  let transaccionIniciada = false;

  try {
    conexion = await db.getConnection();

    await conexion.beginTransaction();
    transaccionIniciada = true;

    // Comprobar que la categoría exista y bloquearla.
    const [categorias] = await conexion.execute(
      `SELECT id, nombre
       FROM categorias
       WHERE id = ?
       FOR UPDATE`,
      [id],
    );

    if (categorias.length === 0) {
      await conexion.rollback();
      transaccionIniciada = false;

      return res.status(404).json({
        error: "La categoría no existe.",
      });
    }

    // Comprobar si tiene productos asociados.
    const [productos] = await conexion.execute(
      `SELECT COUNT(*) AS cantidad
       FROM productos
       WHERE categoria_id = ?`,
      [id],
    );

    if (Number(productos[0].cantidad) > 0) {
      await conexion.rollback();
      transaccionIniciada = false;

      return res.status(409).json({
        error: "No se puede eliminar una categoría que contiene productos.",
        cantidad_productos: Number(productos[0].cantidad),
      });
    }

    // Eliminar la categoría.
    await conexion.execute("DELETE FROM categorias WHERE id = ?", [id]);

    await conexion.commit();
    transaccionIniciada = false;

    res.json({
      mensaje: "Categoría eliminada correctamente.",
      categoria: categorias[0],
    });
  } catch (error) {
    if (conexion && transaccionIniciada) {
      await conexion.rollback();
    }

    console.error("Error al eliminar categoría:", error);

    res.status(500).json({
      error: "No se pudo eliminar la categoría.",
    });
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// ========================================
// OBTENER TODOS LOS PRODUCTOS
// ========================================

app.get("/api/productos", async (req, res) => {
  try {
    const [productos] = await db.execute(`
      SELECT
        p.id,
        p.nombre,
        p.precio,
        p.stock,
        p.categoria_id,

        c.nombre AS categoria,
        c.pagina,
        c.detalle,
        c.precio_general

      FROM productos p

      INNER JOIN categorias c
        ON p.categoria_id = c.id

      ORDER BY p.id
    `);

    res.json(productos);
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);

    res.status(500).json({
      error: "Error al obtener los productos",
    });
  }
});

/* ========================================
   ELIMINAR UN PRODUCTO
======================================== */

app.delete("/api/productos/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({
      error: "Ingresá un ID de producto válido.",
    });
  }

  try {
    // Comprobar que el producto exista.
    const [productos] = await db.execute(
      "SELECT id, nombre FROM productos WHERE id = ?",
      [id],
    );

    if (productos.length === 0) {
      return res.status(404).json({
        error: "El producto no existe.",
      });
    }

    // Eliminar el producto.
    await db.execute("DELETE FROM productos WHERE id = ?", [id]);

    res.json({
      mensaje: "Producto eliminado correctamente.",
      producto: productos[0],
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);

    res.status(500).json({
      error: "No se pudo eliminar el producto.",
    });
  }
});

// ========================================
// OBTENER UN PRODUCTO POR ID
// ========================================

app.get("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [productos] = await db.execute(
      `
      SELECT
        p.id,
        p.nombre,
        p.precio,
        p.stock,
        p.categoria_id,

        c.nombre AS categoria,
        c.pagina,
        c.detalle,
        c.precio_general

      FROM productos p

      INNER JOIN categorias c
        ON p.categoria_id = c.id

      WHERE p.id = ?
      `,
      [id],
    );

    if (productos.length === 0) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    res.json(productos[0]);
  } catch (error) {
    console.error("❌ Error al obtener producto:", error);

    res.status(500).json({
      error: "Error al obtener el producto",
    });
  }
});

/* ========================================
   AGREGAR UN PRODUCTO
======================================== */

app.post("/api/productos", verificarAdmin, async (req, res) => {
  const nombre =
    typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";

  const categoriaId = req.body.categoria_id;
  const idSolicitado =
    typeof req.body.id === "string" ? req.body.id.trim() : "";

  const precioRecibido = req.body.precio;
  const stockRecibido = req.body.stock;

  if (!nombre || nombre.length > 150) {
    return res.status(400).json({
      error: "Ingresá un nombre de hasta 150 caracteres.",
    });
  }

  if (
    categoriaId === undefined ||
    categoriaId === null ||
    String(categoriaId).trim() === ""
  ) {
    return res.status(400).json({
      error: "Seleccioná una categoría.",
    });
  }

  if (
    precioRecibido === undefined ||
    precioRecibido === null ||
    precioRecibido === "" ||
    !Number.isFinite(Number(precioRecibido)) ||
    Number(precioRecibido) < 0
  ) {
    return res.status(400).json({
      error: "Ingresá un precio válido.",
    });
  }

  if (
    stockRecibido === undefined ||
    stockRecibido === null ||
    stockRecibido === "" ||
    !Number.isSafeInteger(Number(stockRecibido)) ||
    Number(stockRecibido) < 0
  ) {
    return res.status(400).json({
      error: "El stock debe ser un entero igual o mayor que cero.",
    });
  }

  if (
    idSolicitado.length > 150 ||
    (idSolicitado !== "" && !/^[a-zA-Z0-9_-]+$/.test(idSolicitado))
  ) {
    return res.status(400).json({
      error:
        "El ID solo puede contener letras, números, guiones y guiones bajos.",
    });
  }

  let conexion;
  let transaccionIniciada = false;

  try {
    conexion = await db.getConnection();
    await conexion.beginTransaction();
    transaccionIniciada = true;

    const [categorias] = await conexion.execute(
      `SELECT id, nombre, precio_general
       FROM categorias
       WHERE id = ?
       FOR UPDATE`,
      [categoriaId],
    );

    if (categorias.length === 0) {
      await conexion.rollback();
      transaccionIniciada = false;

      return res.status(400).json({
        error: "La categoría seleccionada no existe.",
      });
    }

    const categoria = categorias[0];

    // Si la categoría tiene precio general, se respeta ese precio.
    const precioFinal =
      categoria.precio_general !== null
        ? Number(categoria.precio_general)
        : Number(precioRecibido);

    // Generar un ID a partir del nombre si no se especificó uno.
    const baseId =
      idSolicitado ||
      nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);

    if (!baseId) {
      await conexion.rollback();
      transaccionIniciada = false;

      return res.status(400).json({
        error: "No se pudo generar un ID. Ingresá uno manualmente.",
      });
    }

    let id = baseId;
    let contador = 2;

    while (true) {
      const [existentes] = await conexion.execute(
        "SELECT id FROM productos WHERE id = ?",
        [id],
      );

      if (existentes.length === 0) {
        break;
      }

      // Si el usuario eligió el ID, no lo cambiamos silenciosamente.
      if (idSolicitado) {
        await conexion.rollback();
        transaccionIniciada = false;

        return res.status(409).json({
          error: "Ese ID ya existe. Elegí otro.",
        });
      }

      id = `${baseId}-${contador++}`;
    }

    await conexion.execute(
      `INSERT INTO productos
        (id, categoria_id, nombre, precio, stock)
       VALUES (?, ?, ?, ?, ?)`,
      [id, categoria.id, nombre, precioFinal, Number(stockRecibido)],
    );

    await conexion.commit();
    transaccionIniciada = false;

    res.status(201).json({
      mensaje: "Producto creado correctamente.",
      producto: {
        id,
        categoria_id: categoria.id,
        nombre,
        precio: precioFinal,
        stock: Number(stockRecibido),
        categoria: categoria.nombre,
      },
    });
  } catch (error) {
    if (conexion && transaccionIniciada) {
      await conexion.rollback();
    }

    console.error("Error al crear producto:", error);

    res.status(500).json({
      error: "No se pudo crear el producto.",
    });
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// ========================================
// PROCESAR PEDIDO Y DESCONTAR STOCK
// ========================================

app.post("/api/pedidos", async (req, res) => {
  const { productos } = req.body;

  // Validar el pedido
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      error: "El pedido no contiene productos.",
    });
  }

  // Validar y agrupar productos repetidos
  const cantidades = new Map();

  for (const item of productos) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad < 1
    ) {
      return res.status(400).json({
        error: "Hay productos o cantidades inválidas en el pedido.",
      });
    }

    cantidades.set(item.id, (cantidades.get(item.id) || 0) + item.cantidad);
  }

  // Ordenar los IDs para reducir la posibilidad de bloqueos
  const pedido = [...cantidades.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let conexion;
  let transaccionIniciada = false;

  try {
    conexion = await db.getConnection();

    await conexion.beginTransaction();
    transaccionIniciada = true;

    const productosValidados = [];

    // Comprobar todos los productos antes de descontar
    for (const [id, cantidad] of pedido) {
      const [filas] = await conexion.execute(
        `SELECT id, nombre, stock
         FROM productos
         WHERE id = ?
         FOR UPDATE`,
        [id],
      );

      if (filas.length === 0) {
        await conexion.rollback();
        transaccionIniciada = false;

        return res.status(404).json({
          error: `No se encontró el producto ${id}.`,
        });
      }

      const producto = filas[0];

      if (Number(producto.stock) < cantidad) {
        await conexion.rollback();
        transaccionIniciada = false;

        return res.status(409).json({
          error:
            `Stock insuficiente para "${producto.nombre}". ` +
            `Disponibles: ${producto.stock}. Solicitadas: ${cantidad}.`,
        });
      }

      productosValidados.push({
        id,
        nombre: producto.nombre,
        cantidad,
        stockRestante: Number(producto.stock) - cantidad,
      });
    }

    // Descontar todas las unidades
    for (const producto of productosValidados) {
      const [resultado] = await conexion.execute(
        `UPDATE productos
         SET stock = stock - ?
         WHERE id = ? AND stock >= ?`,
        [producto.cantidad, producto.id, producto.cantidad],
      );

      if (resultado.affectedRows !== 1) {
        throw new Error(`No se pudo actualizar el stock de ${producto.id}.`);
      }
    }

    await conexion.commit();
    transaccionIniciada = false;

    res.json({
      mensaje: "Pedido procesado correctamente.",
      productos: productosValidados,
    });
  } catch (error) {
    if (conexion && transaccionIniciada) {
      await conexion.rollback();
    }

    console.error("Error al procesar el pedido:", error);

    res.status(500).json({
      error: "No se pudo procesar el pedido. Intentá nuevamente.",
    });
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// ========================================
// EDITAR PRECIO Y STOCK DE UN PRODUCTO
// ========================================

app.put("/api/productos/:id", verificarAdmin, async (req, res) => {
  const { id } = req.params;
  const { precio, stock } = req.body;

  // Validar los datos recibidos
  if (
    precio === undefined ||
    stock === undefined ||
    precio === "" ||
    stock === "" ||
    !Number.isFinite(Number(precio)) ||
    !Number.isInteger(Number(stock)) ||
    Number(precio) < 0 ||
    Number(stock) < 0
  ) {
    return res.status(400).json({
      error: "El precio o el stock no son válidos.",
    });
  }

  let conexion;

  try {
    conexion = await db.getConnection();

    await conexion.beginTransaction();

    // Buscar el producto y su categoría
    const [productos] = await conexion.execute(
      `SELECT
          p.id,
          p.categoria_id,
          c.precio_general
       FROM productos p
       INNER JOIN categorias c
          ON p.categoria_id = c.id
       WHERE p.id = ?
       FOR UPDATE`,
      [id],
    );

    if (productos.length === 0) {
      await conexion.rollback();

      return res.status(404).json({
        error: "No se encontró el producto.",
      });
    }

    const producto = productos[0];

    // Actualizar stock
    await conexion.execute("UPDATE productos SET stock = ? WHERE id = ?", [
      Number(stock),
      id,
    ]);

    if (producto.precio_general !== null) {
      // Las categorías con precio general comparten el precio.
      await conexion.execute(
        `UPDATE categorias
         SET precio_general = ?
         WHERE id = ?`,
        [Number(precio), producto.categoria_id],
      );

      await conexion.execute(
        `UPDATE productos
         SET precio = ?
         WHERE categoria_id = ?`,
        [Number(precio), producto.categoria_id],
      );
    } else {
      // Los productos con precio individual se actualizan por separado.
      await conexion.execute("UPDATE productos SET precio = ? WHERE id = ?", [
        Number(precio),
        id,
      ]);
    }

    await conexion.commit();

    res.json({
      mensaje: "Producto actualizado correctamente.",
      id,
      precio: Number(precio),
      stock: Number(stock),
    });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    console.error("Error al actualizar producto:", error);

    res.status(500).json({
      error: "No se pudo actualizar el producto.",
    });
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 API DE LUMORA");
  console.log("=================================");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📦 http://localhost:${PORT}/api/productos`);
  console.log(`📂 http://localhost:${PORT}/api/categorias`);
  console.log("=================================");
});
