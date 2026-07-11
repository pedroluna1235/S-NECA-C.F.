import { cn } from '../lib/utils';

interface BadgeSelectorProps {
  label: string;
  options: string[];
  selectedOption: string | null;
  onChange: (option: string) => void;
}

export function BadgeSelector({ label, options, selectedOption, onChange }: BadgeSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider min-w-[200px]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedOption === option;
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95",
                isSelected
                  ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
