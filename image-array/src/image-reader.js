// Image Reader

// Image to Frame Positions JavaScript Version (original Python)
// With help from ChatGPT

// Variables

const defaultConfiguration = {
	resolutionWidth: 480,
	resolutionHeight: 240,
	rgbRound: 1,
};

const defaultVideoConfiguration = {
	startFrame: 0,
	frameCount: 30,
	frameStep: 5,
	framesPerSecond: 30,
};

const defaultLoadProgress = {
	loadedCount: 0,
	totalCount: 0,
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
 * @param {CanvasImageSource} source 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} targetWidth 
 * @param {number} targetHeight 
 * @returns {ImageData} Image data
 */
function getResizedImageSourceData(source, canvas, targetWidth, targetHeight) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });

	// Resize canvas to target resolution
	canvas.width = targetWidth;
	canvas.height = targetHeight;

	// Draw resized image
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

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
 * @param {number[][][]} previousFrame 
 * @returns 
 */
function getContextFrameRGB(imageData, rgbRound, temporalEncode = false, previousFrame = null) {
	// Get pixels
	const pixels = imageData.data;
	const width = imageData.width;
	const height = imageData.height;
	// console.log(imageData.data);

	// Initialize result
	let resultString2D = "";
	let resultString3D = "";
	const frameRGB = [];

	// Loop through every pixel
	resultString2D += "{";
	resultString2D += "\n";
	resultString3D += "{";
	resultString3D += "\n";
	for (let resoI = 0; resoI < height; resoI++) {
		resultString3D += "{";

		// Row RGBs
		let rowResult = "";
		const rowRGB = [];
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
				resultString2D += rowResult;
				resultString2D += "\n";
				resultString3D += rowResult;
				resultString3D += "\n";
				rowResult = "";
			}
		}

		// New line for each row
		rowResult += "\n";

		// Update rgb string
		resultString2D += rowResult;
		resultString3D += rowResult;
		resultString3D += "},";

		// Update frame
		frameRGB.push(rowRGB);
	}

	// Trailing character for each frame
	resultString2D += "}";
	resultString3D += "}";

	// Return
	return { resultString2D, resultString3D, frameRGB };
}

/**
 * 
 * @param {number[][][]} frameRGB 
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
	const uint8Array = new Uint8Array(arrayBuffer);

	// Maybe compress data here?

	// Turn array buffer into array string
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
 * @param {number[][][]} frameRGB 
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

/**
 * Get the buffer string of a file.
 * @param {File} file 
 */
export async function getProcessedBlobBufferString(file) {
	let resultString = "";
	resultString += "{";
	const frameResultString = await getBlobBufferString(file);
	resultString += frameResultString;
	resultString += "}";
	return { resultString };
}

// ImageReader Class
export class ImageReader {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.canvas_ctx = this.canvas.getContext('2d', { willReadFrequently: true });

		this.canvas2 = document.createElement('canvas');
		this.canvas2_ctx = this.canvas2.getContext('2d', { willReadFrequently: true });

		this.video = document.createElement("video");
		this.storedVideoFile = null;

		this.temporalEncode = true;
		this.setConfiguration(defaultConfiguration);
		this.setVideoConfiguration(defaultVideoConfiguration);

		this.loadProgress = defaultLoadProgress;
		this.loadProgressElement = null;
	}

	/**
	 * 
	 * @param {{resolutionWidth, resolutionHeight, rgbRound}} config 
	 */
	setConfiguration(config) {
		this.resolutionWidth = parseFloat(config.resolutionWidth) || defaultConfiguration.resolutionWidth;
		this.resolutionHeight = parseFloat(config.resolutionHeight) || defaultConfiguration.resolutionHeight;
		this.rgbRound = parseFloat(config.rgbRound) || defaultConfiguration.rgbRound;
	}

	/**
	 * 
	 * @param {{startFrame, frameCount, frameStep}} videoConfig 
	 */
	setVideoConfiguration(videoConfig) {
		this.startFrame = parseFloat(videoConfig.startFrame) || defaultVideoConfiguration.startFrame;
		this.frameCount = parseFloat(videoConfig.frameCount) || defaultVideoConfiguration.frameCount;
		this.frameStep = parseFloat(videoConfig.frameStep) || defaultVideoConfiguration.frameStep;
		this.framesPerSecond = parseFloat(videoConfig.framesPerSecond) || defaultConfiguration.framesPerSecond;
	}

	updateLoadProgress() {
		// Validate element
		if (!this.loadProgressElement) {
			return;
		}

		// Update progress
		this.loadProgressElement.innerText = `${this.loadProgress.loadedCount}/${this.loadProgress.totalCount}`;
	}

	/**
	 * 
	 * @param {CanvasImageSource} source
	 * @param {boolean} temporalEncode 
	 * @param {number[][][]} previousFrame 
	 * @returns 
	 */
	async captureImageSourceArray(source, temporalEncode = false, previousFrame = null) {
		// Get frame's image data
		const resizedImageData = getResizedImageSourceData(source, this.canvas, this.resolutionWidth, this.resolutionHeight);

		// Add frame result for RGB pixels
		const { resultString2D, resultString3D, frameRGB } = getContextFrameRGB(resizedImageData, this.rgbRound, temporalEncode, previousFrame);
		const frameResultRGBString2D = resultString2D;
		const frameResultRGBString3D = resultString3D;

		// Add frame result for png format
		const { resultString: frameResultPNGString, newImageData, newBlob } = await getFrameRGBBuffer(frameRGB, this.canvas2, resizedImageData.width, resizedImageData.height);

		// Return result strings and the RGB frame data
		return { frameResultRGBString2D, frameResultRGBString3D, frameResultPNGString, frameRGB, newImageData, newBlob };
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
		let resultRGBString2D = "{";
		let resultRGBString3D = "{";
		let resultPNGString = "{";

		// Set load progress
		this.loadProgress.loadedCount = 0;
		this.loadProgress.totalCount = 1;
		this.updateLoadProgress();

		// Get frame result
		const { frameResultRGBString2D, frameResultRGBString3D, frameResultPNGString, frameRGB, newImageData, newBlob } = await this.captureImageSourceArray(img);

		// Add frame result
		resultRGBString2D += frameResultRGBString2D;
		resultRGBString3D += frameResultRGBString3D;
		resultPNGString += frameResultPNGString;

		// Update load progress
		this.loadProgress.loadedCount++;
		this.updateLoadProgress();

		// Enclosing bracket
		resultRGBString2D += "}";
		resultRGBString3D += "}";
		resultPNGString += "}";

		// Return result strings and the RGB frame data
		return { img, resultRGBString2D, resultRGBString3D, resultPNGString, frameRGB, newImageData, newBlob };
	}

	/**
	 * Main function to resize & process the image
	 * @param {File} imageFile
	 * @param {{resolutionWidth, resolutionHeight, rgbRound}} config
	 * @returns {Promise<{
	 * img: HTMLImageElement, resultRGBString2D: string, resultRGBString3D: string,
	 * resultPNGString: string, frameRGB: number[][][], newImageData: ImageData, newBlob: Blob
	 * }>}
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
	 * 
	 * @param {HTMLVideoElement} video 
	 * @param {number} time 
	 * @param {number[][][]} previousFrame 
	 * @returns {Promise<{
	 * frameResultRGBString2D: string, frameResultRGBString3D: string, frameResultPNGString: string,
	 * frameRGB: number[][][], newImageData: ImageData, newBlob: Blob
	 * }>}
	 */
	async captureVideoFrame(video, time, previousFrame = null) {
		return new Promise((resolve) => {
			// Set video time position
			video.currentTime = time;

			// On video seeked
			video.addEventListener("seeked", async (ev) => {
				if (previousFrame) {
					resolve(await this.captureImageSourceArray(video, true, previousFrame));
				} else {
					resolve(await this.captureImageSourceArray(video));
				}
			}, { once: true });
		});
	}

	/**
	 * 
	 * @param {HTMLVideoElement} video 
	 * @returns 
	 */
	async getResizedVideoArray(video) {
		// Initialize result strings
		let resultRGBString = "{";
		let resultPNGString = "{";
		const newImageDatas = [];
		const newBlobs = [];
		let frameRGB_0 = null;
		let previousFrame = null;

		// Set load progress
		this.loadProgress.loadedCount = 0;
		this.loadProgress.totalCount = this.frameCount;
		this.updateLoadProgress();

		// Go through frames
		for (let frameId = 0; frameId < this.frameCount; frameId++) {
			const time = (this.startFrame + frameId * this.frameStep) / this.framesPerSecond;
			// console.log(time);

			// Get frame result
			const { frameResultRGBString2D, frameResultRGBString3D, frameResultPNGString, frameRGB, newImageData, newBlob } = await this.captureVideoFrame(video, time, previousFrame);

			// Add frame result
			resultRGBString += `${frameResultRGBString3D},\n`;
			resultPNGString += `${frameResultPNGString},\n`;
			newImageDatas.push(newImageData);
			newBlobs.push(newBlob);
			if (!frameRGB_0) {
				frameRGB_0 = frameRGB;
			}

			// Update previous frame
			previousFrame = frameRGB;

			// Update load progress
			this.loadProgress.loadedCount++;
			this.updateLoadProgress();
		}

		// Enclosing bracket
		resultRGBString += "}";
		resultPNGString += "}";

		// Return result strings and the RGB frame data
		return { video, resultRGBString, resultPNGString, frameRGB: frameRGB_0, newImageDatas, newBlobs };
	}

	/**
	 * 
	 * @param {File} videoFile 
	 * @param {{resolutionWidth, resolutionHeight, rgbRound}} config 
	 * @param {{startFrame, frameCount, frameStep, framesPerSecond}} videoConfig 
	 * @returns {Promise<{
	 * video: HTMLVideoElement, resultRGBString: string, resultPNGString: string,
	 * frameRGB: number[][][], newImageDatas: ImageData[], newBlobs: Blob[],
	 * }>}
	 */
	async processResizeVideoFile(videoFile, config, videoConfig) {
		// Set config
		this.setConfiguration(config);
		this.setVideoConfiguration(videoConfig);

		// Revoke old video
		if (this.storedVideoFile) {
			URL.revokeObjectURL(this.storedVideoFile);
		}

		// Load video
		const video = this.video;
		video.src = URL.createObjectURL(videoFile);
		video.muted = true;

		// Store video
		this.storedVideoFile = videoFile;

		// On video loaded
		return new Promise((resolve) => {
			video.addEventListener("loadeddata", async (ev) => {
				// Process video
				resolve(await this.getResizedVideoArray(video));
			}, { once: true });
		})

	}
};
