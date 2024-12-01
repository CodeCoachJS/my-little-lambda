const AWS = require('aws-sdk');
const Busboy = require('busboy');
const Jimp = require('jimp');

const s3 = new AWS.S3();

const handler = async (event) => {
	const bucketName = 'parsity';
	const fileName = 'transformed-image.jpg';

	try {
		// Parse the incoming multipart form-data
		const buffer = await parseMultipart(event);

		// Use Jimp to process the image
		const image = await Jimp.read(buffer);
		image.grayscale();

		// Convert the transformed image to a buffer
		const transformedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

		// Upload the image to S3
		await s3
			.putObject({
				Bucket: bucketName,
				Key: fileName,
				Body: transformedBuffer,
				ContentType: 'image/jpeg',
			})
			.promise();

		return {
			statusCode: 200,
			body: JSON.stringify(
				'Image transformed and uploaded successfully!'
			),
		};
	} catch (error) {
		console.error(error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Failed to process the image.',
				error: error.message,
			}),
		};
	}
};

const parseMultipart = async (event) => {
	return new Promise((resolve, reject) => {
		const busboy = new Busboy({
			headers: {
				'content-type':
					event.headers['content-type'] ||
					event.headers['Content-Type'],
			},
		});

		let fileBuffer = null;

		busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
			const chunks = [];
			file.on('data', (chunk) => {
				chunks.push(chunk);
			});
			file.on('end', () => {
				fileBuffer = Buffer.concat(chunks);
			});
		});

		busboy.on('finish', () => {
			if (fileBuffer) {
				resolve(fileBuffer);
			} else {
				reject(new Error('No file uploaded.'));
			}
		});

		busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
		busboy.end();
	});
};

module.exports = { handler };
