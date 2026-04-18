"""
SQLAlchemy models for the Invoice Generator.

All monetary values (unit_price, total_amount) are stored as integers
representing cents to avoid floating-point precision errors.
"""

from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class Business(Base):
    """A business entity that issues invoices."""

    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    tax_id = Column(String, nullable=True)

    invoices = relationship("Invoice", back_populates="business")

    def __repr__(self) -> str:
        return f"<Business id={self.id} name={self.name!r}>"


class Client(Base):
    """A client who receives invoices."""

    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, default=1)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    address = Column(String, nullable=False)

    invoices = relationship("Invoice", back_populates="client")

    def __repr__(self) -> str:
        return f"<Client id={self.id} name={self.name!r}>"


class Invoice(Base):
    """
    An invoice issued by a Business to a Client.

    - total_amount is stored in cents (integer).
    - tax_rate is stored as basis points (e.g. 1000 = 10.00%).
    """

    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    invoice_number = Column(String, nullable=False, unique=True)
    issue_date = Column(Date, nullable=False, default=date.today)
    due_date = Column(Date, nullable=False)
    tax_rate = Column(Integer, nullable=False, default=0)  # basis points
    total_amount = Column(Integer, nullable=False, default=0)  # cents
    currency = Column(String, nullable=False, default="USD")
    status = Column(String, nullable=False, default="draft")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    business = relationship("Business", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")
    items = relationship(
        "InvoiceItem", back_populates="invoice", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Invoice id={self.id} number={self.invoice_number!r}>"


class InvoiceItem(Base):
    """
    A single line item on an invoice.

    - unit_price is stored in cents (integer).
    """

    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)  # cents

    invoice = relationship("Invoice", back_populates="items")

    def __repr__(self) -> str:
        return f"<InvoiceItem id={self.id} desc={self.description!r}>"


# ---------------------------------------------------------------------------
# Database engine & session factory
# ---------------------------------------------------------------------------

import os

# Create an absolute path to the database file in the same directory as this model file.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "paydocs.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


def init_db() -> None:
    """Create all tables if they don't already exist."""
    Base.metadata.create_all(engine)
