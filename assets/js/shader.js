const canvas = document.getElementById('shader-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
}

// Vertex Shader
const vsSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

// Fragment Shader: Elegant, dark, mysterious abstract fluid
// It flows gracefully and distorts smoothly based on mouse position.
const fsSource = `
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    void main() {
        // Normalize fragment coordinates
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Center UVs and fix aspect ratio for distance calculations
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        // Normalize mouse coordinates
        vec2 m = u_mouse / u_resolution.xy;
        m = m * 2.0 - 1.0;
        m.x *= u_resolution.x / u_resolution.y;
        m.y = -m.y; // Flip Y for WebGL

        // Smooth mouse interaction (push/pull effect)
        float mouseDist = length(p - m);
        float mouseInfluence = smoothstep(1.5, 0.0, mouseDist);
        
        // Gentle distortion from the mouse
        uv += (p - m) * mouseInfluence * 0.06;

        float t = u_time * 0.15; // Animation speed

        // Domain warping / Fractal fluid math
        // This loop displaces the UV coordinates over themselves, creating a swirling liquid
        vec2 q = uv * 3.0; // Scale of the abstract pattern
        for(float i = 1.0; i < 6.0; i++) {
            vec2 newQ = q;
            // The magic swirling equation + subtle mouse perturbation
            newQ.x += 0.6 / i * sin(i * q.y + t + 0.3) + mouseInfluence * 0.05;
            newQ.y += 0.6 / i * cos(i * q.x + t + 0.3) - mouseInfluence * 0.05;
            q = newQ;
        }

        // Color palette mappings based on the distorted space
        // These produce smooth, wavy gradients
        float flow1 = cos(q.x + q.y) * 0.5 + 0.5;
        float flow2 = sin(q.x - q.y) * 0.5 + 0.5;

        // Professional dark portfolio colors
        vec3 colorDarkBg = vec3(0.04, 0.06, 0.12); // Deep rich navy
        vec3 colorAccent1 = vec3(0.0, 0.5, 0.8);   // Vibrant cyan
        vec3 colorAccent2 = vec3(0.4, 0.1, 0.7);   // Electric purple

        // Mix the colors based on the fluid flows
        vec3 finalColor = mix(colorDarkBg, colorAccent1, flow1 * 0.55);
        finalColor = mix(finalColor, colorAccent2, flow2 * 0.45);

        // Add a subtle dynamic glow exactly where the mouse is
        float glow = exp(-mouseDist * 2.5);
        finalColor += vec3(0.1, 0.2, 0.4) * glow;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// Set up rectangle geometry covering the entire canvas
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Locations
const positionLocation = gl.getAttribLocation(program, 'a_position');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const timeLocation = gl.getUniformLocation(program, 'u_time');
const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

// Keep track of mouse position. Start off-screen.
let mouseX = -1000;
let mouseY = -1000;

// Track mouse relative to the header element
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Optionally move light away when mouse leaves the header
window.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
});

function resizeCanvasToDisplaySize(canvas) {
    // Look up the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}

function render(time) {
    time *= 0.001; // Convert to seconds

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Provide uniforms
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(timeLocation, time);
    gl.uniform2f(mouseLocation, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

// Start animation loop
requestAnimationFrame(render);
