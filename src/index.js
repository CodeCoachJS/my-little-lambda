const { S3Client } = require('@aws-sdk/client-s3');
const Jimp = require('jimp');

const s3 = new AWS.S3();

const handler = async (event) => {
	const parsedBody = JSON.parse(event.body);

	const bucketName = 'parsity';
	const fileName = `${parsedBody.fileName}.jpg;`;

	try {
		const base64String = parsedBody.image;
		const buffer = Buffer.from(base64String, 'base64');

		const image = await Jimp.read(buffer);

		image.grayscale();

		const transformedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

		await S3Client.putObject({
			Bucket: bucketName,
			Key: fileName,
			Body: transformedBuffer,
			ContentType: 'image/jpeg',
		}).promise();

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
			body: JSON.stringify('Failed to process the image.'),
		};
	}
};

module.exports = { handler };
