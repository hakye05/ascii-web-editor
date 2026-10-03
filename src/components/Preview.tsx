import React, { useEffect, useRef, useState } from 'react';
import type { GridCache } from '../types/ascii';
import type { useEditorState } from '../hooks/useEditorState';
import { ZoomControls } from './ui/ZoomControl';
import { sampleImageGrid } from '../services/asciiConverter';
import { renderAsciiToCanvas } from '../services/asciiRenderer';

type EditorStatesType = ReturnType<typeof useEditorState>;

interface PreviewProps {
  file: File | null;
  charSets: Record<string, string>;
  editor: EditorStatesType;
}

export const Preview: React.FC<PreviewProps> = ({
  file,
  charSets,
  editor
}) => {
  const { bgColor, asciiSettings, adjustments } = editor;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridCacheRef = useRef<GridCache | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(100);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 500));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  // Load file
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      gridCacheRef.current = null;
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Image Sampling
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const cache = sampleImageGrid(img, asciiSettings, adjustments);
      if (!cache) return;

      gridCacheRef.current = cache;
      triggerRender();
    };

    img.onerror = () => {
      setError('Failed to load image file.');
    };
  }, [imageSrc, asciiSettings.scale, adjustments]);

  // Interactive Rendering Trigger
  const triggerRender = () => {
    const canvas = canvasRef.current;
    const cache = gridCacheRef.current;
    if (!canvas || !cache) return;

    renderAsciiToCanvas(canvas, cache, asciiSettings, adjustments, charSets);
  };

  useEffect(() => {
    triggerRender();
  }, [asciiSettings.spacing, asciiSettings.charSet, asciiSettings.customChar]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.backgroundColor = bgColor;
    }
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = bgColor;
    }
  }, [bgColor]);

  return (
    <div
      ref={containerRef}
      className="relative ml-85 w-[calc(100vw-21.25rem)] h-full flex items-center justify-center overflow-hidden p-4 select-none"
    >
      {!file ? (
        <div className="h-11 flex items-center px-4 text-text-grey">
          <h1 className="text-l">Upload file from the sidebar</h1>
        </div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <>
          <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
            <canvas
              ref={canvasRef}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
              className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-75"
            />
          </div>

          <ZoomControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetZoom}
          />
        </>
      )}
    </div>
  );
};