const canvas = document.getElementById('shader-canvas');
const ctx = canvas.getContext('2d');

// Grab the header content wrapper so we can move it
const headerContent = document.querySelector('.page-header > div');

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
        this.x = x;
        this.y = y;
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
        
        let springStrength = 0.02;
        let dxOrigin = this.originX - this.x;
        let dyOrigin = this.originY - this.y;
        
        this.vx += dxOrigin * springStrength;
        this.vy += dyOrigin * springStrength;
        
        this.vx *= 0.85; 
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
    
    const spacing = 80; 
    const cols = Math.ceil(canvas.width / spacing) + 1;
    const rows = Math.ceil(canvas.height / spacing) + 1;
    
    const offsetX = (canvas.width - (cols - 1) * spacing) / 2;
    const offsetY = (canvas.height - (rows - 1) * spacing) / 2;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
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

// Variables to handle the smoothed motion of the text
let textOffsetX = 0;
let textOffsetY = 0;

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 1.0; 
    
    // Calculate the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // We will measure how much the particles near the center are displaced
    let totalDisplacementX = 0;
    let totalDisplacementY = 0;
    let particlesCounted = 0;
    
    for (let a = 0; a < particles.length; a++) {
        let p = particles[a];
        
        // Measure displacement for particles near the center of the screen
        let distFromCenter = Math.sqrt(Math.pow(p.originX - centerX, 2) + Math.pow(p.originY - centerY, 2));
        if (distFromCenter < 300) {
            totalDisplacementX += (p.x - p.originX);
            totalDisplacementY += (p.y - p.originY);
            particlesCounted++;
        }
        
        for (let b = a + 1; b < particles.length; b++) {
            let dx = p.x - particles[b].x;
            let dy = p.y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                ctx.beginPath();
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 0.4 * (1 - distance / 150);
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
        
        let mdx = p.x - mouse.x;
        let mdy = p.y - mouse.y;
        let mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
        
        if (mDistance < 250) {
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff'; 
            ctx.globalAlpha = 0.5 * (1 - mDistance / 250);
            
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
    }
    
    ctx.globalAlpha = 1.0;

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    // Apply the displacement to the HTML text element
    if (headerContent && particlesCounted > 0) {
        // Average the displacement of the central particles
        let avgDx = totalDisplacementX / particlesCounted;
        let avgDy = totalDisplacementY / particlesCounted;
        
        // Smoothly interpolate the text movement (spring-like text following)
        textOffsetX += (avgDx - textOffsetX) * 0.2;
        textOffsetY += (avgDy - textOffsetY) * 0.2;
        
        // Apply the CSS transform to physically move the text layer
        headerContent.style.transform = \`translate(\${textOffsetX}px, \${textOffsetY}px)\`;
    }
    
    requestAnimationFrame(animate);
}

setTimeout(() => {
    resize();
    animate();
}, 50);
