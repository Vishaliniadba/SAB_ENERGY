declare global {
  interface Window {
    L: any;
  }
}

export function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    // If script is already in the document, wait for load
    const existingScript = document.getElementById('leaflet-cdn-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      existingScript.addEventListener('error', (err) => reject(err));
      // In case it already finished loading
      if (window.L) resolve(window.L);
      return;
    }

    // Add Leaflet CSS
    if (!document.getElementById('leaflet-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    const script = document.createElement('script');
    script.id = 'leaflet-cdn-script';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

