from fastapi import APIRouter, HTTPException, Depends, status
from models.property import NewProperty, GetProperty, EditProperty, UpdatePropStatus
from database import get_db
from typing import List
import cloudinary.uploader
import asyncpg

router = APIRouter(prefix='/prop', tags=['Admin Property'])

@router.post('/add_property', status_code=status.HTTP_201_CREATED)
async def add_property(new: NewProperty = Depends(), db: asyncpg.Connection = Depends(get_db)):

    if not new.prop_image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail=f'Invalid file type: {new.prop_image.content_type}. Only images are allowed.'
        )

    upload_result = cloudinary.uploader.upload(new.prop_image.file)
    image_url = upload_result.get('secure_url')

    add_query = 'CALL p_add_prop($1, $2, $3, $4, $5, NULL)'

    try:
        async with db.transaction():
            prop_id = await db.fetchval(add_query, new.prop_name, new.prop_loc, new.prop_unit,
                             image_url, new.prop_built)

            return {'status': 'success',
                    'data': new.model_dump(),
                    'message': 'New Property Created!'}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail='Unable to add new property!'.capitalize())


@router.get('/', response_model=List[GetProperty])
async def get_prop(db: asyncpg.Connection = Depends(get_db)):

    prop_list = []
    get_data = 'CALL p_get_props($1)'

    try:
        async with db.transaction():

            await db.execute(get_data, 'prop_curs')
            rows = await db.fetch('FETCH ALL FROM prop_curs')

            for row in rows:

                data = {
                    'prop_id': row['prop_id'],
                    'prop_name': row['prop_name'],
                    'prop_status': row['prop_status'],
                    'prop_loc': row['prop_loc'],
                    'prop_unit': row['prop_unit'],
                    'prop_built': row['prop_built'],
                    'prop_image': row['prop_image'],
                    'occupancy_rate': row['occupancy_rate'],
                    'monthly_revenue': row['monthly_revenue']
                }

                prop_list.append(data)
            return prop_list

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail='Property Fetch Failed!')


@router.post('/edit_prop')
async def edit_prop(prop: EditProperty, db: asyncpg.Connection = Depends(get_db)):

    edit_property = 'CALL p_edit_prop($1, $2, $3, $4, $5, $6, $7)'

    try:
        async with db.transaction():

            await db.execute(edit_property, prop.prop_id, prop.prop_name, prop.prop_loc,
                             prop.prop_unit, prop.prop_status, str(prop.prop_image),
                             prop.prop_built)

            return {'status': 'success',
                    'data': prop.model_dump(),
                    'message': 'Data updated successfully!'.capitalize()}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail='Property Edit Failed!')

@router.post('/update_prop_status')
async def update_prop_status(prop: UpdatePropStatus, db: asyncpg.Connection = Depends(get_db)):

    query = 'CALL p_update_prop_status($1, NULL)'

    try:
        async with db.transaction():
            prop_status = await db.fetchval(query, prop.prop_id)

            return {'status': 'success',
                    'data': prop_status,
                    'message':'Status updated successfully!'.capitalize()}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail='Status update failed'.capitalize())