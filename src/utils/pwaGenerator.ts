export async function generatePWAIconsDevOnly() {
  // Check if we already did this in this session to prevent repeated requests
  if (sessionStorage.getItem('pwa_icons_generated_v1') === 'true') return;
  sessionStorage.setItem('pwa_icons_generated_v1', 'true');

  try {
    const response = await fetch('/icon.svg');
    if (!response.ok) return;
    const svgText = await response.text();

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = async () => {
      const sizes = [192, 512, 180];
      const dataUrls: { [key: string]: string } = {};

      for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(0,0,0,0)';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/png');
          if (size === 192) dataUrls.icon192 = dataUrl;
          if (size === 512) dataUrls.icon512 = dataUrl;
          if (size === 180) dataUrls.appleIcon = dataUrl;
        }
      }

      URL.revokeObjectURL(url);

      await fetch('/api/dev/save-icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataUrls),
      }).catch(() => {});
    };

    img.src = url;
  } catch (e) {
    console.warn('PWA Icon Auto-Generation deferred:', e);
  }
}
