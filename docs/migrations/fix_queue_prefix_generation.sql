-- Migration: Fix queue ticket number prefix generation and dynamic pad length
-- Description:
--   Resolves issue where multi-digit or alphanumeric queue prefixes (e.g. '67', '10', 'LAB')
--   caused regexp_replace(..., '^[A-Za-z0-9]', '') to only strip the first character,
--   treating the remaining prefix characters as part of the integer counter.
--   This caused numbers like 67001 to truncate and shift digits left (67700, 67770, 67777),
--   eventually colliding, crashing, or returning empty queue tickets on kiosk prints.
--
-- Fix:
--   1. Dynamic prefix offset via substring(p."patientNum" from (length(p_prefix) + 1)).
--   2. Safe starts_with check preventing SQL wildcard corruption.
--   3. Integration with services.queue_pad_length (defaulting to 3).
--   4. No-truncation padding using greatest(v_pad_length, length(v_next_num::text)).
--   5. Timezone-safe start-of-day calculation in Asia/Manila (+08:00).

CREATE OR REPLACE FUNCTION "public"."create_patient"(
  "p_service" "text",
  "p_subcategory" "text",
  "p_preferred_cubicles" "text"[],
  "p_prefix" "text",
  "p_group_by_subcategory" boolean,
  "p_phone" "text" DEFAULT NULL::"text"
) RETURNS TABLE("id" bigint, "patientNum" "text", "queue_position" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
#variable_conflict use_column
declare
  v_next_num integer;
  v_patient_num text;
  v_next_position integer;
  v_today_start timestamptz := (date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila');
  v_tomorrow timestamptz := v_today_start + interval '1 day';
  v_new_id bigint;
  v_pad_length integer := 3;
  v_prefix_len integer;
begin
  perform pg_advisory_xact_lock(hashtext('create_patient'));

  -- Look up custom pad length from services table if configured
  select coalesce(s.queue_pad_length, 3)
  into v_pad_length
  from services s
  where s.label_en = p_service
  limit 1;

  if v_pad_length is null or v_pad_length < 1 then
    v_pad_length := 3;
  end if;

  v_prefix_len := length(coalesce(p_prefix, ''));

  select coalesce(max(p.queue_position), 0) + 1
  into v_next_position
  from patients p;

  select coalesce(max(
    case
      when v_prefix_len > 0
        and starts_with(p."patientNum", p_prefix)
        and substring(p."patientNum" from (v_prefix_len + 1)) ~ '^[0-9]+$'
        and length(substring(p."patientNum" from (v_prefix_len + 1))) <= 6
      then substring(p."patientNum" from (v_prefix_len + 1))::integer
      else 0
    end
  ), 0) + 1
  into v_next_num
  from patients p
  where p.service = p_service
    and p.created_at >= v_today_start
    and p.created_at <  v_tomorrow
    and (v_prefix_len = 0 or starts_with(p."patientNum", p_prefix))
    and (not p_group_by_subcategory or p.subcategory = p_subcategory);

  v_patient_num := coalesce(p_prefix, '') || lpad(v_next_num::text, greatest(v_pad_length, length(v_next_num::text)), '0');

  insert into patients (
    "patientNum",
    service,
    status,
    "phoneNum",
    "cubicleNum",
    queue_position,
    subcategory,
    "preferredCubicleNums"
  )
  values (
    v_patient_num,
    p_service,
    'On Progress',
    case when p_phone is null or p_phone = '' then null else p_phone::bigint end,
    null,
    v_next_position,
    p_subcategory,
    p_preferred_cubicles
  )
  returning patients.id into v_new_id;

  return query select v_new_id, v_patient_num, v_next_position;
end;
$$;

ALTER FUNCTION "public"."create_patient"("p_service" "text", "p_subcategory" "text", "p_preferred_cubicles" "text"[], "p_prefix" "text", "p_group_by_subcategory" boolean, "p_phone" "text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."create_patient"("p_service" "text", "p_subcategory" "text", "p_preferred_cubicles" "text"[], "p_prefix" "text", "p_group_by_subcategory" boolean, "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_patient"("p_service" "text", "p_subcategory" "text", "p_preferred_cubicles" "text"[], "p_prefix" "text", "p_group_by_subcategory" boolean, "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_patient"("p_service" "text", "p_subcategory" "text", "p_preferred_cubicles" "text"[], "p_prefix" "text", "p_group_by_subcategory" boolean, "p_phone" "text") TO "service_role";
