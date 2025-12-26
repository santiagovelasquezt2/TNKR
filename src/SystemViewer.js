/**
 * ================================================================================
 * TNKR - Interactive 3D Component Explorer
 * ================================================================================
 * FILE: src/SystemViewer.js
 * PURPOSE: Core 3D rendering engine and interaction handler
 * 
 * DESCRIPTION:
 * This is the heart of the TNKR application - a class that manages the entire
 * 3D viewing experience. It uses Three.js to create and render a 3D scene,
 * loads GLTF/GLB models, and provides methods for user interaction such as
 * expanding/collapsing the model, highlighting parts, and controlling the camera.
 * 
 * KEY RESPONSIBILITIES:
 * - Initialize Three.js scene with proper lighting, camera, and renderer
 * - Load GLTF/GLB 3D models and extract individual parts
 * - Implement exploded view animations using GSAP
 * - Handle part highlighting (from sidebar clicks and 3D clicks)
 * - Manage floating part labels that follow 3D objects
 * - Control auto-rotation behavior
 * - Handle window resize events
 * - Provide continuous render loop with animation updates
 * 
 * THREE.JS CONCEPTS USED:
 * - Scene: The container for all 3D objects
 * - PerspectiveCamera: Provides realistic perspective projection
 * - WebGLRenderer: Renders the scene using WebGL
 * - OrbitControls: Allows user to rotate, zoom, and pan the camera
 * - Raycaster: Detects which 3D object the user clicked on
 * - GLTFLoader: Loads .glb/.gltf 3D model files
 * 
 * DEPENDENCIES:
 * - three: Three.js core library for 3D rendering
 * - three/examples/jsm/loaders/GLTFLoader: Loads GLTF 3D models
 * - three/examples/jsm/controls/OrbitControls: Camera orbit controls
 * - gsap: Animation library for smooth expand/collapse animations
 * 
 * AUTHOR: TNKR Development Team
 * ================================================================================
 */

// Three.js core library - provides all 3D rendering capabilities
import * as THREE from 'three'

// GLTF Loader - loads .glb and .gltf 3D model files (industry standard format)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Orbit Controls - allows users to rotate, zoom, and pan the camera with mouse/touch
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// GSAP - professional animation library for smooth transitions
import gsap from 'gsap'

/**
 * SystemViewer Class
 * 
 * A comprehensive 3D viewer component for displaying and interacting with
 * system models. Handles all aspects of 3D rendering, model loading,
 * user interaction, and animations.
 * 
 * @example
 * const canvas = document.getElementById('three-canvas')
 * const viewer = new SystemViewer(canvas)
 * await viewer.loadModel('/models/table.glb', systemConfig)
 * viewer.expand()  // Show exploded view
 */
export class SystemViewer {
    /**
     * Create a new SystemViewer instance.
     * 
     * Initializes the Three.js scene with:
     * - Dark background matching the app theme
     * - Three-point lighting setup for professional look
     * - Perspective camera with auto-fit to model
     * - WebGL renderer with antialiasing
     * - Orbit controls for camera manipulation
     * 
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     */
    constructor(canvas) {
        /** @type {HTMLCanvasElement} The canvas element for WebGL rendering */
        this.canvas = canvas

        /** @type {THREE.Scene|null} The Three.js scene containing all 3D objects */
        this.scene = null

        /** @type {THREE.PerspectiveCamera|null} The camera for viewing the scene */
        this.camera = null

        /** @type {THREE.WebGLRenderer|null} The WebGL renderer */
        this.renderer = null

        /** @type {THREE.Object3D|null} The loaded 3D model */
        this.model = null

        /** 
         * @type {Map<string, THREE.Mesh>} 
         * Map of part name to its 3D mesh object for quick lookup
         */
        this.parts = new Map()

        /** 
         * @type {Map<string, THREE.Vector3>} 
         * Map of part name to its original position (for collapse animation)
         */
        this.originalPositions = new Map()

        /** @type {boolean} Whether the model is currently in exploded view */
        this.isExpanded = false

        /** @type {THREE.Mesh|null} Currently selected part (legacy, may be unused) */
        this.selectedPart = null

        /** 
         * @type {Set<string>} 
         * Set of part names that are currently highlighted (from 3D clicks)
         */
        this.highlightedParts = new Set()

        /** 
         * @type {Map<string, HTMLElement>} 
         * Map of part name to its label DOM element (floating above part)
         */
        this.partLabels = new Map()

        /** @type {THREE.Raycaster} Used to detect 3D object clicks */
        this.raycaster = new THREE.Raycaster()

        /** @type {THREE.Vector2} Normalized mouse coordinates for raycasting */
        this.mouse = new THREE.Vector2()

        /** @type {boolean} User's preference for auto-rotation (global toggle) */
        this.autoRotateEnabled = true

        // Initialize the 3D scene
        this.init()
    }

    /**
     * Initialize the Three.js scene, camera, renderer, controls, and event handlers.
     * 
     * This method sets up:
     * 1. Scene with dark background
     * 2. Three-point lighting (ambient + 2 directional lights)
     * 3. Perspective camera
     * 4. WebGL renderer with antialiasing and proper color handling
     * 5. Orbit controls with damping for smooth camera movement
     * 6. Event handlers for clicks, hover, and window resize
     * 7. Animation loop for continuous rendering
     * 
     * @private
     */
    init() {
        // =====================================================================
        // SCENE SETUP
        // =====================================================================
        // Create the scene - the container for all 3D objects
        this.scene = new THREE.Scene()

        // Set background color to match app's dark theme
        this.scene.background = new THREE.Color(0x0a0a0a)

        // =====================================================================
        // LIGHTING SETUP (Three-Point Lighting)
        // =====================================================================
        // Ambient light: Provides base illumination, softens shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        this.scene.add(ambientLight)

        // Main (key) light: Primary light source from front-right-top
        const dirLight = new THREE.DirectionalLight(0xffffff, 1)
        dirLight.position.set(5, 10, 7)
        this.scene.add(dirLight)

        // Back (rim) light: Creates edge highlights from behind
        const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
        backLight.position.set(-5, 5, -5)
        this.scene.add(backLight)

        // =====================================================================
        // CAMERA SETUP
        // =====================================================================
        // Calculate aspect ratio from canvas dimensions
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight

        // Create perspective camera with:
        // - 45° field of view (natural perspective)
        // - Near plane at 0.1 units (can see objects very close)
        // - Far plane at 1000 units (can see objects far away)
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)

        // =====================================================================
        // RENDERER SETUP
        // =====================================================================
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,   // Render to our canvas element
            antialias: true,       // Smooth edges
            alpha: true            // Support transparency
        })

        // Set initial size to match canvas
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight)

        // Limit pixel ratio for performance (retina displays can be 2-3x)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        // Use ACES Filmic tone mapping for cinematic look
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping

        // Use sRGB color space for correct color display
        this.renderer.outputColorSpace = THREE.SRGBColorSpace

        // =====================================================================
        // CONTROLS SETUP
        // =====================================================================
        // Orbit controls allow rotating, zooming, and panning the camera
        this.controls = new OrbitControls(this.camera, this.canvas)

        // Enable damping for smooth camera movement (momentum effect)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.05

        // Enable auto-rotation by default
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 1.0

        // Enable zoom for 3D interaction
        this.controls.enableZoom = true

        // =====================================================================
        // HOVER-BASED ZOOM TOGGLE
        // =====================================================================
        // Enable zoom when mouse enters canvas (for 3D interaction)
        this.canvas.addEventListener('mouseenter', () => {
            this.controls.enableZoom = true
        })

        // Disable zoom when mouse leaves canvas (allows page scrolling)
        this.canvas.addEventListener('mouseleave', () => {
            this.controls.enableZoom = false
        })

        // =====================================================================
        // CLICK HANDLER FOR PART SELECTION
        // =====================================================================
        // Bind click handler to detect and highlight clicked parts
        this.canvas.addEventListener('click', this.onCanvasClick.bind(this))

        // =====================================================================
        // RESIZE HANDLER
        // =====================================================================
        // Update camera and renderer when window size changes
        window.addEventListener('resize', this.onWindowResize.bind(this))

        // =====================================================================
        // START ANIMATION LOOP
        // =====================================================================
        // Begin continuous rendering
        this.animate()
    }

    /**
     * Handle click events on the 3D canvas.
     * 
     * Uses raycasting to determine which 3D object was clicked,
     * then toggles its highlight state.
     * 
     * @param {MouseEvent} event - The click event
     * @private
     */
    onCanvasClick(event) {
        // Allow clicking in any mode (assembled or exploded)

        // Calculate normalized device coordinates (-1 to +1)
        const rect = this.canvas.getBoundingClientRect()
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        // Cast a ray from the camera through the mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera)

        // Get all mesh objects to test for intersection
        const meshes = Array.from(this.parts.values())
        const intersects = this.raycaster.intersectObjects(meshes, false)

        // If we hit something, toggle its highlight
        if (intersects.length > 0) {
            const clickedPart = intersects[0].object
            this.togglePartHighlight(clickedPart)
        }
    }

    /**
     * Toggle the highlight state of a 3D part.
     * 
     * If the part is highlighted, unhighlight it.
     * If the part is not highlighted, highlight it.
     * Also manages the floating label above the part.
     * 
     * @param {THREE.Mesh} part - The 3D mesh to toggle
     * @private
     */
    togglePartHighlight(part) {
        const partName = part.name

        // Check if part is currently highlighted (from either 3D click or sidebar)
        const isHighlightedFrom3D = this.highlightedParts.has(partName)
        const isHighlightedFromSidebar = this.sidebarHighlightedParts?.has(partName)

        if (isHighlightedFrom3D || isHighlightedFromSidebar) {
            // ===== UNHIGHLIGHT =====
            // Restore original material
            if (part.userData.originalMaterial) {
                part.material = part.userData.originalMaterial
            }

            // Remove from highlighted tracking
            this.highlightedParts.delete(partName)

            // Remove floating label
            this.removePartLabel(partName)

            // Also clear from sidebar tracking if present
            if (this.sidebarHighlightedParts) {
                this.sidebarHighlightedParts.delete(partName)
            }

            // Update sidebar UI to show unhighlighted state
            this.syncSidebarSelection(partName, false)
        } else {
            // ===== HIGHLIGHT =====
            // Apply yellow emissive highlight
            this.applyHighlight(part)

            // Add to highlighted tracking
            this.highlightedParts.add(partName)

            // Create floating label above the part
            this.createPartLabel(partName)
        }
    }

    /**
     * Synchronize sidebar UI when parts are toggled via 3D click.
     * 
     * Finds any sidebar list items that contain the given part ID
     * and updates their selection state based on whether any parts
     * in that group are still highlighted.
     * 
     * @param {string} partId - The ID of the part that was toggled
     * @param {boolean} isSelected - Whether the part is now selected (unused, determined dynamically)
     * @private
     */
    syncSidebarSelection(partId, isSelected) {
        // Find all sidebar items that might contain this part
        document.querySelectorAll('.part-item').forEach(el => {
            try {
                const ids = JSON.parse(el.dataset.partIds || '[]')
                if (ids.includes(partId)) {
                    // Check if any parts in this group are still highlighted
                    const anyStillHighlighted = ids.some(id =>
                        this.highlightedParts.has(id) || this.sidebarHighlightedParts?.has(id)
                    )
                    if (!anyStillHighlighted) {
                        el.classList.remove('selected')
                    }
                }
            } catch (e) { /* Ignore parse errors */ }
        })
    }

    /**
     * Apply yellow highlight material to a part.
     * 
     * Creates a clone of the original material with yellow emissive glow
     * and applies it to the part. Stores the original material for later
     * restoration during unhighlight.
     * 
     * @param {THREE.Mesh} part - The mesh to highlight
     * @private
     */
    applyHighlight(part) {
        // Store original material if not already stored
        if (!part.userData.originalMaterial) {
            part.userData.originalMaterial = part.material.clone()
        }

        // Create highlighted version of the material
        const highlightMat = part.userData.originalMaterial.clone()
        highlightMat.emissive = new THREE.Color(0xffcc00) // Yellow glow
        highlightMat.emissiveIntensity = 0.15              // Subtle glow

        // Apply the highlight material
        part.material = highlightMat
    }

    /**
     * Unhighlight parts (called from sidebar unhighlight - legacy version).
     * 
     * @param {string|string[]} partIds - Single part ID or array of part IDs
     * @deprecated Use the second unhighlightPart method instead (duplicate exists below)
     * @private
     */
    unhighlightPart(partIds) {
        const ids = Array.isArray(partIds) ? partIds : [partIds]

        ids.forEach(partId => {
            const part = this.parts.get(partId)
            if (part && part.userData.originalMaterial) {
                part.material = part.userData.originalMaterial
            }
            if (this.sidebarHighlightedParts) {
                this.sidebarHighlightedParts.delete(partId)
            }
        })

        // Resume rotation if no parts highlighted
        // (Intentionally left empty - rotation control is handled elsewhere)
    }

    /**
     * Create a floating label above a highlighted part.
     * 
     * The label displays the part's human-readable name and follows
     * the part as the camera moves. The label is positioned in 2D
     * screen space but updated each frame to track the 3D object.
     * 
     * @param {string} partName - The internal name/ID of the part
     * @private
     */
    createPartLabel(partName) {
        // Find display name from system config (e.g., "Table_Leg_1" -> "Leg 1")
        let displayName = partName
        if (this.systemConfig?.parts) {
            const partDef = this.systemConfig.parts.find(p => p.id === partName)
            if (partDef) displayName = partDef.name
        }

        // Create label DOM element
        const label = document.createElement('div')
        label.className = 'part-label'
        label.textContent = displayName

        // Add to the viewer container (positioned absolutely)
        document.getElementById('viewer-container').appendChild(label)

        // Store reference for updating position and cleanup
        this.partLabels.set(partName, label)
    }

    /**
     * Remove a floating label from a part.
     * 
     * @param {string} partName - The name of the part whose label to remove
     * @private
     */
    removePartLabel(partName) {
        const label = this.partLabels.get(partName)
        if (label) {
            label.remove()                      // Remove from DOM
            this.partLabels.delete(partName)    // Remove from tracking map
        }
    }

    /**
     * Update the screen positions of all floating labels.
     * 
     * Called every frame to make labels follow their 3D parts
     * as the camera rotates/zooms. Projects 3D coordinates to
     * 2D screen coordinates.
     * 
     * @private
     */
    updateLabels() {
        this.partLabels.forEach((label, partName) => {
            const part = this.parts.get(partName)
            if (!part) return

            // Get the center of the part's bounding box in world space
            const box = new THREE.Box3().setFromObject(part)
            const center = box.getCenter(new THREE.Vector3())

            // Project 3D position to normalized device coordinates
            const screenPos = center.clone().project(this.camera)

            // Convert NDC (-1 to 1) to CSS pixels
            const x = (screenPos.x * 0.5 + 0.5) * this.canvas.clientWidth
            const y = (-screenPos.y * 0.5 + 0.5) * this.canvas.clientHeight

            // Hide label if part is behind camera
            if (screenPos.z > 1) {
                label.style.display = 'none'
            } else {
                label.style.display = 'block'
                label.style.left = x + 'px'
                label.style.top = y + 'px'
            }
        })
    }

    /**
     * Clear all highlighted parts and their labels.
     * 
     * Used when collapsing the model to clean up all highlights.
     * 
     * @private
     */
    clearAllHighlights() {
        this.highlightedParts.forEach(partName => {
            const part = this.parts.get(partName)
            if (part) this.unhighlightPart(part)
            this.removePartLabel(partName)
        })
        this.highlightedParts.clear()
    }

    /**
     * Load a GLTF/GLB 3D model.
     * 
     * This is the main method for loading system models. It:
     * 1. Loads the model file from the given path
     * 2. Centers the model in the scene
     * 3. Positions the camera to frame the model nicely
     * 4. Extracts individual parts for interaction
     * 5. Stores original positions for explode/collapse animations
     * 
     * @param {string} path - Path to the .glb or .gltf file
     * @param {Object} config - System configuration with parts, expandConfig, etc.
     * @returns {Promise<void>} Resolves when model is loaded
     */
    loadModel(path, config) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader()

            loader.load(path, (gltf) => {
                // ===== CLEANUP PREVIOUS MODEL =====
                if (this.model) this.scene.remove(this.model)

                // ===== STORE MODEL AND CONFIG =====
                this.model = gltf.scene
                this.systemConfig = config // Store for expand offsets and part names

                // ===== CENTER MODEL =====
                // Calculate bounding box to find model's center and size
                const box = new THREE.Box3().setFromObject(this.model)
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())

                // Move model so its center is at (0, 0, 0)
                this.model.position.x += (this.model.position.x - center.x)
                this.model.position.y += (this.model.position.y - center.y)
                this.model.position.z += (this.model.position.z - center.z)

                // Add model to scene
                this.scene.add(this.model)

                // ===== POSITION CAMERA =====
                // Calculate distance needed to fit model in view
                const maxDim = Math.max(size.x, size.y, size.z)
                const fov = this.camera.fov * (Math.PI / 180)
                let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2))
                cameraDistance *= 0.6 // Zoom in a bit closer

                // Position camera at an angle for better perspective
                this.camera.position.set(cameraDistance, cameraDistance * 0.7, cameraDistance)
                this.camera.lookAt(0, 0, 0)
                this.controls.target.set(0, 0, 0)
                this.controls.update()

                // Debug logging
                console.log('Model size:', size)
                console.log('Camera position:', this.camera.position)

                // ===== EXTRACT PARTS =====
                // Traverse the model tree and collect all mesh objects
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        // Store mesh by name for later lookup
                        this.parts.set(child.name, child)

                        // Store original position for collapse animation
                        this.originalPositions.set(child.name, child.position.clone())

                        // Optional: Enable shadows
                        // child.castShadow = true
                        // child.receiveShadow = true
                    }
                })

                resolve()
            }, undefined, reject) // undefined = no progress callback
        })
    }

    /**
     * Highlight parts from sidebar selection.
     * 
     * Called when user clicks a part in the sidebar list.
     * Supports multiple parts at once (for grouped parts like "Legs").
     * Also pauses auto-rotation while interacting.
     * 
     * @param {string|string[]} partIds - Single part ID or array of part IDs
     */
    highlightPart(partIds) {
        // Convert single ID to array for consistent handling
        const ids = Array.isArray(partIds) ? partIds : [partIds]

        ids.forEach(partId => {
            const part = this.parts.get(partId)
            if (part && part.material) {
                // Store original material if not already stored
                if (!part.userData.originalMaterial) {
                    part.userData.originalMaterial = part.material.clone()
                }

                // Create yellow highlight material
                const highlightMat = part.userData.originalMaterial.clone()
                highlightMat.emissive = new THREE.Color(0xffcc00) // Yellow
                highlightMat.emissiveIntensity = 0.15

                part.material = highlightMat

                // Track in sidebar highlighted set
                if (!this.sidebarHighlightedParts) {
                    this.sidebarHighlightedParts = new Set()
                }
                this.sidebarHighlightedParts.add(partId)

                // Create floating label for this part
                this.createPartLabel(partId)
            }
        })

        // Pause auto rotation when interacting with parts
        this.controls.autoRotate = false
    }

    /**
     * Unhighlight parts from sidebar selection.
     * 
     * Restores original material and removes floating labels.
     * Resumes auto-rotation if no parts are highlighted anywhere.
     * 
     * @param {string|string[]} partIds - Single part ID or array of part IDs
     */
    unhighlightPart(partIds) {
        const ids = Array.isArray(partIds) ? partIds : [partIds]

        ids.forEach(partId => {
            const part = this.parts.get(partId)
            if (part && part.userData.originalMaterial) {
                // Restore original material
                part.material = part.userData.originalMaterial
            }

            // Clear from sidebar tracking
            if (this.sidebarHighlightedParts) {
                this.sidebarHighlightedParts.delete(partId)
            }

            // Also clear from 3D click tracking
            this.highlightedParts.delete(partId)

            // Remove floating label
            this.removePartLabel(partId)
        })

        // Resume rotation if no parts are highlighted anywhere
        const noSidebarHighlights = !this.sidebarHighlightedParts || this.sidebarHighlightedParts.size === 0
        const no3DHighlights = this.highlightedParts.size === 0
        if (noSidebarHighlights && no3DHighlights) {
            this.controls.autoRotate = this.autoRotateEnabled
        }
    }

    /**
     * Clear all sidebar-initiated highlights.
     * 
     * @private
     */
    clearHighlight() {
        if (this.sidebarHighlightedParts) {
            this.sidebarHighlightedParts.forEach(partId => {
                const part = this.parts.get(partId)
                if (part && part.userData.originalMaterial) {
                    part.material = part.userData.originalMaterial
                }
            })
            this.sidebarHighlightedParts.clear()
        }
        this.selectedPart = null
        this.controls.autoRotate = this.autoRotateEnabled
    }

    /**
     * Set the explosion amount for the model.
     * 
     * This is used by the slider to smoothly transition between
     * assembled (0) and fully exploded (100) states.
     * 
     * @param {number} percent - Explosion percentage (0 = assembled, 100 = fully exploded)
     */
    setExplosionAmount(percent) {
        // Skip if no expand config defined
        if (!this.systemConfig?.expandConfig) return

        // Convert percentage to factor (0 to 1)
        const factor = percent / 100

        // Update expanded state flag
        this.isExpanded = percent > 0

        // Auto-rotation respects user's toggle preference at all positions
        this.controls.autoRotate = this.autoRotateEnabled

        // Move each part based on its configured offset scaled by factor
        this.parts.forEach((part, name) => {
            const offset = this.systemConfig.expandConfig[name]
            const originalPos = this.originalPositions.get(name)

            if (offset && originalPos) {
                // Calculate interpolated position
                const targetX = originalPos.x + (offset.x || 0) * factor
                const targetY = originalPos.y + (offset.y || 0) * factor
                const targetZ = originalPos.z + (offset.z || 0) * factor

                // Set position directly (no animation for slider)
                part.position.set(targetX, targetY, targetZ)
            }
        })

        // Clear highlights when returning to assembled state
        if (percent === 0) {
            this.clearAllHighlights()
        }
    }

    /**
     * Animate the model to fully exploded view.
     * 
     * Uses GSAP for smooth animations. Each part moves to its
     * exploded position based on the expandConfig in the system config.
     */
    expand() {
        // Skip if no expand config defined
        if (!this.systemConfig?.expandConfig) return

        this.isExpanded = true

        // Animate each part to its exploded position
        this.parts.forEach((part, name) => {
            const offset = this.systemConfig.expandConfig[name]
            const originalPos = this.originalPositions.get(name)

            if (offset && originalPos) {
                // Calculate final position
                const targetPos = originalPos.clone()
                if (offset.x) targetPos.x += offset.x
                if (offset.y) targetPos.y += offset.y
                if (offset.z) targetPos.z += offset.z

                // Animate with GSAP
                gsap.to(part.position, {
                    x: targetPos.x,
                    y: targetPos.y,
                    z: targetPos.z,
                    duration: 1,
                    ease: 'power2.out'    // Fast start, slow end
                })
            }
        })
    }

    /**
     * Animate the model to assembled (collapsed) view.
     * 
     * Uses GSAP to smoothly move all parts back to their original positions.
     * Also clears all highlights and labels.
     */
    collapse() {
        if (!this.isExpanded) return

        this.isExpanded = false
        this.controls.autoRotate = this.autoRotateEnabled

        // Clear all highlights when collapsing
        this.clearAllHighlights()

        // Animate each part back to original position
        this.parts.forEach((part, name) => {
            const originalPos = this.originalPositions.get(name)
            if (originalPos) {
                gsap.to(part.position, {
                    x: originalPos.x,
                    y: originalPos.y,
                    z: originalPos.z,
                    duration: 1,
                    ease: 'power2.inOut'  // Smooth start and end
                })
            }
        })
    }

    /**
     * Set the auto-rotation preference.
     * 
     * Called when user toggles the auto-rotation switch.
     * 
     * @param {boolean} enabled - Whether auto-rotation should be enabled
     */
    setAutoRotate(enabled) {
        this.autoRotateEnabled = enabled
        this.controls.autoRotate = enabled
    }

    /**
     * Handle window resize events.
     * 
     * Updates camera aspect ratio and renderer size to match
     * the new container dimensions.
     * 
     * @private
     */
    onWindowResize() {
        // Get container dimensions (parent of the canvas)
        const container = this.canvas.parentElement
        const width = container.clientWidth
        const height = container.clientHeight

        // Update camera aspect ratio
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        // Update renderer size
        this.renderer.setSize(width, height)
    }

    /**
     * Main animation loop.
     * 
     * Called every frame (~60fps) to:
     * 1. Update orbit controls (applies damping and auto-rotation)
     * 2. Update floating label positions
     * 3. Render the scene
     * 
     * @private
     */
    animate() {
        // Schedule next frame
        requestAnimationFrame(this.animate.bind(this))

        // Update controls (applies damping, auto-rotate, etc.)
        this.controls.update()

        // Update floating label positions to follow 3D parts
        this.updateLabels()

        // Render the scene from the camera's perspective
        this.renderer.render(this.scene, this.camera)
    }
}
