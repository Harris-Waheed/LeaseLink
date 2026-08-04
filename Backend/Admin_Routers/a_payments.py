from fastapi import APIRouter, Depends, HTTPException, status
from models.pay_model import NewPayment
from database import get_db
import cloudinary.uploader
import asyncpg

router = APIRouter(prefix="/pay", tags=["ADMIN PAYMENT"])


@router.post("/log_payment", status_code=status.HTTP_201_CREATED)
async def log_payment(
    payment: NewPayment = Depends(), db: asyncpg.Connection = Depends(get_db)
):

    if not payment.reference_image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {payment.reference_image.content_type}. Only images are allowed.",
        )

    upload_result = cloudinary.uploader.upload(payment.reference_image.file)
    image_url = upload_result.get("secure_url")

    insert_query = "CALL p_log_payment($1, $2, $3, NULL)"

    try:
        async with db.transaction():
            result = await db.fetchval(insert_query, payment.tenant_id, payment.amount, image_url)

            if result:
                response_data = {
                    "tenant_id": payment.tenant_id,
                    "amount": payment.amount,
                    "reference_image": image_url,
                }

                return {
                    "status": "success",
                    "data": response_data,
                    "message": "Payment logged successfully!",
                }

            else:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail='Amount not matched with due payment!')


    except HTTPException:
        raise
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
            records = await db.fetch('FETCH ALL FROM "payment_cursor"')

            payment_list = []
            for record in records:
                payment_data = {
                    "date": record["payment_date"],
                    "tenant_name": record["tenant_name"],
                    "tenant_email": record["tenant_email"],
                    "amount": record["amount"],
                    "reference_image": record["reference_image"],
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


@router.get("/due_amount/{tenant_id}")
async def get_due_amount(tenant_id: int, db: asyncpg.Connection = Depends(get_db)):
    try:
        due_query = "CALL p_get_due_amount($1, NULL)"
        due_amount = await db.fetchval(due_query, tenant_id)

        return {
            "status": "success",
            "data": {"due_amount": due_amount},
            "message": "Due amount calculated successfully!"
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Failed to calculate due amount")
