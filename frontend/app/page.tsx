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
  const [showMenu, setShowMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const isTransitioning = useRef(false);
  const lastScrollTime = useRef<number>(0);
  const touchStartY = useRef<number | null>(null);
  const accumulatedDelta = useRef(0);
  const scrollLocked = useRef(false); // NEW: prevent multiple slide jumps per gesture

  // Upload handler
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();

      if (data.success) {
        setTimeout(() => {
          setSlides(data.slides);
          setCurrent(0);
          setShowMenu(false);
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        alert("Upload failed: " + data.error);
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  // Reset to home
  function resetToHome() {
    setSlides([]);
    setCurrent(0);
    setShowMenu(false);
    setIsUploading(false);
    setUploadProgress(0);
    setFileName("");
  }

  // Handle slide transitions
  useEffect(() => {
    isTransitioning.current = true;
    accumulatedDelta.current = 0;
    const timer = setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [current]);

  // MOBILE SWIPE HANDLING
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchStartY.current == null) return;

    const delta = touchStartY.current - touchEndY;

    if (delta > 50 && current < slides.length - 1) {
      setCurrent(current + 1);
    } else if (delta < -50 && current > 0) {
      setCurrent(current - 1);
    }

    touchStartY.current = null;
  }

  // DESKTOP SCROLL HANDLING (fixed to avoid multi-slide skips)
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();

    // if we're in a transition, menu is open, or we're in cooldown, ignore scroll
    if (isTransitioning.current || showMenu || scrollLocked.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;

    if (timeSinceLastScroll > 200) {
      accumulatedDelta.current = 0;
    }

    accumulatedDelta.current += Math.abs(e.deltaY);
    lastScrollTime.current = now;

    const threshold = 100;

    if (accumulatedDelta.current >= threshold) {

        scrollLocked.current = true;
      
        if (e.deltaY > 0 && current < slides.length - 1) {
          setCurrent(current + 1);
        } else if (e.deltaY < 0 && current > 0) {
          setCurrent(current - 1);
        }
      
        accumulatedDelta.current = 0;
      
        setTimeout(() => {
          scrollLocked.current = false;
        }, 600);
      }
    }
      

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTransitioning.current || showMenu) return;
      
      if (e.key === "ArrowDown" && current < slides.length - 1) {
        setCurrent(current + 1);
      } else if (e.key === "ArrowUp" && current > 0) {
        setCurrent(current - 1);
      } else if (e.key === "Escape" && showMenu) {
        setShowMenu(false);
      }
    }

    if (slides.length > 0) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [current, slides.length, showMenu]);

  // UPLOAD SCREEN
  if (slides.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4a235a 50%, #581c87 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '32rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '3.75rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #d8b4fe, #f9a8d4, #d8b4fe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
            }}>
              Slide AI
            </h1>
            <p style={{ color: '#d1d5db', fontSize: '1.125rem' }}>
              Transform your PDFs into beautiful presentations
            </p>
          </div>

          {isUploading ? (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  animation: 'spin 2s linear infinite'
                }}>
                  ⏳
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#d1d5db',
                  marginBottom: '1rem',
                  wordBreak: 'break-word'
                }}>
                  Uploading: <strong>{fileName}</strong>
                </p>
                <div style={{
                  width: '100%',
                  height: '0.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {Math.round(uploadProgress)}% Complete
                </p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                <div style={{
                  padding: '1.25rem 3rem',
                  background: 'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
                  borderRadius: '1rem',
                  fontWeight: '600',
                  fontSize: '1.125rem',
                  boxShadow: '0 20px 25px -5px rgba(168, 85, 247, 0.3)',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  justifyContent: 'center'
                }}>
                  <span>📄</span>
                  Upload PDF
                </div>
              </label>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
              <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>Swipe</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⌨️</div>
              <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>Keyboard</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🖱️</div>
              <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>Scroll</div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #000000 100%)',
        color: 'white',
        overflow: 'hidden'
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Navigation Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4rem',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          ☰ Menu
        </button>

        <div style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          background: 'rgba(168, 85, 247, 0.2)',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem'
        }}>
          Slide AI
        </div>

        <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          {current + 1} / {slides.length}
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '28rem'
          }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              Menu
            </h2>
            
            <button
              onClick={resetToHome}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                border: 'none',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1.125rem',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
            >
              🏠 Upload New PDF
            </button>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#d8b4fe',
                marginBottom: '0.75rem'
              }}>
                Keyboard Shortcuts
              </h3>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span>Next Slide</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}>↓</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span>Previous Slide</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}>↑</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Close Menu</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}>ESC</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMenu(false)}
              style={{
                width: '100%',
                padding: '0.75rem 2rem',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '0.75rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Main slide container */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5vh 4vw'
      }}>
        <img
          key={current}
          src={`data:image/png;base64,${slide.image_base64}`}
          alt={`Slide ${slide.page}`}
          style={{
            maxWidth: '92vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
      </div>

      {/* Navigation arrows */}
      {current > 0 && (
        <button
          onClick={() => !isTransitioning.current && setCurrent(current - 1)}
          style={{
            position: 'absolute',
            left: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3.5rem',
            height: '3.5rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            opacity: 0,
            transition: 'all 0.2s',
            fontSize: '1.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          ‹
        </button>
      )}

      {current < slides.length - 1 && (
        <button
          onClick={() => !isTransitioning.current && setCurrent(current + 1)}
          style={{
            position: 'absolute',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3.5rem',
            height: '3.5rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            opacity: 0,
            transition: 'all 0.2s',
            fontSize: '1.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          ›
        </button>
      )}

      {/* Progress indicator */}
      <div style={{
        position: 'absolute',
        right: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem'
      }}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => !isTransitioning.current && setCurrent(idx)}
            style={{
              width: '0.5rem',
              height: idx === current ? '3.5rem' : '2rem',
              background: idx === current
                ? 'linear-gradient(to bottom, #a855f7, #ec4899)'
                : idx < current
                ? 'rgba(255,255,255,0.4)'
                : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: idx === current ? '0 0 20px rgba(168, 85, 247, 0.5)' : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}
