from fastapi import APIRouter, HTTPException, Depends, status
from models.tenant import NewTenant, GetTenant, EditTenant
from database import get_db
from typing import List
import asyncpg

router = APIRouter(prefix='/tenant', tags=['ADMIN TENANTS'])


@router.post(path='/add_tenant', status_code=status.HTTP_201_CREATED)
async def add_tenant(new: NewTenant = Depends(), db: asyncpg.Connection = Depends(get_db)):

    add_query = 'CALL p_add_tenant($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL)'

    try:
        async with db.transaction():
            result = await db.fetchrow(
            add_query,new.tnt_name,
            str(new.tnt_email), new.tnt_number, new.tnt_national_id,
            new.tnt_unit_assign,new.prop_id, new.lease_start,
            new.lease_end, new.rent_amount
            )

            response_data = new.model_dump()
            response_data['tenant_id'] = result['p_tenant_id']
            response_data['joined_at'] = result['p_joined_at']


            return {
                'status': 'success',
                'data': response_data,
                'message': 'New Tenant Created!'
            }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Unable to add new tenant.')


@router.get('/all', response_model=List[GetTenant])
async def get_tenants(db: asyncpg.Connection = Depends(get_db)):

    tenant_list = []
    get_data = 'CALL p_get_tenants($1)'

    try:
        async with db.transaction():

            await db.execute(get_data, 'tnt_cursor')
            rows = await db.fetch('FETCH ALL FROM tnt_cursor')

            for row in rows:

                data = {
                    'tnt_id': row['tenant_id'],
                    'tnt_name': row['full_name'],
                    'tnt_email': row['email'],
                    'tnt_number': row['phone_number'],
                    'tnt_national_id': row['national_id'],
                    'tnt_unit_assign': row['unit_assign'],
                    'prop_id': row['prop_id'],
                    'lease_start': row['lease_start'],
                    'lease_end': row['lease_end'],
                    'rent_amount': row['rent_amount'],
                    'joined_at': row['joined_at'],
                    'prop_name': row['prop_name']
                }

                tenant_list.append(data)
            return tenant_list

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail='Tenant Fetch Failed!')


@router.delete(path='/delete/{tnt_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(tnt_id: int, db: asyncpg.Connection = Depends(get_db)):
    del_query = 'CALL p_del_tenant($1)'

    try:
        async with db.transaction():
            await db.execute(del_query, tnt_id)
            return {'status': 'successful',
                    'data': None,
                    'message': 'Deleted Successfully!'}

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Unable to delete tenant.'
        )

@router.put(path='/edit_tenant/{tnt_id}', status_code=status.HTTP_200_OK)
async def edit_tenant(tnt_id: int, edit_data: EditTenant, db: asyncpg.Connection = Depends(get_db)):
    edit_query = 'CALL p_edit_tenant($1, $2, $3, $4, $5, $6)'

    try:
        async with db.transaction():
            await db.execute(
                edit_query,
                tnt_id,
                edit_data.tnt_name,
                edit_data.tnt_email,
                edit_data.tnt_number,
                edit_data.tnt_national_id,
                edit_data.rent_amount
            )

            return {
                'status': 'successful',
                'data': None,
                'message': 'Updated Successfully!'
            }

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Unable to update tenant.'
        )


@router.patch(path='/status/{tnt_id}', status_code=status.HTTP_200_OK)
async def update_tenant_status(tnt_id: int, db: asyncpg.Connection = Depends(get_db)):
    status_query = 'CALL p_update_tenant_status($1, NULL)'

    try:
        async with db.transaction():
            new_status = await db.fetchval(status_query, tnt_id)

            return {
                'status': 'successful',
                'data': {'tenant_status': new_status},
                'message': 'Status Updated Successfully!'
            }

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Unable to update tenant status.'
        )
