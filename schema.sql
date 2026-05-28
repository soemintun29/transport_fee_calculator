-- Transportation Fee Calculator Schema

-- 1. MIMU Locations (Townships and Wards)
CREATE TABLE IF NOT EXISTS public.mimu_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL,
    township TEXT NOT NULL,
    ward_en TEXT,
    ward_mm TEXT,
    centroid_lat NUMERIC,
    centroid_lng NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Service Center Configuration
CREATE TABLE IF NOT EXISTS public.service_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region TEXT NOT NULL, -- 'Yangon' or 'Mandalay'
    name TEXT NOT NULL,   -- Branch Name
    center_lat NUMERIC NOT NULL,
    center_lng NUMERIC NOT NULL,
    base_fee NUMERIC DEFAULT 0,
    base_distance NUMERIC DEFAULT 0, -- km included in base fee
    fee_per_km NUMERIC DEFAULT 0,
    bike_base_fee NUMERIC DEFAULT 0,
    bike_base_distance NUMERIC DEFAULT 0,
    bike_fee_per_km NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(region, name)
);

-- 3. RLS Policies
ALTER TABLE public.mimu_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read for all users' AND tablename = 'mimu_locations') THEN
        CREATE POLICY "Allow read for all users" ON public.mimu_locations FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read for all users' AND tablename = 'service_config') THEN
        CREATE POLICY "Allow read for all users" ON public.service_config FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Supervisors can update config' AND tablename = 'service_config') THEN
        CREATE POLICY "Supervisors can update config" ON public.service_config FOR ALL USING (true);
    END IF;
END $$;

-- Initial Data for Service Centers
INSERT INTO public.service_config (region, name, center_lat, center_lng, base_fee, base_distance, fee_per_km, bike_base_fee, bike_base_distance, bike_fee_per_km)
VALUES 
('Yangon', 'Yangon Main SC', 16.8661, 96.1951, 5000, 5, 1000, 3000, 5, 500),
('Mandalay', 'Mandalay Main SC', 21.9588, 96.0891, 5000, 5, 1000, 3000, 5, 500)
ON CONFLICT (region, name) DO NOTHING;

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS public.transport_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    customer_name TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    wo_number TEXT,
    agreed_fee INTEGER NOT NULL,
    vehicle_type TEXT NOT NULL,
    service_center_name TEXT NOT NULL,
    distance_km DECIMAL NOT NULL,
    scheduled_date DATE
);

ALTER TABLE public.transport_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert for all users' AND tablename = 'transport_audit_log') THEN
        CREATE POLICY "Allow insert for all users" ON public.transport_audit_log FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read for all users' AND tablename = 'transport_audit_log') THEN
        CREATE POLICY "Allow read for all users" ON public.transport_audit_log FOR SELECT USING (true);
    END IF;
END $$;
