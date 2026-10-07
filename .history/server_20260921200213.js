const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 80;

app.use(cors());
app.use(express.json());

// Función para respuesta estándar
const response = (statusCode, data) => ({ statusCode, data });

// ==================== ENDPOINTS ====================

// 1. GET - Listar todos los productos
app.get('/productos', (req, res) => {
  const productos = db.prepare(`
    SELECT p.*, c.nombre as categoria 
    FROM productos p 
    LEFT JOIN categorias c ON p.categoria_id = c.id
  `).all();
  res.json(response(200, productos));
});

// 2. GET - Obtener un producto por ID
app.get('/productos/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).json(response(404, { mensaje: 'Producto no encontrado' }));
  res.json(response(200, producto));
});

// 3. POST - Crear producto
app.post('/productos', (req, res) => {
  const { nombre, precio, categoria_id } = req.body;
  const result = db.prepare('INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)').run(nombre, precio, categoria_id);
  res.status(201).json(response(201, { id: result.lastInsertRowid, nombre, precio, categoria_id }));
});

// 4. DELETE - Eliminar producto
app.delete('/productos/:id', (req, res) => {
  const result = db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json(response(404, { mensaje: 'Producto no encontrado' }));
  res.json(response(200, { mensaje: 'Producto eliminado' }));
});

// 5. GET - Listar categorías
app.get('/categorias', (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias').all();
  res.json(response(200, categorias));
});

// 6. POST - Crear categoría
app.post('/categorias', (req, res) => {
  const { nombre } = req.body;
  const result = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run(nombre);
  res.status(201).json(response(201, { id: result.lastInsertRowid, nombre }));
});

// 7. DELETE - Eliminar categoría
app.delete('/categorias/:id', (req, res) => {
  const result = db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json(response(404, { mensaje: 'Categoría no encontrada' }));
  res.json(response(200, { mensaje: 'Categoría eliminada' }));
});

// 8. GET - Contar productos
app.get('/productos/count/total', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as total FROM productos').get();
  res.json(response(200, total));
});

// 9. POST - Backup de la base de datos
app.post('/backup', (req, res) => {
  const dbPath = path.join(__dirname, 'db', 'database.db');
  const backupPath = path.join(__dirname, 'db', `backup-${Date.now()}.db`);
  fs.copyFileSync(dbPath, backupPath);
  res.json(response(200, { mensaje: 'Backup creado', archivo: path.basename(backupPath) }));
});

// 10. DELETE - Vaciar la base de datos
app.delete('/vaciar', (req, res) => {
  db.exec('DELETE FROM productos; DELETE FROM categorias;');
  res.json(response(200, { mensaje: 'Base de datos vaciada' }));
});

// ==================================================

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

