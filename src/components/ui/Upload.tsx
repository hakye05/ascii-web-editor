import { useEffect, useState } from "react";

interface UploadBoxProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  supportedFormats?: string[];
}

const Upload = ({ onFileSelect, file, supportedFormats = ["PNG", "JPEG", "JPG", "WEBP", "GIF", "MP4"] }: UploadBoxProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resolution, setResolution] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setResolution("");
      return;
    }

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        setResolution(`${img.width} × ${img.height}`);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        setResolution(`${video.videoWidth} × ${video.videoHeight}`);
        URL.revokeObjectURL(url);
      };
      video.src = url;
    } else {
      setResolution("Unknown");
      URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border border-dashed p-4 text-center transition-colors cursor-pointer relative ${
          isDragging ? "border-zinc-500" : "border-border hover:border-zinc-500"
        }`}
      >
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="space-y-1 pointer-events-none text-xs">
          <p className="text-text-grey">Click or drag & drop file</p>
          <p className="text-text-dark">{supportedFormats.join(", ")}</p>
        </div>
      </div>

      {/* File Details Display */}
      {file && (
        <div className="border border-border p-3 text-xs space-y-1.5 mt-4">
          <div className="flex justify-between items-center text-text-grey">
            <span>File Name:</span>
            <span className="truncate max-w-[140px] text-text-light" title={file.name}>{file.name}</span>
          </div>
          <div className="flex justify-between items-center text-text-grey">
            <span>Resolution:</span>
            <span className="text-text-light">{resolution || "Loading..."}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;