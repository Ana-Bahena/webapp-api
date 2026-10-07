const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Crear carpeta db si no existe
const dbFolder = path.join(__dirname, 'db');
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

const dbPath = path.join(dbFolder, 'database.db');
const db = new Database(dbPath);

// Crear tablas normalizadas
db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL,
    categoria_id INTEGER,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  );
`);

// Insertar datos de ejemplo si está vacía
const count = db.prepare('SELECT COUNT(*) as total FROM categorias').get();
if (count.total === 0) {
  db.prepare('INSERT INTO categorias (nombre) VALUES (?), (?)').run('Electrónica', 'Ropa');
  db.prepare('INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?), (?, ?, ?)').run(
    'Laptop', 15000, 1,
    'Camisa', 350, 2
  );
}

module.exports = db;

