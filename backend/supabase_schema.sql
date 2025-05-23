-- Users (Supabase Auth handles most, but for metadata/quota)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    daily_quota INT DEFAULT 100,
    questions_asked_today INT DEFAULT 0,
    last_quota_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    text_path TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_size INT,
    page_count INT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_shared BOOLEAN DEFAULT FALSE,
    share_token TEXT
);

-- Messages (with threading)
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_id BIGINT REFERENCES public.messages(id)
);

-- LLM Response Cache
CREATE TABLE IF NOT EXISTS public.llm_cache (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES public.documents(id),
    question TEXT,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exports
CREATE TABLE IF NOT EXISTS public.exports (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES public.chat_sessions(id),
    user_id uuid REFERENCES public.users(id),
    export_type TEXT, -- 'pdf' or 'md'
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics
CREATE TABLE IF NOT EXISTS public.analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    document_id BIGINT REFERENCES public.documents(id),
    session_id BIGINT REFERENCES public.chat_sessions(id),
    question_id BIGINT REFERENCES public.messages(id),
    response_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 