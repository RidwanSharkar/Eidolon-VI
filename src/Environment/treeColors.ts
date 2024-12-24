export const trunkColors = [
  "#3b2616", // Dark brown
  "#4a3421", // Medium brown
  "#5c4033", // Chestnut
  "#654321", // Dark golden brown
  "#8b7355", // Wood brown
  "#d66a95", // Pink trunk
  "#ff69b4", // Hot pink trunk
];

export const leafColors = [
  "#228b22", // Forest green
  "#3a5f0b", // Dark olive green
  "#ff1493", // Deep pink
  "#ff69b4", // Hot pink
];

// Helper function to determine if a tree should be pink
export const shouldBePink = (index: number): boolean => {
  return index % 3 === 0; // Every third tree will be pink
};

// Helper function to get tree colors
export const getTreeColors = (index: number) => {
  if (shouldBePink(index)) {
    return {
      trunk: trunkColors[5 + Math.floor(Math.random() * 2)], // Random pink trunk
      leaves: leafColors[2 + Math.floor(Math.random() * 2)], // Random pink leaves
    };
  }
  return {
    trunk: trunkColors[Math.floor(Math.random() * 5)], // Random normal trunk
    leaves: leafColors[Math.floor(Math.random() * 2)], // Random normal leaves
  };
}; 