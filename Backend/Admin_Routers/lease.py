from fastapi import APIRouter, Depends, HTTPException, status
from models.lease_model import NewLease, EditLease
from database import get_db
import cloudinary.uploader
import asyncpg

router = APIRouter(prefix="/lease", tags=["ADMIN LEASE"])


@router.post("/add_lease", status_code=status.HTTP_201_CREATED)
async def add_lease(
    lease: NewLease = Depends(), db: asyncpg.Connection = Depends(get_db)
):

    if lease.lease_doc.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {lease.lease_doc.content_type}. Only PDFs are allowed.",
        )

    upload_result = cloudinary.uploader.upload(
        lease.lease_doc.file, resource_type="auto"
    )
    doc_url = upload_result.get("secure_url")

    add_query = "CALL p_add_lease($1, $2, $3, $4, $5, $6, $7, NULL, NULL)"

    try:
        async with db.transaction():
            result = await db.fetchrow(
                add_query,
                lease.tenant_id,
                lease.prop_id,
                lease.unit_assign,
                lease.lease_start,
                lease.lease_end,
                lease.rent_amount,
                doc_url,
            )

            response_data = {
                "lease_id": result["p_lease_id"],
                "tenant_id": lease.tenant_id,
                "prop_id": lease.prop_id,
                "unit_assign": lease.unit_assign,
                "lease_start": lease.lease_start,
                "lease_end": lease.lease_end,
                "rent_amount": lease.rent_amount,
                "lease_doc_url": doc_url,
                "created_at": result["p_created_at"],
            }

            return {
                "status": "success",
                "data": response_data,
                "message": "New Lease Created Successfully!",
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Unable to add lease: {str(e)}")


@router.get("/all_leases")
async def get_leases(db: asyncpg.Connection = Depends(get_db)):

    lease_list = []
    get_data = "CALL p_get_leases($1)"

    try:
        async with db.transaction():
            await db.execute(get_data, "lease_cursors")

            rows = await db.fetch('FETCH ALL FROM "lease_cursors"')

            for row in rows:
                data = {
                    "lease_id": row["lease_id"],
                    "tenant_id": row["tenant_id"],
                    "tenant_name": row["tenant_name"],
                    "national_id": row["national_id"],
                    "tenant_image": row["tenant_image"],
                    "prop_id": row["prop_id"],
                    "prop_name": row["prop_name"],
                    "unit_assign": row["unit_assign"],
                    "lease_start": row["lease_start"],
                    "lease_end": row["lease_end"],
                    "rent_amount": row["rent_amount"],
                    "lease_doc_url": row["lease_doc_url"],
                    "lease_status": row["lease_status"],
                    "created_at": row["created_at"],
                }
                lease_list.append(data)

        return {
            "status": "success",
            "data": lease_list,
            "message": "Leases retrieved successfully!",
        }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leases.")


@router.put("/edit_lease/{lease_id}", status_code=status.HTTP_200_OK)
async def edit_lease(
    lease_id: int,
    lease: EditLease = Depends(),
    db: asyncpg.Connection = Depends(get_db),
):
    edit_query = "CALL p_edit_lease($1, $2, $3, $4, $5, $6, NULL)"

    if lease.lease_doc.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {lease.lease_doc.content_type}. Only PDFs are allowed.",
        )

    upload_result = cloudinary.uploader.upload(
        lease.lease_doc.file, resource_type="auto"
    )
    doc_url = upload_result.get("secure_url")

    try:
        async with db.transaction():
            lease_doc = await db.fetchval(
                edit_query,
                lease_id,
                lease.unit_assign,
                lease.lease_start,
                lease.lease_end,
                lease.rent_amount,
                doc_url,
            )

            response_data = {
                "lease_id": lease_id,
                "unit_assign": lease.unit_assign,
                "lease_start": lease.lease_start,
                "lease_end": lease.lease_end,
                "rent_amount": lease.rent_amount,
                "lease_doc": lease_doc,
            }

            return {
                "status": "success",
                "data": response_data,
                "message": "Lease updated successfully!",
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to edit lease.",
        )


@router.patch("/status/{lease_id}")
async def update_lease_status(lease_id: int, db: asyncpg.Connection = Depends(get_db)):

    query = "CALL p_update_lease_status($1, NULL)"

    try:
        async with db.transaction():
            lease_status = await db.fetchval(query, lease_id)

            return {
                "status": "success",
                "data": lease_status,
                "message": "Status updated successfully!".capitalize(),
            }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Status update failed".capitalize())
