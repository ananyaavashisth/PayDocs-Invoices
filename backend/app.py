"""
PayDocs — Invoice Generator API

A Flask application providing CRUD endpoints for invoices.
All monetary values travel as integers (cents) end-to-end.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from pydantic import ValidationError

from models import Base, Business, Client, Invoice, InvoiceItem, SessionLocal, engine, init_db
from schemas import (
    BusinessCreate,
    BusinessResponse,
    ClientCreate,
    ClientResponse,
    InvoiceCreate,
    InvoiceListResponse,
    InvoiceResponse,
    InvoiceUpdate,
)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # Allow the Vite dev server (localhost:5173) to call the API
init_db()  # Ensure tables exist at startup, regardless of entry point


# ---------------------------------------------------------------------------
# Database initialisation
# ---------------------------------------------------------------------------


# Tables are initialized at startup in the main block.


# ---------------------------------------------------------------------------
# Global error handler — Pydantic validation failures
# ---------------------------------------------------------------------------


@app.errorhandler(ValidationError)
def handle_validation_error(error: ValidationError):
    """
    Return a structured 400 response when Pydantic rejects the payload.

    Example response body:
    {
      "error": "Validation failed",
      "details": [
        {"field": "quantity", "message": "Input should be greater than 0", ...}
      ]
    }
    """
    return (
        jsonify(
            {
                "error": "Validation failed",
                "details": error.errors(include_url=False),
            }
        ),
        400,
    )


# ---------------------------------------------------------------------------
# Helper — database session context manager
# ---------------------------------------------------------------------------


def get_db():
    """Yield a SQLAlchemy session and ensure it is closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 1 — POST /api/invoices
# ---------------------------------------------------------------------------


@app.route("/api/invoices", methods=["POST"])
def create_invoice():
    """
    Create a new invoice with its line items.

    The total_amount is computed server-side from the validated items
    and tax_rate, never accepted from the client.
    """
    # --- Validate incoming JSON via Pydantic ---
    payload = InvoiceCreate.model_validate(request.get_json())

    # --- Compute subtotal (all amounts in cents) ---
    subtotal_cents: int = 0
    for item in payload.items:
        subtotal_cents += item.quantity * item.unit_price

    # --- Apply tax (tax_rate is in basis points, e.g. 1000 = 10%) ---
    tax_cents: int = subtotal_cents * payload.tax_rate // 10_000
    total_amount_cents: int = subtotal_cents + tax_cents

    # --- Persist in a single transaction ---
    db = SessionLocal()
    try:
        invoice = Invoice(
            business_id=payload.business_id,
            client_id=payload.client_id,
            invoice_number=payload.invoice_number,
            issue_date=payload.issue_date,
            due_date=payload.due_date,
            tax_rate=payload.tax_rate,
            total_amount=total_amount_cents,
            currency=payload.currency,
            status="draft",
        )
        db.add(invoice)
        db.flush()  # get invoice.id without committing yet

        for item in payload.items:
            db.add(
                InvoiceItem(
                    invoice_id=invoice.id,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                )
            )

        db.commit()

        return jsonify({"id": invoice.id, "message": "Invoice created"}), 201

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 2 — GET /api/invoices
# ---------------------------------------------------------------------------


@app.route("/api/invoices", methods=["GET"])
def list_invoices():
    """
    Return all invoices ordered by issue_date descending.

    Uses the lightweight InvoiceListResponse (no nested items)
    to keep the payload small.
    """
    db = SessionLocal()
    try:
        invoices = (
            db.query(Invoice).order_by(Invoice.issue_date.desc()).all()
        )

        response = [
            InvoiceListResponse.model_validate(inv).model_dump(mode="json")
            for inv in invoices
        ]

        return jsonify(response), 200
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 3 — GET /api/invoices/<invoice_id>
# ---------------------------------------------------------------------------


@app.route("/api/invoices/<int:invoice_id>", methods=["GET"])
def get_invoice(invoice_id: int):
    """
    Return a single invoice with its full line-item details.

    Returns 404 with a JSON body if the invoice does not exist.
    """
    db = SessionLocal()
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

        if invoice is None:
            return (
                jsonify({"error": f"Invoice with id {invoice_id} not found"}),
                404,
            )

        response = InvoiceResponse.model_validate(invoice).model_dump(
            mode="json"
        )

        return jsonify(response), 200
    finally:
        db.close()


@app.route("/api/invoices/<int:invoice_id>", methods=["PATCH"])
def update_invoice(invoice_id: int):
    """
    Update the status of an existing invoice.
    """
    db = SessionLocal()
    try:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if invoice is None:
            return (
                jsonify({"error": f"Invoice with id {invoice_id} not found"}),
                404,
            )

        payload = InvoiceUpdate.model_validate(request.get_json())
        invoice.status = payload.status
        db.commit()

        return (
            jsonify(
                {
                    "id": invoice.id,
                    "status": invoice.status,
                    "message": "Invoice updated",
                }
            ),
            200,
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 4 — GET /api/businesses
# ---------------------------------------------------------------------------


@app.route("/api/businesses", methods=["GET"])
def list_businesses():
    """Return all businesses for the current user."""
    db = SessionLocal()
    try:
        businesses = db.query(Business).filter(Business.user_id == 1).all()
        response = [
            BusinessResponse.model_validate(b).model_dump(mode="json")
            for b in businesses
        ]
        return jsonify(response), 200
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 5 — POST /api/businesses
# ---------------------------------------------------------------------------


@app.route("/api/businesses", methods=["POST"])
def create_business():
    """Create a new business."""
    payload = BusinessCreate.model_validate(request.get_json())
    db = SessionLocal()
    try:
        business = Business(
            user_id=1,
            name=payload.name,
            address=payload.address,
            tax_id=payload.tax_id,
        )
        db.add(business)
        db.commit()
        return jsonify({"id": business.id, "message": "Business created"}), 201
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 6 — GET /api/clients
# ---------------------------------------------------------------------------


@app.route("/api/clients", methods=["GET"])
def list_clients():
    """Return all clients for the current user."""
    db = SessionLocal()
    try:
        clients = db.query(Client).filter(Client.user_id == 1).all()
        response = [
            ClientResponse.model_validate(c).model_dump(mode="json")
            for c in clients
        ]
        return jsonify(response), 200
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Route 7 — POST /api/clients
# ---------------------------------------------------------------------------


@app.route("/api/clients", methods=["POST"])
def create_client():
    """Create a new client."""
    payload = ClientCreate.model_validate(request.get_json())
    db = SessionLocal()
    try:
        client = Client(
            user_id=1,
            name=payload.name,
            email=payload.email,
            address=payload.address,
        )
        db.add(client)
        db.commit()
        return jsonify({"id": client.id, "message": "Client created"}), 201
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
