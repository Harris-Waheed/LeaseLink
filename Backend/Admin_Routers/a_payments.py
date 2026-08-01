from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models.pay_model import NewPayment
import asyncpg

router = APIRouter(prefix="/pay", tags=["ADMIN PAYMENT"])


@router.post("/log_payment", status_code=status.HTTP_201_CREATED)
async def log_payment(payment: NewPayment, db: asyncpg.Connection = Depends(get_db)):
    insert_query = "CALL p_log_payment($1, $2, $3)"

    try:
        async with db.transaction():
            await db.execute(
                insert_query, payment.tenant_id, payment.amount, payment.reference
            )

            return {"status": "success", "message": "Payment logged successfully!"}

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log payment",
        )
