const canvas = document.getElementById('shader-canvas');
const ctx = canvas.getContext('2d');

let particles = [];

// Uniform, cohesive color for a clean, minimalist look. 
// We use a crisp, bright white/silver for all nodes.
const nodeColor = 'rgba(248, 250, 252, 1.0)'; // Slate 50

let mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
let lastMouse = { x: -1000, y: -1000 };

// Track mouse and velocity
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    mouse.vx = mouse.x - lastMouse.x;
    mouse.vy = mouse.y - lastMouse.y;
});

// Decelerate mouse velocity
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
        this.x = x;
        this.y = y;
        
        // Uniform, slightly larger size so they read clearly as nodes
        this.size = Math.random() * 1.5 + 1.5; 
        
        // Very slow, elegant drift
        this.baseVx = (Math.random() - 0.5) * 0.15;
        this.baseVy = (Math.random() - 0.5) * 0.15;
        
        this.vx = 0;
        this.vy = 0;
        this.mass = this.size * 2.0;
    }
    
    update() {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let swatRadius = 150; 
        
        if (distance < swatRadius) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            
            let force = Math.pow((swatRadius - distance) / swatRadius, 2);
            
            let swatX = mouse.vx * 0.15;
            let swatY = mouse.vy * 0.15;

            this.vx += (forceDirectionX * force * 1.5 + swatX) / this.mass;
            this.vy += (forceDirectionY * force * 1.5 + swatY) / this.mass;
        }
        
        this.vx *= 0.90;
        this.vy *= 0.90;
        
        this.x += this.vx + this.baseVx;
        this.y += this.vy + this.baseVy;
        
        // Wrap edges
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;
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
    // Slightly higher density so the connections form a better web
    let numParticles = Math.floor((canvas.width * canvas.height) / 10000);
    if (numParticles > 140) numParticles = 140;
    if (numParticles < 40) numParticles = 40;
    
    for (let i = 0; i < numParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particles.push(new Particle(x, y));
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
    
    // Thicker, more visible connecting lines
    ctx.lineWidth = 1.0; 
    
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            // Increased connection distance slightly so the web is more cohesive
            if (distance < 120) {
                ctx.beginPath();
                ctx.strokeStyle = '#ffffff';
                // Increased base opacity for much clearer connections
                ctx.globalAlpha = 0.35 * (1 - distance / 120);
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
        
        // Mouse connection lines
        let mdx = particles[a].x - mouse.x;
        let mdy = particles[a].y - mouse.y;
        let mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
        
        if (mDistance < 140) {
            ctx.beginPath();
            // Changed mouse connection to uniform white/gray instead of teal to keep the palette clean
            ctx.strokeStyle = '#ffffff'; 
            ctx.globalAlpha = 0.25 * (1 - mDistance / 140);
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
