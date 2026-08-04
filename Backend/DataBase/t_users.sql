CREATE TABLE TENANT_USERS(

    username VARCHAR(40) PRIMARY KEY,
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE TABLE TENANT_OTP_VERIFY(

    username VARCHAR(40) NOT NULL ,
    otp INTEGER NOT NULL ,
    exp_time VARCHAR(30) NOT NULL
);

CREATE OR REPLACE PROCEDURE p_new_tenant(

    p_username in VARCHAR,
    p_password in VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO TENANT_USERS(USERNAME, PASSWORD)
    VALUES (p_username, p_password);
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_tenant(

    p_username in varchar,
    p_password OUT varchar
)
LANGUAGE plpgsql
AS $$
BEGIN
       SELECT PASSWORD INTO p_password
        FROM TENANT_USERS
        WHERE USERNAME = p_username;
END;
$$;

CREATE OR REPLACE PROCEDURE p_verify_tenant(

    p_username IN VARCHAR,
    p_is_verified OUT BOOLEAN
)
LANGUAGE plpgsql
AS
$$
BEGIN
SELECT is_verified INTO p_is_verified
    FROM TENANT_USERS
    WHERE USERNAME = p_username;

END;
$$;

CREATE OR REPLACE PROCEDURE p_new_tenant_password(

    in_username IN VARCHAR,
    in_new_pass IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE TENANT_USERS
    SET PASSWORD = in_new_pass
    WHERE USERNAME = in_username;
END;
$$;

CREATE OR REPLACE PROCEDURE p_add_tenant_otp(
    p_username IN VARCHAR,
    p_otp IN INTEGER,
    p_exp_time IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM TENANT_OTP_VERIFY
    WHERE CAST(exp_time AS TIMESTAMP) < LOCALTIMESTAMP;

    DELETE FROM TENANT_OTP_VERIFY
    WHERE username = p_username;

    INSERT INTO TENANT_OTP_VERIFY (username, otp, exp_time)
    VALUES (p_username, p_otp, p_exp_time);
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_tenant_otp(

    p_username IN VARCHAR,
    p_otp out INTEGER,
    p_exp_time out VARCHAR
)
LANGUAGE plpgsql
AS
$$
BEGIN
    DELETE FROM TENANT_OTP_VERIFY
    WHERE CAST(exp_time AS TIMESTAMP) < LOCALTIMESTAMP;

    SELECT OTP, EXP_TIME INTO p_otp, p_exp_time
    FROM TENANT_OTP_VERIFY
    WHERE USERNAME = p_username;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_tenant_verify_status(

    p_username IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE TENANT_USERS
    SET is_verified = TRUE
    WHERE USERNAME = p_username;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_tenant_pass(

    p_username IN VARCHAR,
    p_password IN VARCHAR
)
LANGUAGE plpgsql
AS $$
    BEGIN
        UPDATE TENANT_USERS
        SET password = p_password
        WHERE username = p_username;
end;
$$;

CREATE OR REPLACE PROCEDURE p_verify_tenant_admin(
    p_tenant_email IN VARCHAR,
    p_is_verified OUT BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
     SELECT EXISTS (
         SELECT 1
         FROM TENANTS
         WHERE EMAIL = p_tenant_email
     )
     INTO p_is_verified;
end;
$$;

CREATE OR REPLACE PROCEDURE p_delete_tenant_account(
    p_tenant_email IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM TENANT_USERS
    WHERE username = p_tenant_email;
end;
    $$;

