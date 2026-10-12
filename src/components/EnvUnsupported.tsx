const BOT = import.meta.env.VITE_BOT_USERNAME as string | undefined;

export function EnvUnsupported() {
  return (
    <div className="app light">
      <div className="empty">
        <h2>Откройте магазин в Telegram</h2>
        <p>Это мини-приложение Telegram: оно работает внутри Telegram на телефоне или компьютере.</p>
        {BOT && <p><a href={`https://t.me/${BOT}`}>Открыть @{BOT}</a></p>}
      </div>
    </div>
  );
}
