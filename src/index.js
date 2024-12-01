const AWS = require('aws-sdk');
const Jimp = require('jimp');

const s3 = new AWS.S3();

const handler = async (event) => {
	const bucketName = 'parsity';
	const fileName = 'transformed-image.jpg';

	try {
		const base64String = JSON.parse(event.body).image;
		const buffer = Buffer.from(base64String, 'base64');

		const image = await Jimp.read(buffer);

		image.grayscale();

		const transformedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

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
			body: JSON.stringify('Failed to process the image.'),
		};
	}
};

module.exports = { handler };
