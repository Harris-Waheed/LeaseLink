from fastapi import APIRouter, Depends, HTTPException, status
from models.maintain_model import NewMaintenanceRequest
from database import get_db
import asyncpg

router = APIRouter(prefix="/maintain", tags=["ADMIN MAINTENANCE"])


@router.post("/add_maintenance", status_code=status.HTTP_201_CREATED)
async def add_maintenance(
    request_data: NewMaintenanceRequest, db: asyncpg.Connection = Depends(get_db)
):
    insert_query = "CALL p_add_maintenance($1, $2, $3)"

    try:
        async with db.transaction():
            await db.execute(
                insert_query,
                request_data.lease_id,
                request_data.issue_title,
                request_data.priority,
            )

            return {
                "status": "success",
                "data": request_data.model_dump(),
                "message": "Maintenance request submitted successfully!",
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit maintenance request",
        )


@router.get("/all_maintenance", status_code=status.HTTP_200_OK)
async def get_all_maintenance(db: asyncpg.Connection = Depends(get_db)):
    try:
        async with db.transaction():
            await db.execute("CALL p_get_maintenance('maintenance_cursor')")

            records = await db.fetch("FETCH ALL FROM maintenance_cursor")

            maintenance_list = []
            for record in records:
                maintenance_item = {
                    "date": record["request_date"],
                    "issue": record["issue_title"],
                    "location": record["location"],
                    "priority": record["priority"],
                    "status": record["status"],
                }
                maintenance_list.append(maintenance_item)

            return {"status": "success", "data": maintenance_list}

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch maintenance details",
        )
