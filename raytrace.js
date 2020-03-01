// For the browser version, uncomment from here
// const Button = {
//     A: "a",
//     B: "b",
//     AB: "ab"
// } as const;
// const Gesture = {
//     TiltLeft: "tiltLeft",
//     TiltRight: "tiltRight",
//     LogoUp: "logoUp",
//     LogoDown: "logoDown"
// } as const;
// let pressA: () => void;
// let pressB: () => void;
// let pressAB: () => void;
// let tiltLeft: () => void;
// let tiltRight: () => void;
// let logoUp: () => void;
// let logoDown: () => void;
// const input = {
//     onButtonPressed: (button: typeof Button[keyof typeof Button], func: () => void) => {
//         if (button === Button.A) {
//             pressA = func;
//         }
//         if (button === Button.B) {
//             pressB = func;
//         }
//         if (button === Button.AB) {
//             pressAB = func;
//         }
//     },
//     onGesture: (gesture: typeof Gesture[keyof typeof Gesture], func: () => void) => {
//         if (gesture === Gesture.TiltLeft) {
//             tiltLeft = func;
//         }
//         if (gesture === Gesture.TiltRight) {
//             tiltRight = func;
//         }
//         if (gesture === Gesture.LogoUp) {
//             logoUp = func;
//         }
//         if (gesture === Gesture.LogoDown) {
//             logoDown = func;
//         }
//     }
// };
// const basic = {
//     clearScreen: () => {
//         const canvas = document.getElementById("canvas") as HTMLCanvasElement;
//         const ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, screenSize, screenSize);
//     }
// };
// const led = {
//     plotBrightness: (x, y, brightness) => {
//         const canvas = document.getElementById("canvas") as HTMLCanvasElement;
//         const ctx = canvas.getContext("2d");
//         ctx.fillStyle = "rgb(" + brightness + ", 0, 0)";
//         ctx.fillRect(x, y, 1, 1);
//     }
// };
// const cameraRays = 3;
// const screenSize = 200;
// const bright = 1;
// const dim = 0.4;
// To here
input.onButtonPressed(Button.A, function () {
    var direction = rotateInY({ x: -0.5, y: 0, z: 0 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render();
});
input.onButtonPressed(Button.B, function () {
    var direction = rotateInY({ x: 0.5, y: 0, z: 0 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render();
});
input.onButtonPressed(Button.AB, function () {
    var direction = rotateInY({ x: 0, y: 0, z: 0.5 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render();
});
input.onGesture(Gesture.TiltLeft, function () {
    cameraYaw += 0.1;
    render();
});
input.onGesture(Gesture.TiltRight, function () {
    cameraYaw -= 0.1;
    render();
});
input.onGesture(Gesture.LogoDown, function () {
    cameraPitch -= 0.1;
    render();
});
input.onGesture(Gesture.LogoUp, function () {
    cameraPitch += 0.1;
    render();
});
function resetPixels() {
    for (var i = 0; i < screenSize * screenSize; i++) {
        pixelLightLevel[i] = 0;
    }
    basic.clearScreen();
}
function display() {
    var maxBrightness = cameraRays * cameraRays;
    for (var i = 0; i < screenSize * screenSize; i++) {
        var normalised = 255 * pixelLightLevel[i] / maxBrightness;
        led.plotBrightness(i % screenSize, Math.floor(i / screenSize), normalised);
    }
}
function rotateInX(v, rads) {
    var newY = v.y * Math.cos(rads) - v.z * Math.sin(rads);
    var newZ = v.y * Math.sin(rads) + v.z * Math.cos(rads);
    v.y = newY;
    v.z = newZ;
    return v;
}
function rotateInY(v, rads) {
    var newX = v.x * Math.cos(rads) + v.z * Math.sin(rads);
    var newZ = -v.x * Math.sin(rads) + v.z * Math.cos(rads);
    v.x = newX;
    v.z = newZ;
    return v;
}
function render() {
    var rays = screenSize * cameraRays;
    var raysExtreme = (rays - 1) / 2;
    // Get unit vector of camera view in abs coords;
    var cameraVec = rotateInY(rotateInX({ x: 0, y: 0, z: 1 }, cameraPitch), cameraYaw);
    var xIncVec = rotateInY(rotateInX({ x: viewWidth / rays, y: 0, z: 0 }, cameraPitch), cameraYaw);
    var yIncVec = rotateInY(rotateInX({ x: 0, y: viewWidth / rays, z: 0 }, cameraPitch), cameraYaw);
    var planeStartPoint = {
        x: cameraCoord.x + cameraVec.x - (xIncVec.x * raysExtreme) - (yIncVec.x * raysExtreme),
        y: cameraCoord.y + cameraVec.y - (xIncVec.y * raysExtreme) - (yIncVec.y * raysExtreme),
        z: cameraCoord.z + cameraVec.z - (xIncVec.z * raysExtreme) - (yIncVec.z * raysExtreme)
    };
    var rayStartAngle = subtractVectors(cameraCoord, planeStartPoint);
    var ray = {
        point: cameraCoord,
        angle: { x: 0, y: 0, z: 1 }
    };
    resetPixels();
    for (var y = 0; y < rays; y++) {
        for (var x = 0; x < rays; x++) {
            var xPx = Math.floor(x / cameraRays);
            var yPx = Math.floor(y / cameraRays);
            ray.angle.x = rayStartAngle.x + xIncVec.x * x + yIncVec.x * y;
            ray.angle.y = rayStartAngle.y + xIncVec.y * x + yIncVec.y * y;
            ray.angle.z = rayStartAngle.z + xIncVec.z * x + yIncVec.z * y;
            traceRay(xPx, yPx, ray);
        }
    }
    display();
}
function subtractVectors(v1, v2) {
    return {
        x: v2.x - v1.x,
        y: v2.y - v1.y,
        z: v2.z - v1.z
    };
}
function computePlane(triangle) {
    var v1x = triangle.c2.x - triangle.c1.x;
    var v1y = triangle.c2.y - triangle.c1.y;
    var v1z = triangle.c2.z - triangle.c1.z;
    var v2x = triangle.c3.x - triangle.c1.x;
    var v2y = triangle.c3.y - triangle.c1.y;
    var v2z = triangle.c3.z - triangle.c1.z;
    var nx = v1y * v2z - v1z * v2y;
    var ny = v1z * v2x - v1x * v2z;
    var nz = v1x * v2y - v1y * v2x;
    return {
        a: nx,
        b: ny,
        c: nz,
        k: -(nx * triangle.c1.x +
            ny * triangle.c1.y +
            nz * triangle.c1.z)
    };
}
function getScale(plane, angle) {
    return plane.a * angle.x +
        plane.b * angle.y +
        plane.c * angle.z;
}
function getLambda(plane, line) {
    var scale = getScale(plane, line.angle);
    if (!scale)
        return null;
    return -(plane.a * line.point.x +
        plane.b * line.point.y +
        plane.c * line.point.z +
        plane.k) / scale;
}
function intersectionDistance(line, triangle) {
    var lambda = getLambda(triangle.plane, line);
    if (lambda <= 0)
        return null;
    var x = line.point.x + lambda * line.angle.x;
    if (x < triangle.min.x)
        return null;
    if (x > triangle.max.x)
        return null;
    var y = line.point.y + lambda * line.angle.y;
    if (y < triangle.min.y)
        return null;
    if (y > triangle.max.y)
        return null;
    var z = line.point.z + lambda * line.angle.z;
    if (z < triangle.min.z)
        return null;
    if (z > triangle.max.z)
        return null;
    if (!pointInTriangle(x, y, z, triangle))
        return null;
    return lambda;
}
function sameSide(ax, ay, az, b, c, d) {
    var sx = d.x - c.x;
    var sy = d.y - c.y;
    var sz = d.z - c.z;
    var cax = c.x - ax;
    var cay = c.y - ay;
    var caz = c.z - az;
    var cp1x = sy * caz - sz * cay;
    var cp1y = sz * cax - sx * caz;
    var cp1z = sx * cay - sy * cax;
    var cbx = c.x - b.x;
    var cby = c.y - b.y;
    var cbz = c.z - b.z;
    var cp2x = sy * cbz - sz * cby;
    var cp2y = sz * cbx - sx * cbz;
    var cp2z = sx * cby - sy * cbx;
    var dx = cp1x * cp2x;
    var dy = cp1y * cp2y;
    var dz = cp1z * cp2z;
    return dx + dy + dz >= 0;
}
function pointInTriangle(ax, ay, az, t) {
    return sameSide(ax, ay, az, t.c1, t.c2, t.c3)
        && sameSide(ax, ay, az, t.c2, t.c1, t.c3)
        && sameSide(ax, ay, az, t.c3, t.c1, t.c2);
}
function traceRay(pixelX, pixelY, ray) {
    var minLambda = null;
    var closest = null;
    for (var _i = 0, triangles_1 = triangles; _i < triangles_1.length; _i++) {
        var triangle = triangles_1[_i];
        var lambda = intersectionDistance(ray, triangle);
        if (lambda) {
            if (minLambda === null || lambda < minLambda) {
                minLambda = lambda;
                closest = triangle;
            }
        }
    }
    if (closest) {
        pixelLightLevel[pixelX + pixelY * screenSize] += closest.brightness;
    }
}
function apply(func, a, b, c) {
    return func(a, func(b, c));
}
// For microbit, uncomment from here to bottom
var cameraRays = 1;
var screenSize = 5;
var bright = 1;
var dim = 0.05;
// To here
var triangleCoords = [
    { c1: { x: -1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 2 }, brightness: bright },
    { c1: { x: -1, y: 0, z: 4 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 4 }, brightness: bright },
    { c1: { x: -1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: -1, y: 0, z: 4 }, brightness: dim },
    { c1: { x: 1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 4 }, brightness: dim }
];
var triangles = triangleCoords.map(function (triangle) { return ({
    brightness: triangle.brightness,
    c1: triangle.c1,
    c2: triangle.c2,
    c3: triangle.c3,
    plane: computePlane(triangle),
    min: {
        x: apply(Math.min, triangle.c1.x, triangle.c2.x, triangle.c3.x),
        y: apply(Math.min, triangle.c1.y, triangle.c2.y, triangle.c3.y),
        z: apply(Math.min, triangle.c1.z, triangle.c2.z, triangle.c3.z)
    },
    max: {
        x: apply(Math.max, triangle.c1.x, triangle.c2.x, triangle.c3.x),
        y: apply(Math.max, triangle.c1.y, triangle.c2.y, triangle.c3.y),
        z: apply(Math.max, triangle.c1.z, triangle.c2.z, triangle.c3.z)
    }
}); });
var cameraCoord = { x: 4, y: -1, z: -1 };
var cameraPitch = 0;
var cameraYaw = -0.25 * Math.PI;
var pixelLightLevel = [];
var viewWidth = 0.5;
render();
