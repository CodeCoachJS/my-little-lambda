const { handler } = require('../src/index');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
	const mockPutObject = jest.fn().mockReturnValue({
		promise: jest.fn(),
	});
	return {
		S3: jest.fn(() => ({
			putObject: mockPutObject,
		})),
	};
});

// Mock Jimp
jest.mock('jimp', () => {
	const mockRead = jest.fn().mockResolvedValue({
		grayscale: jest.fn().mockReturnThis(),
		getBufferAsync: jest.fn().mockResolvedValue(Buffer.from('mockBuffer')),
	});
	return {
		__esModule: true,
		read: mockRead,
	};
});

describe('handler', () => {
	it('should transform and upload the image', async () => {
		const event = {
			body: JSON.stringify({
				image: '/9j/4AAQSkZJRgABAQEAYABgAAD/4QBoRXhpZgAATU0AKgAAAAgAA1IBAAEAAAABAAAAGgEAAEAAAABAAAAIgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABAAKADAAQAAAABAAABAAoAAAABAAABAAoAABIAAAABAAABAAoAAEgAAAABAAABAAoAAIg',
				fileName: 'transformed-image',
			}),
		};

		// Execute handler
		const response = await handler(event);

		// Mock AWS S3
		const mockPutObject = require('aws-sdk').S3().putObject;

		// Assertions
		expect(mockPutObject).toHaveBeenCalledWith({
			Bucket: 'parsity',
			Key: 'transformed-image.jpg',
			Body: expect.any(Buffer),
			ContentType: 'image/jpeg',
		});
		expect(response.statusCode).toBe(200);
		expect(response.body).toBe(
			JSON.stringify('Image transformed and uploaded successfully!')
		);
	});
});
