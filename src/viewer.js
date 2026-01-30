/**
 * ================================================================================
 * TNKR - Interactive 3D Component Explorer
 * ================================================================================
 * FILE: src/viewer.js
 * PURPOSE: Viewer page entry point and controller
 * 
 * DESCRIPTION:
 * This is the main JavaScript file for the TNKR viewer page (viewer.html).
 * It initializes the 3D viewer, loads the appropriate system model based on
 * URL parameters, populates the UI with system information, and sets up all
 * user interaction handlers (buttons, sliders, dropdowns, search).
 * 
 * RESPONSIBILITIES:
 * - Parse URL to determine which system to display
 * - Initialize the SystemViewer class for 3D rendering
 * - Load the correct 3D model based on system configuration
 * - Populate sidebar with system info and grouped component list
 * - Handle expand/collapse button clicks
 * - Handle explosion slider input
 * - Handle auto-rotation toggle
 * - Handle dropdown open/close
 * - Handle component search and filtering
 * 
 * DEPENDENCIES:
 * - ./viewer.css: Viewer page styles
 * - ./SystemViewer.js: Three.js-based 3D viewer class
 * - ./data/systems.js: System configurations (model paths, parts, etc.)
 * - ./VideoSection.js: Video section rendering component
 * 
 * URL PARAMETERS:
 * - system: ID of system to load (e.g., 'table', 'laptop', 'vehicle')
 * 
 * AUTHOR: TNKR Development Team
 * ================================================================================
 */

// Import viewer page styles (Vite bundles CSS with JS)
import './viewer.css'

// SystemViewer: The main class that handles 3D scene setup, rendering, and interaction
import { SystemViewer } from './SystemViewer.js'

// System configurations: Contains model paths, part definitions, expand offsets, etc.
import { systems } from './data/systems.js'

// VideoSection: Component that renders educational video cards
import { renderVideoSection } from './VideoSection.js'

/**
 * Global storage for grouped parts.
 * Used by search functionality to filter and re-render the parts list.
 * @type {Map<string, {displayName: string, ids: string[], description: string}>}
 */
let allGroups = new Map()

/**
 * Reference to the current SystemViewer instance.
 * Stored globally to allow access from event handlers.
 * @type {SystemViewer|null}
 */
let currentViewer = null

// ============================================================================
// CONSTANTS
// ============================================================================

/** Debounce delay for search input in milliseconds */
const SEARCH_DEBOUNCE_MS = 150

// ============================================================================
// CACHED DOM REFERENCES (set during initialization)
// ============================================================================

/** @type {HTMLElement|null} */
let partsListContainer = null

/** @type {number|null} Search debounce timer ID */
let searchDebounceTimer = null

/**
 * Main initialization - runs when DOM is fully loaded.
 * Sets up the entire viewer page including 3D canvas, UI controls, and event handlers.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // =========================================================================
    // 1. GET SYSTEM ID FROM URL
    // =========================================================================
    // Parse URL query parameters to find which system was requested
    const params = new URLSearchParams(window.location.search)
    const systemId = params.get('system')

    // Look up the system configuration from our data
    const systemConfig = systems[systemId]

    // If system not found, alert user and redirect to landing page
    if (!systemConfig) {
        alert('System not found!')
        window.location.href = '/'
        return
    }

    // =========================================================================
    // 2. UPDATE UI WITH SYSTEM INFORMATION
    // =========================================================================
    // Set the system title in the sidebar
    document.getElementById('sys-title').textContent = systemConfig.name

    // Set the system description (or default text if none provided)
    document.getElementById('sys-desc').textContent = systemConfig.description || 'Interactive 3D System'

    // Render the video section if videos are configured for this system
    renderVideoSection('video-section', systemConfig.videos)

    // =========================================================================
    // 3. INITIALIZE 3D VIEWER
    // =========================================================================
    // Get the canvas element where Three.js will render
    const canvas = document.getElementById('three-canvas')

    // Create a new SystemViewer instance - this sets up the 3D scene
    const viewer = new SystemViewer(canvas)
    currentViewer = viewer

    try {
        // Load the 3D model if a path is configured
        if (systemConfig.modelPath) {
            // loadModel is async - wait for it to complete
            await viewer.loadModel(systemConfig.modelPath, systemConfig)
            console.log('Model loaded successfully')

            // Generate the component list with similar parts grouped together
            // e.g., "Leg 1", "Leg 2", "Leg 3", "Leg 4" -> "Legs"
            allGroups = groupParts(systemConfig.parts || [])

            // Render the initial parts list in the sidebar
            renderFilteredPartsList(viewer, allGroups)
        } else {
            // No model path configured for this system (placeholder systems)
            console.warn('No model path for system:', systemId)
        }

    } catch (err) {
        // Handle model loading errors
        console.error('Error loading model:', err)
        document.getElementById('sys-desc').textContent = 'Error loading model: ' + err.message
    }

    // =========================================================================
    // 4. BIND EXPAND/COLLAPSE CONTROLS
    // =========================================================================
    const btnExpand = document.getElementById('btn-expand')
    const btnCollapse = document.getElementById('btn-collapse')
    const slider = document.getElementById('explosion-slider')

    /**
     * Exploded View Button Handler
     * Animates parts apart to show individual components
     */
    btnExpand.addEventListener('click', () => {
        slider.value = 100                          // Set slider to max
        viewer.expand()                             // Trigger expand animation
        btnExpand.classList.add('active')           // Highlight expand button
        btnCollapse.classList.remove('active')      // Un-highlight collapse button
    })

    /**
     * Assembled View Button Handler
     * Animates parts back together to show complete assembly
     */
    btnCollapse.addEventListener('click', () => {
        slider.value = 0                            // Set slider to min
        viewer.collapse()                           // Trigger collapse animation
        btnCollapse.classList.add('active')         // Highlight collapse button
        btnExpand.classList.remove('active')        // Un-highlight expand button
    })

    // =========================================================================
    // 5. EXPLOSION SLIDER CONTROL
    // =========================================================================
    /**
     * Explosion Slider Handler
     * Allows fine-grained control of how "exploded" the view is.
     * Value 0 = fully assembled, 100 = fully exploded
     */
    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        viewer.setExplosionAmount(value)

        // Update button active states based on slider position
        if (value === 0) {
            // Fully collapsed - highlight Assembled button
            btnCollapse.classList.add('active')
            btnExpand.classList.remove('active')
        } else if (value === 100) {
            // Fully expanded - highlight Exploded button
            btnExpand.classList.add('active')
            btnCollapse.classList.remove('active')
        } else {
            // In between - no button highlighted
            btnCollapse.classList.remove('active')
            btnExpand.classList.remove('active')
        }
    })

    // =========================================================================
    // 6. AUTO ROTATION TOGGLE
    // =========================================================================
    /**
     * Auto Rotation Checkbox Handler
     * Toggle continuous rotation of the 3D model
     */
    const btnAutoRotate = document.getElementById('btn-auto-rotate')
    btnAutoRotate.addEventListener('change', () => {
        viewer.setAutoRotate(btnAutoRotate.checked)
    })

    // =========================================================================
    // 7. DROPDOWN TOGGLES
    // =========================================================================
    // Set up Learn and Components dropdown accordions
    setupDropdown('learn-dropdown-btn', 'learn-content')
    setupDropdown('components-dropdown-btn', 'components-content')

    // =========================================================================
    // 8. SEARCH FUNCTIONALITY
    // =========================================================================
    /**
     * Component Search Input Handler
     * Uses debouncing to avoid excessive filtering while typing
     */
    const searchInput = document.getElementById('parts-search')
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim()

        // Clear previous debounce timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer)
        }

        // Debounce search to avoid filtering on every keystroke
        searchDebounceTimer = setTimeout(() => {
            filterAndRenderParts(viewer, query)
        }, SEARCH_DEBOUNCE_MS)
    })

    // =========================================================================
    // 9. HOW TO TNKR BUTTON (SCROLL TO VIDEO SECTION)
    // =========================================================================
    /**
     * How to TNKR Button Handler
     * Smooth scrolls the main content area to the video section
     */
    const howToTnkrBtn = document.getElementById('how-to-tnkr-btn')
    howToTnkrBtn.addEventListener('click', () => {
        const videoSection = document.getElementById('video-section')
        if (videoSection && videoSection.style.display !== 'none') {
            videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    })

    // =========================================================================
    // 10. BACK UP BUTTON (SCROLL BACK TO 3D VIEWER)
    // =========================================================================
    /**
     * Back Up Button Handler
     * Smooth scrolls back to the 3D viewer at the top of the page.
     * The button is rendered by VideoSection.js when videos are present.
     */
    const backUpBtn = document.getElementById('back-up-btn')
    if (backUpBtn) {
        backUpBtn.addEventListener('click', () => {
            const viewerContainer = document.getElementById('viewer-container')
            if (viewerContainer) {
                viewerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        })
    }
})

/**
 * Set up a dropdown accordion behavior.
 * 
 * When the button is clicked:
 * - All other dropdowns are closed
 * - This dropdown toggles open/closed
 * 
 * @param {string} btnId - ID of the dropdown header button
 * @param {string} contentId - ID of the dropdown content container
 */
function setupDropdown(btnId, contentId) {
    const btn = document.getElementById(btnId)
    const content = document.getElementById(contentId)

    btn.addEventListener('click', () => {
        const isOpen = btn.classList.contains('open')

        // Close all dropdowns first (accordion behavior)
        document.querySelectorAll('.dropdown-header').forEach(h => h.classList.remove('open'))
        document.querySelectorAll('.dropdown-content').forEach(c => c.classList.remove('open'))

        // Toggle this dropdown if it wasn't already open
        if (!isOpen) {
            btn.classList.add('open')
            content.classList.add('open')
        }
    })
}

/**
 * Group similar parts together.
 * 
 * This function takes an array of part definitions and groups them by base name.
 * For example, "Leg 1", "Leg 2", "Leg 3", "Leg 4" become a single "Legs" group.
 * 
 * Grouping algorithm:
 * 1. Remove trailing numbers from part names to get base name
 * 2. Group parts with the same base name
 * 3. Pluralize display name if group has multiple parts
 * 
 * @param {Array<{id: string, name: string, description: string}>} parts - Part definitions
 * @returns {Map<string, {displayName: string, ids: string[], description: string}>} Grouped parts
 */
function groupParts(parts) {
    const groups = new Map()

    parts.forEach(part => {
        // Extract base name by removing trailing numbers
        // e.g., "Leg 1" -> "Leg", "Long Apron 1" -> "Long Apron"
        const baseName = part.name.replace(/\s*\d+$/, '').trim()

        // Create group if it doesn't exist
        if (!groups.has(baseName)) {
            groups.set(baseName, {
                displayName: baseName,
                ids: [],
                description: part.description
            })
        }

        // Add this part's ID to the group
        groups.get(baseName).ids.push(part.id)
    })

    // Make display name plural if group has multiple items
    groups.forEach((group, key) => {
        if (group.ids.length > 1 && !key.endsWith('s')) {
            group.displayName = key + 's'
        }
    })

    return groups
}

/**
 * Calculate a search relevance score for a part name.
 * 
 * Scoring priority (highest to lowest):
 * 1. Exact match at start of name (100 points)
 * 2. Word starts with query (90-50 points, earlier words score higher)
 * 3. Contains query anywhere (50 points)
 * 4. Fuzzy match - all letters appear in order (20 points)
 * 5. No match (0 points)
 * 
 * @param {string} displayName - The name to search within
 * @param {string} query - The search query
 * @returns {number} Relevance score (higher is better match)
 */
function getSearchScore(displayName, query) {
    const name = displayName.toLowerCase()

    // Highest priority: exact match at start
    if (name.startsWith(query)) return 100

    // Word starts with query (check each word)
    const words = name.split(/\s+/)
    for (let i = 0; i < words.length; i++) {
        if (words[i].startsWith(query)) {
            return 90 - i * 10 // Earlier words rank higher
        }
    }

    // Contains query anywhere
    if (name.includes(query)) return 50

    // Fuzzy match - check if all query letters appear in order
    let queryIndex = 0
    for (let i = 0; i < name.length && queryIndex < query.length; i++) {
        if (name[i] === query[queryIndex]) {
            queryIndex++
        }
    }
    if (queryIndex === query.length) return 20

    // No match
    return 0
}

/**
 * Filter parts by search query and re-render the list.
 * 
 * If query is empty, shows all parts.
 * Otherwise, filters parts that match the query and sorts by relevance score.
 * 
 * @param {SystemViewer} viewer - The viewer instance (needed for click handlers)
 * @param {string} query - The search query (lowercase, trimmed)
 */
function filterAndRenderParts(viewer, query) {
    // If no query, show all parts
    if (!query) {
        renderFilteredPartsList(viewer, allGroups)
        return
    }

    // Filter and sort by relevance
    const filtered = new Map()
    const sortedEntries = []

    // Score each group
    allGroups.forEach((group, key) => {
        const score = getSearchScore(group.displayName, query)
        if (score > 0) {
            sortedEntries.push({ key, group, score })
        }
    })

    // Sort by score descending (best matches first)
    sortedEntries.sort((a, b) => b.score - a.score)

    // Build filtered map in sorted order
    sortedEntries.forEach(entry => {
        filtered.set(entry.key, entry.group)
    })

    // Render the filtered list
    renderFilteredPartsList(viewer, filtered)
}

/**
 * Render the parts list in the sidebar.
 * 
 * Creates a clickable list item for each part group.
 * When clicked, the part(s) are highlighted in the 3D viewer.
 * 
 * @param {SystemViewer} viewer - The viewer instance for highlighting parts
 * @param {Map<string, {displayName: string, ids: string[], description: string}>} groups - Part groups to display
 */
function renderFilteredPartsList(viewer, groups) {
    // Use cached container reference, or get it once
    if (!partsListContainer) {
        partsListContainer = document.getElementById('parts-list')
    }

    // Clear existing content
    partsListContainer.innerHTML = ''

    // Show placeholder if no parts found
    if (groups.size === 0) {
        partsListContainer.innerHTML = '<p class="dropdown-placeholder">No components found</p>'
        return
    }

    // Use DocumentFragment for batch DOM insertion (better performance)
    const fragment = document.createDocumentFragment()

    // Create a list item for each group
    groups.forEach((group, key) => {
        const el = document.createElement('div')
        el.className = 'part-item'

        // Store part IDs in data attribute for click handler
        el.dataset.partIds = JSON.stringify(group.ids)

        // Render the part name with a caret icon
        el.innerHTML = `
            <span class="part-name">${group.displayName}</span>
            <i class="ph ph-caret-right"></i>
        `

        /**
         * Click handler for part selection.
         * Toggles highlight on the associated 3D parts.
         */
        el.addEventListener('click', () => {
            const partIds = JSON.parse(el.dataset.partIds)
            const isSelected = el.classList.contains('selected')

            if (isSelected) {
                // Currently selected - unhighlight
                el.classList.remove('selected')
                viewer.unhighlightPart(partIds)
            } else {
                // Not selected - highlight
                el.classList.add('selected')
                viewer.highlightPart(partIds)
            }
        })

        fragment.appendChild(el)
    })

    // Single DOM operation to add all items
    partsListContainer.appendChild(fragment)
}
