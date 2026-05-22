'use client';

interface PinKeypadProps {
  onPress: (value: string) => void;
  showAsterisk?: boolean;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function PinKeypad({ onPress, showAsterisk = false }: PinKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full px-4">
      {ROWS.flat().map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onPress(num)}
          className="h-16 rounded-2xl bg-gray-100 text-2xl font-medium text-gray-800 active:bg-gray-200 transition-colors"
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        onClick={() => showAsterisk && onPress('*')}
        className={`h-16 rounded-2xl text-2xl font-medium text-gray-800 transition-colors ${
          showAsterisk ? 'bg-gray-100 active:bg-gray-200' : 'bg-transparent cursor-default'
        }`}
      >
        {showAsterisk ? '*' : ''}
      </button>
      <button
        type="button"
        onClick={() => onPress('0')}
        className="h-16 rounded-2xl bg-gray-100 text-2xl font-medium text-gray-800 active:bg-gray-200 transition-colors"
      >
        0
      </button>
      <button
        type="button"
        onClick={() => onPress('backspace')}
        className="h-16 rounded-2xl bg-gray-100 text-2xl font-medium text-gray-800 active:bg-gray-200 transition-colors flex items-center justify-center"
      >
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
          <path
            d="M10.5 1H26C26.5523 1 27 1.44772 27 2V18C27 18.5523 26.5523 19 26 19H10.5L1 10L10.5 1Z"
            stroke="#374151"
            strokeWidth="1.5"
            fill="none"
          />
          <path d="M18 7L14 13M14 7L18 13" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
