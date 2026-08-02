from fastapi import APIRouter, HTTPException, Depends, status
from models.auth_model import Users, VerifyOtp, ForgetPassword
from security import hash_pass, verify_pass
from datetime import datetime, timedelta
from database import get_db
from mail import send_mail
import asyncpg

router = APIRouter(prefix="/admin", tags=["ADMIN USERS"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: Users, db: asyncpg.Connection = Depends(get_db)):

    hashed_pass = str(hash_pass(user.password))

    verify_query = "CALL p_verify_user($1, NULL)"
    add_new_user = "CALL p_new_user($1, $2)"
    add_new_otp = "CALL p_add_otp($1, $2, $3)"

    try:
        async with db.transaction():
            user_status = await db.fetchval(verify_query, user.username)

            if user_status is True:
                raise HTTPException(
                    status_code=409, detail="Email already exists!".capitalize()
                )

            if user_status is None:
                await db.execute(add_new_user, user.username, hashed_pass)

            new_otp = await send_mail(user.username)

            now = datetime.now()
            expiration_time = now + timedelta(minutes=10)
            otp_time = expiration_time.strftime("%Y-%m-%d %H:%M:%S")

            await db.execute(add_new_otp, user.username, new_otp, otp_time)
            print("Email Send Successfully!")

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "success",
        "data": user.username,
        "message": "Email Send Successfully!",
    }


@router.post("/verify_otp")
async def verify_otp(new_otp: VerifyOtp, db: asyncpg.Connection = Depends(get_db)):

    try:
        async with db.transaction():

            get_data = "CALL p_get_otp($1, NULL, NULL)"
            updt_status = "CALL p_update_verify_status($1)"
            otp_data = await db.fetchrow(get_data, new_otp.username)

            if otp_data[0] is None:
                raise HTTPException(status_code=404, detail="OTP not found or expired")

            exp_time_str = otp_data[1]
            exp_time_obj = datetime.strptime(exp_time_str, "%Y-%m-%d %H:%M:%S")

            if exp_time_obj > datetime.now():
                if str(otp_data[0]).strip() == str(new_otp.otp).strip():
                    await db.execute(updt_status, new_otp.username)

                    return {
                        "status": "success",
                        "data": None,
                        "message": "Otp Verified!",
                    }

            raise HTTPException(status_code=400, detail="Invalid or Expired OTP")

    except HTTPException:
        raise

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Invalid Response!")


@router.post("/login")
async def login(user: Users, db: asyncpg.Connection = Depends(get_db)):

    try:
        async with db.transaction():

            get_credentials = "CALL p_get_user($1, NULL)"
            verify_user = "CALL p_verify_user($1, NULL)"
            user_status = await db.fetchval(verify_user, user.username)

            if user_status is None or user_status is False:
                raise HTTPException(status_code=400, detail="Email Not Verified!")

            hashed_pass = await db.fetchval(get_credentials, user.username)
            verified_pass = verify_pass(user.password.strip(), str(hashed_pass).strip())

            if verified_pass:
                return {
                    "status": "success",
                    "data": None,
                    "message": "Successfully Login!",
                }

            raise HTTPException(status_code=400, detail="Invalid Credentials")

    except HTTPException:
        raise

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Invalid Response!")


@router.post("/forget_password")
async def forget_password(
    user: ForgetPassword, db: asyncpg.Connection = Depends(get_db)
):

    verify_user = "CALL p_verify_user($1, NULL)"
    add_new_otp = "CALL p_add_otp($1, $2, $3)"

    try:
        async with db.transaction():

            user_status = await db.fetchval(verify_user, user.username)

            if user_status is None or user_status is False:
                raise HTTPException(status_code=404, detail="Email Not Verified!")

            new_otp = await send_mail(user.username)

            now = datetime.now()
            expiration_time = now + timedelta(minutes=10)
            otp_time = expiration_time.strftime("%Y-%m-%d %H:%M:%S")

            await db.execute(add_new_otp, user.username, new_otp, otp_time)

            return {
                "status": "success",
                "data": user.username,
                "message": "Email Send Successfully!",
            }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/change_password")
async def change_password(user: Users, db: asyncpg.Connection = Depends(get_db)):

    change_pass = "CALL p_update_pass($1, $2)"
    verify_user = "CALL p_verify_user($1, NULL)"

    hashed_pass = hash_pass(user.password)

    try:
        async with db.transaction():

            user_status = await db.fetchval(verify_user, user.username)

            if user_status is None or user_status is False:
                raise HTTPException(status_code=400, detail="Email Not Verified!")

            try:
                await db.execute(change_pass, user.username, hashed_pass)
                return {
                    "status": "success",
                    "data": None,
                    "message": "Password Changed Successfully!",
                }

            except Exception as e:
                print(e)
                raise HTTPException(
                    status_code=409,
                    detail="Password Must Contain At-least 8 Characters!",
                )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
