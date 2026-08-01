CREATE TABLE PAYMENTS (
    payment_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    amount DECIMAL NOT NULL,
    reference VARCHAR(255),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Paid'
);

CREATE OR REPLACE PROCEDURE p_log_payment(
    p_tenant_id IN INT,
    p_amount IN DECIMAL,
    p_reference IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO PAYMENTS (tenant_id, amount, reference, payment_date, status)
    VALUES (p_tenant_id, p_amount, p_reference, CURRENT_DATE, 'Paid');
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_payments(
    p_cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        P.payment_date,
        T.full_name AS tenant_name,
        P.amount,
        P.reference,
        P.status
    FROM PAYMENTS P
    JOIN TENANTS T
        ON P.tenant_id = T.tenant_id
    ORDER BY P.payment_date DESC;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_pay_status(
    p_pay_id IN INT,
    p_pay_status OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE PAYMENTS
    SET status = CASE
    WHEN status = 'Active' THEN 'Inactive'
    WHEN status = 'Inactive' THEN 'Active'
    ELSE status
    END
    WHERE payment_id = p_pay_id

    RETURNING status INTO p_pay_status;
END;
$$;

