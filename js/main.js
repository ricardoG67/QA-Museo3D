import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 🌐 Base de tu ImageKit
const IK_BASE_URL = "https://ik.imagekit.io/y6ivkwjoq";

// 🧩 Sacar el museumId desde el query param ?id=...
const params = new URLSearchParams(window.location.search);
const museumId = params.get("id");
if (!museumId) {
    document.body.innerHTML = `
        <div style="
            background:#050816;
            color:#fff;
            font-family: sans-serif;
            height:100vh;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            text-align:center;
        ">
            <h1>404 - Museo no encontrado</h1>
            <p>Este museo no existe o la URL es inválida.</p>
            <p>
                Prueba nuestra demo:
                <a href="https://www.museo3d.com/?id=DEMO"
                   style="color:#ff8fa3; text-decoration:underline;">
                   https://www.museo3d.com/?id=DEMO
                </a>
            </p>
            <p>
                O comunícate con soporte.
            </p>
        </div>
    `;
    throw new Error("Museo sin ID en URL");
}

// Carpeta del museo en ImageKit
const museumFolderUrl = `${IK_BASE_URL}/${museumId}`;

// Aquí guardaremos lo que viene del config
let photoConfig = [];
let activeLayout = "default"; // 👈 nuevo

// 🔄 ELEMENTOS DEL LOADER
const loaderOverlay = document.getElementById('loader-overlay');
const loaderBarFill = document.getElementById('loader-bar-fill');
const loaderPercent = document.getElementById('loader-percent');

// 🔄 MANAGER DE CARGA
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    loaderOverlay.style.opacity = '1';
    loaderOverlay.style.display = 'flex';
    loaderBarFill.style.width = '0%';
    loaderPercent.textContent = '0%';
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = itemsTotal ? itemsLoaded / itemsTotal : 0;
    const percent = Math.round(progress * 100);
    loaderBarFill.style.width = percent + '%';
    loaderPercent.textContent = percent + '%';
};

loadingManager.onLoad = function () {
    loaderBarFill.style.width = '100%';
    loaderPercent.textContent = '100%';

    loaderOverlay.style.opacity = '0';
    setTimeout(() => {
        loaderOverlay.style.display = 'none';
    }, 650);
};

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050816);
scene.fog = new THREE.Fog(0x050816, 20, 80);

// Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 1.7, 0);
camera.rotation.order = "YXZ";
let yaw = 0;
let pitch = 0;

// 🎧 AUDIO de fondo
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

let musicReady = false;
let pendingPlay = false;

const audioLoader = new THREE.AudioLoader(loadingManager);
audioLoader.load(
    "music/music.mp3",
    function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.25);

        musicReady = true;

        if (pendingPlay && !sound.isPlaying) {
            sound.play();
        }
    },
    undefined,
    function (err) {
        console.log("Audio no disponible:", err);
    }
);

// 👇 Handler de click
document.addEventListener("click", () => {
    if (!sound.isPlaying) {
        if (musicReady) {
            sound.play();
        } else {
            pendingPlay = true;
        }
    }
});

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

// Luces generales
const ambientLight = new THREE.AmbientLight(0xfff5e9, 1);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xfff5e9, 0x1b1b22, 0.7);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight(0xfff0dd, 0.5);
directionalLight.position.set(5, 8, 5);
directionalLight.castShadow = false;
scene.add(directionalLight);

// Dimensiones sala
const roomWidth = 18;
const roomLength = 36 * 0.65;

const baseWallHeight = 6.0;
const outerWallHeight = baseWallHeight * 1.3;

// ---- TEXTURAS (con loadingManager) ----
const texLoader = new THREE.TextureLoader(loadingManager);

// const marbleColor = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/paredes/MARBLE-diffuse.jpg?updatedAt=1764565313321");
// const marbleAO = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/paredes/MARBLE-ao.jpg?updatedAt=1764565310599");
// const marbleNormal = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/paredes/MARBLE-normal.jpg?updatedAt=1764565310886");

const marbleColor = texLoader.load("img/texturas/paredes/MARBLE-diffuse.jpg");
const marbleAO = texLoader.load("img/texturas/paredes/MARBLE-ao.jpg");
const marbleNormal = texLoader.load("img/texturas/paredes/MARBLE-normal.jpg");

[marbleColor, marbleAO, marbleNormal].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.8, 0.6);
});

// const slateColor = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/piso/SLATE-diffuse.jpg?updatedAt=1764565348135");
// const slateAO = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/piso/SLATE-ao.jpg?updatedAt=1764565345359");
// const slateNormal = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/piso/SLATE-normal.jpg?updatedAt=1764565346610");

const slateColor = texLoader.load("img/texturas/piso/SLATE-diffuse.jpg");
const slateAO = texLoader.load("img/texturas/piso/SLATE-ao.jpg");
const slateNormal = texLoader.load("img/texturas/piso/SLATE-normal.jpg");

[slateColor, slateAO, slateNormal].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.5);
});

// const amethystColor = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/techo/BIANCO%20LASA%20VENATO%20GOLD%20ZEROCARE%20-%20POLISHED%20-%20MARBLE-diffuse.jpg");
// const amethystAO = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/techo/BIANCO%20LASA%20VENATO%20GOLD%20ZEROCARE%20-%20POLISHED%20-%20MARBLE-ao.jpg");
// const amethystNormal = texLoader.load("https://ik.imagekit.io/y6ivkwjoq/texturas/techo/BIANCO%20LASA%20VENATO%20GOLD%20ZEROCARE%20-%20POLISHED%20-%20MARBLE-normal.jpg");

const amethystColor = texLoader.load("img/texturas/techo/BIANCO%20LASA%20VENATO%20GOLD%20ZEROCARE%20-%20POLISHED%20-%20MARBLE-diffuse.jpg");
const amethystAO = texLoader.load("img/texturas/techo/BIANCO%20LASA%20VENATO%20GOLD%20ZEROCARE%20-%20POLISHED%20-%20MARBLE-ao.jpg");
const amethystNormal = texLoader.load("img/texturas/techo/BIANCO%20LASA%20VENATO%20GOLD%20ZEROCARE%20-%20POLISHED%20-%20MARBLE-normal.jpg");

[amethystColor, amethystAO, amethystNormal].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1);
});

// 🔢 Lista de todos los cuadros
const allFrames = [];

// Materiales base
const wallMaterial = new THREE.MeshStandardMaterial({
    map: marbleColor,
    aoMap: marbleAO,
    normalMap: marbleNormal,
    roughness: 0.4,
    metalness: 0.0,
    side: THREE.DoubleSide
});

const floorMaterial = new THREE.MeshStandardMaterial({
    map: slateColor,
    normalMap: slateNormal,
    aoMap: slateAO,
    roughness: 0.65,
    metalness: 0.05
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: amethystColor,
    normalMap: amethystNormal,
    aoMap: amethystAO,
    roughness: 0.35,
    metalness: 0.1
});

const outerFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.6
});

const matMaterial = new THREE.MeshStandardMaterial({
    color: 0xe3ded5,
    roughness: 0.8
});

// ✅ CARGA DEL MARCO 3D (GLB)
const gltfLoader = new GLTFLoader(loadingManager);
let frameModel = null;

gltfLoader.load(
    'modelos/marco.glb',
    (gltf) => {
        frameModel = gltf.scene;

        // Normalizar tamaño
        const box = new THREE.Box3().setFromObject(frameModel);
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxSide = Math.max(size.x, size.y);
        const scale = 1 / maxSide;
        frameModel.scale.setScalar(scale);

        // Centrar modelo
        const center = new THREE.Vector3();
        box.getCenter(center);
        frameModel.position.sub(center);

        // Reemplazar marcos existentes
        for (const frame of allFrames) {
            const oldOuter = frame.userData.outer;
            if (oldOuter) {
                frame.remove(oldOuter);
            }

            const glbClone = frameModel.clone(true);
            glbClone.rotation.y = Math.PI;
            frame.add(glbClone);

            frame.userData.outer = glbClone;

            if (frame.userData.img.material.map?.image) {
                applyTextureToFrame(
                    frame,
                    frame.userData.img.material.map,
                    frame.userData.captionText || ''
                );
            }
        }

        console.log('✅ Marcos GLB inyectados correctamente');
    },
    undefined,
    (err) => {
        console.error('❌ Error cargando marco GLB:', err);
    }
);

// Piso
const floorGeom = new THREE.PlaneGeometry(roomWidth, roomLength, 64, 64);
floorGeom.setAttribute('uv2', new THREE.BufferAttribute(floorGeom.attributes.uv.array, 2));
const floor = new THREE.Mesh(floorGeom, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Techo
const ceilingThickness = 0.35;
const circleRadius = 4.0;

const ceilingShape = new THREE.Shape();
ceilingShape.moveTo(-roomWidth / 2, -roomLength / 2);
ceilingShape.lineTo(roomWidth / 2, -roomLength / 2);
ceilingShape.lineTo(roomWidth / 2, roomLength / 2);
ceilingShape.lineTo(-roomWidth / 2, roomLength / 2);
ceilingShape.lineTo(-roomWidth / 2, -roomLength / 2);

const holePath = new THREE.Path();
holePath.absellipse(0, 0, circleRadius, circleRadius, 0, Math.PI * 2);
ceilingShape.holes.push(holePath);

const ceilingGeom = new THREE.ExtrudeGeometry(ceilingShape, { depth: ceilingThickness, bevelEnabled: false });

ceilingGeom.computeBoundingBox();
const bbox = ceilingGeom.boundingBox;
const sizeCeil = new THREE.Vector3();
bbox.getSize(sizeCeil);

const posAttr = ceilingGeom.attributes.position;
const uvAttr = ceilingGeom.attributes.uv;
const scaleU = 0.15;
const scaleV = 0.15;

for (let i = 0; i < uvAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const u = (x - bbox.min.x) / sizeCeil.x;
    const v = (y - bbox.min.y) / sizeCeil.y;
    uvAttr.setXY(i, u * scaleU, v * scaleV);
}
uvAttr.needsUpdate = true;
ceilingGeom.setAttribute('uv2', new THREE.BufferAttribute(ceilingGeom.attributes.uv.array, 2));

const ceilingMesh = new THREE.Mesh(ceilingGeom, ceilingMaterial);
ceilingMesh.rotation.x = -Math.PI / 2;
ceilingMesh.position.y = outerWallHeight;
scene.add(ceilingMesh);

// Cielo nocturno
const skyGeom = new THREE.SphereGeometry(80, 32, 32);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x050816, side: THREE.BackSide });
const skyDome = new THREE.Mesh(skyGeom, skyMat);
scene.add(skyDome);

const starCount = 750;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const radius = 60 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI / 2;
    starPositions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
    starPositions[i * 3 + 1] = radius * Math.cos(phi);
    starPositions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);
}

const starGeom = new THREE.BufferGeometry();
starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, sizeAttenuation: true });
const stars = new THREE.Points(starGeom, starMat);
scene.add(stars);

// Luna
const moonGeom = new THREE.SphereGeometry(2.4, 32, 32);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xfdf6e3 });
const moon = new THREE.Mesh(moonGeom, moonMat);
moon.position.set(-8, 50, -10);
scene.add(moon);

const moonLight = new THREE.DirectionalLight(0xfdf6e3, 0.35);
moonLight.position.copy(moon.position);
scene.add(moonLight);

// Paredes
function createWall(w, h, x, y, z, rotY = 0) {
    const g = new THREE.PlaneGeometry(w, h, 64, 64);
    g.setAttribute('uv2', new THREE.BufferAttribute(g.attributes.uv.array, 2));
    const wall = new THREE.Mesh(g, wallMaterial);
    wall.position.set(x, y, z);
    wall.rotation.y = rotY;
    wall.receiveShadow = true;
    scene.add(wall);
    return wall;
}

// 🖼️ SISTEMA de CUADROS
const frameDepthOffset = 0.01;
const basePhotoSize = 2.5;

// 👉 sin borde blanco
const matPadding = 0.0;

// 👉 marco más pegado
const outerPadding = 0.05;

// 👉 marco un poco más angosto
const FRAME_WIDTH_FACTOR = 0.58;

// (Función de placa se deja pero ya NO se usa)
/*
function createCaptionPlane(text, width, height) {
    ...
}
*/

function createFrame() {
    const group = new THREE.Group();

    let outer;
    if (frameModel) {
        outer = frameModel.clone(true);
        outer.rotation.y = Math.PI;
        group.add(outer);
    } else {
        const outerGeom = new THREE.PlaneGeometry(1, 1);
        outer = new THREE.Mesh(outerGeom, outerFrameMaterial);
        group.add(outer);
    }

    const matGeom = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.Mesh(matGeom, matMaterial);
    mat.position.z = frameDepthOffset;
    group.add(mat);

    const imgGeom = new THREE.PlaneGeometry(1, 1);
    const imgMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.7
    });
    const img = new THREE.Mesh(imgGeom, imgMaterial);
    img.position.z = frameDepthOffset * 2;
    group.add(img);

    // 👇 Guardamos captionText para el popup, ya no placa 3D
    group.userData = { outer, mat, img, caption: null, captionText: "" };
    allFrames.push(group);

    return group;
}

function applyTextureToFrame(frame, texture, captionText) {
    const { outer, mat, img } = frame.userData;

    if (typeof captionText === 'string') {
        frame.userData.captionText = captionText;
    }

    texture.colorSpace = THREE.SRGBColorSpace;
    img.material.map = texture;
    img.material.color.setHex(0xffffff);
    img.material.needsUpdate = true;

    if (!texture.image) {
        console.warn('Imagen no cargada aún');
        return;
    }

    const ratio = texture.image.width / texture.image.height;
    const r = THREE.MathUtils.clamp(ratio, 0.6, 1.6);

    let photoW, photoH;
    if (r >= 1) {
        photoH = basePhotoSize;
        photoW = basePhotoSize * r;
    } else {
        photoW = basePhotoSize;
        photoH = basePhotoSize / r;
    }

    const matW = photoW + matPadding;
    const matH = photoH + matPadding;

    const outerW = matW + outerPadding;
    const outerH = matH + outerPadding;

    const effectiveOuterW = outerW * FRAME_WIDTH_FACTOR;
    const effectiveOuterH = outerH;

    // foto un pelín más alta para tapar el borde
    img.scale.set(photoW, photoH * 1.02, 1);
    mat.scale.set(matW, matH, 1);
    outer.scale.set(effectiveOuterW, effectiveOuterH, 1);

    // ❌ Ya no creamos / movemos placa 3D aquí
}

function addLightForFrame(frame) {
    const spot = new THREE.SpotLight(0xffffff, 2.2, 20, Math.PI / 3, 0.35, 1.0);
    spot.castShadow = false;

    const normal = new THREE.Vector3(0, 0, 1);
    normal.applyQuaternion(frame.quaternion);

    const targetPos = frame.position.clone();
    targetPos.addScaledVector(normal, -0.02);
    targetPos.y += 1;

    const target = new THREE.Object3D();
    target.position.copy(targetPos);
    scene.add(target);

    spot.position.copy(target.position);
    spot.position.addScaledVector(normal, 1.0);
    spot.position.y += 2;

    spot.target = target;
    scene.add(spot);
}

const frameY = 3.3;
const spacingShort = 7.5;
const longWallFrames = 3;

function addFramesShortWall(zPos, rotY) {
    const xs = [-spacingShort / 2, spacingShort / 2];
    xs.forEach(x => {
        const f = createFrame();
        f.position.set(x, frameY, zPos);
        f.rotation.y = rotY;
        scene.add(f);
        addLightForFrame(f);
    });
}

function addFramesLongWall(xPos, rotY) {
    const margin = 5.0;
    const usable = roomLength - margin * 2;
    const step = usable / (longWallFrames - 1);

    for (let i = 0; i < longWallFrames; i++) {
        const z = -usable / 2 + i * step;
        const f = createFrame();
        f.position.set(xPos, frameY, z);
        f.rotation.y = rotY;
        scene.add(f);
        addLightForFrame(f);
    }
}

// Paredes independientes
const collisionBoxes = [];
const standaloneDepth = 0.6;

function createStandaloneWall(width, height, x, z, rotationY = 0) {
    const geometry = new THREE.BoxGeometry(width, height, standaloneDepth);
    const wall = new THREE.Mesh(geometry, wallMaterial);
    wall.position.set(x, height / 2, z);
    wall.rotation.y = rotationY;
    wall.receiveShadow = true;
    scene.add(wall);

    const halfDepth = standaloneDepth / 2;
    collisionBoxes.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - halfDepth,
        maxZ: z + halfDepth
    });

    return wall;
}

function addFrameToWall(wall) {
    const normal = new THREE.Vector3(0, 0, 1);
    normal.applyQuaternion(wall.quaternion);
    const offset = standaloneDepth / 2 + 0.03;

    const frontFrame = createFrame();
    frontFrame.position.copy(wall.position);
    frontFrame.position.y = frameY;
    frontFrame.position.addScaledVector(normal, offset);
    frontFrame.quaternion.copy(wall.quaternion);
    scene.add(frontFrame);
    addLightForFrame(frontFrame);

    const backFrame = createFrame();
    backFrame.position.copy(wall.position);
    backFrame.position.y = frameY;
    backFrame.position.addScaledVector(normal, -offset);
    backFrame.quaternion.copy(wall.quaternion);
    backFrame.rotateY(Math.PI);
    scene.add(backFrame);
    addLightForFrame(backFrame);
}

const centerWallWidth = 7;

// 🏛️ LAYOUTS

function buildDefaultMuseum() {
    // Paredes perimetrales
    createWall(roomWidth, outerWallHeight, 0, outerWallHeight / 2, -roomLength / 2, 0);
    createWall(roomWidth, outerWallHeight, 0, outerWallHeight / 2, roomLength / 2, Math.PI);
    createWall(roomLength, outerWallHeight, -roomWidth / 2, outerWallHeight / 2, 0, Math.PI / 2);
    createWall(roomLength, outerWallHeight, roomWidth / 2, outerWallHeight / 2, 0, -Math.PI / 2);

    // Cuadros en paredes
    addFramesShortWall(-roomLength / 2 + 0.05, 0);
    addFramesShortWall(roomLength / 2 - 0.05, Math.PI);
    addFramesLongWall(-roomWidth / 2 + 0.05, Math.PI / 2);
    addFramesLongWall(roomWidth / 2 - 0.05, -Math.PI / 2);

    // Paredes centrales
    const centerWall1 = createStandaloneWall(centerWallWidth, baseWallHeight, 0, -6, 0);
    addFrameToWall(centerWall1);

    const centerWall3 = createStandaloneWall(centerWallWidth, baseWallHeight, 0, 6, 0);
    addFrameToWall(centerWall3);
}

function buildMuseum(layout) {
    console.log("🏛️ Layout activo:", layout);

    switch (layout) {
        case "default":
        default:
            buildDefaultMuseum();
            break;

        // En el futuro puedes agregar:
        // case "big":
        //     buildBigMuseum();
        //     break;
        // case "double":
        //     buildDoubleMuseum();
        //     break;
    }
}

// 📁 Cargar config.json desde ImageKit
function loadConfig() {
    const CONFIG_URL = `${museumFolderUrl}/config.json`;

    return fetch(CONFIG_URL)
        .then((res) => {
            if (!res.ok) {
                throw new Error(`No se pudo cargar ${CONFIG_URL}`);
            }
            return res.json();
        })
        .then((data) => {
            photoConfig = Array.isArray(data.photos) ? data.photos : [];
            activeLayout = data.layout || "default"; // 👈 lee el modelo de museo
        })
        .catch((err) => {
            console.error("Error cargando config del museo:", err);
            alert("Este museo no está disponible 😢");
        });
}

// ✅ CARGA DE FOTOS + TEXTOS desde config
function loadFramePhotos() {
    const count = Math.min(photoConfig.length, allFrames.length);

    for (let i = 0; i < count; i++) {
        const { image, caption } = photoConfig[i];
        const frame = allFrames[i];
        const captionText = caption || "";

        frame.userData.captionText = captionText;

        texLoader.load(
            image,
            (texture) => {
                applyTextureToFrame(frame, texture, captionText);
            },
            undefined,
            (err) => {
                console.error(`Error cargando ${image}:`, err);
            }
        );
    }
}

// Primero config, luego construimos el museo y luego fotos
requestAnimationFrame(() => {
    loadConfig().then(() => {
        buildMuseum(activeLayout);
        loadFramePhotos();
    });
});

// Controles
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener('click', () => controls.lock());

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') moveForward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') moveBackward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveLeft = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') moveRight = false;
});

// 📱 DETECCIÓN DE MÓVIL + CONTROLES TOUCH
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const rotateOverlay = document.getElementById('rotate-overlay');
const joystick = document.getElementById('joystick');
const joystickInner = document.getElementById('joystick-inner');

// 💬 Texto de instrucciones según dispositivo
const hintEl = document.querySelector('#info .hint');

if (isMobile) {
    hintEl.textContent = 'Usa el joystick para moverte · Toca y arrastra la pantalla para mirar alrededor';
} else {
    hintEl.textContent = 'Haz clic para entrar · WASD para moverte · Ratón para mirar';
}

// para rotar la vista con el dedo
let isDraggingView = false;
let lastTouchX = 0;
let lastTouchY = 0;
let viewPointerId = null;

// para el joystick
let joystickActive = false;
let joyCenterX = 0;
let joyCenterY = 0;
let joystickPointerId = null;

if (isMobile) {
    function checkOrientation() {
        if (window.innerHeight > window.innerWidth) {
            rotateOverlay.style.display = 'flex';
            joystick.style.display = 'none';
        } else {
            rotateOverlay.style.display = 'none';
            joystick.style.display = 'block';
        }
        setTimeout(checkOrientation, 150);
    }

    window.addEventListener('resize', checkOrientation);
    checkOrientation();

    // rotar cámara con el dedo
    document.addEventListener('pointerdown', (e) => {
        if (loaderOverlay && loaderOverlay.style.display !== 'none') {
            return;
        }

        const rectJoy = joystick.getBoundingClientRect();
        const insideJoy =
            e.clientX >= rectJoy.left &&
            e.clientX <= rectJoy.right &&
            e.clientY >= rectJoy.top &&
            e.clientY <= rectJoy.bottom;

        if (!insideJoy && viewPointerId === null) {
            isDraggingView = true;
            viewPointerId = e.pointerId;
            lastTouchX = e.clientX;
            lastTouchY = e.clientY;
        }
    });

    document.addEventListener('pointermove', (e) => {
        if (!isDraggingView || e.pointerId !== viewPointerId) return;

        const deltaX = e.clientX - lastTouchX;
        const deltaY = e.clientY - lastTouchY;

        camera.rotation.y -= deltaX * 0.003;
        camera.rotation.z = 0;

        camera.rotation.x -= deltaY * 0.0025;
        camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -1.2, 1.2);

        lastTouchX = e.clientX;
        lastTouchY = e.clientY;
    });

    document.addEventListener('pointerup', (e) => {
        if (e.pointerId === viewPointerId) {
            isDraggingView = false;
            viewPointerId = null;
        }
    });

    document.addEventListener('pointercancel', (e) => {
        if (e.pointerId === viewPointerId) {
            isDraggingView = false;
            viewPointerId = null;
        }
    });

    // 🎮 Joystick
    joystick.addEventListener('pointerdown', (e) => {
        e.preventDefault();

        if (joystickPointerId !== null) return;

        joystickActive = true;
        joystickPointerId = e.pointerId;

        const rect = joystick.getBoundingClientRect();
        joyCenterX = rect.left + rect.width / 2;
        joyCenterY = rect.top + rect.height / 2;

        // 🔊 arrancar música también al usar joystick
        if (!sound.isPlaying) {
            if (musicReady) {
                sound.play();
            } else {
                pendingPlay = true;
            }
        }
    });

    document.addEventListener('pointermove', (e) => {
        if (!joystickActive || e.pointerId !== joystickPointerId) return;

        const dx = e.clientX - joyCenterX;
        const dy = e.clientY - joyCenterY;

        const maxDist = 30;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const offsetX = Math.cos(angle) * clampedDist;
        const offsetY = Math.sin(angle) * clampedDist;

        joystickInner.style.left = 25 + offsetX + 'px';
        joystickInner.style.top = 25 + offsetY + 'px';

        moveForward  = (dy < -12);
        moveBackward = (dy >  12);
        moveRight    = (dx >  12);
        moveLeft     = (dx <  -12);
    });

    document.addEventListener('pointerup', (e) => {
        if (e.pointerId !== joystickPointerId) return;

        joystickActive = false;
        joystickPointerId = null;

        joystickInner.style.left = '25px';
        joystickInner.style.top = '25px';

        moveForward = moveBackward = moveLeft = moveRight = false;
    });

    document.addEventListener('pointercancel', (e) => {
        if (e.pointerId !== joystickPointerId) return;

        joystickActive = false;
        joystickPointerId = null;

        joystickInner.style.left = '25px';
        joystickInner.style.top = '25px';

        moveForward = moveBackward = moveLeft = moveRight = false;
    });
}

const speed = isMobile ? 3.5 : 10.0;

const clock = new THREE.Clock();
const wallBoundary = 0.5;

const mobileForwardVec = new THREE.Vector3();
const mobileStrafeVec  = new THREE.Vector3();

// 👁️ POPUP POR MIRADA + PROXIMIDAD
const POPUP_DISTANCE = 5.0; // distancia máxima para mostrar texto
const raycaster = new THREE.Raycaster();
const gazePopup = document.getElementById('gazePopup');

function updateGazePopup() {
    if (!gazePopup) return;

    // Ray desde el centro de la pantalla
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = raycaster.intersectObjects(allFrames, true);

    if (!hits.length) {
        gazePopup.style.display = 'none';
        return;
    }

    // Buscar el grupo "frame" al que pertenece
    let obj = hits[0].object;
    let frame = null;

    while (obj) {
        if (allFrames.includes(obj)) {
            frame = obj;
            break;
        }
        obj = obj.parent;
    }

    if (!frame) {
        gazePopup.style.display = 'none';
        return;
    }

    const dist = camera.position.distanceTo(frame.position);
    if (dist > POPUP_DISTANCE) {
        gazePopup.style.display = 'none';
        return;
    }

    const text = frame.userData.captionText || '';
    if (!text.trim()) {
        gazePopup.style.display = 'none';
        return;
    }

    gazePopup.textContent = text;
    gazePopup.style.display = 'block';
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls.isLocked === true || isMobile) {
        let forward = 0;
        let strafe = 0;

        if (moveForward) forward += speed * delta;
        if (moveBackward) forward -= speed * delta;
        if (moveLeft) strafe -= speed * delta;
        if (moveRight) strafe += speed * delta;

        if (forward !== 0 || strafe !== 0) {
            const oldX = camera.position.x;
            const oldZ = camera.position.z;

            if (isMobile) {
                camera.updateMatrixWorld(true);

                camera.getWorldDirection(mobileForwardVec);
                mobileForwardVec.y = 0;
                mobileForwardVec.normalize();

                mobileStrafeVec.set(
                    -mobileForwardVec.z,
                    0,
                    mobileForwardVec.x
                );

                camera.position.addScaledVector(mobileForwardVec, forward);
                camera.position.addScaledVector(mobileStrafeVec, strafe);
            } else {
                controls.moveForward(forward);
                controls.moveRight(strafe);
            }

            camera.position.x = THREE.MathUtils.clamp(
                camera.position.x,
                -roomWidth / 2 + wallBoundary,
                roomWidth / 2 - wallBoundary
            );
            camera.position.z = THREE.MathUtils.clamp(
                camera.position.z,
                -roomLength / 2 + wallBoundary,
                roomLength / 2 - wallBoundary
            );

            for (const box of collisionBoxes) {
                if (
                    camera.position.x > box.minX &&
                    camera.position.x < box.maxX &&
                    camera.position.z > box.minZ &&
                    camera.position.z < box.maxZ
                ) {
                    camera.position.x = oldX;
                    camera.position.z = oldZ;
                    break;
                }
            }
        }
    }

    // 👁️ actualizar popup en cada frame
    updateGazePopup();

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
