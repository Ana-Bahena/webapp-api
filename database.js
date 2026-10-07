const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbFolder = path.join(__dirname, 'db');
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

const dbPath = path.join(dbFolder, 'database.db');

let db;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Crear tablas
  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      categoria_id INTEGER,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
  `);

  // Datos de ejemplo
  const count = db.exec("SELECT COUNT(*) as total FROM categorias");
  if (count.length === 0 || count[0].values[0][0] === 0) {
    db.run("INSERT INTO categorias (nombre) VALUES ('Electrónica'), ('Ropa')");
    db.run("INSERT INTO productos (nombre, precio, categoria_id) VALUES ('Laptop', 15000, 1), ('Camisa', 350, 2)");
    saveDatabase();
  }

  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb, saveDatabase };
