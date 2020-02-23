input.onButtonPressed(Button.A, function () {
    const direction = rotateInY({ x: -1, y: 0, z: 0 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render()
})
input.onButtonPressed(Button.B, function () {
    const direction = rotateInY({ x: 1, y: 0, z: 0 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render()
})
input.onButtonPressed(Button.AB, function () {
    const direction = rotateInY({ x: 0, y: 0, z: 1 }, cameraYaw);
    cameraCoord.x += direction.x;
    cameraCoord.y += direction.y;
    cameraCoord.z += direction.z;
    render()
})
input.onGesture(Gesture.TiltLeft, function () {
    cameraYaw += 0.25
    render();
})
input.onGesture(Gesture.TiltRight, function () {
    cameraYaw -= 0.25;
    render();
})
input.onGesture(Gesture.LogoDown, function () {
    cameraPitch -= 0.25;
    render();
})
input.onGesture(Gesture.LogoUp, function () {
    cameraPitch += 0.25;
    render();
})
function resetPixels() {
    for (let i = 0; i <= 25 - 1; i++) {
        pixelLightLevel[i] = 0;
    }
    basic.clearScreen();
}
function display() {
    const maxBrightness = cameraRays * cameraRays;
    for (let i = 0; i < 25; i++) {
            const normalised = 255 * pixelLightLevel[i] / maxBrightness;
            led.plotBrightness(i % 5, i / 5, normalised);
    }
}

function rotateInX(v: Vector3, rads: number): Vector3 {
    return {
        x: v.x,
        y: v.y * Math.cos(rads) - v.z * Math.sin(rads),
        z: v.y * Math.sin(rads) + v.z * Math.cos(rads)
    }
}

function rotateInY(v: Vector3, rads: number): Vector3 {
    return {
        x: v.x * Math.cos(rads) + v.z * Math.sin(rads),
        y: v.y,
        z: -v.x * Math.sin(rads) + v.z * Math.cos(rads)
    }
}

function render() {
    const rays = 5 * cameraRays;
    const raysExtreme = (rays - 1) / 2;

    // Get unit vector of camera view in abs coords;
    const cameraVec: Vector3 = rotateInX(rotateInY({ x: 0, y: 0, z: 1 }, cameraYaw), cameraPitch);
    const xIncVec: Vector3 = rotateInX(rotateInY({ x: viewWidth / rays, y: 0, z: 0 }, cameraYaw), cameraPitch);
    const yIncVec: Vector3 = rotateInX(rotateInY({ x: 0, y: viewWidth / rays, z: 0 }, cameraYaw), cameraPitch);

    const planeStartPoint: Vector3 = {
        x: cameraCoord.x + cameraVec.x - (xIncVec.x * raysExtreme) - (yIncVec.x * raysExtreme),
        y: cameraCoord.y + cameraVec.y - (xIncVec.y * raysExtreme) - (yIncVec.y * raysExtreme),
        z: cameraCoord.z + cameraVec.z - (xIncVec.z * raysExtreme) - (yIncVec.z * raysExtreme)
    };

    const rayStartAngle: Vector3 = subtractVectors(cameraCoord, planeStartPoint);

    const ray = {
        point: cameraCoord,
        angle: rayStartAngle
    };

    resetPixels();
    for (let y = 0; y < rays; y++) {
        for (let x = 0; x < rays; x++) {
            const xPx = Math.floor(x / cameraRays);
            const yPx = Math.floor(y / cameraRays);
            ray.angle = {
                x: rayStartAngle.x + xIncVec.x * x + yIncVec.x * y,
                y: rayStartAngle.y + xIncVec.y * x + yIncVec.y * y,
                z: rayStartAngle.z + xIncVec.z * x + yIncVec.z * y
            }
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

function crossProduct(v1: Vector3, v2: Vector3): Vector3 {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    }
}

function dotProduct(v1: Vector3, v2: Vector3): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function magnitude(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalise(v: Vector3, desiredMagnitude: number): Vector3 {
    const mag = magnitude(v);
    const adjustment = desiredMagnitude / mag;
    v.x *= adjustment;
    v.y *= adjustment;
    v.z *= adjustment;
    return v;
}

function computePlane(triangle: TriangleCoords): Plane {
    const v1 = subtractVectors(triangle.c1, triangle.c2);
    const v2 = subtractVectors(triangle.c1, triangle.c3);
    const normal = crossProduct(v1, v2);

    const constant = -(
        normal.x * triangle.c1.x +
        normal.y * triangle.c1.y +
        normal.z * triangle.c1.z
    );
    return {
        a: normal.x,
        b: normal.y,
        c: normal.z,
        k: constant
    }
}

function getScale(plane: Plane, angle: Vector3): number {
    return plane.a * angle.x +
        plane.b * angle.y +
        plane.c * angle.z;
}

function getLambda(plane: Plane, line: Line): number {
    const scale = getScale(plane, line.angle);
    if(!scale) return null;
    return -(
        plane.a * line.point.x +
        plane.b * line.point.y +
        plane.c * line.point.z +
        plane.k
    ) / scale;
}

function intersectionPoint(triangle: Triangle, line: Line): Vector3 | null {
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
    return { x: x, y: y, z: z };
}

function sameSide(p1: Vector3, p2: Vector3, corner1: Vector3, corner2: Vector3): boolean {
    const side = subtractVectors(corner1, corner2);
    const cp1 = crossProduct(side, subtractVectors(corner1, p1));
    const cp2 = crossProduct(side, subtractVectors(corner1, p2));
    return dotProduct(cp1, cp2) >= 0;
}

function pointInTriangle(point: Vector3, t: Triangle): boolean {
    return sameSide(point, t.c1, t.c2, t.c3)
        && sameSide(point, t.c2, t.c1, t.c3)
        && sameSide(point, t.c3, t.c1, t.c2);
}

function intersect(line: Line, triangle: Triangle): Vector3 | null {
    const point = intersectionPoint(triangle, line);
    if (point === null) return null;
    return pointInTriangle(point, triangle) ? point : null;
}

function traceRay(
    pixelX: number,
    pixelY: number,
    ray: Line
) {
    for (let triangle of triangles) {
        if (intersect(ray, triangle)) {
            pixelLightLevel[pixelX + pixelY * 5]++;
            return;
        }
    }
}

let cameraCoord = { x: 0, y: -1, z: 0 };
let cameraPitch = 0
let cameraYaw = 0
const pixelLightLevel: number[] = []
const viewWidth = 1.8;
const cameraRays = 100;

type Vector3 = {
    x: number;
    y: number;
    z: number;
}
type TriangleCoords = {
    c1: Vector3;
    c2: Vector3;
    c3: Vector3;
};
type Triangle = {
    c1: Vector3;
    c2: Vector3;
    c3: Vector3;
    plane: Plane;
    min: Vector3;
    max: Vector3;
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

const triangleCoords: TriangleCoords[] = [
    { c1: { x: -1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 2 } },
    { c1: { x: -1, y: 0, z: 4 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 4 } },
    { c1: { x: -1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: -1, y: 0, z: 4 } },
    { c1: { x: 1, y: 0, z: 2 }, c2: { x: 0, y: -2, z: 3 }, c3: { x: 1, y: 0, z: 4 } }
];
const triangles: Triangle[] = triangleCoords.map((triangle: TriangleCoords) => ({ c1: triangle.c1, c2: triangle.c2, c3: triangle.c3, plane: computePlane(triangle), min: { x: apply(Math.min, triangle.c1.x, triangle.c2.x, triangle.c3.x), y: apply(Math.min, triangle.c1.y, triangle.c2.y, triangle.c3.y), z: apply(Math.min, triangle.c1.z, triangle.c2.z, triangle.c3.z) }, max: { x: apply(Math.max, triangle.c1.x, triangle.c2.x, triangle.c3.x), y: apply(Math.max, triangle.c1.y, triangle.c2.y, triangle.c3.y), z: apply(Math.max, triangle.c1.z, triangle.c2.z, triangle.c3.z) } }));
render();

