from pydantic import BaseModel, Field
from decimal import Decimal


class NewPayment(BaseModel):
    tenant_id: int
    amount: Decimal = Field(..., gt=0, decimal_places=2, max_length=10)
    reference: str | None
