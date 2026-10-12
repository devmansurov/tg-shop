import { useNavigate } from 'react-router-dom';

/** On root screens the bar opens the search page; on the list page it edits the query in place. */
export function SearchBar({ value, onChange, autoFocus }: {
  value?: string;
  onChange?: (q: string) => void;
  autoFocus?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <label className="search">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.38A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/>
      </svg>
      <input
        type="search"
        enterKeyHint="search"
        placeholder="Модель, артикул или категория"
        value={value ?? ''}
        autoFocus={autoFocus}
        readOnly={!onChange}
        onFocus={() => !onChange && navigate('/list?search=1')}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}
