const AWS = require('aws-sdk');
const Busboy = require('busboy');
const jpeg = require('jpeg-js');

const s3 = new AWS.S3();

const handler = async (event) => {
	console.log(event);
	const bucketName = 'parsity';
	const fileName = 'transformed-image.jpg';

	try {
		// Parse the incoming multipart form-data
		const fileBuffer = await parseMultipart(event);

		// Debug: Log file buffer details
		console.log('File buffer received:', fileBuffer.slice(0, 10));

		// Validate JPEG buffer
		if (
			!fileBuffer ||
			fileBuffer.length < 2 ||
			fileBuffer[0] !== 0xff ||
			fileBuffer[1] !== 0xd8
		) {
			console.error(
				'Invalid JPEG file. Buffer start:',
				fileBuffer ? fileBuffer.slice(0, 10) : null
			);
			throw new Error('Invalid JPEG file. SOI marker not found.');
		}

		// Decode the JPEG to get raw pixel data
		const decodedImage = jpeg.decode(fileBuffer, { useTArray: true });

		// Apply grayscale transformation
		const grayscaleImage = applyGrayscale(decodedImage);

		// Encode the transformed image back to JPEG
		const transformedBuffer = jpeg.encode(grayscaleImage, 90).data;

		// Upload the transformed image to S3
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
		console.error('Error:', error.message);
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
		const contentType =
			event.headers['Content-Type'] || event.headers['content-type'];
		if (!contentType) {
			return reject(new Error('Content-Type header is missing'));
		}

		const boundaryMatch = contentType.match(/boundary=([^\s]+)/);
		if (!boundaryMatch) {
			return reject(
				new Error('Boundary not found in Content-Type header.')
			);
		}
		const boundary = boundaryMatch[1];

		const busboy = Busboy({ headers: { 'content-type': contentType } });

		let fileBuffer = null;

		busboy.on('file', (fieldname, file, info) => {
			const { filename, mimeType } = info;
			console.log(`File received: ${filename}, mimeType: ${mimeType}`);

			const chunks = [];
			file.on('data', (chunk) => {
				console.log('Received chunk size:', chunk.length);
				chunks.push(chunk);
			});
			file.on('end', () => {
				console.log('File upload finished');
				fileBuffer = Buffer.concat(chunks);
				console.log('Total buffer size:', fileBuffer.length);
			});
		});

		busboy.on('finish', () => {
			if (fileBuffer) {
				resolve(fileBuffer);
			} else {
				reject(new Error('No file uploaded.'));
			}
		});

		const body = event.isBase64Encoded
			? Buffer.from(event.body, 'base64')
			: Buffer.from(event.body, 'utf-8');

		console.log('Decoded body size:', body.length);
		busboy.write(body);
		busboy.end();
	});
};

// Function to apply grayscale transformation
const applyGrayscale = (decodedImage) => {
	const { data, width, height } = decodedImage;

	// Iterate through every pixel (4 values per pixel: R, G, B, A)
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		// Calculate grayscale value using the luminosity method
		const gray = Math.round(0.3 * r + 0.59 * g + 0.11 * b);

		// Set R, G, and B to the grayscale value
		data[i] = data[i + 1] = data[i + 2] = gray;
	}

	return { data, width, height };
};

module.exports = { handler };
