export const systems = {
    table: {
        id: 'table',
        name: 'Table',
        description: 'Dining and workspace furniture system',
        modelPath: '/models/table.glb',
        cameraPosition: { x: 3, y: 3, z: 3 },
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
        // Configuration for the expand animation (direction/distance for each part)
        expandConfig: {
            'Table_Top': { y: 1 },
            'Table_Leg_1': { x: -1, z: -1 },
            'Table_Leg_2': { x: 1, z: -1 },
            'Table_Leg_3': { x: -1, z: 1 },
            'Table_Leg_4': { x: 1, z: 1 },
            'Table_Long_Apron_1': { z: -0.5 },
            'Table_Long_Apron_2': { z: 0.5 },
            'Table_Short_Apron_1': { x: -0.5 },
            'Table_Short_Apron_2': { x: 0.5 },
            'Table_Fabric_Towel_0': { y: 1.2 }
        }
    },
    // Placeholders for other systems
    laptop: { id: 'laptop', name: 'Laptop', modelPath: null },
    vehicle: { id: 'vehicle', name: 'Electric Vehicle', modelPath: null }
}
