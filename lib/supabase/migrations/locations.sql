-- Note: This table already exists in your database with the correct schema
-- Only run the index and policy creation parts below

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS locations_user_id_idx ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS locations_user_home_idx ON public.locations(user_id, show_in_home);

-- Enable Row Level Security (RLS)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own locations" ON public.locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations" ON public.locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" ON public.locations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" ON public.locations
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON public.locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();