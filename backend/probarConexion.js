const db = require("./db");

async function probarConexion() {
  try {
    const conexion = await db.getConnection();

    console.log("✅ Conexión a MySQL exitosa");
    console.log("🗄️ Base de datos: Lumora");

    conexion.release();
  } catch (error) {
    console.error("❌ No se pudo conectar a MySQL");
    console.error(error.message);
  } finally {
    await db.end();
  }
}

probarConexion();
