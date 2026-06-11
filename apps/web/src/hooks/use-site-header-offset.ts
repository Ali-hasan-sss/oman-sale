'use client';

import { useEffect, useState } from 'react';

const SITE_HEADER_ID = 'site-header';
const STICKY_GAP = 16;

export function useSiteHeaderOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const header = document.getElementById(SITE_HEADER_ID);
    if (!header) return;

    const update = () => {
      setOffset(header.getBoundingClientRect().height + STICKY_GAP);
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(header);
    window.addEventListener('resize', update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return offset;
}
