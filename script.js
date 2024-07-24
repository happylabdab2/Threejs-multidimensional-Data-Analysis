import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import OrbitControls from 'https://cdn.jsdelivr.net/npm/threejs-orbit-controls@1.0.3/+esm';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 5;
controls.update();

scene.add(camera);

const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

let grid = new THREE.GridHelper(100, 10); // Changed var to let for grid
scene.add(grid);

controls.enabled = true;
controls.maxDistance = 1500;
controls.minDistance = 0;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

let on = true;
let dialog = document.getElementById('dialog');
let help = true;
if (localStorage.getItem('help') == 'false') {
    dialog.close();
    help = false;
}

window.addEventListener('keydown', (event) => {
    if (event.key === 'g') {
        grid.visible = !grid.visible;
        on = !on;
    }
    if (event.key === 'h') {
        if (help) {
            dialog.close();
            localStorage.setItem('help', 'false');
            help = false;
        } else {
            dialog.showModal();
            help = true;
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("file").addEventListener("change", (event) => {

        const file = event.target.files[0];
        if (file && file.name.endsWith(".xlsx")) {

            const reader = new FileReader();
            reader.onload = function (e) {

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                rows.forEach((row, index) => {
                    if (index === 0) return;  // skip header row if there is one

                    let x = row[0] || 0;
                    let y = row[1] || 0;
                    let z = row[2] || 0;

                    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

                    const dot = new THREE.Mesh(geometry, material);
                    dot.position.set(x, y, z);
                    dot.userData = { x, y, z };
                    dot.misc = {};


                    if (row.length > 3) {

                        dot.misc.values = [];

                        for (let i = 3; i < row.length; i++) {
                            dot.misc.values.push(row[i]);
                        }
                    } else {

                        dot.misc.value = "null";
                    }

                    scene.add(dot);
                });
            };

            reader.readAsArrayBuffer(file);
        } else {

            alert("Please use xlsx format (Excel spreadsheet)");
        }
    });

    document.getElementById("slider").addEventListener("change", (event) => {
        let val = event.target.value;
        scene.remove(grid);
        grid = new THREE.GridHelper(val, 10);
        scene.add(grid);
        document.getElementById("size").textContent = `${val}/10 Units`;

    });

    document.querySelector("input").disabled = false;
});

renderer.domElement.addEventListener('click', (event) => {

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {

        const dot = intersects[0].object;
        if (dot.userData) {

            const infoDiv = document.getElementById('info');
            infoDiv.textContent = `X: ${dot.userData.x}, Y: ${dot.userData.y}, Z: ${dot.userData.z}`;

            if (dot.misc && dot.misc.values && Array.isArray(dot.misc.values)) {

                infoDiv.textContent += `, Misc: `;
                dot.misc.values.forEach((value, index) => {
                    infoDiv.textContent += `Misc ${index + 1}: ${value}, `;
                });
            } else if (dot.misc && dot.misc.value) {

                infoDiv.textContent += `, Misc: ${dot.misc.value}`;
            }
        }
    }
});

