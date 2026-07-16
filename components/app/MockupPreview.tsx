"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders generated mockup HTML in a sandboxed iframe (scripts blocked via an
 * empty sandbox attribute — the mockup is pure HTML/CSS). `thumbnail` scales a
 * fixed 1200px-wide render down to fit the container for card previews.
 */
export default function MockupPreview({
  html,
  thumbnail = false,
  className = "",
}: {
  html: string;
  thumbnail?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!thumbnail) return;
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1200);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [thumbnail]);

  if (thumbnail) {
    return (
      <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
        <iframe
          title="Website mockup preview"
          sandbox=""
          srcDoc={html}
          tabIndex={-1}
          className="mockup-frame pointer-events-none origin-top-left"
          style={{ width: 1200, height: 1600, transform: `scale(${scale})` }}
        />
      </div>
    );
  }

  return (
    <iframe
      title="Website mockup"
      sandbox=""
      srcDoc={html}
      className={`mockup-frame ${className}`}
    />
  );
}
