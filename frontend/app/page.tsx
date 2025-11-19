"use client";

import React, { useState, useRef } from "react";

interface Slide {
  page: number;
  image_base64: string;
  text: string;
}

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    touchEndY.current = e.changedTouches[0].clientY;

    if (!touchStartY.current || !touchEndY.current) return;

    const delta = touchStartY.current - touchEndY.current;

    // Swipe Up → next slide
    if (delta > 50 && current < slides.length - 1) {
      setCurrent(current + 1);
    }

    // Swipe Down → previous slide
    if (delta < -50 && current > 0) {
      setCurrent(current - 1);
    }

    touchStartY.current = null;
    touchEndY.current = null;
  }

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
    >
      <div className="flex flex-col items-center justify-center transition-transform duration-300 ease-out">
        <img
          src={`data:image/png;base64,${slide.image_base64}`}
          className="max-h-[80vh] object-contain"
        />
        <p className="mt-4 text-center whitespace-pre-wrap text-sm px-4">
          {slide.text}
        </p>
      </div>

      <div className="absolute bottom-4 opacity-70 text-xs">
        Slide {current + 1} / {slides.length}
      </div>
    </div>
  );
}
