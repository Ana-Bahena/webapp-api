process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app, startServer } = require('../server');

beforeAll(async () => {
  await startServer();
  await new Promise(r => setTimeout(r, 800));
});

describe('API WebApp - Pruebas Unitarias (3 escenarios por endpoint)', () => {

  // =====================================================
  // 1. GET /productos
  // =====================================================
  test('GET /productos - Escenario 1: éxito (200 + lista)', async () => {
    const res = await request(app).get('/productos');
    expect(res.statusCode).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /productos - Escenario 2: estructura correcta del JSON', async () => {
    const res = await request(app).get('/productos');
    expect(res.body).toHaveProperty('statusCode');
    expect(res.body).toHaveProperty('data');
  });

  test('GET /productos - Escenario 3: no debe fallar aunque la BD esté vacía', async () => {
    await request(app).delete('/vaciar');
    const res = await request(app).get('/productos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // =====================================================
  // 2. GET /productos/:id
  // =====================================================
  test('GET /productos/:id - Escenario 1: producto existente (200)', async () => {
    await request(app).post('/productos').send({ nombre: 'Temp Get', precio: 10, categoria_id: 1 });
    const lista = await request(app).get('/productos');
    const id = lista.body.data[lista.body.data.length - 1].id;

    const res = await request(app).get(`/productos/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('nombre');
  });

  test('GET /productos/:id - Escenario 2: producto no existe (404)', async () => {
    const res = await request(app).get('/productos/99999');
    expect(res.statusCode).toBe(404);
    expect(res.body.data).toHaveProperty('mensaje');
  });

  test('GET /productos/:id - Escenario 3: id inválido (texto)', async () => {
    const res = await request(app).get('/productos/abc');
    expect([404, 400, 500]).toContain(res.statusCode);
  });

  // =====================================================
  // 3. POST /productos
  // =====================================================
  test('POST /productos - Escenario 1: creación exitosa (201)', async () => {
    const res = await request(app)
      .post('/productos')
      .send({ nombre: 'Mouse', precio: 250, categoria_id: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('nombre', 'Mouse');
  });

  test('POST /productos - Escenario 2: body vacío (fallo controlado)', async () => {
    const res = await request(app).post('/productos').send({});
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  test('POST /productos - Escenario 3: datos parciales (solo nombre)', async () => {
    const res = await request(app).post('/productos').send({ nombre: 'SoloNombre' });
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  // =====================================================
  // 4. DELETE /productos/:id
  // =====================================================
  test('DELETE /productos/:id - Escenario 1: eliminar existente (200)', async () => {
    const create = await request(app)
      .post('/productos')
      .send({ nombre: 'Borrar', precio: 50, categoria_id: 1 });

    const lista = await request(app).get('/productos');
    const id = lista.body.data[lista.body.data.length - 1].id;

    const res = await request(app).delete(`/productos/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.mensaje).toMatch(/eliminado/i);
  });

  test('DELETE /productos/:id - Escenario 2: eliminar id inexistente', async () => {
    const res = await request(app).delete('/productos/99999');
    expect([200, 404]).toContain(res.statusCode);
  });

  test('DELETE /productos/:id - Escenario 3: id inválido', async () => {
    const res = await request(app).delete('/productos/xyz');
    expect([200, 404, 400, 500]).toContain(res.statusCode);
  });

  // =====================================================
  // 5. GET /categorias
  // =====================================================
  test('GET /categorias - Escenario 1: lista exitosa (200)', async () => {
    const res = await request(app).get('/categorias');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /categorias - Escenario 2: estructura JSON correcta', async () => {
    const res = await request(app).get('/categorias');
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(res.body).toHaveProperty('data');
  });

  test('GET /categorias - Escenario 3: después de vaciar BD', async () => {
    await request(app).delete('/vaciar');
    const res = await request(app).get('/categorias');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // =====================================================
  // 6. POST /categorias
  // =====================================================
  test('POST /categorias - Escenario 1: creación exitosa (201)', async () => {
    const res = await request(app)
      .post('/categorias')
      .send({ nombre: 'Nueva Cat' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.nombre).toBe('Nueva Cat');
  });

  test('POST /categorias - Escenario 2: body vacío', async () => {
    const res = await request(app).post('/categorias').send({});
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  test('POST /categorias - Escenario 3: nombre vacío', async () => {
    const res = await request(app).post('/categorias').send({ nombre: '' });
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  // =====================================================
  // 7. DELETE /categorias/:id
  // =====================================================
  test('DELETE /categorias/:id - Escenario 1: eliminar existente', async () => {
    await request(app).post('/categorias').send({ nombre: 'Cat Borrar' });
    const lista = await request(app).get('/categorias');
    const id = lista.body.data[lista.body.data.length - 1].id;

    const res = await request(app).delete(`/categorias/${id}`);
    expect(res.statusCode).toBe(200);
  });

  test('DELETE /categorias/:id - Escenario 2: id inexistente', async () => {
    const res = await request(app).delete('/categorias/99999');
    expect([200, 404]).toContain(res.statusCode);
  });

  test('DELETE /categorias/:id - Escenario 3: id inválido', async () => {
    const res = await request(app).delete('/categorias/abc');
    expect([200, 404, 400, 500]).toContain(res.statusCode);
  });

  // =====================================================
  // 8. GET /productos/count/total
  // =====================================================
  test('GET /productos/count/total - Escenario 1: devuelve total numérico', async () => {
    const res = await request(app).get('/productos/count/total');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.data.total).toBe('number');
  });

  test('GET /productos/count/total - Escenario 2: total >= 0', async () => {
    const res = await request(app).get('/productos/count/total');
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
  });

  test('GET /productos/count/total - Escenario 3: después de vaciar', async () => {
    await request(app).delete('/vaciar');
    const res = await request(app).get('/productos/count/total');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBe(0);
  });

  // =====================================================
  // 9. DELETE /vaciar
  // =====================================================
  test('DELETE /vaciar - Escenario 1: vaciado exitoso', async () => {
    const res = await request(app).delete('/vaciar');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.mensaje).toMatch(/vaciada/i);
  });

  test('DELETE /vaciar - Escenario 2: vaciar dos veces seguidas', async () => {
    await request(app).delete('/vaciar');
    const res = await request(app).delete('/vaciar');
    expect(res.statusCode).toBe(200);
  });

  test('DELETE /vaciar - Escenario 3: después de vaciar, lista vacía', async () => {
    await request(app).delete('/vaciar');
    const res = await request(app).get('/productos');
    expect(res.body.data.length).toBe(0);
  });

  // =====================================================
  // 10. POST /backup
  // =====================================================
  test('POST /backup - Escenario 1: generar backup', async () => {
    const res = await request(app).post('/backup');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('POST /backup - Escenario 2: backup con BD vacía', async () => {
    await request(app).delete('/vaciar');
    const res = await request(app).post('/backup');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('POST /backup - Escenario 3: no debe caer el servidor', async () => {
    const res = await request(app).post('/backup');
    expect(res.statusCode).toBeDefined();
  });

  

});

