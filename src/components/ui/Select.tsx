interface OptionItem {
    label: string;
    value: string;
}

interface SelectProps {
    label: string;
    value: string;
    options: (string | OptionItem)[];
    onChange: (value: string) => void;
}

const Select = ({ label, value, options, onChange }: SelectProps) => {
    return (
        <div className="flex gap-2 items-center text-xs">
            <span className="w-50 text-text-grey truncate" title={label}>
                {label}
            </span>

            <select value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-70 bg-bg-dark border border-border text-text-grey px-2 py-1 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
                {options.map((opt) => {
                    const optionValue = typeof opt === "string" ? opt : opt.value;
                    const optionLabel = typeof opt === "string" ? opt : opt.label;

                    return (
                        <option key={optionValue} value={optionValue} className="bg-bg-dark text-text-grey">
                            {optionLabel}
                        </option>
                    );
                })}
            </select>
        </div>
    )
}

export default Select