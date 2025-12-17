import './viewer.css'
import { SystemViewer } from './SystemViewer.js'
import { systems } from './data/systems.js'

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get system ID from URL
    const params = new URLSearchParams(window.location.search)
    const systemId = params.get('system')

    const systemConfig = systems[systemId]

    if (!systemConfig) {
        alert('System not found!')
        window.location.href = '/'
        return
    }

    // 2. Update UI
    document.getElementById('sys-title').textContent = systemConfig.name
    document.getElementById('sys-desc').textContent = systemConfig.description || 'Interactive 3D System'

    // 3. Initialize Viewer
    const canvas = document.getElementById('three-canvas')
    const viewer = new SystemViewer(canvas)

    try {
        // Load model
        if (systemConfig.modelPath) {
            // Need absolute path from public or relative
            await viewer.loadModel(systemConfig.modelPath, systemConfig)
            console.log('Model loaded successfully')

            // Generate component list
            renderPartsList(viewer, systemConfig)
        } else {
            console.warn('No model path for system:', systemId)
        }

    } catch (err) {
        console.error('Error loading model:', err)
        document.getElementById('sys-desc').textContent = 'Error loading model: ' + err.message
    }

    // 4. Bind Controls
    const btnExpand = document.getElementById('btn-expand')
    const btnCollapse = document.getElementById('btn-collapse')

    btnExpand.addEventListener('click', () => {
        viewer.expand()
        btnExpand.classList.add('active')
        btnCollapse.classList.remove('active')
    })

    btnCollapse.addEventListener('click', () => {
        viewer.collapse()
        btnCollapse.classList.add('active')
        btnExpand.classList.remove('active')
    })
})

function renderPartsList(viewer, config) {
    const container = document.getElementById('parts-list')
    container.innerHTML = ''

    if (!config.parts) return

    config.parts.forEach(partDef => {
        const el = document.createElement('div')
        el.className = 'part-item'
        el.innerHTML = `
      <span class="part-name">${partDef.name}</span>
      <i class="ph ph-caret-right"></i>
    `

        el.addEventListener('click', () => {
            // Handle UI selection
            document.querySelectorAll('.part-item').forEach(i => i.classList.remove('selected'))
            el.classList.add('selected')

            // Update viewer
            viewer.highlightPart(partDef.id)

            // Optional: Show description in a future iteration
            // console.log(partDef.description)
        })

        container.appendChild(el)
    })
}
