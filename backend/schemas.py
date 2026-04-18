"""
Pydantic schemas for request validation.

These schemas act as the safety boundary between untrusted frontend
data and our SQLAlchemy models.  The API layer must validate every
incoming request through one of these schemas before touching the DB.

Monetary values arrive from the frontend in cents (integers) to match
the database storage format — no float conversion needed.
"""

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class InvoiceStatus(str, Enum):
    """Allowed invoice statuses."""

    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


# ---------------------------------------------------------------------------
# Business schemas
# ---------------------------------------------------------------------------


class BusinessCreate(BaseModel):
    """Payload for creating a new business."""

    name: str = Field(..., min_length=1, max_length=200)
    address: str = Field(..., min_length=1, max_length=500)
    tax_id: Optional[str] = Field(None, max_length=50)


class BusinessResponse(BaseModel):
    """Shape of a business returned from the API."""

    id: int
    name: str
    address: str
    tax_id: Optional[str]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Client schemas
# ---------------------------------------------------------------------------


class ClientCreate(BaseModel):
    """Payload for creating a new client."""

    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    address: str = Field(..., min_length=1, max_length=500)


class ClientResponse(BaseModel):
    """Shape of a client returned from the API."""

    id: int
    name: str
    email: str
    address: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Invoice Item schemas
# ---------------------------------------------------------------------------


class InvoiceItemCreate(BaseModel):
    """A single line item inside an invoice creation request."""

    description: str = Field(..., min_length=1, max_length=300)
    quantity: int = Field(..., gt=0, description="Must be at least 1")
    unit_price: int = Field(
        ..., ge=0, description="Price in cents — must be non-negative"
    )


class InvoiceItemResponse(BaseModel):
    """Shape of an invoice item returned from the API."""

    id: int
    description: str
    quantity: int
    unit_price: int  # cents

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Invoice schemas
# ---------------------------------------------------------------------------


class InvoiceCreate(BaseModel):
    """
    Payload for creating a new invoice.

    Includes a nested list of line items that are validated individually.
    The API layer computes total_amount from the items — it is never
    accepted from the client.
    """

    business_id: int = Field(..., gt=0)
    client_id: int = Field(..., gt=0)
    invoice_number: str = Field(..., min_length=1, max_length=50)
    issue_date: date
    due_date: date
    tax_rate: int = Field(
        default=0,
        ge=0,
        le=10000,
        description="Tax rate in basis points (0–10000, i.e. 0%–100%)",
    )
    currency: str = Field(default="USD", min_length=3, max_length=3)
    items: list[InvoiceItemCreate] = Field(
        ..., min_length=1, description="At least one line item is required"
    )

    @model_validator(mode="after")
    def due_date_must_be_on_or_after_issue_date(self) -> "InvoiceCreate":
        if self.due_date < self.issue_date:
            raise ValueError("due_date must be on or after issue_date")
        return self


class InvoiceUpdate(BaseModel):
    """Payload for updating an existing invoice."""

    status: InvoiceStatus


class InvoiceListResponse(BaseModel):
    """Lightweight invoice summary for list endpoints (no nested items)."""

    id: int
    business_id: int
    client_id: int
    invoice_number: str
    issue_date: date
    due_date: date
    tax_rate: int
    total_amount: int  # cents
    currency: str
    status: str

    model_config = {"from_attributes": True}


class InvoiceResponse(BaseModel):
    """Shape of a full invoice returned from the API (includes line items)."""

    id: int
    business_id: int
    client_id: int
    invoice_number: str
    issue_date: date
    due_date: date
    tax_rate: int
    total_amount: int  # cents
    currency: str
    status: str
    items: list[InvoiceItemResponse]

    model_config = {"from_attributes": True}

