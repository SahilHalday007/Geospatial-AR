let markerVisible = false
let popupShown = false
let arSystemReady = false

// Improved AR system initialization
document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene")

  // Wait for AR.js to be ready
  scene.addEventListener("renderstart", () => {
    console.log("[v0] AR scene render started")
    arSystemReady = true

    // Hide loading screen when AR is ready
    setTimeout(() => {
      const loading = document.getElementById("loading")
      if (loading) {
        loading.style.display = "none"
      }
    }, 1000)
  })

  // Handle AR.js errors
  scene.addEventListener("arjs-video-loaded", () => {
    console.log("[v0] AR video loaded successfully")
  })
})

// Declare AFRAME variable
const AFRAME = window.AFRAME

// Custom marker handler component
AFRAME.registerComponent("markerhandler", {
  init: function () {
    const marker = this.el

    // Marker found
    marker.addEventListener("markerFound", () => {
      console.log("[v0] Hiro marker detected!")
      markerVisible = true
      showInfoButton()
    })

    // Marker lost
    marker.addEventListener("markerLost", () => {
      console.log("[v0] Hiro marker lost")
      markerVisible = false
      hideInfoButton()
      hidePenguinInfo()
    })
  },
})

// Show info button when marker is detected
function showInfoButton() {
  const button = document.getElementById("info-button")
  const instructions = document.getElementById("instructions")

  button.classList.add("show")
  instructions.style.display = "none"
}

// Hide info button when marker is lost
function hideInfoButton() {
  const button = document.getElementById("info-button")
  const instructions = document.getElementById("instructions")

  button.classList.remove("show")
  if (!markerVisible) {
    instructions.style.display = "block"
  }
}

// Show penguin information popup
function showPenguinInfo() {
  const popup = document.getElementById("penguin-popup")
  popup.classList.add("show")
  popupShown = true
}

// Hide penguin information popup
function hidePenguinInfo() {
  const popup = document.getElementById("penguin-popup")
  popup.classList.remove("show")
  popupShown = false
}

// Improved camera access handling with better error messages
function initializeCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      })
      .then((stream) => {
        console.log("[v0] Camera access granted")
        // Stop the test stream
        stream.getTracks().forEach((track) => track.stop())
      })
      .catch((err) => {
        console.error("[v0] Camera access error:", err)
        const loading = document.getElementById("loading")
        if (loading) {
          loading.innerHTML = `
                    <h1>🐧 AR Penguin Explorer</h1>
                    <p style="color: #ff6b6b;">Camera access required for AR functionality</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem;">
                        Please allow camera access and refresh the page.<br>
                        Make sure you're using HTTPS or localhost.
                    </p>
                    <button onclick="window.location.reload()" style="
                        margin-top: 1rem; 
                        padding: 10px 20px; 
                        background: white; 
                        border: none; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-size: 1rem;
                    ">Retry</button>
                `
        }
      })
  } else {
    console.error("getUserMedia not supported")
    alert("Your browser does not support camera access. Please use a modern browser.")
  }
}

// Initialize camera on page load
window.addEventListener("load", initializeCamera)

// Handle orientation changes on mobile
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    window.location.reload()
  }, 500)
})
