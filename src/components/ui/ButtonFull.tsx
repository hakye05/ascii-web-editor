import React from "react";

interface ButtonFullProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}

const ButtonFull: React.FC<ButtonFullProps> = ({
    onClick,
    disabled = false,
    children
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full mt-2 py-2 border border-border bg-bg-light hover:bg-zinc-900 hover:border-zinc-700 disabled:bg-bg-dark disabled:text-text-grey disabled:border-zinc-900 text-text-light text-xs transition-colors cursor-pointer disabled:cursor-default"
        >
            {children}
        </button>
    );
};

export default ButtonFull