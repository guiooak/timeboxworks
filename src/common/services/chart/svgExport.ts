/**
 * Serialize an in-DOM <svg> (e.g. a rendered chart) to a base64 PNG data URL.
 * Used by the meeting report's "copy to clipboard" feature.
 */
export function svgElementToPngDataUrl(
  svg: SVGSVGElement,
  options: { background?: string; scale?: number } = {},
): Promise<string> {
  const { background = '#ffffff', scale = 2 } = options;
  const rect = svg.getBoundingClientRect();
  const width = rect.width || svg.clientWidth || 600;
  const height = rect.height || svg.clientHeight || 300;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG'));
    };
    image.src = url;
  });
}
