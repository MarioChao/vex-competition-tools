// Main

// Import

import { getProcessedBlobBufferString, ImageReader } from "../image-reader.js";

// Variables

const videoReader = new ImageReader();

const storedVideoOutputCanvas = document.createElement("canvas");
const storedVideoOutputContext = storedVideoOutputCanvas.getContext("2d");

const downloadVideoOutputCanvas = document.createElement("canvas");
const downloadVideoOutputContext = downloadVideoOutputCanvas.getContext("2d");

const storedVideoOutput = {
	frameRGB: [],
	imageDatas: [],
	outputRGBVector: "",
	outputPNGVector: "",
}

const maximumDisplayCharCount = (1 << 20);

// Helper functions

/**
 * Download multiple files as a zip using JSZip. Made by ChatGPT
 * @param {{url: string, name: string}[]} files 
 * @param {string} name 
 */
async function downloadFilesAsZip(files, zipName) {
	const zip = new JSZip();

	// Add each file to the zip
	for (const file of files) {
		const response = await fetch(file.url);
		const blob = await response.blob();
		zip.file(file.name, blob);
	}

	// Generate the zip file and trigger the download
	zip.generateAsync({ type: 'blob' }).then(function (content) {
		const link = document.createElement('a');
		link.href = URL.createObjectURL(content);
		link.download = zipName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
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

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {ImageData} imageData 
 */
function handlePutImageData(canvas, imageData) {
	const context = canvas.getContext("2d");
	canvas.width = imageData.width;
	canvas.height = imageData.height;
	context.clearRect(0, 0, imageData.width, imageData.height);
	context.putImageData(imageData, 0, 0);
}

// Local functions

function initializeVideoReader() {
	const videoInput = document.getElementById('video-input');
	const videoReadButton = document.getElementById('video-read-button');
	const videoReadLoading = document.getElementById('video-read-loading');
	const videoSizeLabel = document.getElementById('video-size-label');

	const resolutionWidth = document.getElementById('video-resolution-width');
	const resolutionHeight = document.getElementById('video-resolution-height');
	const roundColor = document.getElementById('video-color-round');

	const startFrame = document.getElementById('video-start-frame');
	const frameCount = document.getElementById('video-frame-count');
	const frameStep = document.getElementById('video-frame-step');
	const framesPerSecond = document.getElementById('video-frames-per-second');

	const videoOutputSizeLabel = document.getElementById('video-output-size');
	const videoOutputRGBCharCountLabel = document.getElementById('video-output-rgb-char-count');
	const videoOutputPNGCharCountLabel = document.getElementById('video-output-png-char-count');
	const videoOutputRGBVector = document.getElementById('video-output-rgb-vector');
	const videoOutputPNGVector = document.getElementById('video-output-png-vector');

	const videoOutputCanvas = document.getElementById('video-output-canvas');
	const videoOutputContext = videoOutputCanvas.getContext('2d');

	const videoOutputFrameId = document.getElementById("video-output-frame-id");

	// Optimize textareas

	const textAreaProperties = {
		autocomplete: "off",
		autocorrect: "off",
		autocapitalize: "off",
		spellcheck: "off",
	};
	for (const [key, value] of Object.entries(textAreaProperties)) {
		videoOutputRGBVector[key] = value;
		videoOutputPNGVector[key] = value;
	}

	// Video functions

	async function readVideo(file) {
		// Process video
		const config = {
			resolutionWidth: resolutionWidth.value,
			resolutionHeight: resolutionHeight.value,
			rgbRound: roundColor.value,
		};
		const videoConfig = {
			startFrame: startFrame.value,
			frameCount: frameCount.value,
			frameStep: frameStep.value,
			framesPerSecond: framesPerSecond.value,
		};
		const { video, resultRGBString, resultPNGString, frameRGB, newImageDatas, newBlobs } = await videoReader.processResizeVideoFile(file, config, videoConfig);

		// Get dimensions
		const frameWidth = frameRGB[0].length;
		const frameHeight = frameRGB.length;

		// Show output
		videoSizeLabel.textContent = `${video.videoWidth} × ${video.videoHeight}` || "N/A";
		videoOutputSizeLabel.textContent = `${frameWidth} × ${frameHeight}` || "N/A";
		videoOutputRGBCharCountLabel.textContent = `${resultRGBString.length}` || "N/A";
		videoOutputPNGCharCountLabel.textContent = `${resultPNGString.length}` || "N/A";

		// Show text
		if (resultRGBString.length < maximumDisplayCharCount) {
			videoOutputRGBVector.value = resultRGBString;
		} else {
			videoOutputRGBVector.value = "";
		}
		if (resultPNGString.length < maximumDisplayCharCount) {
			videoOutputPNGVector.value = resultPNGString;
		} else {
			videoOutputPNGVector.value = "";
		}

		// Store output video
		storedVideoOutput.frameRGB = frameRGB;
		storedVideoOutput.imageDatas = newImageDatas;
		const newImageData = newImageDatas[0];
		handlePutImageData(storedVideoOutputCanvas, newImageData);

		// Update frame id slider
		videoOutputFrameId.value = 0;
		videoOutputFrameId.min = 0;
		videoOutputFrameId.max = newImageDatas.length - 1;

		// Draw output (scaled) video image
		const canvasWidth = videoOutputCanvas.width;
		const canvasHeight = videoOutputCanvas.height;
		const scaleFactor = Math.min(
			canvasWidth / Math.max(canvasWidth, frameWidth),
			canvasHeight / Math.max(canvasHeight, frameHeight),
		);
		videoOutputContext.clearRect(0, 0, canvasWidth, canvasHeight);
		videoOutputContext.drawImage(storedVideoOutputCanvas, 0, 0, frameWidth * scaleFactor, frameHeight * scaleFactor);

		// Store output vector for download
		storedVideoOutput.outputRGBVector = resultRGBString;
		storedVideoOutput.outputPNGVector = resultPNGString;
		console.log("Processed");
	}

	async function updateVideo() {
		try {
			// Check for valid file
			const file = videoInput.files[0];
			if (file instanceof Blob) {
				videoReadLoading.removeAttribute("hidden");
				await readVideo(file);
				videoReadLoading.setAttribute("hidden", true);
			}
			videoReadButton.style.setProperty("background-color", "");
		} catch (e) {
			console.error(e);
			return;
		}
	}

	async function onConfigChanged() {
		if (videoInput.files[0] instanceof Blob) {
			videoReadButton.style.setProperty("background-color", "DarkSeaGreen");
		}
	}

	// Events

	videoInput.addEventListener("change", updateVideo);
	videoReadButton.addEventListener("click", updateVideo);
	resolutionWidth.addEventListener("change", onConfigChanged);
	resolutionHeight.addEventListener("change", onConfigChanged);
	roundColor.addEventListener("change", onConfigChanged);
	startFrame.addEventListener("change", onConfigChanged);
	frameCount.addEventListener("change", onConfigChanged);
	frameStep.addEventListener("change", onConfigChanged);
	framesPerSecond.addEventListener("change", onConfigChanged);
}

function initializeVideoArrayDownload() {
	const downloadScaledVideo = document.getElementById('download-scaled-video');
	const downloadVideoRGBVector = document.getElementById('video-download-rgb-vector');
	const downloadVideoPNGVector = document.getElementById('video-download-png-vector');

	downloadScaledVideo.addEventListener("click", (ev) => {
		if (storedVideoOutput.imageDatas.length) {
			// Download all frames
			const files = [];
			for (let i = 0; i < storedVideoOutput.imageDatas.length; i++) {
				const imageData = storedVideoOutput.imageDatas[i];
				handlePutImageData(downloadVideoOutputCanvas, imageData);
				files.push({
					url: downloadVideoOutputCanvas.toDataURL(),
					name: `scaled-video-image-${i}.png`,
				});
			}
			downloadFilesAsZip(files, "scaled-video-images");
		}
	});
	downloadVideoRGBVector.addEventListener("click", (ev) => {
		if (storedVideoOutput.outputRGBVector !== "") {
			downloadTextFile(storedVideoOutput.outputRGBVector, "video-rgb-vector");
		}
	});
	downloadVideoPNGVector.addEventListener("click", (ev) => {
		if (storedVideoOutput.outputPNGVector !== "") {
			downloadTextFile(storedVideoOutput.outputPNGVector, "video-png-vector");
		}
	});
}

function initializeVideoFrameSlider() {
	const videoOutputCanvas = document.getElementById('video-output-canvas');
	const videoOutputContext = videoOutputCanvas.getContext('2d');

	const videoOutputFrameId = document.getElementById("video-output-frame-id");

	videoOutputFrameId.addEventListener("input", (ev) => {
		// Validate frame id
		const frameId = videoOutputFrameId.value;
		if (frameId < 0 || frameId >= storedVideoOutput.imageDatas.length) {
			return;
		}

		// Display image
		handlePutImageData(storedVideoOutputCanvas, storedVideoOutput.imageDatas[frameId]);

		// Get dimensions
		const frameWidth = storedVideoOutput.frameRGB[0].length;
		const frameHeight = storedVideoOutput.frameRGB.length;

		// Draw output (scaled) video image
		const canvasWidth = videoOutputCanvas.width;
		const canvasHeight = videoOutputCanvas.height;
		const scaleFactor = Math.min(
			canvasWidth / Math.max(canvasWidth, frameWidth),
			canvasHeight / Math.max(canvasHeight, frameHeight),
		);
		videoOutputContext.clearRect(0, 0, canvasWidth, canvasHeight);
		videoOutputContext.drawImage(storedVideoOutputCanvas, 0, 0, frameWidth * scaleFactor, frameHeight * scaleFactor);
	});
}

function onDOMContentLoaded() {
	initializeVideoReader();
	initializeVideoArrayDownload();
	initializeVideoFrameSlider();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded)
