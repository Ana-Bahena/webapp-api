const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const net = require('net'); // ← Nuevo: para el socket TCP
const { initDatabase, getDb, saveDatabase } = require('./database');

const app = express();
const PORT = 80;
const TCP_PORT = 6061;

app.use(cors());
app.use(express.json());

const response = (statusCode, data) => ({ statusCode, data });

async function startServer() {
  await initDatabase();
  const db = getDb();

  // ==================== API HTTP (igual que antes) ====================

  app.get('/productos', (req, res) => {
    const result = db.exec(`
      SELECT p.id, p.nombre, p.precio, p.categoria_id, c.nombre as categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
    `);
    const data = result.length ? result[0].values.map(row => ({
      id: row[0], nombre: row[1], precio: row[2], categoria_id: row[3], categoria: row[4]
    })) : [];
    res.json(response(200, data));
  });

  app.get('/productos/:id', (req, res) => {
    const stmt = db.prepare("SELECT * FROM productos WHERE id = ?");
    stmt.bind([req.params.id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      res.json(response(200, row));
    } else {
      stmt.free();
      res.status(404).json(response(404, { mensaje: 'Producto no encontrado' }));
    }
  });

  app.post('/productos', (req, res) => {
    const { nombre, precio, categoria_id } = req.body;
    db.run("INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)", [nombre, precio, categoria_id]);
    saveDatabase();
    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
    res.status(201).json(response(201, { id, nombre, precio, categoria_id }));
  });

  app.delete('/productos/:id', (req, res) => {
    db.run("DELETE FROM productos WHERE id = ?", [req.params.id]);
    saveDatabase();
    res.json(response(200, { mensaje: 'Producto eliminado' }));
  });

  app.get('/categorias', (req, res) => {
    const result = db.exec("SELECT * FROM categorias");
    const data = result.length ? result[0].values.map(row => ({ id: row[0], nombre: row[1] })) : [];
    res.json(response(200, data));
  });

  app.post('/categorias', (req, res) => {
    const { nombre } = req.body;
    db.run("INSERT INTO categorias (nombre) VALUES (?)", [nombre]);
    saveDatabase();
    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
    res.status(201).json(response(201, { id, nombre }));
  });

  app.delete('/categorias/:id', (req, res) => {
    db.run("DELETE FROM categorias WHERE id = ?", [req.params.id]);
    saveDatabase();
    res.json(response(200, { mensaje: 'Categoría eliminada' }));
  });

  app.get('/productos/count/total', (req, res) => {
    const total = db.exec("SELECT COUNT(*) as total FROM productos")[0].values[0][0];
    res.json(response(200, { total }));
  });

  /*
  app.post('/backup', (req, res) => {
    const dbPath = path.join(__dirname, 'db', 'database.db');
    const backupName = `backup-${Date.now()}.db`;
    const backupPath = path.join(__dirname, 'db', backupName);
    fs.copyFileSync(dbPath, backupPath);
    res.download(backupPath, backupName);
  });
  */

  app.post('/backup', (req, res) => {
  const dbPath = path.join(__dirname, 'db', 'database.db');
  const backupName = `backup-${Date.now()}.db`;
  const backupPath = path.join(__dirname, 'db', backupName);

  // Crear la copia
  fs.copyFileSync(dbPath, backupPath);

  // Enviar el archivo para que se descargue
  res.download(backupPath, backupName, (err) => {
    if (err) {
      console.error('Error al descargar:', err);
      res.status(500).json({ statusCode: 500, data: { mensaje: 'Error al generar el backup' } });
    }
  });
});

  app.delete('/vaciar', (req, res) => {
    db.run("DELETE FROM productos");
    db.run("DELETE FROM categorias");
    saveDatabase();
    res.json(response(200, { mensaje: 'Base de datos vaciada' }));
  });

  // ==================== SERVIDOR TCP (Socket) ====================

  /* istanbul ignore next */
  const tcpServer = net.createServer((socket) => {
  //const tcpServer = net.createServer((socket) => {
    console.log('Cliente TCP conectado');

    socket.on('data', (data) => {
      const message = data.toString().trim();
      console.log('Mensaje recibido:', message);

      try {
        // {insert: {...}}
        if (message.startsWith('{insert:')) {
          const jsonStr = message.slice(8, -1); // quita {insert: y el }
          const element = JSON.parse(jsonStr);

          if (element.nombre && element.precio !== undefined) {
            // Insertar producto
            db.run("INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)", 
              [element.nombre, element.precio, element.categoria_id || null]);
            saveDatabase();
            const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
            socket.write(JSON.stringify(response(201, { id, ...element })) + '\n');
          } else if (element.nombre) {
            // Insertar categoría
            db.run("INSERT INTO categorias (nombre) VALUES (?)", [element.nombre]);
            saveDatabase();
            const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
            socket.write(JSON.stringify(response(201, { id, nombre: element.nombre })) + '\n');
          } else {
            socket.write(JSON.stringify(response(400, { mensaje: 'Datos inválidos' })) + '\n');
          }
        }
        // {get:productos} o {get:categorias}
        else if (message.startsWith('{get:')) {
          const resource = message.slice(5, -1); // quita {get: y el }

          if (resource === 'productos') {
            const result = db.exec(`
              SELECT p.id, p.nombre, p.precio, p.categoria_id, c.nombre as categoria
              FROM productos p
              LEFT JOIN categorias c ON p.categoria_id = c.id
            `);
            const data = result.length ? result[0].values.map(row => ({
              id: row[0], nombre: row[1], precio: row[2], categoria_id: row[3], categoria: row[4]
            })) : [];
            socket.write(JSON.stringify(response(200, data)) + '\n');
          } else if (resource === 'categorias') {
            const result = db.exec("SELECT * FROM categorias");
            const data = result.length ? result[0].values.map(row => ({ id: row[0], nombre: row[1] })) : [];
            socket.write(JSON.stringify(response(200, data)) + '\n');
          } else {
            socket.write(JSON.stringify(response(400, { mensaje: 'Recurso no válido' })) + '\n');
          }
        } else {
          socket.write(JSON.stringify(response(400, { mensaje: 'Comando no reconocido' })) + '\n');
        }
      } catch (err) {
        console.error(err);
        socket.write(JSON.stringify(response(500, { mensaje: 'Error interno', error: err.message })) + '\n');
      }
    });

    socket.on('end', () => {
      console.log('Cliente TCP desconectado');
    });
  });

  /*
  // ==================== INICIAR SERVIDORES ====================

  app.listen(PORT, () => {
    console.log(`API HTTP corriendo en http://localhost:${PORT}`);
  });

  tcpServer.listen(TCP_PORT, () => {
    console.log(`Servidor TCP (Socket) corriendo en puerto ${TCP_PORT}`);
  });
}

startServer();
*/


  // ==================== INICIAR SERVIDORES ====================

  // Solo abrir puertos si NO estamos en modo test
  /* istanbul ignore next */
  /* PROBAR
  if (process.env.NODE_ENV !== 'test') {
    
    /*app.listen(PORT, () => {
      console.log(`API HTTP corriendo en http://localhost:${PORT}`);
    });*/
    tcpServer.listen(TCP_PORT, () => {
      console.log(`Servidor TCP (Socket) corriendo en puerto ${TCP_PORT}`);
    });

    tcpServer.listen(TCP_PORT, () => {
      console.log(`Servidor TCP (Socket) corriendo en puerto ${TCP_PORT}`);
    });
  }
} // ← fin de la función startServer()

// Exportar para las pruebas
//module.exports = { app, startServer };

  // Dentro de startServer(), SOLO una vez:
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`API HTTP corriendo en http://localhost:${PORT}`);
    });

    tcpServer.listen(TCP_PORT, () => {
      console.log(`Servidor TCP (Socket) corriendo en puerto ${TCP_PORT}`);
    });
  }
// fin de startServer

module.exports = { app, startServer };

// SOLO una llamada aquí:
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

