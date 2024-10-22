// Main

// Import

import { ImageReader } from "./image-reader.js";

// Variables

const imageReader = new ImageReader();

const storedImageOutput = {
	outputArray: "",
	outputVector: "",
}

const maximumDisplayCharCount = (1 << 22);

// Helper functions

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
	document.body.appendChild(a);
	a.click();

	// Clean up the object URL
	URL.revokeObjectURL(url);

	// Clean up anchor
	document.body.removeChild(a);
}

// Local functions

function initializeImageReader() {
	const imageInput = document.getElementById('image-input');
	const imageReadButton = document.getElementById('image-read-button');
	const imageSizeLabel = document.getElementById('image-size-label');

	const resolutionWidth = document.getElementById('image-resolution-width');
	const resolutionHeight = document.getElementById('image-resolution-height');
	const roundColor = document.getElementById('image-color-round');

	const imageOutputSizeLabel = document.getElementById('image-output-size');
	const imageOutputCharCountLabel = document.getElementById('image-output-char-count');
	const imageOutputArray = document.getElementById('image-output-array');
	const imageOutputVector = document.getElementById('image-output-vector');

	const imageOutputCanvas = document.getElementById('image-output-canvas');
	const imageOutputContext = imageOutputCanvas.getContext('2d');

	// Optimize textareas

	const textAreaProperties = {
		autocomplete: "off",
		// autocorrect: "off",
		autocapitalize: "off",
		spellcheck: "off",
	};
	for (const [key, value] of Object.entries(textAreaProperties)) {
		imageOutputArray[key] = value;
		imageOutputVector[key] = value;
	}

	// Image functions

	async function readImage(file) {
		// Process image
		const config = {
			resolutionWidth: resolutionWidth.value,
			resolutionHeight: resolutionHeight.value,
			rgbRound: roundColor.value,
		};
		const { img, result, frameRGB } = await imageReader.processImageFile(file, config);

		// Get dimensions
		const frameWidth = frameRGB[0].length;
		const frameHeight = frameRGB.length;

		// Show output
		imageSizeLabel.textContent = `${img.width} × ${img.height}` || "N/A";
		imageOutputSizeLabel.textContent = `${frameWidth} × ${frameHeight}` || "N/A";
		imageOutputCharCountLabel.textContent = `${result.length}` || "N/A";

		// Show text
		if (result.length < maximumDisplayCharCount) {
			imageOutputArray.value = result.replaceAll("{", "[").replaceAll("}", "]");
			imageOutputVector.value = result;
		} else {
			imageOutputArray.value = "";
			imageOutputVector.value = "";
		}

		// Draw output (scaled) image
		const canvasWidth = imageOutputCanvas.width;
		const canvasHeight = imageOutputCanvas.height;
		const scaleFactor = Math.min(
			canvasWidth / Math.max(canvasWidth, frameWidth),
			canvasHeight / Math.max(canvasHeight, frameHeight),
		);
		const scaledFrameWidth = frameWidth * scaleFactor;
		const scaledFrameHeight = frameHeight * scaleFactor;
		imageOutputContext.clearRect(0, 0, canvasWidth, canvasHeight);
		if (config.rgbRound == 1) {
			imageOutputContext.drawImage(img, 0, 0, frameWidth * scaleFactor, frameHeight * scaleFactor);
		} else {
			imageReader.setConfiguration({
				resolutionWidth: scaledFrameWidth, resolutionHeight: scaledFrameHeight, rgbRound: config.rgbRound
			});
			const { frameRGB: newFrameRGB } = await imageReader.getImageArray(null, img);
			const dataArray = new Uint8ClampedArray(newFrameRGB.flat(2));
			const imageData = new ImageData(dataArray, scaledFrameWidth, scaledFrameHeight);
			imageOutputContext.putImageData(imageData, 0, 0);
		}

		// Store output array / vector for download
		storedImageOutput.outputArray = result.replaceAll("{", "[").replaceAll("}", "]");
		storedImageOutput.outputVector = result;
		console.log("Processed");
	}

	async function updateImage() {
		try {
			// Check for valid file
			const file = imageInput.files[0];
			if (file instanceof Blob) {
				readImage(file);
			} else {
				imageSizeLabel.textContent = "N/A";
				imageOutputSizeLabel.textContent = "N/A";
				imageOutputCharCountLabel.textContent = "N/A";
				imageOutputArray.value = "";
				imageOutputVector.value = "";
				storedImageOutput.outputArray = "";
				storedImageOutput.outputVector = "";
			}
			imageReadButton.style.setProperty("background-color", "");
		} catch (e) {
			console.error(e);
			return;
		}
	}

	async function onConfigChanged() {
		imageReadButton.style.setProperty("background-color", "DarkSeaGreen");
	}

	// Events

	imageInput.addEventListener("change", updateImage);
	imageReadButton.addEventListener("click", updateImage);
	resolutionWidth.addEventListener("change", onConfigChanged);
	resolutionHeight.addEventListener("change", onConfigChanged);
	roundColor.addEventListener("change", onConfigChanged);
}

function initializeImageArrayDownload() {
	const downloadImageArray = document.getElementById('download-image-array');
	const downloadImageVector = document.getElementById('download-image-vector');

	downloadImageArray.addEventListener("click", (ev) => {
		if (storedImageOutput.outputArray !== "") {
			downloadTextFile(storedImageOutput.outputArray, "image-array");
		}
	});
	downloadImageVector.addEventListener("click", (ev) => {
		if (storedImageOutput.outputVector !== "") {
			downloadTextFile(storedImageOutput.outputVector, "image-vector");
		}
	});
}

function onDOMContentLoaded() {
	initializeImageReader();
	initializeImageArrayDownload();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded)
