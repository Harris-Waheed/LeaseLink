from fastapi import APIRouter, HTTPException, Depends, status
from models.tnt_model import NewTenant, EditTenant
from cloudinary_id import extract_public_id
from database import get_db
import cloudinary.uploader
import asyncpg

router = APIRouter(prefix="/tenant", tags=["ADMIN TENANTS"])


@router.post(path="/add_tenant", status_code=status.HTTP_201_CREATED)
async def add_tenant(
    new: NewTenant = Depends(), db: asyncpg.Connection = Depends(get_db)
):
    add_query = "CALL p_add_tenant($1, $2, $3, $4, $5, NULL, NULL)"

    try:
        if not new.tenant_image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {new.tenant_image.content_type}. Only images are allowed.",
            )

        upload_result = cloudinary.uploader.upload(new.tenant_image.file)
        image_url = upload_result.get("secure_url")

    except HTTPException:
        raise

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail='Size greater than 10MB')

    try:
        async with db.transaction():

            try:
                result = await db.fetchrow(
                    add_query,
                    new.tnt_name,
                    str(new.tnt_email),
                    new.tnt_number,
                    new.tnt_national_id,
                    image_url,
                )
            except asyncpg.exceptions.UniqueViolationError:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, detail="Email Already Exits!"
                )

            response_data = {
                "tnt_name": new.tnt_name,
                "tnt_email": new.tnt_email,
                "tnt_number": new.tnt_number,
                "tnt_national_id": new.tnt_national_id,
                "tenant_image": image_url,
                "tenant_id": result["p_tenant_id"],
                "joined_at": result["p_joined_at"],
            }

            return {
                "status": "success",
                "data": response_data,
                "message": "New Tenant Created!",
            }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Unable to add tenant.")


@router.get(path="/all_tenants")
async def get_tenants(db: asyncpg.Connection = Depends(get_db)):
    tenant_list = []
    get_data = "CALL p_get_tenants($1)"

    try:
        async with db.transaction():
            await db.execute(get_data, "tnt_cursor")
            rows = await db.fetch('FETCH ALL FROM "tnt_cursor"')

            for row in rows:
                data = {
                    "tnt_id": row["tenant_id"],
                    "tnt_name": row["full_name"],
                    "tnt_email": row["email"],
                    "tnt_number": row["phone_number"],
                    "tnt_national_id": row["national_id"],
                    "tenant_image": row["tenant_image"],
                    "status": row["status"],
                    "joined_at": row["joined_at"],
                    "prop_name": row["prop_name"],
                    "unit_assign": row["unit_assign"],
                    "lease_start": row["lease_start"],
                    "lease_end": row["lease_end"],
                    "rent_amount": row["rent_amount"],
                }

                tenant_list.append(data)

            return {
                "status": "success",
                "data": tenant_list,
                "message": "Tenants retrieved successfully!",
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Unable to fetch tenants.")


@router.delete(path="/delete/{tnt_mail}")
async def delete_tenant(tnt_mail: str, db: asyncpg.Connection = Depends(get_db)):
    del_tenant_account = 'CALL p_delete_tenant_account($1)'
    del_query = "CALL p_del_tenant($1)"

    try:
        async with db.transaction():
            await db.execute(del_query, tnt_mail)
            await db.execute(del_tenant_account, tnt_mail)
            return {
                "status": "successful",
                "data": None,
                "message": "Deleted Successfully!",
            }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Unable to delete tenant.")


@router.put(path="/edit_tenant/{tnt_id}")
async def edit_tenant(
    tnt_id: int,
    edit_data: EditTenant = Depends(),
    db: asyncpg.Connection = Depends(get_db),
):

    old_url = None
    image_url = None
    old_image_url = f"SELECT tenant_image FROM TENANTS WHERE tenant_id = $1"
    edit_query = "CALL p_edit_tenant($1, $2, $3, $4, $5, $6, NULL)"

    try:
        if edit_data.tenant_image is not None:
            if not edit_data.tenant_image.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {edit_data.tenant_image.content_type}. Only images are allowed.",
                )

            upload_result = cloudinary.uploader.upload(edit_data.tenant_image.file)
            image_url = upload_result.get("secure_url")
            old_url = await db.fetchval(old_image_url, tnt_id)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=400, detail='Image size greater than 10MB!')


    try:
        async with db.transaction():
            image = await db.fetchval(
                edit_query,
                tnt_id,
                edit_data.tnt_name,
                str(edit_data.tnt_email),
                edit_data.tnt_number,
                edit_data.tnt_national_id,
                image_url,
            )

            if image_url and old_url:
                public_id = extract_public_id(old_url)
                if public_id:
                    try:
                        cloudinary.uploader.destroy(public_id)
                    except Exception as e:
                        print(f"Cloudinary cleanup failed for {public_id}: {e}")

        response_data = {
            "tnt_name": edit_data.tnt_name,
            "tnt_email": edit_data.tnt_email,
            "tnt_number": edit_data.tnt_number,
            "tnt_national_id": edit_data.tnt_national_id,
            "tenant_image": image,
        }

        return {
            "status": "successful",
            "data": response_data,
            "message": "Updated Successfully!",
        }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Unable to update tenant.")


@router.patch(path="/status/{tnt_id}")
async def update_tenant_status(tnt_id: int, db: asyncpg.Connection = Depends(get_db)):
    status_query = "CALL p_update_tenant_status($1, NULL)"

    try:
        async with db.transaction():
            new_status = await db.fetchval(status_query, tnt_id)

            return {
                "status": "successful",
                "data": {"tenant_status": new_status},
                "message": "Status Updated Successfully!",
            }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Unable to update tenant status.")
