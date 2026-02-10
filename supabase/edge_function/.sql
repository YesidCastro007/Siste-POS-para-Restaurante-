create table mesas (
  id uuid primary key default gen_random_uuid(),
  numero int,
  estado text
);
