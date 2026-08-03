from fastapi import Form, File, UploadFile
from decimal import Decimal


class NewPayment:
    def __init__(
        self,
        tenant_id: int = Form(...),
        amount: Decimal = Form(...),
        reference_image: UploadFile = File(...),
    ):
        self.tenant_id = tenant_id
        self.amount = amount
        self.reference_image = reference_image
