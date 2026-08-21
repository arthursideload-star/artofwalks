"""Lead sources. Each returns a list[Lead]; scoring and export are shared."""

from __future__ import annotations

from typing import Any

from .base import Provider, ProviderError
from .apollo import ApolloProvider
from .csv_source import CsvProvider
from .demo import DemoProvider

_REGISTRY: dict[str, type[Provider]] = {
    "apollo": ApolloProvider,
    "csv": CsvProvider,
    "demo": DemoProvider,
}


def get(name: str, cfg: dict[str, Any]) -> Provider:
    try:
        cls = _REGISTRY[name.lower()]
    except KeyError:
        known = ", ".join(sorted(_REGISTRY))
        raise ProviderError(f"unknown provider {name!r}; expected one of: {known}") from None
    return cls(cfg)


__all__ = ["Provider", "ProviderError", "get"]
