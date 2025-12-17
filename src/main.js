import './style.css'
import gsap from 'gsap'
import * as THREE from 'three'

// Simple check to ensure dependencies are loaded
console.log('Three.js version:', THREE.REVISION)
console.log('GSAP loaded')

// Wait for DOM to be ready
const init = () => {
  const cards = document.querySelectorAll('.card')
  console.log('Found cards:', cards.length)

  // Animate cards on load
  gsap.to('.card', {
    duration: 0.8,
    y: 0,
    opacity: 1,
    stagger: 0.2,
    ease: 'power3.out',
    delay: 0.4,
    onComplete: () => {
      // Add visible class as fallback
      cards.forEach(card => card.classList.add('visible'))
    }
  })

  // Add click handlers
  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active from all
      cards.forEach(c => c.classList.remove('active'))
      // Add active to clicked
      card.classList.add('active')
      console.log(`Selected system: ${card.dataset.system}`)

      // Navigate to 3D view
      window.location.href = `/viewer.html?system=${card.dataset.system}`
    })
  })
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  // DOM already loaded
  init()
}
