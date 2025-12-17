import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

export class SystemViewer {
    constructor(canvas) {
        this.canvas = canvas
        this.scene = null
        this.camera = null
        this.renderer = null
        this.model = null
        this.parts = new Map() // Map of part name -> Object3D
        this.originalPositions = new Map() // Map of part name -> Vector3
        this.isExpanded = false
        this.selectedPart = null

        this.init()
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x0a0a0a) // Match dark theme

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        this.scene.add(ambientLight)

        const dirLight = new THREE.DirectionalLight(0xffffff, 1)
        dirLight.position.set(5, 10, 7)
        this.scene.add(dirLight)

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
        backLight.position.set(-5, 5, -5)
        this.scene.add(backLight)

        // Camera
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        })
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.outputColorSpace = THREE.SRGBColorSpace

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.05
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 2.0

        // Resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this))

        // Animation loop
        this.animate()
    }

    loadModel(path, config) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader()

            loader.load(path, (gltf) => {
                // cleanup previous model if any
                if (this.model) this.scene.remove(this.model)

                this.model = gltf.scene
                this.systemConfig = config // Store config for expand offsets

                // Center model
                const box = new THREE.Box3().setFromObject(this.model)
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())

                // Adjust model position to center it
                this.model.position.x += (this.model.position.x - center.x)
                this.model.position.y += (this.model.position.y - center.y)
                this.model.position.z += (this.model.position.z - center.z)

                this.scene.add(this.model)

                // Adjust camera to fit model
                const maxDim = Math.max(size.x, size.y, size.z)
                const fov = this.camera.fov * (Math.PI / 180)
                let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2))
                cameraDistance *= 1.5 // Add some padding

                this.camera.position.set(cameraDistance, cameraDistance * 0.7, cameraDistance)
                this.camera.lookAt(0, 0, 0)
                this.controls.target.set(0, 0, 0)
                this.controls.update()

                console.log('Model size:', size)
                console.log('Camera position:', this.camera.position)

                // Store parts and original positions
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        // Use the name from GLB or map it if necessary
                        // For now assuming GLB names match config IDs roughly or exactly
                        // Clean up name? e.g. "Table_Leg_1" might be "Table_Leg_1_Node" etc. 
                        // We'll store by name for now.
                        this.parts.set(child.name, child)
                        this.originalPositions.set(child.name, child.position.clone())

                        // Enable shadows if we want
                        // child.castShadow = true
                        // child.receiveShadow = true
                    }
                })

                resolve()
            }, undefined, reject)
        })
    }

    highlightPart(partId) {
        if (this.selectedPart) {
            // Reset previous highlight
            // Simple way: reset emissive if material allows, or just scale
            // For MVP let's use a simple scale or emissive flash if standard material
        }

        const part = this.parts.get(partId)
        if (part && part.material) {
            // Clone material to avoid affecting others sharing it
            if (!part.userData.originalMaterial) {
                part.userData.originalMaterial = part.material.clone()
            }

            // Create highlight material
            const highlightMat = part.userData.originalMaterial.clone()
            highlightMat.emissive = new THREE.Color(0x4444ff)
            highlightMat.emissiveIntensity = 0.5

            part.material = highlightMat
            this.selectedPart = part

            // Stop auto rotation when interacting
            this.controls.autoRotate = false
        }
    }

    clearHighlight() {
        if (this.selectedPart) {
            if (this.selectedPart.userData.originalMaterial) {
                this.selectedPart.material = this.selectedPart.userData.originalMaterial
            }
            this.selectedPart = null
            // Resume rotation if desired - or keep it static
            this.controls.autoRotate = true
        }
    }

    expand() {
        if (this.isExpanded || !this.systemConfig?.expandConfig) return

        this.isExpanded = true
        this.controls.autoRotate = false // Stop rotation for clarity

        // Animate each part
        this.parts.forEach((part, name) => {
            const offset = this.systemConfig.expandConfig[name]
            const originalPos = this.originalPositions.get(name)

            if (offset && originalPos) {
                const targetPos = originalPos.clone()
                if (offset.x) targetPos.x += offset.x
                if (offset.y) targetPos.y += offset.y
                if (offset.z) targetPos.z += offset.z

                gsap.to(part.position, {
                    x: targetPos.x,
                    y: targetPos.y,
                    z: targetPos.z,
                    duration: 1,
                    ease: 'power2.out'
                })
            }
        })
    }

    collapse() {
        if (!this.isExpanded) return

        this.isExpanded = false
        this.controls.autoRotate = true

        this.parts.forEach((part, name) => {
            const originalPos = this.originalPositions.get(name)
            if (originalPos) {
                gsap.to(part.position, {
                    x: originalPos.x,
                    y: originalPos.y,
                    z: originalPos.z,
                    duration: 1,
                    ease: 'power2.inOut'
                })
            }
        })
    }

    onWindowResize() {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight)
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this))
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
    }
}
