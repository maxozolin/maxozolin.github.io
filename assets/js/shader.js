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

// Fragment Shader: Professional, elegant, slow-moving fluid waves
// Colors matching the original Cayman theme (#159957 to #155799)
const fsSource = `
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    void main() {
        // Normalize coordinates
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Base theme colors
        vec3 colorTeal = vec3(0.082, 0.600, 0.341); // #159957
        vec3 colorBlue = vec3(0.082, 0.341, 0.600); // #155799
        
        // Smooth undulating waves
        float wave1 = sin(uv.x * 3.0 + u_time * 0.4) * 0.5 + 0.5;
        float wave2 = cos(uv.y * 2.5 - u_time * 0.3) * 0.5 + 0.5;
        float combinedWave = wave1 * wave2;
        
        // Blend colors based on waves and horizontal position
        vec3 baseGradient = mix(colorTeal, colorBlue, combinedWave + uv.x * 0.3);
        
        // Mouse interaction: subtle light highlight
        vec2 mouseNorm = u_mouse / u_resolution.xy;
        mouseNorm.y = 1.0 - mouseNorm.y; // Flip Y for WebGL
        
        // Correct aspect ratio for circular highlight
        vec2 diff = uv - mouseNorm;
        diff.x *= u_resolution.x / u_resolution.y;
        
        float dist = length(diff);
        float highlight = smoothstep(0.8, 0.0, dist) * 0.15; // Soft, subtle brightness
        
        gl_FragColor = vec4(baseGradient + highlight, 1.0);
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

// Set up rectangle geometry
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Uniform locations
const positionLocation = gl.getAttribLocation(program, 'a_position');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const timeLocation = gl.getUniformLocation(program, 'u_time');
const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

let mouseX = -1000;
let mouseY = -1000;

// Track mouse relative to the canvas/header
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

function resizeCanvasToDisplaySize(canvas) {
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
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

    // Set uniforms
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(timeLocation, time);
    gl.uniform2f(mouseLocation, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
