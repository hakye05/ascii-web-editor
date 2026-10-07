import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-bg-light text-text-light px-4">
      <div className="max-w-2xl w-full text-left space-y-6">

        {/* Header with Logo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">ASCII Web Editor</h1>
            <p className="text-text-grey text-sm flex flex-column">
              Made by Denis
              <img
                src="/favicon.svg"
                alt="Logo"
                className="w-5 h-5 object-contain ml-1.5"
              />
            </p>
          </div>
        </div>

        <div className="space-y-4 leading-relaxed text-sm">
          <p>
            A real-time image-to-ASCII converter and image editor built with React, TypeScript, and Vite. Inspired by <strong>Grainrad</strong>.
          </p>
          <p>
            By leveraging WebGPU compute and render shaders, this application offloads image adjustments, character density calculations, and grid rendering directly to the GPU to process ASCII editing at 60 FPS.
          </p>
        </div>

        {/* Features Summary */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-text-light">Key Features</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-grey">
            <li>Real-Time WebGPU Pipeline based editing tool.</li>
            <li>Live Editing through controls for character sets and color adjustments.</li>
            <li>High-resolution PNG/JPG canvas export or raw TXT output.</li>
          </ul>
        </div>

        {/* Navigation Action */}
        <div className="pt-4">
          <Link
            to="/"
            className="inline-block border border-border bg-bg-light hover:bg-zinc-900 hover:border-zinc-700 font-medium px-5 py-2.5 transition-colors text-sm"
          >
            ← Back to Editor
          </Link>
        </div>

      </div>
    </div>
  );
}

export default AboutPage