interface InputProps {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

const Input = ({ label, value, placeholder = "", onChange }: InputProps) => {
    return (
        <div className="flex gap-2 items-center text-xs">
            <span className="w-50 text-text-grey truncate" title={label}>
                {label}
            </span>

            <div className="flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-43 bg-bg-dark border border-border text-text-grey px-2 py-1 focus:outline-none focus:border-zinc-500"
                />
            </div>
        </div>
    );
}

export default Input