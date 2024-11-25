// SVG Uniform Cubic Spline


// Imports

import { SplineType, SVGCubicSplineSegment } from "./svg-cspline-segment.js";


// Variables

const defaultSegments = [new SVGCubicSplineSegment(), new SVGCubicSplineSegment()];

const emptySegment = new SVGCubicSplineSegment();


// SVGUniformCubicSpline class

export class SVGUniformCubicSpline {
	/**
	 * Constructs a new cubic spline for SVG.
	 * @param {SVGCubicSplineSegment[]} segments 
	 */
	constructor(segments = defaultSegments) {
		this._onInit(segments);
	}

	_onInit(segments = defaultSegments) {
		this.setSegments(segments);
	}

	/**
	 * 
	 * @param {SVGCubicSplineSegment[]} segments 
	 */
	setSegments(segments) {
		this.segments = segments;
	}


	// Segment operations

	/**
	 * 
	 * @param {number} id The starting segment id of the second half.
	 * @returns {SVGUniformCubicSpline} The second half of the split.
	 */
	split(id) {
		// Calculate second spline
		const newSegments = this.segments.slice(id);

		// Replace this with first spline
		this.setSegments(this.segments.slice(0, id));

		// Return second spline
		return new SVGUniformCubicSpline(newSegments);
	}

	/**
	 * 
	 * @param {SVGUniformCubicSpline} spline 
	 */
	connectSpline(spline) {
		for (const segment of spline.segments) {
			this.connectSegment(segment);
		}
	}

	/**
	 * 
	 * @param {SVGCubicSplineSegment} segment 
	 */
	connectSegment(segment) {
		// Get last segment
		const lastSegment = (this.segments.length > 0) && this.segments[this.segments.length - 1];

		// Connect segment
		if (lastSegment) {
			segment.moveSplinePointTo(0, lastSegment.getAt(1));
		}

		// Store segment if not already
		if (!this.segments.includes(segment)) {
			this.segments.push(segment);
		}
	}


	// Segment extensions

	/**
	 * Extends the spline with a control point.
	 * (for now) Only works with catmull-rom and basis splines.
	 * @param {[x: number, y: number]} point 
	 */
	extendPoint(point) {
		// Get last segment
		const lastSegment = this.getSegment(this.segments.length - 1);

		// Create new segment
		const newSegment = new SVGCubicSplineSegment([
			lastSegment.storedPoints[1],
			lastSegment.storedPoints[2],
			lastSegment.storedPoints[3],
			point
		], lastSegment.splineType);

		// Connect segment
		this.connectSegment(newSegment);
	}


	// Get points

	getSegment(id) {
		// Validate segments
		if (this.segments.length === 0) {
			return emptySegment;
		}

		// Check overshoot
		if (!(id < this.segments.length)) {
			// Get last segment
			const lastSegment = this.segments[this.segments.length - 1];
			const point = lastSegment.getAt(1);

			// Return segment on last point
			return new SVGCubicSplineSegment([point, point, point, point]);
		}

		// Check undershoot
		if (!(0 <= id)) {
			// Get first segment
			const firstSegment = this.segments[0];
			const point = firstSegment.getAt(0);

			// Return segment on first point
			return new SVGCubicSplineSegment([point, point, point, point]);
		}

		// Return result
		return this.segments[id];
	}

	/**
	 * 
	 * @param {number} t The percentage on the spline.
	 * @returns {[x: number, y: number]} 
	 */
	getAt(t) {
		// Get segment info
		const id = Math.floor(t);
		const segment_t = t - id;

		// Return result
		return this.getSegment(id).getAt(segment_t);
	}

	/**
	 * 
	 * @param {number} t The percentage on the spline.
	 * @returns {[x: number, y: number]} 
	 */
	getVelocityAt(t) {
		// Get segment info
		const id = Math.floor(t);
		const segment_t = t - id;

		// Return result
		return this.getSegment(id).getVelocityAt(segment_t);
	}


	// Transformations

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
		// Translate each segment
		for (const segment of this.segments) {
			segment.translateBy(deltaPoint);
		}
	}

	/**
	 * 
	 * @param {number} polarRotate_degrees The counter-clockwise rotation in degrees.
	 * @param {number} t The percentage on the spline. This point is used as the center of rotation.
	 */
	rotateBy(polarRotate_degrees, t = 0) {
		// Get center of rotation
		const centerPoint = this.getAt(t);

		// Rotate each segment
		let lastSegment = null;
		for (const segment of this.segments) {
			segment.rotateBy(polarRotate_degrees);

			// Connect to previous segment
			if (lastSegment) {
				segment.moveSplinePointTo(0, lastSegment.getAt(1));
			}

			// Update last segment
			lastSegment = segment;
		}

		// Translate center point back
		this.moveSplinePointTo(t, centerPoint);
	}


	// SVG

	showPath(parent_element, strokeColor = "") {
		// Show each segment
		for (const segment of this.segments) {
			segment.showPath(parent_element, strokeColor);
		}
	}

	hidePath() {
		// Hide each segment
		for (const segment of this.segments) {
			segment.hidePath();
		}
	}

	/**
	 * 
	 * @param {SVGElement} parent_element The parent element of the circles.
	 * @param {string} strokeColor The stroke color of the circles.
	 * @param {SVGElement} connections_element The parent element of the connections. `null` for no connections.
	 * @param {number} radius The radius of the circles.
	 */
	drawControl(parent_element, strokeColor = "", connections_element = null, radius = 0.05) {
		// Draw controls of each segment
		for (const segment of this.segments) {
			segment.drawControl(parent_element, strokeColor, connections_element, radius);
		}
	}

	drawBezierControl(parent_element, strokeColor = "", connections_element = null, radius = 0.05) {
		// Draw controls of each segment
		for (const segment of this.segments) {
			segment.drawBezierControl(parent_element, strokeColor, connections_element, radius);
		}
	}

	/**
	 * 
	 * @param {SVGElement} parent_element The parent element of the circles.
	 * * @param {string} circleColor The color of the circles.
	 * @param {number} dt For each dt, draw a circle.
	 * @param {number} radius The radius of the circles.
	 */
	drawDottedByT(parent_element, circleColor = "", dt = 0.05, t_start = 0, t_end = 1, radius = 0.03) {
		// Draw dots of each segment
		for (const segment of this.segments) {
			segment.drawDottedByT(parent_element, circleColor, dt, t_start, t_end, radius);
		}
	}

	eraseControl() {
		// Erase controls of each segment
		for (const segment of this.segments) {
			segment.eraseControl();
		}
	}

	eraseBezierControl() {
		// Erase controls of each segment
		for (const segment of this.segments) {
			segment.eraseBezierControl();
		}
	}

	eraseDotted() {
		// Erase dots of each segment
		for (const segment of this.segments) {
			segment.eraseDotted();
		}
	}
}
