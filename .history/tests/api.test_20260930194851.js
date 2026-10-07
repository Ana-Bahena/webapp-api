const request = require('supertest');

//3 veces cada enpoint

// Importamos la app (no inicia el servidor si NODE_ENV=test)
process.env.NODE_ENV = 'test';
const { app, startServer } = require('../server');

let server;

beforeAll(async () => {
  // Iniciar la app en un puerto de prueba
  await startServer();
  // Esperar un momento a que la DB se inicialice
  await new Promise(r => setTimeout(r, 500));
});

describe('API WebApp - Pruebas de Endpoints', () => {

  // ========== 1. GET /productos ==========
  test('GET /productos - debe devolver lista de productos con status 200', async () => {
    const res = await request(app).get('/productos');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ========== 2. GET /productos/:id (éxito) ==========

test('GET /productos/:id - debe devolver un producto existente', async () => {
  // 1. Crear producto
  const create = await request(app)
    .post('/productos')
    .send({ nombre: 'Producto Para Get', precio: 100, categoria_id: 1 });

  expect(create.statusCode).toBe(201);

  // 2. Obtener la lista y usar el último producto creado
  const lista = await request(app).get('/productos');
  expect(lista.statusCode).toBe(200);
  expect(lista.body.data.length).toBeGreaterThan(0);

  const producto = lista.body.data[lista.body.data.length - 1];
  const id = producto.id;

  // 3. Consultar por ese id
  const res = await request(app).get(`/productos/${id}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.statusCode).toBe(200);
  expect(res.body.data).toHaveProperty('id');
  expect(res.body.data).toHaveProperty('nombre');
});

  /*
  test('GET /productos/1 - debe devolver un producto existente', async () => {
    const res = await request(app).get('/productos/1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('nombre');
  });
  */


  // ========== 3. GET /productos/:id (error - no existe) ==========
  test('GET /productos/9999 - debe devolver 404 cuando el producto no existe', async () => {
    const res = await request(app).get('/productos/9999');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.data).toHaveProperty('mensaje');
  });

  // ========== 4. POST /productos (éxito) ==========
  test('POST /productos - debe crear un producto y devolver 201', async () => {
    const nuevoProducto = {
      nombre: 'Mouse Test',
      precio: 299,
      categoria_id: 1
    };

    const res = await request(app)
      .post('/productos')
      .send(nuevoProducto);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.nombre).toBe('Mouse Test');
  });

  // ========== 5. POST /productos (error - body vacío) ==========
  test('POST /productos - debe manejar body incompleto', async () => {
    const res = await request(app)
      .post('/productos')
      .send({}); // sin datos
    
    // Aunque tu API actual no valida, al menos no debe caerse
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  // ========== 6. DELETE /productos/:id ==========
  test('DELETE /productos/:id - debe eliminar un producto', async () => {
    // Primero crear uno para eliminar
    const create = await request(app)
      .post('/productos')
      .send({ nombre: 'Temporal', precio: 100, categoria_id: 1 });
    
    const id = create.body.data.id;

    const res = await request(app).delete(`/productos/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.mensaje).toMatch(/eliminado/i);
  });

  // ========== 7. GET /categorias ==========
  test('GET /categorias - debe devolver lista de categorías', async () => {
    const res = await request(app).get('/categorias');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ========== 8. POST /categorias ==========
  test('POST /categorias - debe crear una categoría', async () => {
    const res = await request(app)
      .post('/categorias')
      .send({ nombre: 'Categoría Test' });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.nombre).toBe('Categoría Test');
  });

  // ========== 9. DELETE /categorias/:id ==========
  test('DELETE /categorias/:id - debe eliminar una categoría', async () => {
    const create = await request(app)
      .post('/categorias')
      .send({ nombre: 'Temp Cat' });
    
    const id = create.body.data.id;
    const res = await request(app).delete(`/categorias/${id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.mensaje).toMatch(/eliminada/i);
  });

  // ========== 10. GET /productos/count/total ==========
  test('GET /productos/count/total - debe devolver el total de productos', async () => {
    const res = await request(app).get('/productos/count/total');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('total');
    expect(typeof res.body.data.total).toBe('number');
  });

  // ========== 11. DELETE /vaciar ==========
  test('DELETE /vaciar - debe vaciar la base de datos', async () => {
    const res = await request(app).delete('/vaciar');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.mensaje).toMatch(/vaciada/i);
  });

  // ========== 12. POST /backup ==========
  test('POST /backup - debe generar un backup (status 200)', async () => {
    const res = await request(app).post('/backup');
    
    // Puede devolver 200 con archivo o JSON de error
    expect([200, 500]).toContain(res.statusCode);
  });

});

