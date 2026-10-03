interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

export const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) => {
    return (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 select-none">
            {/* Zoom Controls Group */}
            <div className="flex items-center gap-1 bg-bg-light px-1 py-1 shadow-lg border border-border text-sm">
                <button
                    onClick={onZoomOut}
                    className="text-text-grey w-7 h-7 flex items-center justify-center hover:bg-neutral-700/50 hover:text-text-light transition-colors leading-none"
                    title="Zoom Out"
                >
                    -
                </button>
                <span className="text-text-light min-w-[3.5rem] text-center">
                    {Math.round(zoom)}%
                </span>
                <button
                    onClick={onZoomIn}
                    className="text-text-grey w-7 h-7 flex items-center justify-center hover:bg-neutral-700/50 transition-colors leading-none"
                    title="Zoom In"
                >
                    +
                </button>
            </div>

            {/* Reset Button */}
            <button
                onClick={onReset}
                className="bg-bg-light text-text-grey hover:text-text-light px-3 py-2 shadow-lg border border-border text-sm transition-colors hover:bg-neutral-700/50"
                title="Reset Zoom"
            >
                Reset
            </button>
        </div>
    );
};