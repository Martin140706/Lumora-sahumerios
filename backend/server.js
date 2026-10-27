// ========================================
// CONFIGURACIÓN
// ========================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

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
    const [categorias] = await db.execute(`
      SELECT
        id,
        nombre,
        pagina,
        detalle,
        precio_general
      FROM categorias
      ORDER BY id
    `);

    res.json(categorias);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);

    res.status(500).json({
      error: "Error al obtener las categorías",
    });
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

app.put("/api/productos/:id", async (req, res) => {
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
