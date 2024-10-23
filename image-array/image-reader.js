// Image Reader

// Image to Frame Positions JavaScript Version (original Python)
// With help from ChatGPT

// Variables

const defaultConfiguration = {
	resolutionWidth: 480,
	resolutionHeight: 240,
	rgbRound: 1,
};

const maxLineLength = 100;

// Helper functions

function roundToNearestIntMultiple(x, multiple) {
	return Math.round(x / multiple) * multiple;
}

function clamp(x, minNum, maxNum) {
	return Math.min(Math.max(x, minNum), maxNum);
}

function readAsArrayBuffer(imageFile) {
	return new Promise((resolve, reject) => {
		// Process image
		const reader = new FileReader();

		reader.onload = async (event) => {
			resolve(reader.result);
		};
		reader.onerror = reject;

		reader.readAsArrayBuffer(imageFile);
	});
}

/**
 * Resize image and return the image data
 * @param {HTMLImageElement} img 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} targetWidth 
 * @param {number} targetHeight 
 * @returns {ImageData} Image data
 */
function getResizedImageData(img, canvas, targetWidth, targetHeight) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });

	// Resize canvas to target resolution
	canvas.width = targetWidth;
	canvas.height = targetHeight;

	// Draw resized image
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

	// Return image data
	return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Get detailed RGB info from a flat array pixel.
 * @param {Uint8ClampedArray} dataArray 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} rgbRound 
 * @returns RGB values
 */
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

/**
 * 
 * @param {ImageData} imageData 
 * @param {number} rgbRound 
 * @param {boolean} temporalEncode 
 * @param {[[[number]]]} previousFrame 
 * @returns 
 */
function getContextFrameRGB(imageData, rgbRound, temporalEncode = false, previousFrame = null) {
	// Get pixels
	const pixels = imageData.data;
	const width = imageData.width;
	const height = imageData.height;
	// console.log(imageData.data);

	// Initialize result
	let resultString = "";
	const frameRGB = [];

	// Loop through every pixel
	resultString += "{";
	resultString += "\n";
	for (let resoI = 0; resoI < height; resoI++) {
		// Row RGBs
		let rowResult = "";
		const rowRGB = [];
		// rowResult += "{";
		for (let resoJ = 0; resoJ < width; resoJ++) {
			// Get pixel's RGB info
			let { R, G, B, rgbNumber } = getPixelRGBValues(pixels, resoJ, resoI, width, rgbRound);
			rowRGB.push([R, G, B, 255]);

			// Add RBG to result string
			if (temporalEncode) {
				const prevRGB = previousFrame[resoI][resoJ];
				if (prevRGB[0] === R && prevRGB[1] === G && prevRGB[2] === B) {
					rowResult += "-1";
				} else {
					rowResult += rgbNumber;
				}
			} else {
				rowResult += rgbNumber;
			}

			// Trailing comma for each pixel
			rowResult += ",";

			// New line if row is too long
			if (rowResult.length > maxLineLength) {
				resultString += rowResult;
				resultString += "\n";
				rowResult = "";
			}
		}

		// New line for each row
		rowResult += "\n";

		// Update frame
		resultString += rowResult;
		frameRGB.push(rowRGB);
	}

	// Trailing character for each frame
	resultString += "}";

	// Return
	return { resultString, frameRGB };
}

/**
 * 
 * @param {[[[number]]]} frameRGB 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} width 
 * @param {number} height 
 */
function drawFrameRGBOnCanvas(frameRGB, canvas, width, height) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });

	// Create new image data
	const dataArray = new Uint8ClampedArray(frameRGB.flat(2));
	const imageData = new ImageData(dataArray, width, height);

	// Resize canvas
	canvas.width = width;
	canvas.height = height;

	// Draw on canvas
	ctx.clearRect(0, 0, width, height);
	ctx.putImageData(imageData, 0, 0);

	// Return info
	return { imageData };
}

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @return {Promise<Blob>}
 */
function encodeCanvasToPNG(canvas) {
	return new Promise((resolve) => {
		// Convert canvas to a Blob
		canvas.toBlob((blob) => {
			resolve(blob);
		}, "image/png");
	});
}

/**
 * 
 * @param {Blob} blob 
 * @returns 
 */
export async function getBlobBufferString(blob) {
	// Convert blob to array buffer
	const arrayBuffer = await blob.arrayBuffer();

	// Turn array buffer into array string
	const uint8Array = new Uint8Array(arrayBuffer);
	let resultString = "";
	resultString += "{";
	let rowString = "";
	for (const value of uint8Array) {
		rowString += value.toString();
		rowString += ",";
		if (rowString.length > maxLineLength) {
			resultString += rowString;
			resultString += "\n";
			rowString = "";
		}
	}
	rowString += "\n";
	resultString += rowString;
	resultString += "}";

	// Return
	return resultString;
}

/**
 * 
 * @param {[[[number]]]} frameRGB 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} width 
 * @param {number} height 
 */
async function getFrameRGBBuffer(frameRGB, canvas, width, height) {
	// Draw frame on canvas
	const { imageData: newImageData } = drawFrameRGBOnCanvas(frameRGB, canvas, width, height);

	// Encode canvas as png
	const newBlob = await encodeCanvasToPNG(canvas);

	// Convert blob to array buffer
	const resultString = await getBlobBufferString(newBlob);

	// Return
	return { resultString, newImageData, newBlob };
}

// ImageReader Class
export class ImageReader {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas_ctx = this.canvas.getContext('2d', { willReadFrequently: true });

		this.canvas2 = document.createElement('canvas');
		this.canvas2_ctx = this.canvas2.getContext('2d', { willReadFrequently: true });

		this.temporalEncode = true;
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

	// Retrieve the resized image converted into vector and memory buffer
	async getResizedImageArray(readerResult, useImage) {
		const img = useImage || new Image();

		// Load image
		if (!useImage) {
			img.src = readerResult;
			await img.decode();
		}

		// Initialize result strings
		let resultRGBString = "{";
		let resultPNGString = "{";

		// Get frame's image data
		const resizedImageData = getResizedImageData(img, this.canvas, this.resolutionWidth, this.resolutionHeight);

		// Add frame result for RGB pixels
		const { resultString: frameResultRGBString, frameRGB } = getContextFrameRGB(resizedImageData, this.rgbRound);
		resultRGBString += frameResultRGBString;

		// Add frame result for png format
		const { resultString: frameResultPNGString, newImageData, newBlob } = await getFrameRGBBuffer(frameRGB, this.canvas2, resizedImageData.width, resizedImageData.height);
		resultPNGString += frameResultPNGString;

		// Enclosing bracket
		resultRGBString += "}";
		resultPNGString += "}";

		// Return result strings and the RGB frame data
		return { img, resultRGBString, resultPNGString, frameRGB, newImageData, newBlob };
	}

	/**
	 * Main function to resize & process the image
	 * @param {File} imageFile
	 * @param {{resolutionWidth, resolutionHeight, rgbRound}} config
	 * @returns {Promise<{img: HTMLImageElement, resultRGBString: string, resultPNGString: string, frameRGB: [[[number]]], newImageData: ImageData, newBlob: Blob}>}
	 */
	async processResizeImageFile(imageFile, config) {
		// Set config
		this.setConfiguration(config);

		// Process & return
		return new Promise((resolve, reject) => {
			// Process image
			const reader = new FileReader();

			reader.onload = async (event) => {
				resolve(await this.getResizedImageArray(reader.result));
			};
			reader.onerror = reject;

			reader.readAsDataURL(imageFile);
		});
	}

	/**
	 * Main function to process the original image file
	 * @param {File} imageFile 
	 */
	async processOriginalImageFile(imageFile) {
		let resultPNGString = "";
		resultPNGString += "{";
		const frameResultPNGString = await getBlobBufferString(imageFile);
		resultPNGString += frameResultPNGString;
		resultPNGString += "}";
		return { resultPNGString };
	}
};
