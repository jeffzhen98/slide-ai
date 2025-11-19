"use client";

import React, { useState, useRef, useEffect } from "react";

interface Slide {
  page: number;
  image_base64: string;
  text: string;
}

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const edgeReached = useRef(false);

  const [narration, setNarration] = useState("");
  const [loadingNarration, setLoadingNarration] = useState(false);

  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      setSlides(data.slides);
      setCurrent(0);
    } else {
      alert("Upload failed: " + data.error);
    }
  }

  // auto-fetch narration whenever slide changes
//   useEffect(() => {
//     if (slides.length === 0) return;

//     const fetchNarration = async () => {
//       setLoadingNarration(true);
//       setNarration("");

//       const res = await fetch("/api/narrate", {
//         method: "POST",
//         body: JSON.stringify({ text: slides[current].text }),
//         headers: { "Content-Type": "application/json" }
//       });

//       const data = await res.json();
//       if (data.success) {
//         setNarration(data.narration);
//       } else {
//         setNarration("(Narration unavailable)");
//       }
//       setLoadingNarration(false);
//     };

//     fetchNarration();
//   }, [current, slides]);

  // mobile swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    touchEndY.current = e.changedTouches[0].clientY;
    if (touchStartY.current == null || touchEndY.current == null) return;

    const delta = touchStartY.current - touchEndY.current;

    if (delta > 50 && current < slides.length - 1) setCurrent(current + 1);
    if (delta < -50 && current > 0) setCurrent(current - 1);

    touchStartY.current = null;
    touchEndY.current = null;
  }

  // desktop scroll
  function handleWheel(e: React.WheelEvent) {
    const container = containerRef.current;
    if (!container) return;
  
    const now = Date.now();
    const cooldown = 600; // ms between slide changes
  
    // allow normal scrolling
    const atTop = container.scrollTop <= 0;
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight;
  
    // if not at an edge, do nothing (let user scroll normally)
    if (!atTop && !atBottom) {
      edgeReached.current = false; // reset
      return;
    }
  
    // reached an edge, but require a second scroll
    if (!edgeReached.current) {
      edgeReached.current = true;
      lastScrollTime.current = now;
      return; // don't change slide yet
    }
  
    // require cooldown AND second scroll
    if (now - lastScrollTime.current < cooldown) return;
  
    if (atBottom && e.deltaY > 0 && current < slides.length - 1) {
      setCurrent(current + 1);
    } else if (atTop && e.deltaY < 0 && current > 0) {
      setCurrent(current - 1);
    }
  
    edgeReached.current = false;
    lastScrollTime.current = now;
  }
  

  // upload screen
  if (slides.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <input type="file" accept="application/pdf" onChange={handleUpload} />
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-black text-white flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
        <div
        ref={containerRef}
        key={current}
        className="flex flex-col items-center justify-start transition-all duration-300 ease-out overflow-y-auto h-screen w-screen p-4"
        >

        <img
          src={`data:image/png;base64,${slide.image_base64}`}
          className="max-h-[70vh] object-contain rounded-lg"
        />

        <p className="mt-4 text-center whitespace-pre-wrap text-sm px-4">
          {slide.text}
        </p>

        <div className="mt-6 text-center text-sm opacity-80 px-4">
          {loadingNarration ? (
            <span>Generating narration...</span>
          ) : (
            <p>{narration}</p>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 opacity-70 text-xs">
        Slide {current + 1} / {slides.length}
      </div>
    </div>
  );
}
