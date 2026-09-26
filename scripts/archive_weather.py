#!/usr/bin/env python3
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HISTORY_DIR = ROOT / "weather-history"
CATALOG_URL = "https://raw.githubusercontent.com/bennessism/window/main/weather/catalog.json"
DATA_URL = "https://raw.githubusercontent.com/bennessism/window/main/weather/data/{code}.json"


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "bennessism-windfield/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def last_source_update(path):
    if not path.exists():
        return None
    last = None
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                last = line
    if not last:
        return None
    try:
        return json.loads(last).get("source_updated_at")
    except json.JSONDecodeError:
        return None


def archive_country(code, payload, archived_at):
    source_updated_at = payload.get("updated_at")
    if not source_updated_at:
        raise RuntimeError(f"{code}: source payload has no updated_at")

    try:
        stamp = datetime.fromisoformat(source_updated_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise RuntimeError(f"{code}: invalid updated_at {source_updated_at}") from exc

    month_dir = HISTORY_DIR / f"{stamp.year:04d}-{stamp.month:02d}"
    month_dir.mkdir(parents=True, exist_ok=True)
    path = month_dir / f"{code}.jsonl"

    if last_source_update(path) == source_updated_at:
        return False

    record = {
        "source_updated_at": source_updated_at,
        "archived_at": archived_at,
        "country_code": payload.get("country_code", code),
        "country": payload.get("country"),
        "source": payload.get("source"),
        "source_url": payload.get("source_url"),
        "locations": payload.get("locations", {}),
    }

    with path.open("a", encoding="utf-8") as handle:
        json.dump(record, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
    return True


def main():
    catalog = fetch_json(CATALOG_URL)
    archived_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    changed = 0

    for code in catalog.get("countries", {}):
        payload = fetch_json(DATA_URL.format(code=code))
        if archive_country(code, payload, archived_at):
            changed += 1
            print(f"Archived {code} @ {payload.get('updated_at')}")
        else:
            print(f"No new snapshot for {code}")

    print(f"Archived {changed} updated country snapshot(s).")


if __name__ == "__main__":
    main()
