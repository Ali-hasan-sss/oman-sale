'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export type ShowcaseShot = {
  id: string;
  image: string;
  title: string;
  price: string;
  category: string;
  place: string;
  href: string;
};

type VertexShowcaseProps = {
  shots: ShowcaseShot[];
  preview: ShowcaseShot[];
  banner: { image: string; kicker: string; title: string; cta: string; href: string };
  announcement: string;
  sectionTitle: string;
  viewAll: string;
  viewAllHref: string;
  navLinks: string[];
  dir: 'rtl' | 'ltr';
};

/*
 * The ring is authored on a fixed 1172 x 657 design canvas and scaled by one factor k.
 * 37 cards sit on a cylinder of radius R = 891 whose camera is AT the ring centre
 * (perspective = R), so every card is tangent to the cylinder and faces the camera:
 * the slanted tops are perspective, not rotation. Cards beyond +-42deg are culled.
 */
const W = 1172;
const R = 891;
const COUNT = 37;
const STEP = 360 / COUNT;
const CULL = 42;
const SPEED = 1.9; // deg / s

export function VertexShowcase({
  shots,
  preview,
  banner,
  announcement,
  sectionTitle,
  viewAll,
  viewAllHref,
  navLinks,
  dir
}: VertexShowcaseProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const browserRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Scale: fill the width, but never let the cards get too small on phones.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const resize = () => {
      const width = wrap.clientWidth;
      const k = Math.min(Math.max(width / W, 0.6), 1.45);
      wrap.style.setProperty('--k', k.toFixed(4));
      const browser = browserRef.current;
      const inner = innerRef.current;
      if (browser && inner) {
        const designWidth = window.innerWidth <= 700 ? 520 : 842;
        browser.style.setProperty('--mk', (browser.clientWidth / designWidth).toFixed(4));
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Ring rotation loop.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let phase = -2;
    let last = 0;
    let frame = 0;

    const place = () => {
      for (let i = 0; i < COUNT; i += 1) {
        const el = cardRefs.current[i];
        if (!el) continue;
        // signed angle in -180..180
        const a = ((((i * STEP + phase) % 360) + 540) % 360) - 180;
        if (Math.abs(a) > CULL) {
          el.style.visibility = 'hidden';
          continue;
        }
        el.style.visibility = 'visible';
        const r = (a * Math.PI) / 180;
        const c = Math.cos(r);
        el.style.transform = `translate3d(${(R * Math.sin(r)).toFixed(2)}px,0,${(R * (1 - c)).toFixed(2)}px) rotateY(${(-a).toFixed(3)}deg)`;
        // edges dim, front bright
        el.style.filter = `brightness(${(0.84 + 0.5 * (1 / c - 1)).toFixed(3)})`;
      }
    };

    const tick = (t: number) => {
      const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      if (!reduce) phase -= SPEED * dt;
      place();
      frame = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      last = 0; // a backgrounded tab must not jump on return
    };

    place();
    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [shots.length]);


  return (
    <div ref={wrapRef} className="vx-showcase" aria-hidden={false}>
      <div className="vx-canvas" dir="ltr">
        <div className="vx-ring vx-in" style={{ ['--d' as string]: '700ms', ['--vx-from' as string]: '18px' }}>
          {shots.length > 0
            ? Array.from({ length: COUNT }, (_, i) => {
                const shot = shots[i % shots.length]!;
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    className="vx-card"
                    dir={dir}
                  >
                    <img
                      alt=""
                      src={shot.image}
                      loading="lazy"
                      onError={(event) => event.currentTarget.parentElement?.classList.add('broken')}
                    />
                    <div className="shade" />
                    {shot.category ? <span className="chip">{shot.category}</span> : null}
                    <div className="meta">
                      <b>{shot.title}</b>
                      {shot.price ? <s>{shot.price}</s> : null}
                      {shot.place ? <u>{shot.place}</u> : null}
                    </div>
                    <div className="edge" />
                  </div>
                );
              })
            : null}
        </div>
      </div>

      <div
        ref={browserRef}
        className="vx-browser vx-in"
        style={{ ['--d' as string]: '900ms', ['--vx-from' as string]: '26px' }}
      >
        <div ref={innerRef} className="vx-browser-inner">
          <div className="vx-bar" dir="ltr">
            <div className="dots">
              <i style={{ background: '#ee5c62' }} />
              <i style={{ background: '#f6b719' }} />
              <i style={{ background: '#12c02f' }} />
            </div>
            <div className="omni">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".72">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.8-3.8" />
              </svg>
              <span>omansale.om</span>
            </div>
            <div className="tools">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                <path d="M4 15v5h16v-5" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="#fff" opacity=".95" />
                <path d="M3 13l9 5 9-5" opacity=".55" />
              </svg>
            </div>
          </div>

          <div className="vx-page" dir={dir}>
            <div className="vx-ann">{announcement}</div>
            <div className="vx-pghead">
              <img src="/logo.png" alt="Oman Sale" />
              <nav>
                {navLinks.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </nav>
            </div>

            <Link href={banner.href} className="vx-pghero block" tabIndex={-1}>
              <img
                alt=""
                src={banner.image}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <div className="scrim" />
              <div className="copy">
                <u>{banner.kicker}</u>
                <em>{banner.title}</em>
                <i>{banner.cta}</i>
              </div>
            </Link>

            <div className="vx-pgsec">
              <b>{sectionTitle}</b>
              <Link href={viewAllHref} tabIndex={-1}>
                <u>{viewAll}</u>
              </Link>
            </div>
            <div className="vx-pggrid">
              {preview.map((shot) => (
                <Link key={shot.id} href={shot.href} className="vx-pgcard" tabIndex={-1}>
                  <div className="ph">
                    <img
                      alt={shot.title}
                      src={shot.image}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <b>{shot.title}</b>
                  <i>{shot.place}</i>
                  <s>{shot.price}</s>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
