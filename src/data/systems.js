/**
 * ================================================================================
 * TNKR - Interactive 3D Component Explorer
 * ================================================================================
 * FILE: src/data/systems.js
 * PURPOSE: System configuration data
 * 
 * DESCRIPTION:
 * This file contains the configuration data for all available systems in the
 * TNKR application. Each system represents a real-world object that can be
 * explored in 3D, such as furniture, electronics, or vehicles.
 * 
 * A system configuration includes:
 * - Basic info: id, name, description
 * - Model path: URL to the GLTF/GLB 3D model file
 * - Camera settings: Initial camera position for optimal viewing
 * - Parts list: Array of component definitions with IDs, names, and descriptions
 * - Expand config: Animation offsets for exploded view (how far each part moves)
 * - Videos: Educational content related to the system
 * 
 * COORDINATE SYSTEM:
 * The expand config uses Three.js coordinates where:
 * - X axis: Left/Right (negative = left, positive = right)
 * - Y axis: Front/Back (negative = back, positive = front)
 * - Z axis: Up/Down (negative = down, positive = up)
 * 
 * ADDING NEW SYSTEMS:
 * 1. Create/obtain a GLTF/GLB model with named mesh parts
 * 2. Add a new key to the `systems` object below
 * 3. Define all required properties (see 'table' for a complete example)
 * 4. Add the model file to public/models/
 * 5. The new system will automatically appear on the landing page
 *    (requires adding a card in index.html)
 * 
 * PART NAMING CONVENTION:
 * Part IDs should match the mesh names in the 3D model file exactly.
 * Example: If Blender exports a mesh named "Table_Leg_1", the ID must be "Table_Leg_1"
 * 
 * AUTHOR: TNKR Development Team
 * ================================================================================
 */

/**
 * Systems configuration object.
 * 
 * Keys are system IDs (used in URL: ?system=table)
 * Values are full system configuration objects
 * 
 * @type {Object.<string, SystemConfig>}
 */
export const systems = {
    /**
     * Table System Configuration
     * 
     * A fully configured example showing a dining/workspace table.
     * Demonstrates all configuration options including parts list,
     * expand animations, and video content.
     */
    table: {
        /** Unique identifier for this system (used in URLs) */
        id: 'table',

        /** Human-readable name displayed in the UI */
        name: 'Table',

        /** Description shown in the sidebar */
        description: 'Dining and workspace furniture system',

        /** 
         * Path to the GLTF/GLB 3D model file
         * Relative to the public directory (served at root)
         */
        modelPath: '/models/table.glb',

        /** 
         * Default camera position (x, y, z)
         * Note: This may be overridden by auto-fit logic in SystemViewer
         */
        cameraPosition: { x: 3, y: 3, z: 3 },

        /**
         * Parts List
         * 
         * Defines all interactive components of the system.
         * Each part has:
         * - id: Must match the mesh name in the 3D model exactly
         * - name: Human-readable name shown in the parts list and label
         * - description: Tooltip/detail text explaining the part's function
         */
        parts: [
            { id: 'Table_Top', name: 'Table Top', description: 'The main surface used for placing objects.' },
            { id: 'Table_Leg_1', name: 'Leg 1', description: 'Support structure for the table.' },
            { id: 'Table_Leg_2', name: 'Leg 2', description: 'Support structure for the table.' },
            { id: 'Table_Leg_3', name: 'Leg 3', description: 'Support structure for the table.' },
            { id: 'Table_Leg_4', name: 'Leg 4', description: 'Support structure for the table.' },
            { id: 'Table_Long_Apron_1', name: 'Long Apron 1', description: 'Structural support frame underneath the table top.' },
            { id: 'Table_Long_Apron_2', name: 'Long Apron 2', description: 'Structural support frame underneath the table top.' },
            { id: 'Table_Short_Apron_1', name: 'Short Apron 1', description: 'Structural support frame underneath the table top.' },
            { id: 'Table_Short_Apron_2', name: 'Short Apron 2', description: 'Structural support frame underneath the table top.' },
            { id: 'Table_Fabric_Towel_0', name: 'Protective Felt', description: 'Protective layer for the table surface.' }
        ],

        /**
         * Expand Configuration
         * 
         * Defines how far each part moves in the exploded view.
         * Values are in model units (relative to original position).
         * 
         * Coordinate reference:
         * - x: positive = right, negative = left
         * - y: positive = front, negative = back  
         * - z: positive = up, negative = down
         * 
         * The slider interpolates between 0 (assembled) and these offsets (exploded).
         */
        expandConfig: {
            // Table top moves upward to reveal structure underneath
            'Table_Top': { z: 1 },

            // Legs move outward (away from center)
            'Table_Leg_1': { y: -1 },      // Back leg moves backward
            'Table_Leg_2': { y: 1 },       // Front leg moves forward
            'Table_Leg_3': { y: 1 },       // Front leg moves forward
            'Table_Leg_4': { y: -1 },      // Back leg moves backward

            // Aprons move sideways and slightly up to separate from legs
            'Table_Long_Apron_1': { x: 1, z: 0.5 },   // Right side
            'Table_Long_Apron_2': { x: -1, z: 0.5 },  // Left side
            'Table_Short_Apron_1': { y: -1, z: 0.5 }, // Back side
            'Table_Short_Apron_2': { y: 1, z: 0.5 },  // Front side

            // Note: There's a duplicate entry for short aprons above (legacy)
            'Table_Short_Apron_1': { y: -1, z: 0.5 },
            'Table_Short_Apron_2': { y: 1, z: 0.5 },

            // Protective felt moves down to separate from table top
            'Table_Fabric_Towel_0': { z: -1 }
        },

        /**
         * Educational Videos
         * 
         * Array of video links to display in the video section.
         * These could link to YouTube tutorials, product demos, etc.
         * 
         * Currently using placeholder images - replace with real content.
         */
        videos: [
            { title: 'Build a Simple Table', thumbnail: 'https://img.youtube.com/vi/kC8M1hAVNeA/maxresdefault.jpg', url: 'https://www.youtube.com/watch?v=kC8M1hAVNeA' },
            { title: 'Dining Table Build', thumbnail: 'https://img.youtube.com/vi/LtaW6dKSn-U/maxresdefault.jpg', url: 'https://www.youtube.com/watch?v=LtaW6dKSn-U' },
            { title: 'DIY Table Project', thumbnail: 'https://img.youtube.com/vi/sHCPpRrxC1U/maxresdefault.jpg', url: 'https://www.youtube.com/watch?v=sHCPpRrxC1U' }
        ]
    },

    /**
     * Laptop System Configuration (Placeholder)
     * 
     * A placeholder entry for a future laptop/computer system.
     * Currently has no model or full configuration.
     * 
     * TODO: Add GLTF model, parts list, and expand config
     */
    laptop: {
        id: 'laptop',
        name: 'Laptop',
        modelPath: null  // No model yet - will show error in viewer
    },

    /**
     * Electric Vehicle System Configuration (Placeholder)
     * 
     * A placeholder entry for a future EV system.
     * Currently has no model or full configuration.
     * 
     * TODO: Add GLTF model, parts list, and expand config
     */
    vehicle: {
        id: 'vehicle',
        name: 'Electric Vehicle',
        modelPath: null  // No model yet - will show error in viewer
    }
}
