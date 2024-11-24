const { handler } = require('../src/index');

test('GET /items returns all items', async () => {
	const event = { httpMethod: 'GET' };
	const result = await handler(event);
	expect(result.statusCode).toBe(200);
	expect(result.body).toBe(JSON.stringify([]));
});

test('POST /items creates an item', async () => {
	const event = {
		httpMethod: 'POST',
		body: JSON.stringify({ id: '1', name: 'Test Item' }),
	};
	const result = await handler(event);
	expect(result.statusCode).toBe(201);
	expect(result.body).toBe(JSON.stringify({ id: '1', name: 'Test Item' }));
});

test('GET /items/{id} returns an item', async () => {
	const postEvent = {
		httpMethod: 'POST',
		body: JSON.stringify({ id: '1', name: 'Test Item' }),
	};
	await handler(postEvent);

	const getEvent = { httpMethod: 'GET', pathParameters: { id: '1' } };
	const result = await handler(getEvent);
	expect(result.statusCode).toBe(200);
	expect(result.body).toBe(JSON.stringify({ id: '1', name: 'Test Item' }));
});

test('PUT /items/{id} updates an item', async () => {
	const postEvent = {
		httpMethod: 'POST',
		body: JSON.stringify({ id: '1', name: 'Test Item' }),
	};
	await handler(postEvent);

	const putEvent = {
		httpMethod: 'PUT',
		pathParameters: { id: '1' },
		body: JSON.stringify({ name: 'Updated Item' }),
	};
	const result = await handler(putEvent);
	expect(result.statusCode).toBe(200);
	expect(result.body).toBe(JSON.stringify({ id: '1', name: 'Updated Item' }));
});

test('DELETE /items/{id} deletes an item', async () => {
	const postEvent = {
		httpMethod: 'POST',
		body: JSON.stringify({ id: '1', name: 'Test Item' }),
	};
	await handler(postEvent);

	const deleteEvent = {
		httpMethod: 'DELETE',
		pathParameters: { id: '1' },
	};
	const result = await handler(deleteEvent);
	expect(result.statusCode).toBe(204);
});
