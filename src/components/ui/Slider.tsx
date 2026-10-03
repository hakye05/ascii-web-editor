interface SliderProps {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  decimals?: number;
  onChange: (value: number) => void;
}

const Slider = ({ label, value, defaultValue = 0, min, max, step = 1, unit = "", decimals = 0, onChange }: SliderProps) => {
  const formattedValue = value.toFixed(decimals);

  const isDefault = value === defaultValue;

  const handleReset = () => {
    onChange(defaultValue);
  };

  return (
    <div className="flex gap-2 items-center text-xs">
      <span className="w-50 text-text-grey truncate" title={label}>
        {label}
      </span>

      <span className="w-12 text-text-grey text-right">
        {formattedValue}{unit}
      </span>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 control-slider"
      />

      <button
        onClick={handleReset}
        className={`py-1 rounded transition-colors ${isDefault
            ? "text-text-dark/70"
            : "text-text-grey hover:text-text-grey cursor-pointer"
          }`}
        title={`Reset to ${formattedValue}${unit}`}
      >
        Reset
      </button>
    </div>
  )
}

export default Slider