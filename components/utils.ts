/// Find if color is considered dark
export const isDarkColor = (color: string) => {
    const rgb = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    console.log('brightness', brightness);
    return brightness < 50;
};

// Brighten color by 25%
export const brightenColor = (color: string) => {
    const rgb = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
    return `#${(rgb[0] + 20).toString(16)}${(rgb[1] + 50).toString(16)}${(rgb[2] + 50).toString(16)}`;
};

// Darken color by 25%
export const darkenColor = (color: string) => {
    const rgb = color.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) || [0, 0, 0];
    return `#${(rgb[0] - 50).toString(16)}${(rgb[1] - 50).toString(16)}${(rgb[2] - 50).toString(16)}`;
};