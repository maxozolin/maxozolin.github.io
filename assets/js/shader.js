const canvas = document.getElementById('shader-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const nodeColor = 'rgba(248, 250, 252, 0.9)'; 

let mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
let lastMouse = { x: -1000, y: -1000 };

window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    mouse.vx = mouse.x - lastMouse.x;
    mouse.vy = mouse.y - lastMouse.y;
});

setInterval(() => {
    mouse.vx *= 0.5;
    mouse.vy *= 0.5;
}, 50);

window.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
});

class Particle {
    constructor(x, y) {
        // Current actual position
        this.x = x;
        this.y = y;
        
        // Target anchor position (the grid intersection)
        this.originX = x;
        this.originY = y;
        
        this.size = 2.0; 
        
        this.vx = 0;
        this.vy = 0;
        this.mass = this.size * 2.0;
    }
    
    update() {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let swatRadius = 200; // Increased interaction radius
        
        // 1. Mouse Swat Repulsion
        if (distance < swatRadius) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            
            let force = Math.pow((swatRadius - distance) / swatRadius, 2);
            
            let swatX = mouse.vx * 0.2;
            let swatY = mouse.vy * 0.2;

            this.vx += (forceDirectionX * force * 2.0 + swatX) / this.mass;
            this.vy += (forceDirectionY * force * 2.0 + swatY) / this.mass;
        }
        
        // 2. Grid Snap (Spring Physics)
        // This constantly pulls the particle back to its original grid anchor
        let springStrength = 0.02;
        let dxOrigin = this.originX - this.x;
        let dyOrigin = this.originY - this.y;
        
        this.vx += dxOrigin * springStrength;
        this.vy += dyOrigin * springStrength;
        
        // Friction / Damping
        this.vx *= 0.85; // Lower friction means more springy/bouncy
        this.vy *= 0.85;
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
    }
}

function init() {
    particles = [];
    
    // Create a strict grid layout instead of random placement
    const spacing = 80; // Distance between grid nodes
    
    // Calculate how many rows/cols fit in the canvas
    const cols = Math.ceil(canvas.width / spacing) + 1;
    const rows = Math.ceil(canvas.height / spacing) + 1;
    
    // Offset to center the grid
    const offsetX = (canvas.width - (cols - 1) * spacing) / 2;
    const offsetY = (canvas.height - (rows - 1) * spacing) / 2;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Add a tiny bit of random jitter so it doesn't look *too* perfectly rigid
            let jitterX = (Math.random() - 0.5) * 10;
            let jitterY = (Math.random() - 0.5) * 10;
            
            let x = c * spacing + offsetX + jitterX;
            let y = r * spacing + offsetY + jitterY;
            
            particles.push(new Particle(x, y));
        }
    }
}

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    init();
}

window.addEventListener('resize', resize);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 1.0; 
    
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            // Increased connection distance
            if (distance < 150) {
                ctx.beginPath();
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 0.4 * (1 - distance / 150);
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
        
        // Much stronger magnetic mouse connection
        let mdx = particles[a].x - mouse.x;
        let mdy = particles[a].y - mouse.y;
        let mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
        
        // Grab from much further away
        if (mDistance < 250) {
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff'; 
            // Much brighter connection lines to the mouse
            ctx.globalAlpha = 0.5 * (1 - mDistance / 250);
            
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
    }
    
    ctx.globalAlpha = 1.0;

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    requestAnimationFrame(animate);
}

setTimeout(() => {
    resize();
    animate();
}, 50);
