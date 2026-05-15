"""Tipos de datos del módulo biométrico."""

from dataclasses import dataclass
from enum import Enum


class MinutiaType(str, Enum):
    """Tipos de minutia."""
    TERMINATION = "TERMINATION"
    BIFURCATION = "BIFURCATION"


@dataclass
class Minutia:
    """Representa un punto característico (minutia) de una huella digital."""
    x: int
    y: int
    theta: float  # Orientación en radianes [0, 2π]
    type: MinutiaType
    quality: float = 1.0  # Confianza en la detección [0, 1]

    def to_dict(self) -> dict:
        return {
            "x": self.x,
            "y": self.y,
            "theta": round(self.theta, 4),
            "type": self.type.value,
            "quality": round(self.quality, 4),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Minutia":
        return cls(
            x=data["x"],
            y=data["y"],
            theta=data["theta"],
            type=MinutiaType(data["type"]),
            quality=data.get("quality", 1.0),
        )


@dataclass
class MatchResult:
    """Resultado de un matching biométrico."""
    score: float
    matched: int
    query_count: int
    template_count: int
    is_match: bool
