"""Read-only Data Terminal client and durable last-successful reference rates."""
import json
import os
import tempfile
import threading
import time
from bisect import bisect_right
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

import httpx

from app.config import get_settings


def converted(amount, origin, target, rate):
    value = Decimal(str(amount))
    if origin not in ('CNY', 'USD') or target not in ('CNY', 'USD'):
        raise ValueError('Unsupported currency')
    if origin == target or value == 0:
        return value
    if rate is None:
        return None
    return value * rate if origin == 'USD' else value / rate


def money_value(value):
    return None if value is None else float(value.quantize(Decimal('.01'), rounding=ROUND_HALF_UP))


def validate_rate(row):
    if not isinstance(row, dict) or row.get('base') != 'USD' or row.get('quote') != 'CNY':
        raise ValueError('Unexpected currency pair')
    try:
        value = Decimal(str(row['rate']))
        day = date.fromisoformat(row['rate_date'])
        if not value.is_finite() or not 0 < value < 1000000 or day > date.today():
            raise ValueError('Invalid reference rate')
        if not isinstance(row.get('source'), str) or not row['source'].strip():
            raise ValueError('Missing reference source')
    except (KeyError, TypeError, InvalidOperation) as exc:
        raise ValueError('Invalid reference rate') from exc
    result = {key: row.get(key) for key in ('base', 'quote', 'rate_date', 'source', 'fetched_at', 'method')}
    result['rate'] = str(value)
    return result


class RateSnapshot:
    def __init__(self, rows, warning=None, checked_at=None, cached=False):
        self.rows = sorted(rows, key=lambda row: row['rate_date'])
        self.days = [row['rate_date'] for row in self.rows]
        self.warning = warning
        self.checked_at = checked_at
        self.cached = cached

    def on_or_before(self, day):
        index = bisect_right(self.days, day) - 1
        return self.rows[index] if index >= 0 else None

    def metadata(self):
        latest = self.rows[-1] if self.rows else None
        stale = bool(latest and (date.today() - date.fromisoformat(latest['rate_date'])).days > 4)
        return {
            'available': latest is not None, 'latest': latest,
            'stale': stale or self.cached, 'cached': self.cached,
            'warning': self.warning or ('参考汇率已超过 4 天未更新' if stale else None),
            'checked_at': self.checked_at,
        }


class ExchangeRateClient:
    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.lock = threading.Lock()
        self.snapshot = None
        self.retry_at = 0

    def _read_cache(self):
        try:
            data = json.loads(Path(self.settings.FX_CACHE_PATH).read_text())
            if data['api_url'] != self.settings.DATA_TERMINAL_API_URL.rstrip('/'):
                return None
            rows = [validate_rate(row) for row in data['rows']]
            return RateSnapshot(rows, checked_at=data['checked_at'])
        except (OSError, ValueError, KeyError, TypeError):
            return None

    def _save(self, rows, checked_at):
        path = Path(self.settings.FX_CACHE_PATH)
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix='.fx-', dir=path.parent)
        try:
            with os.fdopen(fd, 'w') as output:
                json.dump({'api_url': self.settings.DATA_TERMINAL_API_URL.rstrip('/'),
                           'rows': rows, 'checked_at': checked_at}, output)
            os.replace(temporary, path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    def get(self):
        with self.lock:
            now = time.time()
            if self.snapshot is not None and now < self.retry_at:
                return self.snapshot
            previous = self.snapshot or self._read_cache()
            warning = None
            if not self.settings.DATA_TERMINAL_API_KEY.strip():
                warning = '尚未配置 Data Terminal API key，无法刷新汇率'
            else:
                try:
                    # Do not send credentials to redirects or inherit a workstation proxy.
                    with httpx.Client(timeout=self.settings.DATA_TERMINAL_TIMEOUT_SECONDS,
                                      follow_redirects=False, trust_env=False) as client:
                        url = self.settings.DATA_TERMINAL_API_URL.rstrip('/')
                        headers = {'X-API-Key': self.settings.DATA_TERMINAL_API_KEY.strip()}
                        latest_response = client.get(url + '/exchange-rates/latest',
                                                     params={'base': 'USD', 'quote': 'CNY'}, headers=headers)
                        latest_response.raise_for_status()
                        latest = validate_rate(latest_response.json())
                        response = client.get(url + '/exchange-rates',
                                              params={'base': 'USD', 'quote': 'CNY', 'limit': 10000}, headers=headers)
                        response.raise_for_status()
                        payload = response.json()
                        if not isinstance(payload, list) or len(payload) >= 10000:
                            raise ValueError('Incomplete rate history')
                        rows = [validate_rate(row) for row in payload]
                        by_date = {row['rate_date']: row for row in rows}
                        if len(by_date) != len(rows):
                            raise ValueError('Duplicate rate dates')
                        by_date[latest['rate_date']] = latest
                        rows = sorted(by_date.values(), key=lambda row: row['rate_date'])
                        self.snapshot = RateSnapshot(rows, checked_at=now)
                        try:
                            self._save(rows, now)
                        except OSError:
                            self.snapshot.warning = '汇率已获取，但本地缓存写入失败'
                        self.retry_at = now + max(1, self.settings.FX_CACHE_TTL_SECONDS)
                        return self.snapshot
                except httpx.HTTPStatusError as exc:
                    status = exc.response.status_code
                    warning = f'Data Terminal 汇率请求失败（HTTP {status}）'
                except (httpx.RequestError, ValueError, TypeError, KeyError):
                    warning = 'Data Terminal 汇率暂不可用或返回数据无效'
            self.snapshot = RateSnapshot(previous.rows if previous else [], warning,
                                         previous.checked_at if previous else None,
                                         cached=bool(previous and previous.rows))
            self.retry_at = now + 60
            return self.snapshot


_client = None


def get_rate_snapshot():
    global _client
    if _client is None:
        _client = ExchangeRateClient()
    return _client.get()
