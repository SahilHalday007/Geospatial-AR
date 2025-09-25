// Game State
const gameState = {
    score: 0,
    maxTreasures: 5,
    treasures: [],
    isPlacing: true,
    trackerInitialized: false,
    treasuresPlaced: 0,
    hasPlaced: false
};

// Main variables
let renderer, camera, scene;
let tracker, trackerGroup;
let placementUI;

// Initialize the game
async function init() {
    console.log('Initializing Zappar Three.js...');
    showLoadingProgress(10);

    try {
        // Setup ThreeJS renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        document.body.appendChild(renderer.domElement);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        showLoadingProgress(30);

        // Setup Zappar camera
        camera = new ZapparThree.Camera();
        showLoadingProgress(40);

        // The Zappar library needs your WebGL context
        ZapparThree.glContextSet(renderer.getContext());
        showLoadingProgress(50);

        // Create a ThreeJS Scene and set its background to be the camera background texture
        scene = new THREE.Scene();
        scene.background = camera.backgroundTexture;
        showLoadingProgress(60);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(0, 5, 0);
        scene.add(directionalLight);
        showLoadingProgress(70);

        // Set up our instant tracker group
        tracker = new ZapparThree.InstantWorldTracker();
        trackerGroup = new ZapparThree.InstantWorldAnchorGroup(camera, tracker);
        scene.add(trackerGroup);
        showLoadingProgress(80);

        // Setup placement UI
        setupPlacementUI();
        showLoadingProgress(90);

        // Setup event listeners
        setupEventListeners();
        showLoadingProgress(95);

        // Request camera permission and start camera
        await requestCameraPermission();
        showLoadingProgress(100);

        // Start render loop
        renderer.setAnimationLoop(render);

        // Hide loading screen
        document.getElementById('loading-container').classList.add('hidden');

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize AR: ' + error.message);
    }
}

// Request camera permission - SIMPLIFIED VERSION
async function requestCameraPermission() {
    try {
        // Use a simpler permission approach
        const permission = await ZapparThree.permissionRequest();
        
        if (permission === "granted") {
            console.log("Camera permission granted");
            camera.start();
            return true;
        } else if (permission === "denied") {
            console.log("Camera permission denied");
            // Show manual permission UI
            showManualPermissionUI();
            return false;
        } else {
            // Show the permission UI
            return new Promise((resolve) => {
                ZapparThree.permissionRequestUI().then((granted) => {
                    if (granted) {
                        camera.start();
                        resolve(true);
                    } else {
                        ZapparThree.permissionDeniedUI();
                        showManualPermissionUI();
                        resolve(false);
                    }
                });
            });
        }
    } catch (error) {
        console.error("Permission error:", error);
        // Try direct camera start as fallback
        try {
            camera.start();
            return true;
        } catch (e) {
            showManualPermissionUI();
            return false;
        }
    }
}

// Show manual permission instructions
function showManualPermissionUI() {
    const loadingContainer = document.getElementById('loading-container');
    loadingContainer.innerHTML = `
        <h1>📷 Camera Permission Required</h1>
        <p>Please allow camera access to play the AR treasure hunt!</p>
        <p>1. Check your browser's permission settings</p>
        <p>2. Allow camera access for this site</p>
        <p>3. Refresh the page</p>
        <button onclick="location.reload()">Try Again</button>
    `;
}

// Setup placement UI
function setupPlacementUI() {
    placementUI = document.getElementById("zappar-placement-ui");
    
    // Show placement UI only after camera starts
    const checkCamera = setInterval(() => {
        if (camera && camera.backgroundTexture && camera.backgroundTexture.ready) {
            placementUI.classList.remove("hidden");
            document.getElementById('ui-overlay').classList.remove('hidden');
            document.getElementById('instructions').classList.remove('hidden');
            clearInterval(checkCamera);
        }
    }, 100);
    
    placementUI.addEventListener("click", () => {
        placementUI.classList.add("hidden");
        gameState.hasPlaced = true;
        gameState.trackerInitialized = true;
        document.getElementById('instruction-text').textContent = 
            'Anchor placed! Tap to position treasures around the room.';
    });
}

// Setup event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener("resize", () => {
        if (renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });

    // Tap to place treasures
    window.addEventListener("click", handleTap);
    
    // Prevent right-click menu
    window.addEventListener("contextmenu", (e) => e.preventDefault());
}

// Handle screen taps
function handleTap(event) {
    if (!gameState.hasPlaced || !gameState.trackerInitialized) return;
    
    if (gameState.isPlacing) {
        placeTreasure();
    }
}

// Place a new treasure
function placeTreasure() {
    if (gameState.treasuresPlaced >= gameState.maxTreasures) return;
    
    const treasureIndex = gameState.treasuresPlaced;
    
    // Create treasure geometry
    let geometry;
    let color;
    
    switch(treasureIndex % 5) {
        case 0: // Gold coin
            geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 32);
            color = 0xFFD700;
            break;
        case 1: // Ruby
            geometry = new THREE.OctahedronGeometry(0.15);
            color = 0xFF0000;
            break;
        case 2: // Emerald
            geometry = new THREE.DodecahedronGeometry(0.15);
            color = 0x00FF00;
            break;
        case 3: // Diamond
            geometry = new THREE.ConeGeometry(0.1, 0.3, 4);
            color = 0x00FFFF;
            break;
        case 4: // Crown
            geometry = new THREE.TorusGeometry(0.15, 0.05, 16, 100);
            color = 0xFFFFFF;
            break;
    }
    
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
    });
    
    const treasure = new THREE.Mesh(geometry, material);
    
    // Position treasure with some randomness
    const distance = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    treasure.position.set(x, 0.3, z);
    
    // Add floating animation data
    treasure.userData = {
        startY: treasure.position.y,
        time: 0,
        collected: false,
        index: treasureIndex
    };
    
    // Add treasure to tracker group
    trackerGroup.add(treasure);
    gameState.treasures.push(treasure);
    gameState.treasuresPlaced++;
    
    // Update UI
    updateUI();
    
    // Check if all treasures are placed
    if (gameState.treasuresPlaced >= gameState.maxTreasures) {
        startHuntPhase();
    }
}

// Start the hunting phase
function startHuntPhase() {
    gameState.isPlacing = false;
    document.getElementById('instruction-text').textContent = 
        'All treasures placed! Walk around to find them. They will collect automatically when you get close.';
    document.getElementById('game-phase').textContent = 'Hunt Phase';
}

// Check for treasure collection
function checkTreasureCollection() {
    if (gameState.isPlacing || !gameState.hasPlaced) return;
    
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    
    gameState.treasures.forEach((treasure, index) => {
        if (treasure.userData.collected) return;
        
        const treasurePosition = new THREE.Vector3();
        treasure.getWorldPosition(treasurePosition);
        
        const distance = cameraPosition.distanceTo(treasurePosition);
        
        // If treasure is close enough, collect it
        if (distance < 0.8) {
            collectTreasure(index);
        }
    });
}

// Collect a treasure
function collectTreasure(index) {
    const treasure = gameState.treasures[index];
    if (!treasure || treasure.userData.collected) return;
    
    treasure.userData.collected = true;
    gameState.score++;
    
    // Add collection animation
    const startTime = Date.now();
    const animateDisappear = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 500, 1);
        
        const currentScale = 1 - progress;
        treasure.scale.set(currentScale, currentScale, currentScale);
        
        if (progress < 1) {
            requestAnimationFrame(animateDisappear);
        } else {
            if (treasure.parent) {
                treasure.parent.remove(treasure);
            }
        }
    };
    
    animateDisappear();
    
    // Play sound effect
    playCollectSound();
    
    // Update UI
    updateUI();
    
    // Check win condition
    if (gameState.score >= gameState.maxTreasures) {
        endGame();
    }
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    
    if (gameState.isPlacing) {
        document.getElementById('game-phase').textContent = 
            `Placement: ${gameState.treasuresPlaced}/${gameState.maxTreasures}`;
    } else {
        document.getElementById('game-phase').textContent = 
            `Hunt: ${gameState.score}/${gameState.maxTreasures}`;
    }
}

// End game celebration
function endGame() {
    document.getElementById('instruction-text').innerHTML = 
        '<h2>🎉 CONGRATULATIONS! 🎉</h2>' +
        '<p>You found all the treasures!</p>' +
        '<button onclick="location.reload()">Play Again</button>';
    
    createCelebrationEffects();
}

// Create celebration effects
function createCelebrationEffects() {
    for (let i = 0; i < 20; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: Math.random() * 0xffffff 
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4 - 3
        );
        
        scene.add(particle);
        
        setTimeout(() => {
            if (particle.parent) {
                scene.remove(particle);
            }
        }, 2000);
    }
}

// Render loop
function render() {
    try {
        // Update camera frame
        if (camera && camera.start) {
            camera.updateFrame(renderer);
        }
        
        // Set anchor pose before placement
        if (!gameState.hasPlaced) {
            tracker.setAnchorPoseFromCameraOffset(0, 0, -5);
        }
        
        // Animate treasures
        gameState.treasures.forEach(treasure => {
            if (treasure.userData && !treasure.userData.collected) {
                treasure.userData.time += 0.02;
                treasure.position.y = treasure.userData.startY + Math.sin(treasure.userData.time) * 0.1;
                treasure.rotation.y += 0.01;
                
                // Add glow effect
                const pulse = Math.sin(treasure.userData.time * 2) * 0.1 + 0.9;
                treasure.scale.set(pulse, pulse, pulse);
            }
        });
        
        // Check for treasure collection
        checkTreasureCollection();
        
        // Render the scene
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    } catch (error) {
        console.error('Render error:', error);
    }
}

// Utility functions
function showLoadingProgress(percent) {
    const progressElement = document.getElementById('loading-progress');
    if (progressElement) {
        progressElement.textContent = `${percent}%`;
    }
}

function showError(message) {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.innerHTML = `
            <h1>❌ Error</h1>
            <p>${message}</p>
            <button onclick="location.reload()">Try Again</button>
        `;
    }
}

function playCollectSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = 800 + Math.random() * 400;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        // Silent fail if audio isn't supported
    }
}

// Debug function to check camera status
function checkCameraStatus() {
    console.log('Camera status:', {
        camera: camera,
        hasStart: !!camera.start,
        backgroundTexture: camera.backgroundTexture,
        textureReady: camera.backgroundTexture ? camera.backgroundTexture.ready : false
    });
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add debug button to check status
document.addEventListener('DOMContentLoaded', () => {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Camera';
    debugButton.style.position = 'absolute';
    debugButton.style.top = '10px';
    debugButton.style.left = '10px';
    debugButton.style.zIndex = '10000';
    debugButton.onclick = checkCameraStatus;
    document.body.appendChild(debugButton);
});