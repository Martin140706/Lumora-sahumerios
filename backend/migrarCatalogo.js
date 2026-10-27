console.log("🚀 EJECUTANDO MIGRACIÓN");

const db = require("./db");
const catalogo = require("../datos/productos");

async function migrarCatalogo() {
  let conexion;

  try {
    conexion = await db.getConnection();

    console.log("🔌 Conectado a MySQL");
    console.log("🚀 Comenzando migración...\n");

    // Empezamos una transacción.
    // Si algo falla, no dejamos la migración a medias.
    await conexion.beginTransaction();

    for (const claveCategoria in catalogo) {
      const categoria = catalogo[claveCategoria];

      // ----------------------------------------
      // 1. Buscar si la categoría ya existe
      // ----------------------------------------

      const [categoriasExistentes] = await conexion.execute(
        `
        SELECT id
        FROM categorias
        WHERE pagina = ?
        `,
        [categoria.pagina],
      );

      let categoriaId;

      if (categoriasExistentes.length > 0) {
        categoriaId = categoriasExistentes[0].id;

        // Actualizamos los datos de la categoría
        await conexion.execute(
          `
          UPDATE categorias
          SET nombre = ?,
              detalle = ?,
              precio_general = ?
          WHERE id = ?
          `,
          [
            categoria.nombre,
            categoria.detalle || null,
            categoria.precio || null,
            categoriaId,
          ],
        );

        console.log(`📂 Categoría actualizada: ${categoria.nombre}`);
      } else {
        // Creamos la categoría
        const [resultadoCategoria] = await conexion.execute(
          `
          INSERT INTO categorias
          (nombre, pagina, detalle, precio_general)
          VALUES (?, ?, ?, ?)
          `,
          [
            categoria.nombre,
            categoria.pagina,
            categoria.detalle || null,
            categoria.precio || null,
          ],
        );

        categoriaId = resultadoCategoria.insertId;

        console.log(`📂 Categoría creada: ${categoria.nombre}`);
      }

      // ----------------------------------------
      // 2. Insertar / actualizar productos
      // ----------------------------------------

      for (const producto of categoria.productos) {
        const precio =
          producto.precio !== undefined
            ? producto.precio
            : categoria.precio || null;

        const [productosExistentes] = await conexion.execute(
          `
          SELECT id
          FROM productos
          WHERE id = ?
          `,
          [producto.id],
        );

        if (productosExistentes.length > 0) {
          // Actualizamos producto existente
          await conexion.execute(
            `
            UPDATE productos
            SET categoria_id = ?,
                nombre = ?,
                precio = ?,
                stock = ?
            WHERE id = ?
            `,
            [categoriaId, producto.nombre, precio, producto.stock, producto.id],
          );

          console.log(`   🔄 Actualizado: ${producto.nombre}`);
        } else {
          // Creamos producto nuevo
          await conexion.execute(
            `
            INSERT INTO productos
            (id, categoria_id, nombre, precio, stock)
            VALUES (?, ?, ?, ?, ?)
            `,
            [producto.id, categoriaId, producto.nombre, precio, producto.stock],
          );

          console.log(`   ✅ Creado: ${producto.nombre}`);
        }
      }

      console.log("");
    }

    await conexion.commit();

    console.log("=================================");
    console.log("🎉 ¡Migración completada!");
    console.log("=================================");
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    console.error("\n❌ Error durante la migración:");
    console.error(error);
  } finally {
    if (conexion) {
      conexion.release();
    }

    await db.end();
  }
}

migrarCatalogo();
