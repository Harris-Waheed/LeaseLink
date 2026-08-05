from fastapi import APIRouter, Depends, HTTPException, status
from models.maintain_model import NewMaintenanceRequest, MaintenanceStatusUpdate
from database import get_db
import asyncpg

router = APIRouter(prefix="/maintain", tags=["ADMIN MAINTENANCE"])


@router.post("/add_maintenance", status_code=status.HTTP_201_CREATED)
async def add_maintenance(
    request_data: NewMaintenanceRequest, db: asyncpg.Connection = Depends(get_db)
):
    insert_query = "CALL p_add_maintenance($1, $2, $3, $4, NULL, NULL)"

    try:
        async with db.transaction():
            result = await db.fetch(
                insert_query,
                request_data.lease_id,
                request_data.issue_title,
                request_data.priority,
                request_data.description
            )

            response_model = request_data.model_dump()

            for record in result:
                response_model['request_id'] = record[0]
                response_model['request_date'] = record[1]

            return {
                "status": "success",
                "data": response_model,
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
            await db.execute("CALL p_get_maintenance('maintenance_cursors')")

            records = await db.fetch("FETCH ALL FROM maintenance_cursors")

            maintenance_list = []
            for record in records:
                maintenance_item = {
                    "request_id": record["request_id"],
                    "date": record["request_date"],
                    "issue": record["issue_title"],
                    "location": record["location"],
                    "unit_assign": record["unit_assign"],
                    "priority": record["priority"],
                    "description": record["description"],
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


@router.patch("/update_maintenance_status")
async def update_maintenance_status(
        payload: MaintenanceStatusUpdate,
        db: asyncpg.Connection = Depends(get_db)
):
    try:
        async with db.transaction():

            update_query = "CALL p_update_maintenance_status($1, $2)"
            await db.execute(update_query, payload.request_id, payload.status)

            return {
                "status": "success",
                "message": f"Status updated to '{payload.status}' successfully!"
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/delete_maintenance_request/{request_id}")
async def delete_maintenance_request(
        request_id: int,
        db: asyncpg.Connection = Depends(get_db)
):
    try:
        async with db.transaction():

            delete_query = "CALL p_delete_request($1)"
            await db.execute(delete_query, request_id)

            return {
                "status": "success",
                "message": f"Maintenance request {request_id} deleted successfully!"
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")