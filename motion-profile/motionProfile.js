// Motion Profile Script

// Motion profile namespace
function MotionProfile() {
    var self = {};
    
    var targetStartTime, targetEndTime, motionEndTime;
    var startAccelerationElement, endDecelerationElement, maxVelocityElement;
    var startAcceleration, endDeceleration, velocityCap;
    var accelerationTimeElement, middleTimeElement, decelerationTimeElement;
    var accelerationTime, middleTime, decelerationTime;
    var distanceElement;
    var distance;
    var motionSign;
    var calculateMode;

    const precision = 5;

    var signum = function(number) {
        return (number > 0) - (number < 0);
    }
    
    var getElements = function() {
        startAccelerationElement = document.getElementById("startAcceleration");
        endDecelerationElement = document.getElementById("endDeceleration");
        maxVelocityElement = document.getElementById("maxVelocity");
        
        accelerationTimeElement = document.getElementById("accelerationTime");
        middleTimeElement = document.getElementById("middleTime");
        decelerationTimeElement = document.getElementById("decelerationTime");
        
        distanceElement = document.getElementById("travelDistance");
    };

    var updateDistanceValue = function() {
        distanceElement = document.getElementById("travelDistance");
        distance = distanceElement.value;
    }
    
    // From movement details

    var updateValuesFromMovementDetails = function() {
        getElements();
        startAcceleration = Math.max(0.05, Math.abs(startAccelerationElement.value));
        endDeceleration = -Math.max(0.05, Math.abs(endDecelerationElement.value));
        velocityCap = Math.abs(maxVelocityElement.value);
        if (Math.abs(velocityCap) < 1e-9) {
            velocityCap = 0.1;
        }
        updateDistanceValue();
    };

    var createMotionProfileFromMovementDetails = function(distance) {
        /* Kinematics:
        vf^2 = vi^2 + 2a * Δx
        Δx = (vf^2 - vi^2) / (2a)
        */
        // Distance (trapezoidal):
        // x_start = v_max^2 / (2 * a_start)
        // x_middle = v_max * t
        // x_end = -v_max^2 / (2 * a_end)
        var absDistance = Math.abs(distance);
        var distanceStart = Math.pow(velocityCap, 2) / (2 * startAcceleration);
        var distanceEnd = -Math.pow(velocityCap, 2) / (2 * endDeceleration);
        if (distanceStart + distanceEnd >= absDistance) {
            // Triangular motion
            // Velocity:
            // x_total = v_max^2 * (a_end - a_start) / (2 * a_start * a_end)
            // v_max = √(x_total * (2 * a_start * a_end) / (a_end - a_start))
            var velocityPeak = Math.sqrt(absDistance * (2 * startAcceleration * endDeceleration) / (endDeceleration - startAcceleration));
            // Time:
            // v = at
            // t = v / a
            targetStartTime = targetEndTime = velocityPeak / startAcceleration;
            motionEndTime = targetEndTime + (-velocityPeak / endDeceleration);
            // console.log("Triangular motion profile.\n");
            // console.log("D1: " + (distanceStart).toPrecision(3).toString() + ", D2: " + (absDistance - (distanceStart + distanceEnd)).toPrecision(3).toString() + ", D3: " + (distanceEnd).toPrecision(3).toString() + "\n");
        } else {
            // Trapezoidal motion
            targetStartTime = velocityCap / startAcceleration;
            targetEndTime = targetStartTime + (absDistance - (distanceStart + distanceEnd)) / velocityCap;
            motionEndTime = targetEndTime + (-velocityCap / endDeceleration);
            // console.log("Trapezoidal motion profile.\n");
            // console.log("D1: " + (distanceStart).toPrecision(precision).toString() + ", D2: " + (absDistance - (distanceStart + distanceEnd)).toPrecision(precision).toString() + ", D3: " + (distanceEnd).toPrecision(precision).toString() + "\n");
            // console.log("A1: " + (+startAcceleration).toPrecision(3).toString() + ", MV: " + (+velocityCap).toPrecision(3).toString() + ", A3: " + (+endDeceleration).toPrecision(3).toString() + "\n");
        }
    };

    // From elapsed time

    var updateValuesFromElapsedTime = function() {
        getElements();
        accelerationTime = accelerationTimeElement.value;
        middleTime = middleTimeElement.value;
        decelerationTime = decelerationTimeElement.value;

        // Compute validated stage time
        targetStartTime = Math.abs(accelerationTime);
        targetEndTime = targetStartTime + Math.abs(middleTime);
        motionEndTime = targetEndTime + Math.abs(decelerationTime);
        if (Math.abs(targetStartTime + targetEndTime + motionEndTime) < 1e-9) {
            targetEndTime = motionEndTime = 1;
        }

        // Update elapsed time
        accelerationTime = targetStartTime;
        middleTime = targetEndTime - targetStartTime;
        decelerationTime = motionEndTime - targetEndTime;
        
        updateDistanceValue();
    };

    var createMotionProfileFromElapsedTime = function(distance) {
        // Velocity:
        // v_max = x_total / (t_1 / 2 + t_2 + t_3 / 2)
        velocityCap = Math.abs(distance) / (accelerationTime / 2.0 + middleTime + decelerationTime / 2.0);
        // Acceleration:
        // vf = vi + at
        // a = (vf - vi) / t
        startAcceleration = velocityCap / accelerationTime;
        endDeceleration = -velocityCap / decelerationTime;
    }

    // Class functions

    // Get profile info
    self.getVelocity = function(timeSeconds) {
        var currentTime = timeSeconds;
        var velocity;
        if (currentTime < targetStartTime) {
            velocity = startAcceleration * currentTime;
        } else if (currentTime < targetEndTime) {
            velocity = startAcceleration * targetStartTime;
        } else if (currentTime < motionEndTime) {
            velocity = -endDeceleration * (motionEndTime - currentTime);
        } else {
            velocity = 0;
        }
        return velocity * motionSign;
    }

    self.getStageTimes = function() {
        return [0, targetStartTime, targetEndTime, motionEndTime];
    }

    // Generate motion profile
    self.createMotionProfileMovementDetails = function() {
        updateValuesFromMovementDetails();
        createMotionProfileFromMovementDetails(distance);
        motionSign = signum(distance);
        calculateMode = "MovementDetails";
        // console.log("TargetSt: " + (targetStartTime).toPrecision(precision).toString() + ", TargetEd: " + (targetEndTime).toPrecision(precision).toString() + ", MotionEnd: " + (motionEndTime).toPrecision(precision).toString() + "\n");
        // console.log("StartAccl: " + (startAcceleration).toPrecision(precision).toString() + ", EndDcl: " + (endDeceleration).toPrecision(precision).toString() + ", VelocityCap: " + (+velocityCap).toPrecision(precision).toString() + "\n");
        // console.log("Motion sign: " + (motionSign).toString());
    };
    
    self.createMotionProfileElapsedTime = function() {
        updateValuesFromElapsedTime();
        createMotionProfileFromElapsedTime(distance);
        motionSign = signum(distance);
        calculateMode = "ElapsedTime";
        // console.log("TargetSt: " + (targetStartTime).toPrecision(precision).toString() + ", TargetEd: " + (targetEndTime).toPrecision(precision).toString() + ", MotionEnd: " + (motionEndTime).toPrecision(precision).toString() + "\n");
        // console.log("StartAccl: " + (startAcceleration).toPrecision(precision).toString() + ", EndDcl: " + (endDeceleration).toPrecision(precision).toString() + ", VelocityCap: " + (+velocityCap).toPrecision(precision).toString() + "\n");
        // console.log("Motion sign: " + (motionSign).toString());
    };

    self.updateDistance = function() {
        updateDistanceValue();
        switch (calculateMode) {
            case "MovementDetails":
                createMotionProfileFromMovementDetails(distance);
                break;
            case "ElapsedTime":
                createMotionProfileFromElapsedTime(distance);
                break;
            default:
                return false;
        }
        motionSign = signum(distance);
        return true;
    }
    
    return self;
};

// Variables
let velocityTimeChart;
let motionProfile = new MotionProfile();

// Functions
// Motion profile function
function onMovementDetailsCreateProfile() {
    motionProfile.createMotionProfileMovementDetails();
    graphMotionProfile();
}

function onElapsedTimeCreateProfile() {
    motionProfile.createMotionProfileElapsedTime();
    graphMotionProfile();
}

function setUpMotionProfileUpdate() {
    // Distance update
    var distanceElement = document.getElementById("travelDistance");
    var distanceLabelElement = document.getElementById("travelDistanceLabel");  
    // distanceLabelElement.innerText = distanceElement.value;
    distanceElement.oninput = function() {
        // distanceLabelElement.innerText = this.value;
        if (motionProfile.updateDistance()) {
            graphMotionProfile();
        }
    };
}

function graphMotionProfile() {
    var motionTimes = motionProfile.getStageTimes();

    // Graph velocity-time chart
    var velocityTimeDataArray = [["Time", "Velocity"]];
    var previousTime = 0;
    var timeIncrement = (motionTimes[motionTimes.length - 1] / 50).toPrecision(4);
    console.log(timeIncrement);
    for (var stageTime of motionTimes) {
        for (var timeSeconds = previousTime + timeIncrement; timeSeconds <= stageTime; timeSeconds += timeIncrement) {
            velocityTimeDataArray.push([timeSeconds, motionProfile.getVelocity(timeSeconds)]);
        }
        velocityTimeDataArray.push([stageTime, motionProfile.getVelocity(stageTime)]);
        previousTime = stageTime;
    }
    // console.log(velocityTimeDataArray);
    drawChart(velocityTimeChart, velocityTimeDataArray);
}

// Chart function
function setUpChart() {
    // Created with help from https://www.w3schools.com/js/js_graphics_google_chart.asp
    google.charts.load("current", {packages:["corechart"]});
    google.charts.setOnLoadCallback(onChartLoaded);
}

function onChartLoaded() {
    velocityTimeChart = new google.visualization.LineChart(document.getElementById("motionProfileVelocityTimeChart"));
    // drawChart(velocityTimeChart, [["Time", "Velocity"], [0, 0]]);
}

function drawChart(chart, dataArray) {
    // Set data
    var data = google.visualization.arrayToDataTable(dataArray);
    
    // Set options
    var options = {
        title : "Velocity vs Time",
        hAxis : {title : "Time (s)"},
        vAxis : {
            title : "Velocity (m/s)",
            viewWindow : {
                min : -110,
                max : 110
            }
        },
        legend: "none",
    };
    
    // Draw
    chart.draw(data, options);
}

// Setup function
function bindInputWithLabel(inputElementId, labelElementId) {
    var inputElement = document.getElementById(inputElementId);
    var labelElement = document.getElementById(labelElementId);
    
    labelElement.innerText = inputElement.value;
    inputElement.oninput = function() {
        labelElement.innerText = this.value;
    };
}

function setUpInputLabelBinding() {
    // bindInputWithLabel("startAcceleration", "startAccelerationLabel");
    // bindInputWithLabel("endDeceleration", "endDecelerationLabel");
    // bindInputWithLabel("maxVelocity", "maxVelocityLabel");
    // bindInputWithLabel("accelerationTime", "accelerationTimeLabel");
    // bindInputWithLabel("middleTime", "middleTimeLabel");
    // bindInputWithLabel("decelerationTime", "decelerationTimeLabel");
}

function onDOMContentLoaded() {
    document.getElementById("movementDetailsCreateProfile").addEventListener("click", onMovementDetailsCreateProfile);
    document.getElementById("elapsedTimeCreateProfile").addEventListener("click", onElapsedTimeCreateProfile);
    setUpInputLabelBinding();
    setUpMotionProfileUpdate();
    setUpChart();
}
window.addEventListener("DOMContentLoaded", onDOMContentLoaded);