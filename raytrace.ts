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
    const direction = rotateInY({ x: -0.5, y: 0, z: 0 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render();
});
input.onButtonPressed(Button.B, function () {
    const direction = rotateInY({ x: 0.5, y: 0, z: 0 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render()
});
input.onButtonPressed(Button.AB, function () {
    const direction = rotateInY({ x: 0, y: 0, z: 0.5 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render()
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
    for (let i = 0; i < screenSize * screenSize; i++) {
        pixelLightLevel[i] = 0;
    }
    basic.clearScreen();
}

function display() {
    const maxBrightness = cameraRays * cameraRays;
    for (let i = 0; i < screenSize * screenSize; i++) {
        const normalised = 255 * pixelLightLevel[i] / maxBrightness;
        led.plotBrightness(i % screenSize, Math.floor(i / screenSize), normalised);
    }
}

function rotateInX(v: Vector3, rads: number): Vector3 {
    const newY = v.y * Math.cos(rads) - v.z * Math.sin(rads);
    const newZ = v.y * Math.sin(rads) + v.z * Math.cos(rads);
    v.y = newY;
    v.z = newZ;
    return v;
}

function rotateInY(v: Vector3, rads: number): Vector3 {
    const newX = v.x * Math.cos(rads) + v.z * Math.sin(rads);
    const newZ = -v.x * Math.sin(rads) + v.z * Math.cos(rads);
    v.x = newX;
    v.z = newZ;
    return v;
}

function render() {
    const rays = screenSize * cameraRays;
    const raysExtreme = (rays - 1) / 2;

    // Get unit vector of camera view in abs coords;
    const cameraVec: Vector3 = rotateInY(rotateInX({ x: 0, y: 0, z: 1 }, cameraPitch), cameraYaw);
    const xIncVec: Vector3 = rotateInY(rotateInX({ x: viewWidth / rays, y: 0, z: 0 }, cameraPitch), cameraYaw);
    const yIncVec: Vector3 = rotateInY(rotateInX({ x: 0, y: viewWidth / rays, z: 0 }, cameraPitch), cameraYaw);

    const planeStartPoint: Vector3 = {
        x: cameraCoord.x + cameraVec.x - (xIncVec.x * raysExtreme) - (yIncVec.x * raysExtreme),
        y: cameraCoord.y + cameraVec.y - (xIncVec.y * raysExtreme) - (yIncVec.y * raysExtreme),
        z: cameraCoord.z + cameraVec.z - (xIncVec.z * raysExtreme) - (yIncVec.z * raysExtreme)
    };

    const rayStartAngle: Vector3 = subtractVectors(cameraCoord, planeStartPoint);

    const ray = {
        point: cameraCoord,
        angle: { x: 0, y: 0, z: 1 }
    };

    resetPixels();
    for (let y = 0; y < rays; y++) {
        for (let x = 0; x < rays; x++) {
            const xPx = Math.floor(x / cameraRays);
            const yPx = Math.floor(y / cameraRays);
            ray.angle.x = rayStartAngle.x + xIncVec.x * x + yIncVec.x * y;
            ray.angle.y = rayStartAngle.y + xIncVec.y * x + yIncVec.y * y;
            ray.angle.z = rayStartAngle.z + xIncVec.z * x + yIncVec.z * y;
            traceRay(xPx, yPx, ray);
        }
    }
    display();
}

function subtractVectors(v1: Vector3, v2: Vector3): Vector3 {
    return {
        x: v2.x - v1.x,
        y: v2.y - v1.y,
        z: v2.z - v1.z
    }
}

function computePlane(triangle: TriangleCoords): Plane {
    const v1x = triangle.c2.x - triangle.c1.x;
    const v1y = triangle.c2.y - triangle.c1.y;
    const v1z = triangle.c2.z - triangle.c1.z;
    const v2x = triangle.c3.x - triangle.c1.x;
    const v2y = triangle.c3.y - triangle.c1.y;
    const v2z = triangle.c3.z - triangle.c1.z;
    const nx = v1y * v2z - v1z * v2y;
    const ny = v1z * v2x - v1x * v2z;
    const nz = v1x * v2y - v1y * v2x;
    return {
        a: nx,
        b: ny,
        c: nz,
        k: -(
            nx * triangle.c1.x +
            ny * triangle.c1.y +
            nz * triangle.c1.z
        )
    }
}

function getScale(plane: Plane, angle: Vector3): number {
    return plane.a * angle.x +
        plane.b * angle.y +
        plane.c * angle.z;
}

function getLambda(plane: Plane, line: Line): number {
    const scale = getScale(plane, line.angle);
    if (!scale) return null;
    return -(
        plane.a * line.point.x +
        plane.b * line.point.y +
        plane.c * line.point.z +
        plane.k
    ) / scale;
}

function intersectionDistance(line: Line, triangle: Triangle): number | null {
    const lambda = getLambda(triangle.plane, line);
    if (lambda <= 0) return null;

    const x = line.point.x + lambda * line.angle.x;
    if (x < triangle.min.x) return null;
    if (x > triangle.max.x) return null;
    const y = line.point.y + lambda * line.angle.y;
    if (y < triangle.min.y) return null;
    if (y > triangle.max.y) return null;
    const z = line.point.z + lambda * line.angle.z;
    if (z < triangle.min.z) return null;
    if (z > triangle.max.z) return null;
    if (!pointInTriangle(x, y, z, triangle)) return null;
    return lambda;
}


function sameSide(ax: number, ay: number, az: number, b: Vector3, c: Vector3, d: Vector3): boolean {
    const sx = d.x - c.x;
    const sy = d.y - c.y;
    const sz = d.z - c.z;

    const cax = c.x - ax;
    const cay = c.y - ay;
    const caz = c.z - az;

    const cp1x = sy * caz - sz * cay;
    const cp1y = sz * cax - sx * caz;
    const cp1z = sx * cay - sy * cax;

    const cbx = c.x - b.x;
    const cby = c.y - b.y;
    const cbz = c.z - b.z;

    const cp2x = sy * cbz - sz * cby;
    const cp2y = sz * cbx - sx * cbz;
    const cp2z = sx * cby - sy * cbx;

    const dx = cp1x * cp2x;
    const dy = cp1y * cp2y;
    const dz = cp1z * cp2z;

    return dx + dy + dz >= 0;
}


function pointInTriangle(ax: number, ay: number, az: number, t: Triangle): boolean {
    return sameSide(ax, ay, az, t.c1, t.c2, t.c3)
        && sameSide(ax, ay, az, t.c2, t.c1, t.c3)
        && sameSide(ax, ay, az, t.c3, t.c1, t.c2);
}

function traceRay(
    pixelX: number,
    pixelY: number,
    ray: Line
) {
    let minLambda: number = null;
    let closest: Triangle = null;

    for (let triangle of triangles) {
        const lambda = intersectionDistance(ray, triangle);
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

type Vector3 = {
    x: number;
    y: number;
    z: number;
}
type TriangleCoords = {
    c1: Vector3;
    c2: Vector3;
    c3: Vector3;
    brightness: number;
};
type Triangle = {
    c1: Vector3;
    c2: Vector3;
    c3: Vector3;
    plane: Plane;
    min: Vector3;
    max: Vector3;
    brightness: number;
}
type Plane = {
    a: number;
    b: number;
    c: number;
    k: number;
}
type Line = {
    angle: Vector3,
    point: Vector3,
}

function apply(func: (a: number, b: number) => number, a: number, b: number, c: number) {
    return func(a, func(b, c))
}

// For microbit, uncomment from here to bottom
const cameraRays = 1;
const screenSize = 5;
const bright = 1;
const dim = 0.05;
// To here

const triangleCoords: TriangleCoords[] = [
    { c1: { x: -1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 2 }, brightness: bright },
    { c1: { x: -1, y: 0, z: 4 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 4 }, brightness: bright },
    { c1: { x: -1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: -1, y: 0, z: 4 }, brightness: dim },
    { c1: { x: 1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 4 }, brightness: dim }
];
const triangles: Triangle[] = triangleCoords.map((triangle: TriangleCoords) => ({
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
}));
const cameraCoord = { x: 4, y: -1, z: -1 };
let cameraPitch = 0;
let cameraYaw = -0.25 * Math.PI;
const pixelLightLevel: number[] = [];
const viewWidth = 0.5;

render();

