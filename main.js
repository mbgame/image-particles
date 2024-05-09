import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

// Initialize the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black color
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 400;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Texture loader
// const loader = new THREE.TextureLoader();
// const starTexture = loader.load('star2.png'); // Replace 'star.png' with your star texture path

let points = null;
function cleanupScene() {
    if (points !== null) {
        scene.remove(points);
        points.geometry.dispose();
        points.material.dispose();
        points = null;
    }
}


// Load the PNG image
function loadImage(imageSrc) {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = 'anonymous';

    img.onload = function () {
        cleanupScene();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height).data;
    
        const positions = [];
        const colors = new Float32Array(img.width * img.height * 3);
        let colorIndex = 0;
    
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const r = imageData[index];
                const g = imageData[index + 1];
                const b = imageData[index + 2];
                const a = imageData[index + 3];
                if (a > 0) {
                    const posX = x - img.width / 2;
                    const posY = -(y - img.height / 2);
                    const posZ = Math.random() * 20 - 20/2;
                    positions.push(posX, posY, posZ);
    
                    const color = new THREE.Color(`rgb(${r}, ${g}, ${b})`);
                    colors[colorIndex++] = color.r;
                    colors[colorIndex++] = color.g;
                    colors[colorIndex++] = color.b;
    
                }
            }
        }
    
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
        const material = new THREE.PointsMaterial({
            size: 0.1,
            // map: starTexture,
            vertexColors: true,
            // blending: THREE.AdditiveBlending,
            // depthWrite: false,
            // transparent: true,
            // alphaTest: 0.5
        });
    
        points = new THREE.Points(geometry, material);
        scene.add(points);
    
        // Explode effect variables
        const explodeDistance = 300; // Distance multiplier for the explosion effect
        const duration = 10; // Duration of the animation
    
        // Animate points
        for (let i = 0; i < positions.length / 3; i++) {
            const index = i * 3;
            const [x, y, z] = [positions[index], positions[index + 1], positions[index + 2]];
    
            // Calculate the direction vector from the center
            const direction = new THREE.Vector3(x, y, z).normalize();
            const targetX = x + direction.x * explodeDistance;
            const targetY = y + direction.y * explodeDistance;
            const targetZ = z + direction.z * explodeDistance;
    
            // GSAP animation for each point
            gsap.to(geometry.attributes.position.array, {
                [index]: targetX,
                [index + 1]: targetY,
                [index + 2]: targetZ,
                duration: duration,
                repeat: -1,
                yoyo: true,
                ease: "power2.inOut",
                onUpdate: () => {
                    geometry.attributes.position.needsUpdate = true;
                }
            });
        }


        let rotationAngle = 0;
        const rotationSpeed = 0.001;
        
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            if (points !== null) {
                // Calculate the new camera position based on the rotation angle
                // const radius = 400; // Adjust the radius as needed
                // const x = Math.sin(rotationAngle) * radius;
                // const z = Math.cos(rotationAngle) * radius;
                // camera.position.set(x, 0, z);
                // camera.lookAt(scene.position);
        
                // Increment the rotation angle
                // rotationAngle += rotationSpeed;
        
                renderer.render(scene, camera);
            }
        }
    
        animate();
    };
}



const imageInput = document.getElementById('imageInput');

imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === 'image/png') {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imageSrc = e.target.result;
            loadImage(imageSrc);
        };
        reader.readAsDataURL(file);
    } else {
        console.error('Please select a valid PNG image.');
    }
});

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});