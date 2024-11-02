// Main

// Import

import { getProcessedBlobBufferString, ImageReader } from "./src/image-reader.js";

// Variables

const imageReader = new ImageReader();

const storedImageOutputCanvas = document.createElement("canvas");
const storedImageOutputContext = storedImageOutputCanvas.getContext("2d");

const storedImageOutput = {
	originalVector: "",
	outputRGBVector: "",
	outputPNGVector: "",
}

const maximumDisplayCharCount = (1 << 20);

// Helper functions

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {string} fileName 
 */
function downloadCanvasImage(canvas, fileName) {
	const a = document.createElement('a');
	a.href = canvas.toDataURL();
	a.download = fileName;
	a.click();
}

/**
 * 
 * @param {string} contentString 
 * @param {string} fileName 
 */
function downloadTextFile(contentString, fileName) {
	// Create a Blob object with the content
	const blob = new Blob([contentString], { type: 'text/plain' });

	// Create a URL for the Blob
	const url = URL.createObjectURL(blob);

	// Create a temporary <a> element to trigger the download
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;

	// Simulate a click
	a.click();

	// Clean up the object URL
	URL.revokeObjectURL(url);
}

// Local functions

function initializeImageReader() {
	const imageInput = document.getElementById('image-input');
	const imageReadButton = document.getElementById('image-read-button');
	const imageReadLoading = document.getElementById('image-read-loading');
	const imageSizeLabel = document.getElementById('image-size-label');

	const resolutionWidth = document.getElementById('image-resolution-width');
	const resolutionHeight = document.getElementById('image-resolution-height');
	const roundColor = document.getElementById('image-color-round');

	const originalImageOutputCharCountLabel = document.getElementById('original-image-output-char-count');
	const originalImageOutputVector = document.getElementById('original-image-output-vector');

	const imageOutputSizeLabel = document.getElementById('image-output-size');
	const imageOutputRGBCharCountLabel = document.getElementById('image-output-rgb-char-count');
	const imageOutputPNGCharCountLabel = document.getElementById('image-output-png-char-count');
	const imageOutputRGBVector = document.getElementById('image-output-rgb-vector');
	const imageOutputPNGVector = document.getElementById('image-output-png-vector');

	const imageOutputCanvas = document.getElementById('image-output-canvas');
	const imageOutputContext = imageOutputCanvas.getContext('2d');

	// Optimize textareas

	const textAreaProperties = {
		autocomplete: "off",
		autocorrect: "off",
		autocapitalize: "off",
		spellcheck: "off",
	};
	for (const [key, value] of Object.entries(textAreaProperties)) {
		imageOutputRGBVector[key] = value;
		imageOutputPNGVector[key] = value;
	}

	// Image functions

	async function readOriginalImage(file) {
		const { resultString } = await getProcessedBlobBufferString(file);
		originalImageOutputCharCountLabel.textContent = `${resultString.length}` || "N/A";
		if (resultString.length < maximumDisplayCharCount) {
			originalImageOutputVector.value = resultString;
		} else {
			originalImageOutputVector.value = "";
		}
		storedImageOutput.originalVector = resultString;
	}

	async function readImage(file) {
		await readOriginalImage(file);

		// Process image
		const config = {
			resolutionWidth: resolutionWidth.value,
			resolutionHeight: resolutionHeight.value,
			rgbRound: roundColor.value,
		};
		const { img, resultRGBString2D, resultRGBString3D, resultPNGString, frameRGB, newImageData, newBlob } = await imageReader.processResizeImageFile(file, config);
		const resultRGBString = resultRGBString3D;

		// Get dimensions
		const frameWidth = frameRGB[0].length;
		const frameHeight = frameRGB.length;

		// Show output
		imageSizeLabel.textContent = `${img.naturalWidth} × ${img.naturalHeight}` || "N/A";
		imageOutputSizeLabel.textContent = `${frameWidth} × ${frameHeight}` || "N/A";
		imageOutputRGBCharCountLabel.textContent = `${resultRGBString.length}` || "N/A";
		imageOutputPNGCharCountLabel.textContent = `${resultPNGString.length}` || "N/A";

		// Show text
		if (resultRGBString.length < maximumDisplayCharCount) {
			imageOutputRGBVector.value = resultRGBString;
		} else {
			imageOutputRGBVector.value = "";
		}
		if (resultPNGString.length < maximumDisplayCharCount) {
			imageOutputPNGVector.value = resultPNGString;
		} else {
			imageOutputPNGVector.value = "";
		}

		// Store output image
		storedImageOutputCanvas.width = newImageData.width;
		storedImageOutputCanvas.height = newImageData.height;
		storedImageOutputContext.clearRect(0, 0, newImageData.width, newImageData.height);
		storedImageOutputContext.putImageData(newImageData, 0, 0);

		// Draw output (scaled) image
		const canvasWidth = imageOutputCanvas.width;
		const canvasHeight = imageOutputCanvas.height;
		const scaleFactor = Math.min(
			canvasWidth / Math.max(canvasWidth, frameWidth),
			canvasHeight / Math.max(canvasHeight, frameHeight),
		);
		imageOutputContext.clearRect(0, 0, canvasWidth, canvasHeight);
		imageOutputContext.drawImage(storedImageOutputCanvas, 0, 0, frameWidth * scaleFactor, frameHeight * scaleFactor);

		// Store output vector for download
		storedImageOutput.outputRGBVector = resultRGBString;
		storedImageOutput.outputPNGVector = resultPNGString;
		console.log("Processed");
	}

	async function updateImage() {
		try {
			// Check for valid file
			const file = imageInput.files[0];
			if (file instanceof Blob) {
				imageReadLoading.removeAttribute("hidden");
				await readImage(file);
				imageReadLoading.setAttribute("hidden", true);
			}
			imageReadButton.style.setProperty("background-color", "");
		} catch (e) {
			console.error(e);
			return;
		}
	}

	async function onConfigChanged() {
		if (imageInput.files[0] instanceof Blob) {
			imageReadButton.style.setProperty("background-color", "DarkSeaGreen");
		}
	}

	// Events

	imageInput.addEventListener("change", updateImage);
	imageReadButton.addEventListener("click", updateImage);
	resolutionWidth.addEventListener("change", onConfigChanged);
	resolutionHeight.addEventListener("change", onConfigChanged);
	roundColor.addEventListener("change", onConfigChanged);
}

function initializeImageArrayDownload() {
	const originalDownloadImageVector = document.getElementById('original-image-download-vector');
	const downloadScaledImage = document.getElementById('download-scaled-image');
	const downloadImageRGBVector = document.getElementById('image-download-rgb-vector');
	const downloadImagePNGVector = document.getElementById('image-download-png-vector');

	originalDownloadImageVector.addEventListener("click", (ev) => {
		if (storedImageOutput.originalVector !== "") {
			downloadTextFile(storedImageOutput.originalVector, "original-image-vector");
		}
	});
	downloadScaledImage.addEventListener("click", (ev) => {
		if (storedImageOutput.outputRGBVector !== "") { // If stored array is empty, then image is empty
			downloadCanvasImage(storedImageOutputCanvas, "scaled-image");
		}
	});
	downloadImageRGBVector.addEventListener("click", (ev) => {
		if (storedImageOutput.outputRGBVector !== "") {
			downloadTextFile(storedImageOutput.outputRGBVector, "image-rgb-vector");
		}
	});
	downloadImagePNGVector.addEventListener("click", (ev) => {
		if (storedImageOutput.outputPNGVector !== "") {
			downloadTextFile(storedImageOutput.outputPNGVector, "image-png-vector");
		}
	});
}

function onDOMContentLoaded() {
	initializeImageReader();
	initializeImageArrayDownload();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
