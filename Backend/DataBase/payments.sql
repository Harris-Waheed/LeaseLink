CREATE TABLE PAYMENTS (
    payment_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    amount DECIMAL NOT NULL,
    reference_image varchar,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Paid'
);

CREATE OR REPLACE PROCEDURE p_log_payment(
    p_tenant_id IN INT,
    p_amount IN DECIMAL,
    p_reference IN VARCHAR,
    p_is_accepted OUT BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE v_payable_amount DECIMAL;
BEGIN

    SELECT rent_amount INTO v_payable_amount
    FROM LEASES
    WHERE tenant_id = p_tenant_id;

    IF p_amount = v_payable_amount
        THEN
        INSERT INTO PAYMENTS (tenant_id, amount, reference_image, payment_date, status)
        VALUES (p_tenant_id, p_amount, p_reference, CURRENT_DATE, 'Paid');

    p_is_accepted := TRUE;

    ELSE
        p_is_accepted := FALSE;
    END IF;
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
        T.email as tenant_email,
        P.amount,
        P.reference_image,
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
    WHEN status = 'Paid' THEN 'Due'
    WHEN status = 'Due' THEN 'Paid'
    ELSE status
    END
    WHERE payment_id = p_pay_id

    RETURNING status INTO p_pay_status;
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_due_amount(
    p_tenant_id IN INT,
    p_due_amount OUT DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rent_amount DECIMAL := 0;
    v_paid_this_month DECIMAL := 0;
BEGIN
    SELECT rent_amount INTO v_rent_amount
    FROM leases
    WHERE tenant_id = p_tenant_id
      AND lease_status = 'Active'
    LIMIT 1;

    IF v_rent_amount IS NULL THEN
        v_rent_amount := 0;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid_this_month
    FROM payments
    WHERE tenant_id = p_tenant_id
      AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND status = 'Paid';

    p_due_amount := v_rent_amount - v_paid_this_month;

    IF p_due_amount < 0 THEN
        p_due_amount := 0;
    END IF;
END;
$$;