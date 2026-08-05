--
-- PostgreSQL database dump
--

\restrict rb2DkpHgYLIkoN1a2SeGtAqVzRePgePHvqCqthibsxY5iEmboyyfwgYnFKBp8Sr

-- Dumped from database version 18.4 (df16b3c)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: p_add_lease(integer, integer, character varying, date, date, numeric, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_lease(IN p_tenant_id integer, IN p_prop_id integer, IN p_unit_assign character varying, IN p_lease_start date, IN p_lease_end date, IN p_rent_amount numeric, IN p_lease_doc_url character varying, OUT p_lease_id integer, OUT p_created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO LEASES (
        tenant_id, prop_id, unit_assign, lease_start,
        lease_end, rent_amount, lease_doc_url
    )
    VALUES (p_tenant_id, p_prop_id, p_unit_assign,
        p_lease_start, p_lease_end, p_rent_amount,
        p_lease_doc_url
    )
    RETURNING lease_id, created_at INTO p_lease_id, p_created_at;
END;
$$;


ALTER PROCEDURE public.p_add_lease(IN p_tenant_id integer, IN p_prop_id integer, IN p_unit_assign character varying, IN p_lease_start date, IN p_lease_end date, IN p_rent_amount numeric, IN p_lease_doc_url character varying, OUT p_lease_id integer, OUT p_created_at timestamp without time zone) OWNER TO neondb_owner;

--
-- Name: p_add_maintenance(integer, character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_maintenance(IN p_lease_id integer, IN p_issue_title character varying, IN p_priority character varying, IN p_description character varying, OUT r_request_id character varying, OUT r_request_date date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO MAINTENANCE_REQUESTS (lease_id, issue_title, priority, description, status, request_date)
    VALUES (p_lease_id, p_issue_title, p_priority,
            p_description,'Pending', CURRENT_DATE)

    RETURNING request_id, request_date INTO r_request_id, r_request_date;

END;
$$;


ALTER PROCEDURE public.p_add_maintenance(IN p_lease_id integer, IN p_issue_title character varying, IN p_priority character varying, IN p_description character varying, OUT r_request_id character varying, OUT r_request_date date) OWNER TO neondb_owner;

--
-- Name: p_add_otp(character varying, integer, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_otp(IN p_username character varying, IN p_otp integer, IN p_exp_time character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM OTP_VERIFY
    WHERE CAST(exp_time AS TIMESTAMP) < LOCALTIMESTAMP;

    DELETE FROM OTP_VERIFY
    WHERE username = p_username;

    INSERT INTO OTP_VERIFY (username, otp, exp_time)
    VALUES (p_username, p_otp, p_exp_time);
END;
$$;


ALTER PROCEDURE public.p_add_otp(IN p_username character varying, IN p_otp integer, IN p_exp_time character varying) OWNER TO neondb_owner;

--
-- Name: p_add_prop(character varying, character varying, integer, text, integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_prop(IN p_prop_name character varying, IN p_prop_loc character varying, IN p_prop_unit integer, IN p_prop_image text, IN p_prop_built integer, OUT p_prop_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO properties(PROP_NAME, PROP_LOC, PROP_UNIT, PROP_IMAGE, PROP_BUILT)
    VALUES (p_prop_name, p_prop_loc, p_prop_unit,
             p_prop_image, p_prop_built)

    RETURNING prop_id INTO p_prop_id;
END;
$$;


ALTER PROCEDURE public.p_add_prop(IN p_prop_name character varying, IN p_prop_loc character varying, IN p_prop_unit integer, IN p_prop_image text, IN p_prop_built integer, OUT p_prop_id integer) OWNER TO neondb_owner;

--
-- Name: p_add_tenant(character varying, character varying, character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_tenant(IN p_full_name character varying, IN p_email character varying, IN p_phone_number character varying, IN p_national_id character varying, IN p_tenant_image character varying, OUT p_tenant_id integer, OUT p_joined_at date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO TENANTS(FULL_NAME, EMAIL, PHONE_NUMBER, NATIONAL_ID, TENANT_IMAGE)
    VALUES (p_full_name, p_email, p_phone_number,
            p_national_id, p_tenant_image)

    RETURNING tenant_id, joined_at INTO p_tenant_id, p_joined_at;
END;
$$;


ALTER PROCEDURE public.p_add_tenant(IN p_full_name character varying, IN p_email character varying, IN p_phone_number character varying, IN p_national_id character varying, IN p_tenant_image character varying, OUT p_tenant_id integer, OUT p_joined_at date) OWNER TO neondb_owner;

--
-- Name: p_add_tenant(character varying, character varying, character varying, character varying, integer, date, date, numeric); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_tenant(IN p_full_name character varying, IN p_email character varying, IN p_phone_number character varying, IN p_national_id character varying, IN p_prop_id integer, IN p_lease_start date, IN p_lease_end date, IN p_rent_amount numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO TENANTS(FULL_NAME, EMAIL, PHONE_NUMBER, NATIONAL_ID, PROP_ID, LEASE_START,
                        LEASE_END, RENT_AMOUNT)
    VALUES (p_full_name, p_email, p_phone_number,
            p_national_id, p_prop_id, p_lease_start,
            p_lease_end, p_rent_amount);
END;
$$;


ALTER PROCEDURE public.p_add_tenant(IN p_full_name character varying, IN p_email character varying, IN p_phone_number character varying, IN p_national_id character varying, IN p_prop_id integer, IN p_lease_start date, IN p_lease_end date, IN p_rent_amount numeric) OWNER TO neondb_owner;

--
-- Name: p_add_tenant_otp(character varying, integer, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_add_tenant_otp(IN p_username character varying, IN p_otp integer, IN p_exp_time character varying)
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


ALTER PROCEDURE public.p_add_tenant_otp(IN p_username character varying, IN p_otp integer, IN p_exp_time character varying) OWNER TO neondb_owner;

--
-- Name: p_change_lease_status(integer, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_change_lease_status(IN p_lease_id integer, IN p_new_status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN

    UPDATE LEASES
    SET lease_status = p_new_status
    WHERE lease_id = p_lease_id;
END;
$$;


ALTER PROCEDURE public.p_change_lease_status(IN p_lease_id integer, IN p_new_status character varying) OWNER TO neondb_owner;

--
-- Name: p_del_tenant(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_del_tenant(IN p_tnt_email character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM TENANTS
    WHERE email = p_tnt_email;
END;
$$;


ALTER PROCEDURE public.p_del_tenant(IN p_tnt_email character varying) OWNER TO neondb_owner;

--
-- Name: p_delete_request(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_delete_request(IN p_request_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN

    DELETE FROM MAINTENANCE_REQUESTS
    WHERE request_id = p_request_id;
end;

    $$;


ALTER PROCEDURE public.p_delete_request(IN p_request_id integer) OWNER TO neondb_owner;

--
-- Name: p_delete_tenant_account(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_delete_tenant_account(IN p_tenant_email character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM TENANT_USERS
    WHERE username = p_tenant_email;
end;
    $$;


ALTER PROCEDURE public.p_delete_tenant_account(IN p_tenant_email character varying) OWNER TO neondb_owner;

--
-- Name: p_edit_lease(integer, character varying, date, date, numeric, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_edit_lease(IN p_lease_id integer, IN p_unit_assign character varying, IN p_lease_start date, IN p_lease_end date, IN p_rent_amount numeric, IN p_lease_doc_url character varying, OUT r_lease_doc_url character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE LEASES
    SET
        unit_assign = p_unit_assign,
        lease_start = p_lease_start,
        lease_end = p_lease_end,
        rent_amount = p_rent_amount,
        lease_doc_url = COALESCE(p_lease_doc_url::VARCHAR, LEASES.lease_doc_url)
    WHERE lease_id = p_lease_id

    RETURNING lease_doc_url INTO r_lease_doc_url;
END;
$$;


ALTER PROCEDURE public.p_edit_lease(IN p_lease_id integer, IN p_unit_assign character varying, IN p_lease_start date, IN p_lease_end date, IN p_rent_amount numeric, IN p_lease_doc_url character varying, OUT r_lease_doc_url character varying) OWNER TO neondb_owner;

--
-- Name: p_edit_prop(integer, character varying, character varying, integer, character varying, character varying, integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_edit_prop(IN p_prop_id integer, IN p_prop_name character varying, IN p_prop_loc character varying, IN p_prop_unit integer, IN p_prop_status character varying, IN p_prop_image character varying, IN p_prop_built integer, OUT r_prop_image character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE properties
    SET PROP_NAME = p_prop_name,
        PROP_LOC = p_prop_loc,
        PROP_UNIT = p_prop_unit,
        PROP_STATUS = p_prop_status,
        PROP_IMAGE = COALESCE(p_prop_image::VARCHAR, prop_image),
        PROP_BUILT = p_prop_built
    WHERE PROP_ID = p_prop_id

    RETURNING prop_image INTO r_prop_image;
END;
$$;


ALTER PROCEDURE public.p_edit_prop(IN p_prop_id integer, IN p_prop_name character varying, IN p_prop_loc character varying, IN p_prop_unit integer, IN p_prop_status character varying, IN p_prop_image character varying, IN p_prop_built integer, OUT r_prop_image character varying) OWNER TO neondb_owner;

--
-- Name: p_edit_tenant(integer, character varying, character varying, character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_edit_tenant(IN p_tnt_id integer, IN p_full_name character varying, IN p_email character varying, IN p_phone_number character varying, IN p_national_id character varying, IN p_tenant_image character varying, OUT r_tenant_image character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE TENANTS
    SET
        full_name = p_full_name, email = p_email, phone_number = p_phone_number,
        national_id = p_national_id,
        tenant_image = COALESCE(p_tenant_image::VARCHAR, tenant_image)
    WHERE tenant_id = p_tnt_id

    RETURNING tenant_image INTO r_tenant_image;
END;
$$;


ALTER PROCEDURE public.p_edit_tenant(IN p_tnt_id integer, IN p_full_name character varying, IN p_email character varying, IN p_phone_number character varying, IN p_national_id character varying, IN p_tenant_image character varying, OUT r_tenant_image character varying) OWNER TO neondb_owner;

--
-- Name: p_get_dashboard_stats(); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_dashboard_stats(OUT p_total_properties bigint, OUT p_active_tenants bigint, OUT p_pending_rent numeric, OUT p_open_tickets bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN

    SELECT COUNT(*) INTO p_total_properties FROM PROPERTIES;
    SELECT COUNT(*) INTO p_active_tenants FROM LEASES WHERE LEASE_STATUS = 'Active';
    SELECT COALESCE(SUM(amount), 0) INTO p_pending_rent FROM PAYMENTS WHERE status = 'Due';
    SELECT COUNT(*) INTO p_open_tickets FROM MAINTENANCE_REQUESTS WHERE status != 'Completed';
END;
$$;


ALTER PROCEDURE public.p_get_dashboard_stats(OUT p_total_properties bigint, OUT p_active_tenants bigint, OUT p_pending_rent numeric, OUT p_open_tickets bigint) OWNER TO neondb_owner;

--
-- Name: p_get_due_amount(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_due_amount(IN p_tenant_id integer, OUT p_due_amount numeric)
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


ALTER PROCEDURE public.p_get_due_amount(IN p_tenant_id integer, OUT p_due_amount numeric) OWNER TO neondb_owner;

--
-- Name: p_get_leases(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_leases(INOUT p_lease_cursor refcursor)
    LANGUAGE plpgsql
    AS $$
BEGIN
    OPEN p_lease_cursor FOR
    SELECT
        l.lease_id, l.tenant_id, t.full_name AS tenant_name,
        t.national_id, t.tenant_image,
        l.prop_id, p.prop_name, l.unit_assign,
        l.lease_start, l.lease_end, l.rent_amount,
        l.lease_doc_url, l.lease_status, l.created_at
    FROM LEASES l
    JOIN TENANTS t ON l.tenant_id = t.tenant_id
    JOIN PROPERTIES p ON l.prop_id = p.prop_id
    ORDER BY l.created_at DESC;
END;
$$;


ALTER PROCEDURE public.p_get_leases(INOUT p_lease_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_maintenance(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_maintenance(INOUT p_cursor refcursor)
    LANGUAGE plpgsql
    AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        M.request_id,
        M.request_date,
        M.issue_title,
        P.prop_name AS location,
        L.unit_assign,
        M.priority,
        M.description,
        M.status
    FROM MAINTENANCE_REQUESTS M
    LEFT JOIN LEASES L
        ON M.lease_id = L.lease_id
    LEFT JOIN PROPERTIES P
        ON L.prop_id = P.prop_id
    WHERE L.lease_status = 'Active'
    ORDER BY M.request_date DESC;
END;
$$;


ALTER PROCEDURE public.p_get_maintenance(INOUT p_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_otp(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_otp(IN p_username character varying, OUT p_otp integer, OUT p_exp_time character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM OTP_VERIFY
    WHERE CAST(exp_time AS TIMESTAMP) < LOCALTIMESTAMP;

    SELECT OTP, EXP_TIME INTO p_otp, p_exp_time
    FROM OTP_VERIFY
    WHERE USERNAME = p_username;
END;
$$;


ALTER PROCEDURE public.p_get_otp(IN p_username character varying, OUT p_otp integer, OUT p_exp_time character varying) OWNER TO neondb_owner;

--
-- Name: p_get_payments(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_payments(INOUT p_cursor refcursor)
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


ALTER PROCEDURE public.p_get_payments(INOUT p_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_prop_stats(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_prop_stats(IN p_prop_id integer, OUT p_occupancy_rate numeric, OUT p_monthly_revenue numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    SELECT
        COALESCE((COUNT(L.TENANT_ID)::DECIMAL / NULLIF(MAX(P.PROP_UNIT), 0)) * 100, 0),
        COALESCE(SUM(L.RENT_AMOUNT), 0)
    INTO
        p_occupancy_rate,
        p_monthly_revenue
    FROM PROPERTIES P
    LEFT JOIN LEASES L
        ON P.PROP_ID = L.PROP_ID AND L.LEASE_STATUS = 'Active'
    WHERE P.PROP_ID = p_prop_id;
END;
$$;


ALTER PROCEDURE public.p_get_prop_stats(IN p_prop_id integer, OUT p_occupancy_rate numeric, OUT p_monthly_revenue numeric) OWNER TO neondb_owner;

--
-- Name: p_get_props(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_props(INOUT p_cursor refcursor)
    LANGUAGE plpgsql
    AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        P.PROP_ID,
        P.PROP_NAME,
        P.PROP_STATUS,
        P.PROP_LOC,
        P.PROP_UNIT,
        P.PROP_BUILT,
        P.PROP_IMAGE
    FROM PROPERTIES P
    ORDER BY prop_id DESC ;
END;
$$;


ALTER PROCEDURE public.p_get_props(INOUT p_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_recent_activities(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_recent_activities(INOUT p_cursor refcursor)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    OPEN p_cursor FOR
    SELECT activity_type, activity_date, description FROM (
        SELECT
            'payment' AS activity_type,
            payment_date::timestamp AS activity_date,
            'Rent paid by ' || T.full_name || ' - $' || P.amount AS description
        FROM PAYMENTS P
        JOIN TENANTS T ON P.tenant_id = T.tenant_id

        UNION ALL

        SELECT
            'ticket' AS activity_type,
            request_date::timestamp AS activity_date,
            'New ticket: ' || issue_title AS description
        FROM MAINTENANCE_REQUESTS

        UNION ALL

        SELECT
            'lease' AS activity_type,
            created_at::timestamp AS activity_date,
            'New lease signed for Unit ' || unit_assign AS description
        FROM LEASES
    ) AS activity_log
    ORDER BY activity_date DESC
    LIMIT 5;
END;
$_$;


ALTER PROCEDURE public.p_get_recent_activities(INOUT p_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_revenue_chart_data(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_revenue_chart_data(INOUT p_cursor refcursor)
    LANGUAGE plpgsql
    AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        TO_CHAR(payment_date, 'Mon') AS month_name,
        SUM(amount) AS total_revenue
    FROM PAYMENTS
    WHERE payment_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY DATE_TRUNC('month', payment_date), TO_CHAR(payment_date, 'Mon')
    ORDER BY DATE_TRUNC('month', payment_date);
END;
$$;


ALTER PROCEDURE public.p_get_revenue_chart_data(INOUT p_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_tenant(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_tenant(IN p_username character varying, OUT p_password character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
       SELECT PASSWORD INTO p_password
        FROM TENANT_USERS
        WHERE USERNAME = p_username;
END;
$$;


ALTER PROCEDURE public.p_get_tenant(IN p_username character varying, OUT p_password character varying) OWNER TO neondb_owner;

--
-- Name: p_get_tenant_otp(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_tenant_otp(IN p_username character varying, OUT p_otp integer, OUT p_exp_time character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM TENANT_OTP_VERIFY
    WHERE CAST(exp_time AS TIMESTAMP) < LOCALTIMESTAMP;

    SELECT OTP, EXP_TIME INTO p_otp, p_exp_time
    FROM TENANT_OTP_VERIFY
    WHERE USERNAME = p_username;
END;
$$;


ALTER PROCEDURE public.p_get_tenant_otp(IN p_username character varying, OUT p_otp integer, OUT p_exp_time character varying) OWNER TO neondb_owner;

--
-- Name: p_get_tenant_portal(character varying, refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_tenant_portal(IN p_tenant_email character varying, INOUT cursor refcursor)
    LANGUAGE plpgsql
    AS $$
BEGIN
    OPEN cursor FOR
    SELECT T.full_name, T.tenant_image, T.joined_at, T.status, L.lease_id,
           L.lease_start, L.lease_end, L.lease_status, L.lease_doc_url,
           L.unit_assign, L.rent_amount, L.created_at,
           M.request_id, M.issue_title, M.priority,
           M.status, M.request_date
    FROM tenants T
    LEFT JOIN leases L ON T.tenant_id = L.tenant_id
    LEFT JOIN properties P ON P.prop_id = L.prop_id
    LEFT JOIN maintenance_requests M ON M.lease_id = L.lease_id
    WHERE T.email = p_tenant_email AND L.lease_status = 'Active';
end;
$$;


ALTER PROCEDURE public.p_get_tenant_portal(IN p_tenant_email character varying, INOUT cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_tenants(refcursor); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_tenants(INOUT p_cursor refcursor)
    LANGUAGE plpgsql
    AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        T.TENANT_ID, FULL_NAME, EMAIL, PHONE_NUMBER,
        NATIONAL_ID, TENANT_IMAGE, STATUS, JOINED_AT, P.PROP_NAME, L.UNIT_ASSIGN,
        L.LEASE_START, L.LEASE_END, L.RENT_AMOUNT
    FROM TENANTS T
    JOIN LEASES L ON L.TENANT_ID = T.TENANT_ID
    JOIN PROPERTIES P ON P.PROP_ID = L.PROP_ID
    WHERE LEASE_STATUS = 'Active'
    ORDER BY TENANT_ID DESC
    ;
END;
$$;


ALTER PROCEDURE public.p_get_tenants(INOUT p_cursor refcursor) OWNER TO neondb_owner;

--
-- Name: p_get_user(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_get_user(IN p_username character varying, OUT p_password character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
       SELECT PASSWORD INTO p_password
        FROM USERS
        WHERE USERNAME = p_username;
    END;

$$;


ALTER PROCEDURE public.p_get_user(IN p_username character varying, OUT p_password character varying) OWNER TO neondb_owner;

--
-- Name: p_log_payment(integer, numeric, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_log_payment(IN p_tenant_id integer, IN p_amount numeric, IN p_reference character varying, OUT p_is_accepted boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE v_payable_amount DECIMAL;
BEGIN

    SELECT rent_amount INTO v_payable_amount
    FROM leases
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


ALTER PROCEDURE public.p_log_payment(IN p_tenant_id integer, IN p_amount numeric, IN p_reference character varying, OUT p_is_accepted boolean) OWNER TO neondb_owner;

--
-- Name: p_new_password(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_new_password(IN in_username character varying, IN in_new_pass character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE USERS
    SET PASSWORD = in_new_pass
    WHERE USERNAME = in_username;
END;
$$;


ALTER PROCEDURE public.p_new_password(IN in_username character varying, IN in_new_pass character varying) OWNER TO neondb_owner;

--
-- Name: p_new_tenant(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_new_tenant(IN p_username character varying, IN p_password character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO TENANT_USERS(USERNAME, PASSWORD)
    VALUES (p_username, p_password);
END;
$$;


ALTER PROCEDURE public.p_new_tenant(IN p_username character varying, IN p_password character varying) OWNER TO neondb_owner;

--
-- Name: p_new_tenant_password(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_new_tenant_password(IN in_username character varying, IN in_new_pass character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE TENANT_USERS
    SET PASSWORD = in_new_pass
    WHERE USERNAME = in_username;
END;
$$;


ALTER PROCEDURE public.p_new_tenant_password(IN in_username character varying, IN in_new_pass character varying) OWNER TO neondb_owner;

--
-- Name: p_new_user(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_new_user(IN p_username character varying, IN p_password character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO USERS(USERNAME, PASSWORD)
    VALUES (p_username, p_password);
END;
$$;


ALTER PROCEDURE public.p_new_user(IN p_username character varying, IN p_password character varying) OWNER TO neondb_owner;

--
-- Name: p_update_lease_status(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_lease_status(IN p_lease_id integer, OUT p_lease_status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE LEASES
    SET lease_status = CASE
    WHEN leases.lease_status = 'Active' THEN 'Terminated'
    WHEN leases.lease_status = 'Terminated' THEN 'Active'
    ELSE lease_status
    END
    WHERE leases.lease_id = p_lease_id

    RETURNING lease_status INTO p_lease_status;
END;
$$;


ALTER PROCEDURE public.p_update_lease_status(IN p_lease_id integer, OUT p_lease_status character varying) OWNER TO neondb_owner;

--
-- Name: p_update_maintenance_status(integer, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_maintenance_status(IN p_request_id integer, IN p_new_status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE maintenance_requests
    SET status = p_new_status
    WHERE request_id = p_request_id;
END;
$$;


ALTER PROCEDURE public.p_update_maintenance_status(IN p_request_id integer, IN p_new_status character varying) OWNER TO neondb_owner;

--
-- Name: p_update_pass(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_pass(IN p_username character varying, IN p_password character varying)
    LANGUAGE plpgsql
    AS $$
    BEGIN
        UPDATE USERS
        SET password = p_password
        WHERE username = p_username;
end;
$$;


ALTER PROCEDURE public.p_update_pass(IN p_username character varying, IN p_password character varying) OWNER TO neondb_owner;

--
-- Name: p_update_pay_status(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_pay_status(IN p_pay_id integer, OUT p_pay_status character varying)
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


ALTER PROCEDURE public.p_update_pay_status(IN p_pay_id integer, OUT p_pay_status character varying) OWNER TO neondb_owner;

--
-- Name: p_update_prop_status(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_prop_status(IN p_prop_id integer, OUT p_prop_status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE properties
    SET prop_status = CASE
    WHEN prop_status = 'Active' THEN 'Inactive'
    WHEN prop_status = 'Inactive' THEN 'Active'
    ELSE prop_status
    END
    WHERE prop_id = p_prop_id

    RETURNING prop_status INTO p_prop_status;
END;
$$;


ALTER PROCEDURE public.p_update_prop_status(IN p_prop_id integer, OUT p_prop_status character varying) OWNER TO neondb_owner;

--
-- Name: p_update_tenant_pass(character varying, character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_tenant_pass(IN p_username character varying, IN p_password character varying)
    LANGUAGE plpgsql
    AS $$
    BEGIN
        UPDATE TENANT_USERS
        SET password = p_password
        WHERE username = p_username;
end;
$$;


ALTER PROCEDURE public.p_update_tenant_pass(IN p_username character varying, IN p_password character varying) OWNER TO neondb_owner;

--
-- Name: p_update_tenant_status(integer); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_tenant_status(IN p_tenant_id integer, OUT p_tenant_status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE TENANTS
    SET status = CASE
    WHEN status = 'Active' THEN 'Inactive'
    WHEN status = 'Inactive' THEN 'Active'
    ELSE status
    END
    WHERE tenant_id = p_tenant_id

    RETURNING status INTO p_tenant_status;
END;
$$;


ALTER PROCEDURE public.p_update_tenant_status(IN p_tenant_id integer, OUT p_tenant_status character varying) OWNER TO neondb_owner;

--
-- Name: p_update_tenant_verify_status(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_tenant_verify_status(IN p_username character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE TENANT_USERS
    SET is_verified = TRUE
    WHERE USERNAME = p_username;
END;
$$;


ALTER PROCEDURE public.p_update_tenant_verify_status(IN p_username character varying) OWNER TO neondb_owner;

--
-- Name: p_update_verify_status(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_update_verify_status(IN p_username character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE USERS
    SET is_verified = TRUE
    WHERE USERNAME = p_username;
END;
$$;


ALTER PROCEDURE public.p_update_verify_status(IN p_username character varying) OWNER TO neondb_owner;

--
-- Name: p_verify_tenant(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_verify_tenant(IN p_username character varying, OUT p_is_verified boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
SELECT is_verified INTO p_is_verified
    FROM TENANT_USERS
    WHERE USERNAME = p_username;

END;
$$;


ALTER PROCEDURE public.p_verify_tenant(IN p_username character varying, OUT p_is_verified boolean) OWNER TO neondb_owner;

--
-- Name: p_verify_tenant_admin(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_verify_tenant_admin(IN p_tenant_email character varying, OUT p_is_verified boolean)
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


ALTER PROCEDURE public.p_verify_tenant_admin(IN p_tenant_email character varying, OUT p_is_verified boolean) OWNER TO neondb_owner;

--
-- Name: p_verify_user(character varying); Type: PROCEDURE; Schema: public; Owner: neondb_owner
--

CREATE PROCEDURE public.p_verify_user(IN p_username character varying, OUT p_is_verified boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
SELECT is_verified INTO p_is_verified
    FROM USERS
    WHERE USERNAME = p_username;

END;
$$;


ALTER PROCEDURE public.p_verify_user(IN p_username character varying, OUT p_is_verified boolean) OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.properties (
    prop_id integer CONSTRAINT add_prop_prop_id_not_null NOT NULL,
    prop_name character varying(100) CONSTRAINT add_prop_prop_name_not_null NOT NULL,
    prop_loc text CONSTRAINT add_prop_prop_loc_not_null NOT NULL,
    prop_unit integer CONSTRAINT add_prop_prop_unit_not_null NOT NULL,
    prop_status character varying(30) DEFAULT 'Active'::character varying CONSTRAINT add_prop_prop_status_not_null NOT NULL,
    prop_image text,
    prop_built integer CONSTRAINT add_prop_prop_built_not_null NOT NULL,
    CONSTRAINT add_prop_prop_status_check CHECK (((prop_status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.properties OWNER TO neondb_owner;

--
-- Name: add_prop_prop_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.add_prop_prop_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.add_prop_prop_id_seq OWNER TO neondb_owner;

--
-- Name: add_prop_prop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.add_prop_prop_id_seq OWNED BY public.properties.prop_id;


--
-- Name: leases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leases (
    lease_id integer NOT NULL,
    tenant_id integer NOT NULL,
    prop_id integer NOT NULL,
    unit_assign character varying(50) NOT NULL,
    lease_start date NOT NULL,
    lease_end date NOT NULL,
    rent_amount numeric(10,2) NOT NULL,
    lease_doc_url character varying,
    lease_status character varying(20) DEFAULT 'Active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leases_lease_status_check CHECK (((lease_status)::text = ANY ((ARRAY['Active'::character varying, 'Expired'::character varying, 'Terminated'::character varying])::text[])))
);


ALTER TABLE public.leases OWNER TO neondb_owner;

--
-- Name: leases_lease_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.leases_lease_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leases_lease_id_seq OWNER TO neondb_owner;

--
-- Name: leases_lease_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.leases_lease_id_seq OWNED BY public.leases.lease_id;


--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.maintenance_requests (
    request_id integer NOT NULL,
    lease_id integer NOT NULL,
    issue_title character varying(255) NOT NULL,
    priority character varying(50) DEFAULT 'Low'::character varying NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    description text
);


ALTER TABLE public.maintenance_requests OWNER TO neondb_owner;

--
-- Name: maintenance_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.maintenance_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_requests_request_id_seq OWNER TO neondb_owner;

--
-- Name: maintenance_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.maintenance_requests_request_id_seq OWNED BY public.maintenance_requests.request_id;


--
-- Name: otp_verify; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.otp_verify (
    username character varying(40) NOT NULL,
    otp integer NOT NULL,
    exp_time character varying(30) NOT NULL
);


ALTER TABLE public.otp_verify OWNER TO neondb_owner;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    tenant_id integer NOT NULL,
    amount numeric NOT NULL,
    reference_image character varying,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(50) DEFAULT 'Paid'::character varying NOT NULL
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO neondb_owner;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- Name: tenant_otp_verify; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenant_otp_verify (
    username character varying(40) NOT NULL,
    otp integer NOT NULL,
    exp_time character varying(30) NOT NULL
);


ALTER TABLE public.tenant_otp_verify OWNER TO neondb_owner;

--
-- Name: tenant_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenant_users (
    username character varying(40) NOT NULL,
    password text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tenant_users OWNER TO neondb_owner;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenants (
    tenant_id integer NOT NULL,
    full_name character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    phone_number character varying(20) NOT NULL,
    national_id character varying(40) NOT NULL,
    tenant_image character varying,
    status character varying(30) DEFAULT 'Active'::character varying NOT NULL,
    joined_at date DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.tenants OWNER TO neondb_owner;

--
-- Name: tenants_tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tenants_tenant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_tenant_id_seq OWNER TO neondb_owner;

--
-- Name: tenants_tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tenants_tenant_id_seq OWNED BY public.tenants.tenant_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    username character varying(40) CONSTRAINT login_username_not_null NOT NULL,
    password text CONSTRAINT login_password_not_null NOT NULL,
    is_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: leases lease_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leases ALTER COLUMN lease_id SET DEFAULT nextval('public.leases_lease_id_seq'::regclass);


--
-- Name: maintenance_requests request_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.maintenance_requests ALTER COLUMN request_id SET DEFAULT nextval('public.maintenance_requests_request_id_seq'::regclass);


--
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- Name: properties prop_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.properties ALTER COLUMN prop_id SET DEFAULT nextval('public.add_prop_prop_id_seq'::regclass);


--
-- Name: tenants tenant_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants ALTER COLUMN tenant_id SET DEFAULT nextval('public.tenants_tenant_id_seq'::regclass);


--
-- Data for Name: leases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leases (lease_id, tenant_id, prop_id, unit_assign, lease_start, lease_end, rent_amount, lease_doc_url, lease_status, created_at) FROM stdin;
13	22	25	4	2026-08-05	2027-08-05	1200.00	https://res.cloudinary.com/i40w66o4/image/upload/v1785940869/j0anyjn7g7fk6l5yfdv6.pdf	Active	2026-08-05 14:41:10.33887
\.


--
-- Data for Name: maintenance_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.maintenance_requests (request_id, lease_id, issue_title, priority, status, request_date, description) FROM stdin;
5	13	AC not working	High	Pending	2026-08-05	My bedroom AC is not working, send team as soon as possilbe, it's very hot outside.\n
\.


--
-- Data for Name: otp_verify; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.otp_verify (username, otp, exp_time) FROM stdin;
ah6086395@gmail.com	935257	2026-08-05 16:45:20
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (payment_id, tenant_id, amount, reference_image, payment_date, status) FROM stdin;
6	22	1200	https://res.cloudinary.com/i40w66o4/image/upload/v1785940992/usxfhvwv48p8v2xnrry6.png	2026-08-05	Paid
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.properties (prop_id, prop_name, prop_loc, prop_unit, prop_status, prop_image, prop_built) FROM stdin;
23	Lahore Hotel	DHA Phase 07, Lahore	20	Active	https://res.cloudinary.com/i40w66o4/image/upload/v1785940674/njs4ze1mlx9hhfolhlys.jpg	2020
25	Residental Villas	Islamabad	10	Active	https://res.cloudinary.com/i40w66o4/image/upload/v1785940729/t9nzqvxn1opqvkiwcvik.jpg	2019
\.


--
-- Data for Name: tenant_otp_verify; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenant_otp_verify (username, otp, exp_time) FROM stdin;
adansheikh2024@gmail.com	173749	2026-08-04 18:27:30
ah6086395@gmail.com	796952	2026-08-04 23:16:36
\.


--
-- Data for Name: tenant_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenant_users (username, password, is_verified) FROM stdin;
adansheikh2024@gmail.com	$2b$12$uZKgVMwQOygms1wrBJp5XegqA9MbbWhsL//L4WgIrKLa2PIzITqGm	t
ah6086395@gmail.com	$2b$12$rl8thYkaJjaSLAXe5db/AOT9Y6s8SlOZV5EAGvtZQR2h1XiBm..h2	t
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenants (tenant_id, full_name, email, phone_number, national_id, tenant_image, status, joined_at) FROM stdin;
22	Haris Waheed	ah6086395@gmail.com	03123456786	3510525665903	https://res.cloudinary.com/i40w66o4/image/upload/v1785940868/ik3hnmzjbckx3wjqg4tr.jpg	Active	2026-08-05
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (username, password, is_verified) FROM stdin;
ah6086395@gmail.com	$2b$12$7DO5yKZnLSJSU6nPSXJ5Su6Xkr1M.7lEQbIeuJ7w/RCAsQ7gACf/W	t
\.


--
-- Name: add_prop_prop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.add_prop_prop_id_seq', 25, true);


--
-- Name: leases_lease_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leases_lease_id_seq', 13, true);


--
-- Name: maintenance_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.maintenance_requests_request_id_seq', 5, true);


--
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 6, true);


--
-- Name: tenants_tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tenants_tenant_id_seq', 22, true);


--
-- Name: properties add_prop_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT add_prop_pkey PRIMARY KEY (prop_id);


--
-- Name: properties add_prop_prop_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT add_prop_prop_name_key UNIQUE (prop_name);


--
-- Name: leases leases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT leases_pkey PRIMARY KEY (lease_id);


--
-- Name: users login_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT login_pkey PRIMARY KEY (username);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (request_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: tenant_users tenant_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT tenant_users_pkey PRIMARY KEY (username);


--
-- Name: tenants tenants_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_email_key UNIQUE (email);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (tenant_id);


--
-- Name: maintenance_requests fk_lease; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT fk_lease FOREIGN KEY (lease_id) REFERENCES public.leases(lease_id) ON DELETE CASCADE;


--
-- Name: leases leases_prop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT leases_prop_id_fkey FOREIGN KEY (prop_id) REFERENCES public.properties(prop_id) ON DELETE CASCADE;


--
-- Name: leases leases_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leases
    ADD CONSTRAINT leases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict rb2DkpHgYLIkoN1a2SeGtAqVzRePgePHvqCqthibsxY5iEmboyyfwgYnFKBp8Sr

