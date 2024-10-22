// Image Reader

// Image to Frame Positions JavaScript Version (original Python)
// With help from ChatGPT

// Variables

const defaultConfiguration = {
	resolutionWidth: 480,
	resolutionHeight: 240,
	rgbRound: 1,
};

// Helper functions

function roundToNearestIntMultiple(x, multiple) {
	return Math.round(x / multiple) * multiple;
}

function clamp(x, minNum, maxNum) {
	return Math.min(Math.max(x, minNum), maxNum);
}

// Get detailed RGB info from a flat array pixel
function getPixelRGBValues(dataArray, x, y, width, rgbRound) {
	// Get RGB values
	const pixelBaseIndex = (x + y * width) * 4;
	let R = dataArray[pixelBaseIndex];
	let G = dataArray[pixelBaseIndex + 1];
	let B = dataArray[pixelBaseIndex + 2];
	let A = dataArray[pixelBaseIndex + 3];

	// Round RGB values
	R = clamp(roundToNearestIntMultiple(R, rgbRound), 0, 255);
	G = clamp(roundToNearestIntMultiple(G, rgbRound), 0, 255);
	B = clamp(roundToNearestIntMultiple(B, rgbRound), 0, 255);
	const rgbNumber = R * (1 << 16) + G * (1 << 8) + B;

	// Return
	return { R, G, B, rgbNumber };
}

// ImageReader Class
export class ImageReader {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas_ctx = this.canvas.getContext('2d', { willReadFrequently: true });

		this.showSameColor = false;
		this.setConfiguration(defaultConfiguration);
	}

	/**
	 * 
	 * @param {{resolutionWidth, resolutionHeight, rgbRound}} config 
	 */
	setConfiguration(config) {
		this.resolutionWidth = config.resolutionWidth;
		this.resolutionHeight = config.resolutionHeight;
		this.rgbRound = config.rgbRound;
	}

	// Retrieve the image pixels converted into an array/vector
	async getImageArray(readerResult, useImage) {
		const img = useImage || new Image();

		// Load image
		if (!useImage) {
			img.src = readerResult;
			await img.decode();
		}

		// Resize canvas & draw resized image on canvas
		const canvas = this.canvas;
		const ctx = this.canvas_ctx;
		canvas.width = this.resolutionWidth;
		canvas.height = this.resolutionHeight;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		// Initialize result
		let result = "{";
		let frameId = 0;

		// Image frame info
		const width = canvas.width;
		const height = canvas.height;
		const frameRGB = [];

		// Get pixels
		const imageData = ctx.getImageData(0, 0, width, height);
		const pixels = imageData.data;
		// console.log(imageData.data);

		// Loop through every pixel
		const willTemporalEncode = (frameId > 0 && !this.showSameColor);
		result += "{";
		for (let resoI = 0; resoI < this.resolutionHeight; resoI++) {
			// Row RGBs
			const rowRGB = [];
			result += "{";
			for (let resoJ = 0; resoJ < this.resolutionWidth; resoJ++) {
				// Get block's RGB info
				let { R, G, B, rgbNumber } = getPixelRGBValues(pixels, resoJ, resoI, width, this.rgbRound);
				rowRGB.push([R, G, B, 255]);

				// Add RBG to result string
				if (willTemporalEncode) {
					const prevRGB = frameRGB[frameId - 1][resoI][resoJ];
					if (prevRGB[0] === R && prevRGB[1] === G && prevRGB[2] === B) {
						result += "-1";
					} else {
						result += rgbNumber;
					}
				} else {
					result += rgbNumber;
				}

				// Trailing comma for each block
				if (resoJ + 1 < this.resolutionWidth) {
					result += ",";
				}
			}
			result += "}";

			// Trailing comma for each row
			if (resoI + 1 < this.resolutionHeight) {
				result += ",";
			}

			// Update frame
			frameRGB.push(rowRGB);
		}
		result += "}";
		result += "}";

		// Return result string and the RGB frame data
		return { img, result, frameRGB };
	}

	/**
	 * Main function to process the image
	 * @param {File} imageFile
	 * @param {{resolutionWidth, resolutionHeight, rgbRound}} config
	 * @returns {Promise<{img: HTMLImageElement, result: string, frameRGB: [[[number]]]}>}
	 */
	async processImageFile(imageFile, config) {
		// Set config
		this.setConfiguration(config);

		// Process & return
		return new Promise((resolve, reject) => {
			// Process image
			const reader = new FileReader();

			reader.onload = async (event) => {
				resolve(await this.getImageArray(reader.result));
			};
			reader.onerror = reject;

			reader.readAsDataURL(imageFile);
		});

	}
};
