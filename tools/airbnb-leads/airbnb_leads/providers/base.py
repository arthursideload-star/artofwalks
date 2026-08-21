"""Provider contract."""

from __future__ import annotations

import abc
from typing import Any

from ..models import Lead


class ProviderError(RuntimeError):
    """Raised for a source that is misconfigured, unreachable or plan-gated."""


class Provider(abc.ABC):
    #: Set on subclasses that produce synthetic rows, so the PDF can label them.
    synthetic = False

    def __init__(self, cfg: dict[str, Any]):
        self.cfg = cfg

    @property
    @abc.abstractmethod
    def name(self) -> str:
        ...

    @abc.abstractmethod
    def fetch(self, target_count: int) -> list[Lead]:
        """Return up to target_count leads. May return fewer."""

    def describe(self) -> str:
        """One line about where the data came from, shown on the PDF cover."""
        return self.name
