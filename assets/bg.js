const canvas = document.getElementById('binary-canvas');
const ctx = canvas.getContext('2d');

let width, height, columns, drops;
const fontSize = 12;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  
    columns = Math.ceil(width / fontSize);
    drops = [];
    
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -100); 
    }
}

window.addEventListener('resize', resize);
resize();

function draw() {
    // Semi-transparent background refresh creates a subtle motion blur / trail effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; 
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#cba6f788';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        // Generate random 0 or 1
        const text = Math.random() > 0.5 ? '1' : '0';
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        // Reset drop back to top once it hits bottom with a randomized delay
        if (y > height && Math.random() > 0.95) {
            drops[i] = 0;
        }

        drops[i]++;
    }

    // requestAnimationFrame(draw);
}

const frameDelay = 50; 
setInterval(draw, frameDelay);