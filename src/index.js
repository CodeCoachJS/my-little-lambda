const items = [];

const handler = async (event) => {
	const { httpMethod, body, pathParameters } = event;
	let response;

	switch (httpMethod) {
		case 'GET':
			if (pathParameters) {
				response = getItem(pathParameters.id);
			} else {
				response = getAllItems();
			}
			break;
		case 'POST':
			response = createItem(JSON.parse(body));
			break;
		case 'PUT':
			response = updateItem(pathParameters.id, JSON.parse(body));
			break;
		case 'DELETE':
			response = deleteItem(pathParameters.id);
			break;
		default:
			response = {
				statusCode: 405,
				body: JSON.stringify({ message: 'Method Not Allowed' }),
			};
	}

	return response;
};

const getItem = (id) => {
	const item = items.find((item) => item.id === id);
	return {
		statusCode: 200,
		body: JSON.stringify(item),
	};
};

const getAllItems = () => {
	return {
		statusCode: 200,
		body: JSON.stringify(items),
	};
};

const createItem = (data) => {
	items.push(data);
	return {
		statusCode: 201,
		body: JSON.stringify(data),
	};
};

const updateItem = (id, data) => {
	const index = items.findIndex((item) => item.id === id);
	if (index === -1) {
		return {
			statusCode: 404,
			body: JSON.stringify({ message: 'Item not found' }),
		};
	}
	items[index] = { id, ...data };
	return {
		statusCode: 200,
		body: JSON.stringify(items[index]),
	};
};

const deleteItem = (id) => {
	const index = items.findIndex((item) => item.id === id);
	if (index === -1) {
		return {
			statusCode: 404,
			body: JSON.stringify({ message: 'Item not found' }),
		};
	}
	items.splice(index, 1);
	return {
		statusCode: 204,
		body: null,
	};
};

// Function to run locally
if (require.main === module) {
	(async () => {
		await handler({
			httpMethod: 'POST',
			pathParameters: { id: '1' },
			body: JSON.stringify({ id: '1', name: 'Test Item' }),
		});
		const result = await handler({
			httpMethod: 'GET',
			pathParameters: { id: '1' },
		});
		console.log(result);
	})();
}

module.exports = { handler };
