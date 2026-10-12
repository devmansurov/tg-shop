"""Create the shop bot through BotFather (from the owner's Telegram account) and attach the Mini App.

Usage: bot_setup.py <username> "<display name>" <mini app url>
The token goes to .env.bot (gitignored); an existing token there is reused."""
import asyncio
import json
import os
import pathlib
import re
import sys
import urllib.request

from telethon import TelegramClient
from telethon.tl.functions.account import UpdateStatusRequest

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENV = ROOT / '.env.bot'


def read_env(path):
    return dict(l.split('=', 1) for l in path.read_text().split() if '=' in l) if path.exists() else {}


# owner's Telegram API app and session: TG_API_ID, TG_API_HASH, TG_PHONE, TG_SESSION in .env.tg (gitignored)
TG = read_env(ROOT / '.env.tg')
TOKEN_RE = re.compile(r'(\d{8,}:[A-Za-z0-9_-]{30,})')


async def ask(client, bf, text, timeout=15.0):
    """Send one line to BotFather, return its concatenated reply."""
    sent = await client.send_message(bf, text)
    await client(UpdateStatusRequest(offline=True))
    loop = asyncio.get_event_loop()
    deadline, seen, last = loop.time() + timeout, [], None
    while loop.time() < deadline:
        await asyncio.sleep(0.7)
        msgs = [m async for m in client.iter_messages(bf, limit=10) if m.id > sent.id and not m.out]
        if len(msgs) > len(seen):
            seen, last = msgs, loop.time()
        elif last and loop.time() - last > 1.8:
            break
    return '\n'.join(m.text or '' for m in reversed(seen))


async def create(username, name):
    client = TelegramClient(TG['TG_SESSION'], int(TG['TG_API_ID']), TG['TG_API_HASH'])
    await client.start(phone=TG['TG_PHONE'])
    try:
        bf = await client.get_entity('@BotFather')
        await ask(client, bf, '/cancel')
        await ask(client, bf, '/newbot')
        await ask(client, bf, name)
        reply = await ask(client, bf, username)
        m = TOKEN_RE.search(reply)
        if not m:
            raise SystemExit(f'BotFather did not return a token: {reply[:300]}')
        return m.group(1)
    finally:
        await client(UpdateStatusRequest(offline=True))
        await client.disconnect()


def api(token, method, **params):
    req = urllib.request.Request(f'https://api.telegram.org/bot{token}/{method}',
                                 data=json.dumps(params).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        res = json.load(r)
    if not res.get('ok'):
        raise SystemExit(f'{method}: {res}')
    return res['result']


def main():
    username, name, url = sys.argv[1:4]
    token = read_env(ENV).get('BOT_TOKEN')
    if not token:
        token = asyncio.run(create(username, name))
        ENV.write_text(f'BOT_TOKEN={token}\nBOT_USERNAME={username}\n')
        os.chmod(ENV, 0o600)
        print('bot created, token saved to .env.bot')
    me = api(token, 'getMe')
    api(token, 'setChatMenuButton', menu_button={'type': 'web_app', 'text': 'Магазин', 'web_app': {'url': url}})
    api(token, 'setMyShortDescription', short_description='Каталог одежды, обуви и аксессуаров с корзиной.')
    api(token, 'setMyDescription', description=(
        'Магазин в Telegram: обувь, одежда, сумки, часы и аксессуары.\n\n'
        'Нажмите кнопку «Магазин» внизу, чтобы открыть каталог.'))
    print(f"@{me['username']} ready, menu button -> {url}")


if __name__ == '__main__':
    main()
