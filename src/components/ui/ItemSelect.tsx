export interface ItemOption {
    label: string;
    subtitle?: string;
}

interface ItemSelectProps {
    label: string;
    value: string;
    options: (string | ItemOption)[];
    onChange: (value: string) => void;
}

const ItemSelect = ({ label, value, options, onChange }: ItemSelectProps) => {
    return (
        <div className="space-y-1.5 text-xs">
            <span className="text-text-grey block">{label}</span>
            <div className="grid grid-cols-2 gap-2">
                {options.map((opt) => {
                    const optValue = typeof opt === "string" ? opt : opt.label;
                    const optSubtitle = typeof opt === "object" ? opt.subtitle : undefined;

                    const targetValue = (optSubtitle ? optSubtitle.replace(/^\./, "") : optValue).toLowerCase();
                    const isSelected = value.toLowerCase() === targetValue;

                    return (
                        <button
                            key={optValue}
                            onClick={() => onChange(targetValue.toLowerCase())}
                            className={`px-3 py-2 border transition-colors flex flex-col items-start justify-center cursor-pointer ${isSelected
                                ? "bg-zinc-900 border-zinc-500 text-text-light"
                                : "border-border text-text-grey hover:border-zinc-700"
                                }`}
                        >
                            <span className="uppercase tracking-wide text-text-light">
                                {optValue}
                            </span>
                            <span className="text-text-grey">
                                {optSubtitle}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ItemSelect;