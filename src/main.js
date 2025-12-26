/**
 * ================================================================================
 * TNKR - Interactive 3D Component Explorer
 * ================================================================================
 * FILE: src/main.js
 * PURPOSE: Landing page entry point and animation controller
 * 
 * DESCRIPTION:
 * This is the main JavaScript file for the TNKR landing page (index.html).
 * It initializes the page by animating the system selection cards on load
 * using GSAP for smooth, professional animations, and sets up click handlers
 * to navigate users to the 3D viewer page when they select a system.
 * 
 * FEATURES:
 * - Staggered fade-in animation for system cards on page load
 * - Click handlers for card selection and navigation
 * - Logs for debugging library versions
 * 
 * DEPENDENCIES:
 * - gsap: Animation library for smooth, professional UI animations
 * - three: Three.js library (imported here for version logging, used in viewer)
 * - ./style.css: Landing page styles
 * 
 * NAVIGATION FLOW:
 * User clicks card -> card becomes active -> navigate to /viewer.html?system={id}
 * 
 * AUTHOR: TNKR Development Team
 * ================================================================================
 */

// Import the landing page styles (Vite bundles CSS with JS)
import './style.css'

// GSAP: Professional animation library for smooth UI transitions
import gsap from 'gsap'

// Three.js: 3D rendering library (imported here to log version for debugging)
import * as THREE from 'three'

/**
 * Debug logging to verify dependencies are loaded correctly.
 * Useful for troubleshooting build or import issues.
 */
console.log('Three.js version:', THREE.REVISION)
console.log('GSAP loaded')

/**
 * Initialize the landing page.
 * 
 * This function sets up:
 * 1. Card entrance animations using GSAP
 * 2. Click event handlers for system selection
 * 
 * Called when the DOM is ready (either immediately or after DOMContentLoaded).
 */
const init = () => {
  // Get all system selection cards from the DOM
  const cards = document.querySelectorAll('.card')
  console.log('Found cards:', cards.length)

  /**
   * Animate cards on load with a staggered fade-in effect.
   * 
   * Animation details:
   * - Duration: 0.8 seconds per card
   * - Effect: Cards slide up from 50px below while fading in
   * - Stagger: 0.2 second delay between each card
   * - Easing: power3.out for natural deceleration
   * - Initial delay: 0.4 seconds to let page settle
   */
  gsap.to('.card', {
    duration: 0.8,           // Animation duration in seconds
    y: 0,                    // Final Y position (slides up to natural position)
    opacity: 1,              // Final opacity (fully visible)
    stagger: 0.2,            // Delay between each card's animation start
    ease: 'power3.out',      // Easing function for natural motion
    delay: 0.4,              // Initial delay before animation starts
    onComplete: () => {
      // Add visible class as fallback for CSS transitions
      // This ensures cards remain visible if GSAP somehow fails
      cards.forEach(card => card.classList.add('visible'))
    }
  })

  /**
   * Add click event handlers to each system card.
   * 
   * When a card is clicked:
   * 1. Remove 'active' class from all cards (deselect previous)
   * 2. Add 'active' class to clicked card (visual feedback)
   * 3. Navigate to the viewer page with the system ID as a URL parameter
   */
  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active state from all cards
      cards.forEach(c => c.classList.remove('active'))

      // Add active state to the clicked card
      card.classList.add('active')

      // Log for debugging
      console.log(`Selected system: ${card.dataset.system}`)

      // Navigate to the 3D viewer page with the system ID
      // Example: /viewer.html?system=table
      window.location.href = `/viewer.html?system=${card.dataset.system}`
    })
  })
}

/**
 * Run initialization when DOM is ready.
 * 
 * Handles two cases:
 * 1. If DOM is still loading, wait for DOMContentLoaded event
 * 2. If DOM is already loaded (e.g., script is deferred), run immediately
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  // DOM already loaded, run init immediately
  init()
}
