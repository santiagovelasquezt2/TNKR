/**
 * ================================================================================
 * TNKR - Interactive 3D Component Explorer
 * ================================================================================
 * FILE: src/VideoSection.js
 * PURPOSE: Video section component renderer
 * 
 * DESCRIPTION:
 * This module provides a function to render a grid of educational video cards
 * below the 3D viewer. Videos help users learn more about the system they're
 * exploring - for example, assembly instructions, maintenance tips, or
 * explanations of how individual components work.
 * 
 * The video section displays:
 * - A section title encouraging exploration
 * - A responsive grid of video cards (3 columns on desktop)
 * - Each card shows a thumbnail, play overlay, and title
 * - Clicking a card opens the video in a new tab
 * 
 * USAGE:
 * This function is called from viewer.js after the page loads:
 *   renderVideoSection('video-section', systemConfig.videos)
 * 
 * VIDEO DATA FORMAT:
 * Each video object should have:
 * - title: The video title displayed below the thumbnail
 * - thumbnail: URL to the thumbnail image
 * - url: URL to the video (opens in new tab when clicked)
 * 
 * STYLING:
 * See viewer.css for the video card styling (.video-section-title,
 * .video-grid, .video-card, .video-thumbnail, .play-overlay, .video-title)
 * 
 * AUTHOR: TNKR Development Team
 * ================================================================================
 */

/**
 * Render a grid of educational video cards.
 * 
 * If no videos are provided, the section is hidden entirely.
 * Otherwise, displays a YouTube-style grid of clickable video cards
 * with thumbnails and play button overlays.
 * 
 * @param {string} containerId - The ID of the container element (e.g., 'video-section')
 * @param {Array<{title: string, thumbnail: string, url: string}>|undefined} videos - Array of video objects
 * 
 * @example
 * // Render videos for a table system
 * renderVideoSection('video-section', [
 *   { title: 'Assembly Guide', thumbnail: '/img/assembly.jpg', url: 'https://youtube.com/...' },
 *   { title: 'Maintenance Tips', thumbnail: '/img/maintenance.jpg', url: 'https://youtube.com/...' }
 * ])
 */
export function renderVideoSection(containerId, videos) {
    // Get the container element from the DOM
    const container = document.getElementById(containerId)

    // Exit early if container doesn't exist
    if (!container) return

    // Hide section if no videos are provided
    if (!videos || videos.length === 0) {
        container.style.display = 'none'
        return
    }

    // Show the section and render the video grid
    container.style.display = 'block'

    /**
     * Generate the HTML content for the video section.
     * 
     * Structure:
     * - h2.video-section-title: Section heading
     * - div.video-grid: CSS Grid container for cards
     *   - a.video-card (for each video): Clickable card with thumbnail and title
     *     - div.video-thumbnail: Thumbnail image container
     *       - img: The thumbnail image
     *       - div.play-overlay: Play button icon (appears on hover)
     *     - h3.video-title: Video title text
     */
    container.innerHTML = `
        <h2 class="video-section-title">Explore how to TNKR......</h2>
        <div class="video-grid">
            ${videos.map(video => `
                <a href="${video.url}" class="video-card" target="_blank">
                    <div class="video-thumbnail">
                        <img src="${video.thumbnail}" alt="${video.title}">
                        <div class="play-overlay">
                            <i class="ph ph-play-circle"></i>
                        </div>
                    </div>
                    <h3 class="video-title">${video.title}</h3>
                </a>
            `).join('')}
        </div>
    `
}
