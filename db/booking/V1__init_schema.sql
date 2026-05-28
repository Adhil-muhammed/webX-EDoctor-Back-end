-- booking-service initial schema
-- Tables derived from BookingModel and the BookingStatus union type
-- ('pending' | 'confirmed' | 'cancelled').

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE IF NOT EXISTS bookings (
  id          UUID           PRIMARY KEY,
  patient_id  UUID           NOT NULL,
  provider_id UUID           NOT NULL,
  starts_at   TIMESTAMPTZ    NOT NULL,
  status      booking_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_patient_id  ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_starts_at   ON bookings(starts_at);
