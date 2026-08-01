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

            return {
                "status": "success",
                "data": payment.model_dump(),
                "message": "Payment logged successfully!",
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log payment",
        )


@router.get("/all_payments", status_code=status.HTTP_200_OK)
async def get_all_payments(db: asyncpg.Connection = Depends(get_db)):

    query = "CALL p_get_payments($1)"

    try:
        async with db.transaction():

            await db.execute(query, "payment_cursor")
            records = await db.fetch('FETCH ALL FROM "payments_cursor"')

            payment_list = []
            for record in records:
                payment_data = {
                    "date": record["payment_date"],
                    "tenant_name": record["tenant_name"],
                    "amount": record["amount"],
                    "reference": record["reference"],
                    "status": record["status"],
                }
                payment_list.append(payment_data)

            return {"status": "success", "data": payment_list}

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment details",
        )


@router.patch("/status/{pay_id}")
async def update_pay_status(pay_id: int, db: asyncpg.Connection = Depends(get_db)):

    query = "CALL p_update_pay_status($1, NULL)"

    try:
        async with db.transaction():
            pay_status = await db.fetchval(query, pay_id)

            return {
                "status": "success",
                "data": pay_status,
                "message": "Status updated successfully!".capitalize(),
            }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Status update failed".capitalize())
