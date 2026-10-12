import { useEffect, useRef } from 'react';
import { mainButton, useSignal } from '@tma.js/sdk-react';

const ACCENT = '#01c2c3';

/**
 * Shows Telegram's native bottom button while the page is open.
 * Returns a fallback HTML button for the browser, where the native one does not exist.
 */
export function useMainButton(text: string | null, onClick: () => void, enabled = true) {
  // in dev the Telegram environment is mocked: the "native" button is mounted but invisible
  const native = useSignal(mainButton.isMounted) && !import.meta.env.DEV;
  const handler = useRef(onClick);
  handler.current = onClick;

  useEffect(() => {
    if (!native) return;
    if (text === null) {
      mainButton.setParams({ isVisible: false });
      return;
    }
    mainButton.setParams({
      text, isVisible: true, isEnabled: enabled,
      bgColor: enabled ? ACCENT : '#b8c2c2', textColor: '#ffffff',
    });
  }, [native, text, enabled]);

  useEffect(() => {
    if (!native) return;
    const off = mainButton.onClick(() => handler.current());
    return () => {
      off();
      mainButton.setParams({ isVisible: false });
    };
  }, [native]);

  if (native || text === null) return null;
  return (
    <div className="fallback-main">
      <button disabled={!enabled} onClick={() => handler.current()}>{text}</button>
    </div>
  );
}
