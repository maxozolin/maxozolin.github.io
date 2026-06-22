const canvas = document.getElementById('shader-canvas');
const ctx = canvas.getContext('2d');

let particles = [];

// Minimalistic Palette: Mostly varied opacities of white, with a rare subtle teal accent
const colors = [
    'rgba(255, 255, 255, 0.8)',
    'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.2)',
    'rgba(255, 255, 255, 0.1)',
    'rgba(45, 212, 191, 0.9)' // Teal accent
];

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
        
        // Smaller, more refined particle sizes
        this.size = Math.random() * 1.5 + 0.5; 
        
        // Slower, more elegant base drift
        this.baseVx = (Math.random() - 0.5) * 0.2;
        this.baseVy = (Math.random() - 0.5) * 0.2;
        
        this.vx = 0;
        this.vy = 0;
        
        // 90% chance to be white/gray, 10% chance to be the accent color
        if (Math.random() > 0.9) {
            this.color = colors[4];
            this.size *= 1.5; // Accent particles are slightly larger
        } else {
            this.color = colors[Math.floor(Math.random() * 4)];
        }
        
        this.mass = this.size * 1.5;
    }
    
    update() {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let swatRadius = 150; // Interaction radius
        
        if (distance < swatRadius) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            
            // Smoother force curve
            let force = Math.pow((swatRadius - distance) / swatRadius, 2);
            
            let swatX = mouse.vx * 0.15;
            let swatY = mouse.vy * 0.15;

            // Apply force
            this.vx += (forceDirectionX * force * 1.5 + swatX) / this.mass;
            this.vy += (forceDirectionY * force * 1.5 + swatY) / this.mass;
        }
        
        // Friction - higher means they stop sliding sooner (more controlled)
        this.vx *= 0.90;
        this.vy *= 0.90;
        
        this.x += this.vx + this.baseVx;
        this.y += this.vy + this.baseVy;
        
        // Wrap edges instead of bouncing for a continuous infinite feel
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function init() {
    particles = [];
    // Slightly lower density for a minimalist look
    let numParticles = Math.floor((canvas.width * canvas.height) / 12000);
    if (numParticles > 120) numParticles = 120;
    if (numParticles < 30) numParticles = 30;
    
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
    
    // Draw connecting lines
    ctx.lineWidth = 0.5; // Ultra-thin lines
    
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                ctx.beginPath();
                ctx.strokeStyle = '#ffffff';
                // Extremely subtle line opacity
                ctx.globalAlpha = 0.15 * (1 - distance / 100);
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
        
        // Connect particles to mouse if close (adds an engaging "magnetic" feel)
        let mdx = particles[a].x - mouse.x;
        let mdy = particles[a].y - mouse.y;
        let mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
        
        if (mDistance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = '#2dd4bf'; // Magnetic lines to mouse are teal
            ctx.globalAlpha = 0.2 * (1 - mDistance / 120);
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
