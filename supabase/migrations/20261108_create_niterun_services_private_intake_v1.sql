-- NiteRun Services — private consented request ledger.
-- Production migration: additive, no changes to other NITERUN products.
CREATE TABLE IF NOT EXISTS public.nr_service_requests_v1 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  service_key text NOT NULL CHECK (service_key IN ('cleaning','detailing','washing','holiday-lights')),
  city_key text NOT NULL CHECK (city_key IN ('wilmington','raleigh','charlotte')),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 180),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 32),
  postal_code text NOT NULL DEFAULT '' CHECK (char_length(postal_code) <= 10),
  timing_key text NOT NULL CHECK (timing_key IN ('asap','week','month','flexible')),
  details text NOT NULL CHECK (char_length(details) BETWEEN 12 AND 1200),
  contact_consent_at timestamptz NOT NULL,
  source_utm text NOT NULL DEFAULT 'direct' CHECK (char_length(source_utm) <= 65),
  campaign_utm text NOT NULL DEFAULT '' CHECK (char_length(campaign_utm) <= 65),
  landing_path text NOT NULL DEFAULT '' CHECK (char_length(landing_path) <= 180),
  ip_hash text NOT NULL CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
  submission_hash text NOT NULL UNIQUE CHECK (submission_hash ~ '^[a-f0-9]{64}$'),
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','reviewing','qualified','quoted','booked','completed','declined','cancelled')),
  provider_verified boolean NOT NULL DEFAULT false,
  booking_confirmed_at timestamptz,
  first_response_at timestamptz,
  quote_cents integer CHECK (quote_cents IS NULL OR quote_cents >= 0),
  verified_payment_cents integer NOT NULL DEFAULT 0 CHECK (verified_payment_cents >= 0)
);
CREATE INDEX IF NOT EXISTS nr_services_city_service_created_v1
  ON public.nr_service_requests_v1(city_key,service_key,created_at DESC);
CREATE INDEX IF NOT EXISTS nr_services_triage_created_v1
  ON public.nr_service_requests_v1(stage,created_at DESC);
CREATE INDEX IF NOT EXISTS nr_services_ip_rate_v1
  ON public.nr_service_requests_v1(ip_hash,created_at DESC);

CREATE TABLE IF NOT EXISTS public.nr_service_outbox_v1 (
  request_id uuid PRIMARY KEY REFERENCES public.nr_service_requests_v1(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  state text NOT NULL DEFAULT 'pending_human_review'
    CHECK (state IN ('pending_human_review','reviewed','cancelled')),
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS nr_services_outbox_pending_v1
  ON public.nr_service_outbox_v1(state,created_at DESC);

CREATE OR REPLACE FUNCTION public.nr_services_capture_outbox_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.nr_service_outbox_v1(request_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS nr_services_new_request_outbox_v1 ON public.nr_service_requests_v1;
CREATE TRIGGER nr_services_new_request_outbox_v1
AFTER INSERT ON public.nr_service_requests_v1
FOR EACH ROW EXECUTE FUNCTION public.nr_services_capture_outbox_v1();

ALTER TABLE public.nr_service_requests_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nr_service_outbox_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nr_service_requests_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.nr_service_outbox_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nr_services_capture_outbox_v1() FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.nr_service_requests_v1 TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.nr_service_outbox_v1 TO service_role;
COMMENT ON TABLE public.nr_service_requests_v1 IS 'Private NiteRun Services buyer inquiries. An inquiry is not a booking, verified provider, or paid transaction.';
COMMENT ON TABLE public.nr_service_outbox_v1 IS 'Private human-review queue. This table does not send email, SMS, or payment instructions.';
