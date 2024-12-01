const AWS = require('aws-sdk');
const Busboy = require('busboy');
const jpeg = require('jpeg-js'); // A lightweight library for encoding/decoding JPEG images

const s3 = new AWS.S3();

const handler = async (event) => {
	const bucketName = 'parsity';
	const fileName = 'transformed-image.jpg';

	try {
		// Parse the incoming multipart form-data
		const buffer = await parseMultipart(event);

		// Decode the JPEG to get raw pixel data
		const decodedImage = jpeg.decode(buffer, { useTArray: true });

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

// Function to parse multipart/form-data
const parseMultipart = async (event) => {
	return new Promise((resolve, reject) => {
		const busboy = Busboy({
			headers: {
				'content-type':
					event.headers['content-type'] ||
					event.headers['Content-Type'],
			},
		});

		let fileBuffer = null;

		busboy.on('file', (_, file) => {
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
