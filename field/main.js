// Variables

import { SplineType, SVGCubicSpline } from "./src/svg-cspline.js";


// Local functions

function testBasis(paths, control_points, dotted_points) {
	const basisSpline1 = new SVGCubicSpline([[0, 0], [0, 3], [3, 0], [3, 3]], SplineType.B_Spline);
	const basisSpline2 = new SVGCubicSpline([
		basisSpline1.controlPoints[1], basisSpline1.controlPoints[2], basisSpline1.controlPoints[3], [3, 6]], SplineType.B_Spline);
	const basisSpline3 = new SVGCubicSpline([
		basisSpline2.controlPoints[1], basisSpline2.controlPoints[2], basisSpline2.controlPoints[3], [6, 3]], SplineType.B_Spline);
	const basisSpline4 = new SVGCubicSpline([
		basisSpline3.controlPoints[1], basisSpline3.controlPoints[2], basisSpline3.controlPoints[3], [6, 6]], SplineType.B_Spline);

	paths.appendChild(basisSpline1.getPathElement());
	paths.appendChild(basisSpline2.getPathElement());
	paths.appendChild(basisSpline3.getPathElement());
	paths.appendChild(basisSpline4.getPathElement());

	basisSpline1.drawDotted(dotted_points);
	basisSpline2.drawDotted(control_points);
	basisSpline3.drawDotted(dotted_points);
	basisSpline4.drawDotted(control_points);
}

function testAll(paths, control_points, dotted_points) {
	const bezierSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]]);
	const basisSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.B_Spline);
	const catmullRomSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.CatmullRom);
	const hermiteSpline1 = new SVGCubicSpline([[0, 0], [0, 2], [2, 0], [2, 2]], SplineType.Hermite);

	paths.appendChild(bezierSpline1.getPathElement());
	paths.appendChild(basisSpline1.getPathElement());
	paths.appendChild(catmullRomSpline1.getPathElement());
	paths.appendChild(hermiteSpline1.getPathElement());

	bezierSpline1.moveSplinePointTo(0, [0, 0]);
	bezierSpline1.rotateBy(-20, 0);
	basisSpline1.moveSplinePointTo(0, bezierSpline1.getAt(1));
	catmullRomSpline1.moveSplinePointTo(0, basisSpline1.getAt(1));
	catmullRomSpline1.rotateBy(180, 0);
	hermiteSpline1.moveSplinePointTo(0, catmullRomSpline1.getAt(1));
	hermiteSpline1.rotateBy(90, 0);

	bezierSpline1.drawControl(control_points);
	basisSpline1.drawControl(control_points, "red");
	catmullRomSpline1.drawControl(control_points, "deepskyblue");
	hermiteSpline1.drawControl(control_points, "darkgreen");

	bezierSpline1.drawDotted(dotted_points);
	basisSpline1.drawDotted(dotted_points);
	catmullRomSpline1.drawDotted(dotted_points);
	hermiteSpline1.drawDotted(dotted_points);
}

function initializePaths() {
	const paths = document.getElementById("paths");
	const control_points = document.getElementById("control-points");
	const dotted_points = document.getElementById("dotted-points");

	testBasis(paths, control_points, dotted_points);
	// testAll(paths, control_points, dotted_points);
}

function onDOMContentLoaded() {
	initializePaths();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded)
