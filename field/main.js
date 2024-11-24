// Variables

import { SplineType, SVGCubicSpline } from "./src/svg-cspline.js";


// Local functions

function testBasis(paths, control_points, dotted_points, connections) {
	const basisSpline1 = new SVGCubicSpline([[0, 0], [0, 3], [3, 0], [3, 3]], SplineType.B_Spline);
	const basisSpline2 = new SVGCubicSpline([
		basisSpline1.controlPoints[1], basisSpline1.controlPoints[2], basisSpline1.controlPoints[3], [3, 6]], SplineType.B_Spline);
	const basisSpline3 = new SVGCubicSpline([
		basisSpline2.controlPoints[1], basisSpline2.controlPoints[2], basisSpline2.controlPoints[3], [6, 3]], SplineType.B_Spline);
	const basisSpline4 = new SVGCubicSpline([
		basisSpline3.controlPoints[1], basisSpline3.controlPoints[2], basisSpline3.controlPoints[3], [6, 6]], SplineType.B_Spline);

	basisSpline1.showPath(paths);
	basisSpline2.showPath(paths);
	basisSpline3.showPath(paths);
	basisSpline4.showPath(paths);

	function spinAndDraw() {
		// Rotate
		const rotate_degrees = -1;
		basisSpline2.rotateBy(rotate_degrees, 1);
		basisSpline1.rotateBy(rotate_degrees, 0);
		basisSpline1.moveSplinePointTo(1, basisSpline2.getAt(0));
		basisSpline3.rotateBy(rotate_degrees, 0);
		basisSpline3.moveSplinePointTo(0, basisSpline2.getAt(1));
		basisSpline4.rotateBy(rotate_degrees, 0);
		basisSpline4.moveSplinePointTo(0, basisSpline3.getAt(1));

		// Draw
		basisSpline1.drawBezierControl(control_points, "", connections);
		basisSpline2.drawBezierControl(control_points, "hotpink", connections);
		basisSpline3.drawBezierControl(control_points, "", connections);
		basisSpline4.drawBezierControl(control_points, "hotpink", connections);

		basisSpline1.drawDottedByT(dotted_points);
		basisSpline2.drawDottedByT(dotted_points, "hotpink");
		basisSpline3.drawDottedByT(dotted_points);
		basisSpline4.drawDottedByT(dotted_points, "hotpink");

		setTimeout(spinAndDraw, 10);
	}
	spinAndDraw();
}

function testAll(paths, control_points, dotted_points, connections) {
	const bezierSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]]);
	const basisSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.B_Spline);
	const catmullRomSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.CatmullRom);
	const hermiteSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.Hermite);

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

function initializePaths() {
	const paths = document.getElementById("paths");
	const control_points = document.getElementById("control-points");
	const dotted_points = document.getElementById("dotted-points");
	const connections = document.getElementById("control-point-connections");

	testBasis(paths, control_points, dotted_points, connections);
	// testAll(paths, control_points, dotted_points, connections);
}

function onDOMContentLoaded() {
	initializePaths();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded)
