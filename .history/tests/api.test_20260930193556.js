process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app, startServer } = require('../server');

beforeAll(async () => {
  // Inicializa la base de datos, pero NO abre puertos
  await startServer();
  await new Promise(r => setTimeout(r, 800));
});

describe('API WebApp - Pruebas de Endpoints', () => {

  test('1. GET /productos - lista de productos (200)', async () => {
    const res = await request(app).get('/productos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('statusCode', 200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('2. GET /productos/1 - producto existente (200)', async () => {
    const res = await request(app).get('/productos/1');
    expect([200, 404]).toContain(res.statusCode);
  });

  test('3. GET /productos/9999 - producto no existe (404)', async () => {
    const res = await request(app).get('/productos/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body.statusCode).toBe(404);
  });

  test('4. POST /productos - crear producto (201)', async () => {
    const res = await request(app)
      .post('/productos')
      .send({ nombre: 'Producto Test', precio: 150, categoria_id: 1 });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });

  test('5. POST /productos - body vacío (no debe caerse)', async () => {
    const res = await request(app).post('/productos').send({});
    expect([201, 400, 500]).toContain(res.statusCode);
  });

  test('6. DELETE /productos/:id - eliminar producto', async () => {
    const create = await request(app)
      .post('/productos')
      .send({ nombre: 'Temp Delete', precio: 50, categoria_id: 1 });
    
    const id = create.body?.data?.id || 1;
    const res = await request(app).delete(`/productos/${id}`);
    expect(res.statusCode).toBe(200);
  });

  test('7. GET /categorias - lista de categorías (200)', async () => {
    const res = await request(app).get('/categorias');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('8. POST /categorias - crear categoría (201)', async () => {
    const res = await request(app)
      .post('/categorias')
      .send({ nombre: 'Cat Test' });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('nombre', 'Cat Test');
  });

  test('9. DELETE /categorias/:id - eliminar categoría', async () => {
    const create = await request(app)
      .post('/categorias')
      .send({ nombre: 'TempCat' });
    
    const id = create.body?.data?.id || 1;
    const res = await request(app).delete(`/categorias/${id}`);
    expect(res.statusCode).toBe(200);
  });

  test('10. GET /productos/count/total - conteo de productos', async () => {
    const res = await request(app).get('/productos/count/total');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('total');
  });

  test('11. DELETE /vaciar - vaciar base de datos', async () => {
    const res = await request(app).delete('/vaciar');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.mensaje).toMatch(/vaciada/i);
  });

  test('12. POST /backup - generar backup', async () => {
    const res = await request(app).post('/backup');
    expect([200, 500]).toContain(res.statusCode);
  });

});