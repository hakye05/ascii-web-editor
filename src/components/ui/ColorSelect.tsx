interface ColorSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorSelect = ({ label, value, onChange }: ColorSelectProps) => {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-50 text-text-grey truncate" title={label}>
                {label}
            </span>

            {/* Color Cube & Input */}
            <div className="flex-1 flex items-center">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-7 h-7 bg-bg-light border border-border cursor-pointer appearance-none p-0 
                        [&::-webkit-color-swatch-wrapper]:p-0 
                        [&::-webkit-color-swatch]:border-none 
                        [&::-webkit-color-swatch]:rounded-none
                        [&::-moz-focus-inner]:p-0
                        [&::-moz-color-swatch]:border-none"
                />

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="-ml-px flex-1 h-7 w-36 bg-bg-dark border border-border text-text-grey px-2 uppercase focus:outline-none focus:border-zinc-500 select-text"
                />
            </div>
        </div>
    )
}

export default ColorSelect