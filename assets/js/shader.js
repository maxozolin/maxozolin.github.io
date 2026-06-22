const canvas = document.getElementById('shader-canvas');
// Switching from WebGL to a 2D context to easily handle object physics (particles you can swat)
const ctx = canvas.getContext('2d');

let particles = [];

// Professional portfolio color palette (cyans, blues, soft whites)
const colors = ['#1cb5e0', '#6eb8cc', '#ffffff', '#4158d0', '#89a5df'];

let mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
let lastMouse = { x: -1000, y: -1000 };

// Track mouse and its velocity for the "swat" effect
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    // Calculate how fast the mouse is moving
    mouse.vx = mouse.x - lastMouse.x;
    mouse.vy = mouse.y - lastMouse.y;
});

// Decelerate mouse velocity when it stops moving
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
        this.size = Math.random() * 3 + 1.5; // Circle radius
        
        // Base drift speed
        this.baseVx = (Math.random() - 0.5) * 0.5;
        this.baseVy = (Math.random() - 0.5) * 0.5;
        
        // Current velocity (used for physics/swatting)
        this.vx = 0;
        this.vy = 0;
        
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.mass = this.size * 1.2; // Larger particles are harder to swat
    }
    
    update() {
        // --- Swatting Physics ---
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let swatRadius = 130; // How close the mouse needs to be to affect it
        
        if (distance < swatRadius) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            
            // Force is stronger the closer the mouse is
            let force = (swatRadius - distance) / swatRadius;
            
            // Combine repulsion with the mouse's actual swipe velocity
            let swatX = mouse.vx * 0.25;
            let swatY = mouse.vy * 0.25;

            this.vx += (forceDirectionX * force * 3 + swatX) / this.mass;
            this.vy += (forceDirectionY * force * 3 + swatY) / this.mass;
        }
        
        // Friction slows them down after being swatted
        this.vx *= 0.93;
        this.vy *= 0.93;
        
        // Apply velocity + natural drift
        this.x += this.vx + this.baseVx;
        this.y += this.vy + this.baseVy;
        
        // Gently bounce off walls for the drift
        if (this.x < 0 || this.x > canvas.width) this.baseVx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.baseVy *= -1;
        
        // Screen wrap if swatted out of bounds
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
    // Amount of particles scales with screen size
    let numParticles = Math.floor((canvas.width * canvas.height) / 9000);
    if (numParticles > 150) numParticles = 150; // Cap to keep it clean
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
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connecting network lines (classic portfolio tech vibe)
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 90) { // Connect if close
                ctx.beginPath();
                ctx.strokeStyle = particles[a].color;
                // Fade line out the further they are
                ctx.globalAlpha = 0.4 * (1 - distance / 90);
                ctx.lineWidth = 1;
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
    
    ctx.globalAlpha = 1.0;

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    requestAnimationFrame(animate);
}

// Initial boot
setTimeout(() => {
    resize();
    animate();
}, 50);
