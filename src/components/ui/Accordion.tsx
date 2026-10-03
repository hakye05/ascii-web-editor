import { useState, type ReactNode } from "react";

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const Accordion = ({ title, children, defaultOpen = false }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="px-4 overflow-hidden border-b border-border"> 
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[14px] font-medium text-text-light block mb-2.5"
      >
        {isOpen ? "−" : "+"} {title}
      </button>

      {/* Accordion Content Body */}
      {isOpen && (
        <div className="mt-2.5 mb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;