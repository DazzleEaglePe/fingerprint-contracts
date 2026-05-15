"""Common schemas — pagination, responses."""

from pydantic import BaseModel, Field


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str
    detail: str | None = None
