import { useState, type RefObject } from "react";
import { ZoomControls } from "./ui/ZoomControl";

interface PreviewProps {
  file: File | null;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export const Preview = ({ file, canvasRef }: PreviewProps) => {

  const [zoom, setZoom] = useState<number>(100);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 500));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="relative flex-1 h-full flex items-center justify-center overflow-hidden bg-black select-none min-w-0 p-4">
      {/* State Overlay */}
      {!file && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="h-11 flex items-center px-4 text-text-grey">
            <h1 className="text-l">Upload file from the sidebar</h1>
          </div>
        </div>
      )}

      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "center center",
        }}
        className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full block object-contain shadow-2xl"
        />
      </div>

      {/* Zoom UI Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetZoom}
      />
    </div>
  );
};