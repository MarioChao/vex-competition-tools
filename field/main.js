// Variables

import { SplineType, SVGCubicSplineSegment } from "./src/svg-cspline-segment.js";
import { SVGUniformCubicSpline } from "./src/svg-uniform-cspline.js";


// Local functions

function testAll(paths, control_points, dotted_points, connections) {
	const bezierSpline1 = new SVGCubicSplineSegment([[0, 0], [0, 2], [2, 0], [2, 2]]);
	const basisSpline1 = new SVGCubicSplineSegment([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.B_Spline);
	const catmullRomSpline1 = new SVGCubicSplineSegment([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.CatmullRom);
	const hermiteSpline1 = new SVGCubicSplineSegment([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.Hermite);

	bezierSpline1.showPath(paths);
	basisSpline1.showPath(paths);
	catmullRomSpline1.showPath(paths);
	hermiteSpline1.showPath(paths);

	bezierSpline1.moveSplinePointTo(0, [0, 0]);
	bezierSpline1.rotateBy(-20, 0);
	basisSpline1.moveSplinePointTo(0, bezierSpline1.getAt(1));
	catmullRomSpline1.moveSplinePointTo(0, basisSpline1.getAt(1));
	catmullRomSpline1.rotateBy(180, 0);
	hermiteSpline1.moveSplinePointTo(0, catmullRomSpline1.getAt(1));
	hermiteSpline1.rotateBy(90, 0);

	bezierSpline1.drawControl(control_points, "", connections);
	basisSpline1.drawControl(control_points, "red", connections);
	catmullRomSpline1.drawControl(control_points, "deepskyblue", connections);
	hermiteSpline1.drawControl(control_points, "darkgreen", connections);

	bezierSpline1.drawDottedByT(dotted_points);
	basisSpline1.drawDottedByT(dotted_points);
	catmullRomSpline1.drawDottedByT(dotted_points);
	hermiteSpline1.drawDottedByT(dotted_points);
}

function testGeneral(paths, control_points, dotted_points, connections) {
	const spline = new SVGUniformCubicSpline([
		new SVGCubicSplineSegment([[0, 0], [0, 3], [3, 0], [3, 3]], SplineType.B_Spline),
	]);
	spline.extendPoint([3, 6]);
	spline.extendPoint([6, 3]);
	spline.extendPoint([6, 6]);
	spline.showPath(paths, "magenta");

	function spinAndDraw() {
		// Rotate
		const rotate_degrees = -1;
		spline.rotateBy(rotate_degrees, 2);

		// Draw
		// spline.drawControl(control_points, "", connections)
		// spline.drawBezierControl(control_points, "", connections);
		// spline.drawDottedByT(dotted_points);

		setTimeout(spinAndDraw, 10);
	}
	// spinAndDraw();
}

function initializePaths() {
	const paths = document.getElementById("paths");
	const control_points = document.getElementById("control-points");
	const dotted_points = document.getElementById("dotted-points");
	const connections = document.getElementById("control-point-connections");

	// testAll(paths, control_points, dotted_points, connections);
	testGeneral(paths, control_points, dotted_points, connections);
}

function onDOMContentLoaded() {
	initializePaths();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded)
