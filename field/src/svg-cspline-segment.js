// SVG Cubic Spline Segment


// Imports
import { Matrix } from "./matrix.js";


// Variables

const defaultPoints = [[0, 0], [0, 0], [0, 0], [0, 0]];

const CharacteristicMatrix = Object.freeze({
	Bezier: new Matrix([
		[1, 0, 0, 0],
		[-3, 3, 0, 0],
		[3, -6, 3, 0],
		[-1, 3, -3, 1],
	]),
	Hermite: new Matrix([
		[1, 0, 0, 0],
		[0, 1, 0, 0],
		[-3, -2, 3, -1],
		[2, 1, -2, 1],
	]),
	CatmullRom: new Matrix([
		[0, 2, 0, 0],
		[-1, 0, 1, 0],
		[2, -5, 4, -1],
		[-1, 3, -3, 1],
	]).scaleBy(0.5),
	B_Spline: new Matrix([
		[1, 4, 1, 0],
		[-3, 0, 3, 0],
		[3, -6, 3, 0],
		[-1, 3, -3, 1],
	]).scaleBy(1.0 / 6.0),
});

// Inverse bezier matrix (calculated with numpy), used to convert other cubic spline types to bezier.
const inverseBezier_matrix = new Matrix([
	[3, 0, 0, 0],
	[3, 1, 0, 0],
	[3, 2, 1, 0],
	[3, 3, 3, 3],
]).scaleBy(1.0 / 3.0);

const StoringMatrix = Object.freeze({
	Bezier: Matrix.identity(4),
	Hermite: new Matrix([
		[1, 0, 0, 0],
		[-1, 1, 0, 0],
		[0, 0, 1, 0],
		[0, 0, -1, 1],
	]),
	CatmullRom: Matrix.identity(4),
	B_Spline: Matrix.identity(4),
});


// Enums

export const SplineType = Object.freeze({
	Bezier: Symbol("bezier"),
	Hermite: Symbol("hermite"),
	CatmullRom: Symbol("catmull-rom"),
	B_Spline: Symbol("b-spline"),
});


// SVGCubicSplineSegment class

export class SVGCubicSplineSegment {
	/**
	 * Constructs a new cubic spline segment for SVG.
	 * @param {[[x: number, y: number], [x: number, y: number], [x: number, y: number], [x: number, y: number]]} points 
	 */
	constructor(points = defaultPoints, splineType = SplineType.Bezier) {
		this._onInit(points, splineType);
	}

	_onInit(points = defaultPoints, splineType = SplineType.Bezier) {
		// Initialize empty path element
		this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");

		// Set type
		this.splineType = splineType;

		// Set points
		this.setPoints(points);

		// Set stored svg elements
		this.storedPathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.storedControlContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.storedBezierControlContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.storedControlConnectionsContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.storedBezierControlConnectionsContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.storedDotContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
	}

	setPoints(points = defaultPoints) {
		this.controlPoints = points;
		this.calculateStoredPoints();
		this.calculateBezierSplinePoints();
		this.updatePathElement();
	}

	calculateStoredPoints() {
		const control_matrix = new Matrix(this.controlPoints);
		this.storedPoints = this.getStoringMatrix().multiply(control_matrix).data;
	}

	calculateBezierSplinePoints() {
		// Conversion matrix: (M_bezier)^-1 * (M_this)
		const conversion_matrix = inverseBezier_matrix.multiply(this.getCharacteristicMatrix());

		// Calculate bezier spline points
		const storedPoints_matrix = new Matrix(this.storedPoints);
		const bezierPoints = conversion_matrix.multiply(storedPoints_matrix).data;
		this.bezierSplinePoints = bezierPoints;
	}

	updatePathElement() {
		const bezierPoints = this.bezierSplinePoints;
		const pathString = `M ${bezierPoints[0]}, C ${bezierPoints[1]}, ${bezierPoints[2]}, ${bezierPoints[3]},`;
		this.path.setAttribute("d", pathString);
	}

	/**
	 * 
	 * @param {number} t
	 * @returns {[x: number, y: number]} 
	 */
	getAt(t) {
		const t_matrix = new Matrix([[1, t, t ** 2, t ** 3]]);
		const character_matrix = this.getCharacteristicMatrix();
		const control_matrix = new Matrix(this.storedPoints);
		return t_matrix.multiply(character_matrix).multiply(control_matrix).data[0];
	}

	/**
	 * 
	 * @param {number} t
	 * @returns {[x: number, y: number]} 
	 */
	getVelocityAt(t) {
		const t_matrix = new Matrix([[0, 1, 2 * t, 3 * t ** 2]]);
		const character_matrix = this.getCharacteristicMatrix();
		const control_matrix = new Matrix(this.storedPoints);
		return t_matrix.multiply(character_matrix).multiply(control_matrix).data[0];
	}

	getCharacteristicMatrix() {
		switch (this.splineType) {
			case SplineType.Bezier:
				return CharacteristicMatrix.Bezier;

			case SplineType.B_Spline:
				return CharacteristicMatrix.B_Spline;

			case SplineType.CatmullRom:
				return CharacteristicMatrix.CatmullRom;

			case SplineType.Hermite:
				return CharacteristicMatrix.Hermite;

			default:
				return Matrix.identity(4);
		}
	}

	getStoringMatrix() {
		switch (this.splineType) {
			case SplineType.Bezier:
				return StoringMatrix.Bezier;

			case SplineType.B_Spline:
				return StoringMatrix.B_Spline;

			case SplineType.CatmullRom:
				return StoringMatrix.CatmullRom;

			case SplineType.Hermite:
				return StoringMatrix.Hermite;

			default:
				return Matrix.identity(4);
		}
	}

	/**
	 * 
	 * @param {number} t The percentage on the spline. This point is moved to the `targetPoint`.
	 * @param {[x: number, y: number]} targetPoint The point to connect to.
	 */
	moveSplinePointTo(t, targetPoint) {
		const point = this.getAt(t);
		const deltaPoint = [targetPoint[0] - point[0], targetPoint[1] - point[1]];
		this.translateBy(deltaPoint);
	}

	/**
	 * 
	 * @param {[x: number, y: number]} deltaPoint The change in position.
	 */
	translateBy(deltaPoint) {
		// Get info
		const pointCount = this.controlPoints.length;
		const newPoints = [];

		// For each old point
		for (let index = 0; index < pointCount; index++) {
			// Create new translated point
			newPoints.push(this.controlPoints[index].map((x) => x));
			for (let dim = 0; dim < newPoints[index].length; dim++) {
				newPoints[index][dim] += deltaPoint[dim];
			}
		}

		// Update spline points
		this.setPoints(newPoints);
	}

	/**
	 * 
	 * @param {number} polarRotate_degrees The counter-clockwise rotation in degrees.
	 * @param {number} t The percentage on the spline. This point is used as the center of rotation.
	 */
	rotateBy(polarRotate_degrees, t = 0) {
		// Get center of rotation
		const centerPoint = this.getAt(t);

		// Create rotation matrix
		const theta_radians = polarRotate_degrees / 180.0 * Math.PI;
		const rotation_matrix = new Matrix([
			[Math.cos(theta_radians), -Math.sin(theta_radians)],
			[Math.sin(theta_radians), Math.cos(theta_radians)],
		]);

		// Get info
		const pointCount = this.controlPoints.length;
		const newPoints = [];

		// For each old point
		for (let index = 0; index < pointCount; index++) {
			// Create new rotated point
			const point_matrix = new Matrix(this.controlPoints[index].map((x) => [x]));
			const rotatedPoint = rotation_matrix.multiply(point_matrix).data.flat();
			newPoints.push(rotatedPoint);
		}

		// Update spline points
		this.setPoints(newPoints);

		// Translate center point back
		this.moveSplinePointTo(t, centerPoint);
	}

	showPath(parent_element, strokeColor = "") {
		// Get container
		const container = this.storedPathContainer;
		if (container.parentElement === parent_element) {
			parent_element.removeChild(container);
		}

		// Set config
		container.setAttribute("stroke", strokeColor);

		// Parent path
		container.appendChild(this.path);

		// Show
		parent_element.appendChild(container);
	}

	hidePath() {
		// Get and hide container
		const container = this.storedPathContainer;
		const parent_element = container.parentElement;
		if (parent_element) {
			parent_element.removeChild(container);
		}
	}

	/**
	 * 
	 * @param {SVGElement} parent_element 
	 * @param {SVGGElement} container 
	 * @param {[x: number, y: number][]} points 
	 * @param {string} strokeColor
	 */
	_drawConnections(parent_element, container, points, strokeColor = "") {
		// Get container
		if (container.parentElement === parent_element) {
			parent_element.removeChild(container);
		}

		// Clear previous dots
		container.innerHTML = "";

		// Set config
		container.setAttribute("stroke", strokeColor);
		// container.setAttribute("stroke-dasharray", "0.1");

		// Draw connections
		{
			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			let pathString = `M ${points[0]},`;
			for (let index = 1; index < points.length; index++) {
				pathString += ` L ${points[index]},`;
			}
			path.setAttribute("d", pathString);
			path.setAttribute("fill", "none");
			container.append(path);
		}

		// Show
		parent_element.appendChild(container);
	}

	/**
	 * 
	 * @param {SVGElement} parent_element The parent element of the circles.
	 * @param {string} strokeColor The stroke color of the circles.
	 * @param {SVGElement} connections_element The parent element of the connections. `null` for no connections.
	 * @param {number} radius The radius of the circles.
	 */
	drawControl(parent_element, strokeColor = "", connections_element = null, radius = 0.05) {
		// Get container
		const container = this.storedControlContainer;
		if (container.parentElement === parent_element) {
			parent_element.removeChild(container);
		}

		// Clear previous dots
		container.innerHTML = "";

		// Set config
		container.setAttribute("stroke", strokeColor);

		// Draw dots
		for (const point of this.controlPoints) {
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("cx", point[0]);
			circle.setAttribute("cy", point[1]);
			circle.setAttribute("r", radius);
			container.append(circle);
		}

		// Draw connections
		if (connections_element) {
			this._drawConnections(connections_element, this.storedControlConnectionsContainer, this.controlPoints, strokeColor);
		}

		// Show
		parent_element.appendChild(container);
	}

	drawBezierControl(parent_element, strokeColor = "", connections_element = null, radius = 0.05) {
		// Get container
		const container = this.storedBezierControlContainer;
		if (container.parentElement === parent_element) {
			parent_element.removeChild(container);
		}

		// Clear previous dots
		container.innerHTML = "";

		// Set config
		container.setAttribute("stroke", strokeColor);

		// Draw dots
		for (const point of this.bezierSplinePoints) {
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("cx", point[0]);
			circle.setAttribute("cy", point[1]);
			circle.setAttribute("r", radius);
			container.append(circle);
		}

		// Draw connections
		if (connections_element) {
			this._drawConnections(connections_element, this.storedBezierControlConnectionsContainer, this.bezierSplinePoints, strokeColor);
		}

		// Show
		parent_element.appendChild(container);
	}

	/**
	 * 
	 * @param {SVGElement} parent_element The parent element of the circles.
	 * * @param {string} circleColor The color of the circles.
	 * @param {number} dt For each dt, draw a circle.
	 * @param {number} radius The radius of the circles.
	 */
	drawDottedByT(parent_element, circleColor = "", dt = 0.05, t_start = 0, t_end = 1, radius = 0.03) {
		// Get container
		const container = this.storedDotContainer;
		if (container.parentElement === parent_element) {
			parent_element.removeChild(container);
		}

		// Clear previous dots
		container.innerHTML = "";

		// Set config
		container.setAttribute("fill", circleColor);

		// Draw dots
		for (let t = t_start; t < t_end; t += dt) {
			const point = this.getAt(t);
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("cx", point[0]);
			circle.setAttribute("cy", point[1]);
			circle.setAttribute("r", radius);
			container.append(circle);
		}

		// Show
		parent_element.appendChild(container);
	}

	eraseControl() {
		this.storedControlContainer.innerHTML = "";
		this.storedControlConnectionsContainer.innerHTML = "";
	}

	eraseBezierControl() {
		this.storedBezierControlContainer.innerHTML = "";
		this.storedBezierControlConnectionsContainer.innerHTML = "";
	}

	eraseDotted() {
		this.storedDotContainer.innerHTML = "";
	}
}
