import { useEffect, useState } from 'react';

function parseHash() {
  const hash = window.location.hash || '#/';
  if (!hash.startsWith('#/')) return '/';
  const path = hash.slice(1); // "/..."
  return path || '/';
}

export function navigate(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  window.location.hash = `#${normalized}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

