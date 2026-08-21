"""SQLite-backed page cache and lead store.

A full 100-lead run touches a few thousand pages. Caching every fetch means a
re-run after a crash, a block, or a config tweak costs seconds instead of hours,
and it keeps repeat load off Airbnb and off the small business sites we visit.
"""

import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, Iterator, Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS pages (
    url        TEXT PRIMARY KEY,
    status     INTEGER,
    body       TEXT,
    fetched_at REAL
);
CREATE TABLE IF NOT EXISTS listings (
    listing_id TEXT PRIMARY KEY,
    market     TEXT,
    data       TEXT,
    stage      TEXT,
    updated_at REAL
);
CREATE INDEX IF NOT EXISTS listings_stage ON listings(stage);
"""


class Store:
    def __init__(self, path: str | Path):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path))
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.db.commit()

    # ---- page cache -------------------------------------------------

    def get_page(self, url: str, max_age_seconds: Optional[float] = None) -> Optional[str]:
        row = self.db.execute("SELECT body, fetched_at FROM pages WHERE url = ?", (url,)).fetchone()
        if row is None:
            return None
        if max_age_seconds is not None and time.time() - row["fetched_at"] > max_age_seconds:
            return None
        return row["body"]

    def put_page(self, url: str, body: str, status: int = 200) -> None:
        self.db.execute(
            "INSERT OR REPLACE INTO pages (url, status, body, fetched_at) VALUES (?, ?, ?, ?)",
            (url, status, body, time.time()),
        )
        self.db.commit()

    # ---- listings ---------------------------------------------------

    def upsert_listing(self, listing_id: str, market: str, data: Dict[str, Any], stage: str) -> None:
        self.db.execute(
            "INSERT INTO listings (listing_id, market, data, stage, updated_at) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(listing_id) DO UPDATE SET data=excluded.data, stage=excluded.stage, "
            "updated_at=excluded.updated_at",
            (listing_id, market, json.dumps(data, ensure_ascii=False), stage, time.time()),
        )
        self.db.commit()

    def get_listing(self, listing_id: str) -> Optional[Dict[str, Any]]:
        row = self.db.execute(
            "SELECT listing_id, market, data, stage FROM listings WHERE listing_id = ?", (listing_id,)
        ).fetchone()
        if row is None:
            return None
        data = json.loads(row["data"])
        data.update(listing_id=row["listing_id"], market=row["market"], stage=row["stage"])
        return data

    def iter_stage(self, stage: str) -> Iterator[Dict[str, Any]]:
        rows = self.db.execute(
            "SELECT listing_id, market, data FROM listings WHERE stage = ? ORDER BY updated_at", (stage,)
        ).fetchall()
        for row in rows:
            data = json.loads(row["data"])
            data.update(listing_id=row["listing_id"], market=row["market"])
            yield data

    def count_stage(self, stage: str) -> int:
        return self.db.execute("SELECT COUNT(*) c FROM listings WHERE stage = ?", (stage,)).fetchone()["c"]

    def known_ids(self) -> set[str]:
        return {r["listing_id"] for r in self.db.execute("SELECT listing_id FROM listings")}

    def close(self) -> None:
        self.db.close()
