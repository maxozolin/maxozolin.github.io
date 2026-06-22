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

// Hexagon Configuration
const HEX_RADIUS = 50; 
// To form perfect hexagons, we only connect nearest neighbors (distance = HEX_RADIUS).
// We set the threshold slightly higher to account for organic jitter.
const CONNECTION_DISTANCE = HEX_RADIUS * 1.45; 

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        // Using elegant dots for the vertices of the hexagons
        this.size = 2.5; 
        this.vx = 0;
        this.vy = 0;
        this.mass = this.size * 2.0;
    }
    
    update() {
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let swatRadius = 200; 
        
        if (distance < swatRadius) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let force = Math.pow((swatRadius - distance) / swatRadius, 2);
            let swatX = mouse.vx * 0.2;
            let swatY = mouse.vy * 0.2;

            this.vx += (forceDirectionX * force * 2.0 + swatX) / this.mass;
            this.vy += (forceDirectionY * force * 2.0 + swatY) / this.mass;
        }
        
        let dxOrigin = this.originX - this.x;
        let dyOrigin = this.originY - this.y;
        let distFromOrigin = Math.sqrt(dxOrigin * dxOrigin + dyOrigin * dyOrigin);
        
        // Dynamic Spring Physics: 
        // Base strength is very low for floaty movement.
        // As it gets pushed further away (creating a void), the spring tension multiplies to snap it back.
        let baseSpring = 0.003;
        let tensionMultiplier = (distFromOrigin > 50) ? (distFromOrigin - 50) * 0.0005 : 0;
        let springStrength = baseSpring + tensionMultiplier;
        
        this.vx += dxOrigin * springStrength;
        this.vy += dyOrigin * springStrength;
        
        this.vx *= 0.94; 
        this.vy *= 0.94;
        
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
    if (canvas.width === 0 || canvas.height === 0) return;
    
    // Mathematical generation of a true Honeycomb / Hexagonal lattice
    const hexWidth = Math.sqrt(3) * HEX_RADIUS;
    const ySpacing = 1.5 * HEX_RADIUS;
    
    const cols = Math.ceil(canvas.width / hexWidth) + 2;
    const rows = Math.ceil(canvas.height / ySpacing) + 2;
    
    const offsetX = (canvas.width - (cols - 1) * hexWidth) / 2;
    const offsetY = (canvas.height - (rows - 1) * ySpacing) / 2;
    
    for (let row = -2; row <= rows; row++) {
        for (let col = -2; col <= cols; col++) {
            // Offset odd rows to interlock the hexagons
            let xOffset = (row % 2 !== 0) ? hexWidth / 2 : 0;
            
            // A hexagon requires two vertices per grid coordinate
            let x1 = col * hexWidth + xOffset + offsetX;
            let y1 = row * ySpacing + offsetY;
            
            let x2 = x1;
            let y2 = y1 + HEX_RADIUS;
            
            // Add a small amount of jitter so it feels organic, 
            // but not so much that the hexagons lose their shape.
            let jitter = 10;
            let jx1 = (Math.random() - 0.5) * jitter;
            let jy1 = (Math.random() - 0.5) * jitter;
            let jx2 = (Math.random() - 0.5) * jitter;
            let jy2 = (Math.random() - 0.5) * jitter;
            
            particles.push(new Particle(x1 + jx1, y1 + jy1));
            particles.push(new Particle(x2 + jx2, y2 + jy2));
        }
    }
}

function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || canvas.clientWidth || window.innerWidth;
    canvas.height = rect.height || canvas.clientHeight || 400;
    init();
}

window.addEventListener('resize', resize);
window.addEventListener('load', resize);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.0; 
    
    let mouseConnections = [];

    for (let a = 0; a < particles.length; a++) {
        let p = particles[a];
        
        for (let b = a + 1; b < particles.length; b++) {
            let dx = p.x - particles[b].x;
            let dy = p.y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only connect the nearest neighbors to mathematically form hexagons
            if (distance < CONNECTION_DISTANCE) {
                ctx.beginPath();
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 0.5 * (1 - distance / CONNECTION_DISTANCE);
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
        
        // Collect potential mouse connections
        let mdx = p.x - mouse.x;
        let mdy = p.y - mouse.y;
        let mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
        
        if (mDistance < 180) { // Reduced tracking radius
            mouseConnections.push({ p: p, dist: mDistance });
        }
    }
    
    // Sort and limit mouse connections to the closest 4 nodes
    mouseConnections.sort((a, b) => a.dist - b.dist);
    const MAX_CONNECTIONS = 4;
    
    for (let i = 0; i < Math.min(mouseConnections.length, MAX_CONNECTIONS); i++) {
        let conn = mouseConnections[i];
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff'; 
        ctx.globalAlpha = 0.6 * (1 - conn.dist / 180);
        ctx.moveTo(conn.p.x, conn.p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    requestAnimationFrame(animate);
}

resize();
animate();