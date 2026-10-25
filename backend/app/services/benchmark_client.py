"""Backend-only Data reads, bounded cache and explicit stale/error semantics."""
import hashlib
import json
import math
import os
import tempfile
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import httpx

from app.config import get_settings

DEFINITIONS = {
    'sp500': ('^GSPC', 'USD', '标普 500'),
    'btc': ('BTCUSDT', 'USDT', 'BTC / USDT'),
    'sse_composite': ('000001.SS', 'CNY', '上证指数'),
    'nasdaq100': ('^NDX', 'USD', '纳斯达克 100'),
    'gold': ('GC=F', 'USD', '黄金期货'),
}


class BenchmarkUnavailable(Exception):
    pass


def parse_ids(raw):
    ids = raw.split(',')
    if not ids or len(ids) > len(DEFINITIONS) or len(set(ids)) != len(ids) or any(i not in DEFINITIONS for i in ids):
        raise ValueError(f'请选择 1 至 {len(DEFINITIONS)} 个不同的有效基准')
    return ids


def validate_history(payload, ids, start, end):
    if not isinstance(payload, dict) or payload.get('start') != str(start) or payload.get('end') != str(end):
        raise ValueError('Invalid coverage')
    items = payload.get('items', [])
    if not isinstance(payload.get('catalog_version'), str) or not payload['catalog_version']:
        raise ValueError('Missing catalog version')
    if not isinstance(items, list) or any(not isinstance(i, dict) for i in items) or len(items) != len(ids) or {i.get('id') for i in items} != set(ids):
        raise ValueError('Incomplete benchmark response')
    for item in items:
        asset, currency, _ = DEFINITIONS[item['id']]
        if item.get('asset_id') != asset or item.get('currency') != currency:
            raise ValueError('Unexpected benchmark mapping')
        if any(not isinstance(item.get(key), str) or not item[key] for key in ('name', 'source', 'return_type')):
            raise ValueError('Missing benchmark metadata')
        expected = item.get('expected_dates', [])
        if expected != sorted(set(expected)) or len(expected) > 8000:
            raise ValueError('Invalid calendar')
        for day in expected:
            if not start-timedelta(days=366) <= date.fromisoformat(day) <= end:
                raise ValueError('Invalid session range')
        if sum(day < str(start) for day in expected) > 1:
            raise ValueError('Too many predecessor sessions')
        rows = item.get('points', [])
        days = [r['date'] for r in rows]
        if days != sorted(set(days)) or not set(days).issubset(expected):
            raise ValueError('Invalid price dates')
        for row in rows:
            if row.get('is_final') is not True or not row.get('updated_at'):
                raise ValueError('Unconfirmed price')
            datetime.fromisoformat(row['updated_at'].replace('Z', '+00:00'))
            if type(row['close']) not in (float, int) or not math.isfinite(row['close']) or row['close'] <= 0:
                raise ValueError('Invalid price')
        if item.get('missing_dates', []) != [d for d in expected if d not in set(days)]:
            raise ValueError('Incomplete coverage metadata')
    return payload


class BenchmarkClient:
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.lock = threading.Lock()
        self.entries = {}
        self.binding = hashlib.sha256((self.settings.DATA_TERMINAL_API_URL + self.settings.DATA_TERMINAL_API_KEY).encode()).hexdigest()
        self.path = Path(self.settings.BENCHMARK_CACHE_PATH)
        try:
            stored = json.loads(self.path.read_text())
            if stored['binding'] == self.binding:
                self.entries = dict(list(stored['entries'].items())[-32:])
                for entry in self.entries.values():
                    entry['retry_at'] = 0
        except (OSError, ValueError, TypeError, KeyError, AttributeError):
            self.entries = {}

    def _persist(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix='.benchmarks-', dir=self.path.parent)
        try:
            with os.fdopen(fd, 'w') as output:
                json.dump({'binding': self.binding, 'entries': self.entries}, output, allow_nan=False)
            os.replace(temporary, self.path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    def history(self, ids, start, end):
        key = ','.join(sorted(ids)) + ':' + str(start) + ':' + str(end)
        with self.lock:
            now = time.time()
            previous = self.entries.get(key)
            if previous:
                try:
                    validate_history(previous['payload'], ids, start, end)
                except (ValueError, TypeError, KeyError, AttributeError):
                    self.entries.pop(key, None)
                    previous = None
            if not self.settings.DATA_TERMINAL_API_KEY.strip():
                raise BenchmarkUnavailable('尚未配置 Data 行情凭据')
            if previous and now < previous.get('retry_at', 0):
                return previous
            try:
                with httpx.Client(timeout=self.settings.DATA_TERMINAL_TIMEOUT_SECONDS, follow_redirects=False, trust_env=False) as client:
                    response = client.get(self.settings.DATA_TERMINAL_API_URL.rstrip('/') + '/benchmarks/history',
                        params={'ids': ','.join(ids), 'start': str(start), 'end': str(end)},
                        headers={'X-API-Key': self.settings.DATA_TERMINAL_API_KEY.strip()})
                    response.raise_for_status()
                    payload = validate_history(response.json(), ids, start, end)
                result = dict(payload=payload, checked_at=now, retry_at=now+300, cached=False, warning=None)
                self.entries[key] = result
                while len(self.entries) > 32:
                    self.entries.pop(next(iter(self.entries)))
                try:
                    self._persist()
                except OSError:
                    result['warning'] = '行情已获取，但本地缓存写入失败'
                return result
            except httpx.HTTPStatusError as exc:
                code = exc.response.status_code
                if code in (401, 403):
                    self.entries.clear()
                    try:
                        self.path.unlink(missing_ok=True)
                    except OSError:
                        pass
                    raise BenchmarkUnavailable('Data 行情访问权限已失效，请检查后端凭据') from exc
                warning = f'Data 行情暂不可用（HTTP {code}）'
            except (httpx.RequestError, ValueError, KeyError, TypeError, AttributeError):
                warning = 'Data 行情暂不可用或返回数据不完整'
            if previous:
                result = dict(previous, retry_at=now+60, cached=True, warning=warning+'；当前显示上次成功行情')
                self.entries[key] = result
                return result
            raise BenchmarkUnavailable(warning)


_client = None


def get_benchmark_client():
    global _client
    if _client is None:
        _client = BenchmarkClient()
    return _client
