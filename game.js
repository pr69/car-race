let scene, camera, renderer, road, car1, car2, coins = [], buildings = [];
let player1Score = 0, player2Score = 0;
let timeLeft = 180; // 3 minutes in seconds
let car1NormalSpeed = 0.1, car2NormalSpeed = 0.1;
let car1Speed = car1NormalSpeed, car2Speed = car2NormalSpeed;
let car1Boost = 0, car2Boost = 0;
let gameActive = false;
const keys = {};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Road
    const roadGeometry = new THREE.PlaneGeometry(10, 2000);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Cars
    const carGeometry = new THREE.BoxGeometry(0.5, 0.3, 1);
    const car1Material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const car2Material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    car1 = new THREE.Mesh(carGeometry, car1Material);
    car2 = new THREE.Mesh(carGeometry, car2Material);
    car1.position.set(-2, 0.15, 0);
    car2.position.set(2, 0.15, 0);
    scene.add(car1);
    scene.add(car2);

    // Finish line
    const finishLineGeometry = new THREE.PlaneGeometry(10, 2);
    const finishLineMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        map: new THREE.TextureLoader().load('https://i.imgur.com/GzVCeGz.png')
    });
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.z = -1000; // Place it at the end of the 2000-unit long road
    scene.add(finishLine);

    generateEnvironment();

    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);

    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
}

function generateEnvironment() {
    for (let z = -1000; z < 1000; z += 20) {
        createBuilding(-8, z);
        createBuilding(8, z);
        if (Math.random() < 0.2) {
            createCoin(Math.random() * 8 - 4, z);
        }
    }
}

function createBuilding(x, z) {
    const height = Math.random() * 5 + 2;
    const buildingGeometry = new THREE.BoxGeometry(2, height, 2);
    const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, height / 2, z);
    scene.add(building);
    buildings.push(building);
}

function createCoin(x, z) {
    const coinGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const coinMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(x, 0.2, z);
    scene.add(coin);
    coins.push(coin);
}

function updateGame() {
    if (!gameActive) return;

    // Move cars
    if (keys['ArrowUp']) car1.position.z -= car1Speed;
    if (keys['ArrowDown']) car1.position.z += car1Speed;
    if (keys['ArrowLeft']) car1.position.x -= 0.1;
    if (keys['ArrowRight']) car1.position.x += 0.1;

    if (keys['KeyW']) car2.position.z -= car2Speed;
    if (keys['KeyS']) car2.position.z += car2Speed;
    if (keys['KeyA']) car2.position.x -= 0.1;
    if (keys['KeyD']) car2.position.x += 0.1;

    // Keep cars on the road
    car1.position.x = Math.max(-4, Math.min(4, car1.position.x));
    car2.position.x = Math.max(-4, Math.min(4, car2.position.x));

    // Check car collision
    if (car1.position.distanceTo(car2.position) < 1) {
        // Simple collision response
        let temp = car1Speed;
        car1Speed = car2Speed;
        car2Speed = temp;
    }

    // Check collisions with coins
    coins.forEach((coin, index) => {
        if (car1.position.distanceTo(coin.position) < 0.5) {
            scene.remove(coin);
            coins.splice(index, 1);
            player1Score += 10;
            car1Speed = car1NormalSpeed * 1.75;  // Increase speed by 75%
            car1Boost = 15 * 60;  // Set boost timer to 15 seconds (60 frames per second)
        } else if (car2.position.distanceTo(coin.position) < 0.5) {
            scene.remove(coin);
            coins.splice(index, 1);
            player2Score += 10;
            car2Speed = car2NormalSpeed * 1.75;  // Increase speed by 75%
            car2Boost = 15 * 60;  // Set boost timer to 15 seconds (60 frames per second)
        }
    });

    // Update boosts
    if (car1Boost > 0) {
        car1Boost--;
        if (car1Boost === 0) car1Speed = car1NormalSpeed;  // Return speed to normal
    }
    if (car2Boost > 0) {
        car2Boost--;
        if (car2Boost === 0) car2Speed = car2NormalSpeed;  // Return speed to normal
    }

    // Update camera
    camera.position.z = (car1.position.z + car2.position.z) / 2 + 5;

    // Update HUD
    document.getElementById('player1Score').textContent = player1Score;
    document.getElementById('player2Score').textContent = player2Score;
    document.getElementById('timeLeft').textContent = formatTime(timeLeft);

    // Update time
    timeLeft -= 1 / 60;
    if (timeLeft <= 0) {
        endGame();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(updateGame);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startGame() {
    gameActive = true;
    document.getElementById('startScreen').classList.add('hidden');
    updateGame();
}

function endGame() {
    gameActive = false;
    const winner = player1Score > player2Score ? 'Player 1' : 'Player 2';
    document.getElementById('winnerText').textContent = `${winner} wins!`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function restartGame() {
    timeLeft = 180;
    player1Score = 0;
    player2Score = 0;
    car1.position.set(-2, 0.15, 0);
    car2.position.set(2, 0.15, 0);
    car1Speed = car1NormalSpeed;
    car2Speed = car2NormalSpeed;
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGame();
}

window.addEventListener('load', init);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});