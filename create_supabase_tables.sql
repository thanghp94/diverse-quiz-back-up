
-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS wsc;

-- Create users table
CREATE TABLE IF NOT EXISTS wsc.users (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    assignment_student_try_id TEXT,
    assignment_id TEXT,
    email TEXT,
    topic_id TEXT,
    content_id TEXT,
    typeoftaking TEXT,
    question_id TEXT,
    meraki_email TEXT,
    answer_choice TEXT,
    quiz_result TEXT,
    show TEXT,
    category TEXT,
    session_shown_ids TEXT,
    content_viewed INTEGER,
    total_score INTEGER,
    question_viewed INTEGER,
    time_start TEXT,
    time_end TEXT,
    correct_answer TEXT,
    show_content BOOLEAN,
    current_index INTEGER,
    writing_answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create topic table
CREATE TABLE IF NOT EXISTS wsc.topic (
    id TEXT PRIMARY KEY,
    topic TEXT,
    short_summary TEXT,
    challengesubject TEXT,
    image TEXT,
    parentid TEXT,
    showstudent BOOLEAN
);

-- Create content table
CREATE TABLE IF NOT EXISTS wsc.content (
    id TEXT PRIMARY KEY,
    topicid TEXT,
    imageid TEXT,
    videoid TEXT,
    videoid2 TEXT,
    challengesubject TEXT[],
    parentid TEXT,
    prompt TEXT,
    information TEXT,
    title TEXT NOT NULL,
    short_blurb TEXT,
    second_short_blurb TEXT,
    mindmap TEXT,
    mindmapurl TEXT,
    translation TEXT,
    vocabulary TEXT,
    classdone TEXT,
    studentseen TEXT,
    show TEXT,
    showtranslation TEXT,
    showstudent TEXT,
    "order" TEXT,
    contentgroup TEXT,
    typeoftaking TEXT,
    short_description TEXT,
    url TEXT,
    header TEXT,
    update TEXT,
    imagelink TEXT,
    translation_dictionary JSONB
);

-- Create image table
CREATE TABLE IF NOT EXISTS wsc.image (
    id TEXT PRIMARY KEY,
    imagelink TEXT,
    contentid TEXT,
    "default" TEXT,
    description TEXT,
    imagefile TEXT,
    name TEXT,
    questionid TEXT,
    showimage TEXT,
    topicid TEXT
);

-- Create question table
CREATE TABLE IF NOT EXISTS wsc.question (
    id TEXT PRIMARY KEY,
    topic TEXT,
    randomorder TEXT,
    questionlevel TEXT,
    contentid TEXT,
    question_type TEXT,
    noi_dung TEXT,
    video TEXT,
    picture TEXT,
    cau_tra_loi_1 TEXT,
    cau_tra_loi_2 TEXT,
    cau_tra_loi_3 TEXT,
    cau_tra_loi_4 TEXT,
    correct_choice TEXT,
    writing_choice TEXT,
    "time" TEXT,
    explanation TEXT,
    questionorder TEXT,
    tg_tao TEXT,
    answer TEXT
);

-- Create matching table
CREATE TABLE IF NOT EXISTS wsc.matching (
    id TEXT PRIMARY KEY,
    type TEXT,
    subject TEXT,
    topic TEXT,
    description TEXT,
    prompt1 TEXT,
    prompt2 TEXT,
    prompt3 TEXT,
    prompt4 TEXT,
    prompt5 TEXT,
    prompt6 TEXT,
    choice1 TEXT,
    choice2 TEXT,
    choice3 TEXT,
    choice4 TEXT,
    choice5 TEXT,
    choice6 TEXT,
    topicid TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video table
CREATE TABLE IF NOT EXISTS wsc.video (
    id TEXT PRIMARY KEY,
    topicid TEXT,
    contentid TEXT,
    videolink TEXT,
    videoupload TEXT,
    showvideo TEXT,
    video_name TEXT,
    description TEXT,
    first TEXT,
    second TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matching_attempts table
CREATE TABLE IF NOT EXISTS wsc.matching_attempts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    matching_id TEXT NOT NULL,
    answers JSONB,
    score INTEGER,
    max_score INTEGER,
    is_correct BOOLEAN,
    time_start TIMESTAMPTZ DEFAULT NOW(),
    time_end TIMESTAMPTZ,
    duration_seconds INTEGER,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment table
CREATE TABLE IF NOT EXISTS wsc.assignment (
    id TEXT PRIMARY KEY,
    assignmentname TEXT,
    category TEXT,
    contentid TEXT,
    description TEXT,
    expiring_date TEXT,
    imagelink TEXT,
    noofquestion INTEGER,
    question_id TEXT,
    status TEXT,
    subject TEXT,
    testtype TEXT,
    tg_tao TEXT,
    topicid TEXT,
    type TEXT,
    typeofquestion TEXT,
    update TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment_student_try table
CREATE TABLE IF NOT EXISTS wsc.assignment_student_try (
    id SERIAL PRIMARY KEY,
    assignmentid TEXT,
    contentid TEXT,
    end_time TEXT,
    hocsinh_id TEXT,
    questionids TEXT,
    start_time TEXT,
    typeoftaking TEXT,
    update TEXT
);

-- Create student_try table
CREATE TABLE IF NOT EXISTS wsc.student_try (
    id TEXT PRIMARY KEY,
    answer_choice TEXT,
    assignment_student_try_id TEXT,
    currentindex INTEGER,
    hocsinh_id TEXT,
    question_id TEXT,
    quiz_result TEXT,
    score INTEGER,
    showcontent TEXT,
    time_end TIMESTAMPTZ,
    time_start TIMESTAMPTZ,
    update TIMESTAMPTZ,
    writing_answer TEXT
);

-- Create student_try_content table
CREATE TABLE IF NOT EXISTS wsc.student_try_content (
    id TEXT PRIMARY KEY,
    contentid TEXT,
    hocsinh_id TEXT,
    student_try_id TEXT,
    time_end TIMESTAMPTZ,
    time_start TIMESTAMPTZ,
    update TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_ratings table
CREATE TABLE IF NOT EXISTS wsc.content_ratings (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    rating TEXT NOT NULL,
    personal_note TEXT,
    view_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_streaks table
CREATE TABLE IF NOT EXISTS wsc.student_streaks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_activities table
CREATE TABLE IF NOT EXISTS wsc.daily_activities (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    activity_date TIMESTAMPTZ NOT NULL,
    activities_count INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create writing_prompts table
CREATE TABLE IF NOT EXISTS wsc.writing_prompts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    prompts JSONB,
    suggestions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create writing_submissions table
CREATE TABLE IF NOT EXISTS wsc.writing_submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    title TEXT,
    opening_paragraph TEXT,
    body_paragraph_1 TEXT,
    body_paragraph_2 TEXT,
    body_paragraph_3 TEXT,
    conclusion_paragraph TEXT,
    full_essay TEXT,
    ai_feedback JSONB,
    overall_score INTEGER,
    paragraph_scores JSONB,
    word_count INTEGER,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning_progress table
CREATE TABLE IF NOT EXISTS wsc.learning_progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    topic_id TEXT,
    content_id TEXT,
    status TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    score INTEGER,
    completed_at TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cron_jobs table
CREATE TABLE IF NOT EXISTS wsc.cron_jobs (
    id TEXT PRIMARY KEY,
    job_name TEXT NOT NULL,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pending_access_requests table
CREATE TABLE IF NOT EXISTS wsc.pending_access_requests (
    id TEXT PRIMARY KEY,
    google_email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    google_id TEXT NOT NULL,
    request_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    processed_by TEXT
);

-- Create content_views table
CREATE TABLE IF NOT EXISTS wsc.content_views (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    view_date TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enhanced_content_ratings table
CREATE TABLE IF NOT EXISTS wsc.enhanced_content_ratings (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    rating TEXT NOT NULL,
    feedback TEXT,
    difficulty_score INTEGER,
    engagement_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS wsc.quiz_attempts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_choice TEXT,
    is_correct BOOLEAN,
    time_start TIMESTAMPTZ,
    time_end TIMESTAMPTZ,
    score INTEGER,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_activities table
CREATE TABLE IF NOT EXISTS wsc.session_activities (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    activity_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_participants table
CREATE TABLE IF NOT EXISTS wsc.session_participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS wsc.sessions (
    id TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    teacher_id TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    session_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_badges table
CREATE TABLE IF NOT EXISTS wsc.student_badges (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    criteria_met JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teaching_sessions table
CREATE TABLE IF NOT EXISTS wsc.teaching_sessions (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    session_name TEXT NOT NULL,
    topic_id TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    participant_count INTEGER DEFAULT 0,
    session_status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employees table (for the policy example)
CREATE TABLE IF NOT EXISTS wsc.employees (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for all tables
ALTER TABLE wsc.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.topic ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.image ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.question ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.matching ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.video ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.matching_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.assignment_student_try ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.student_try ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.student_try_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.student_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.writing_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.writing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.pending_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.enhanced_content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.teaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsc.employees ENABLE ROW LEVEL SECURITY;

-- Create policy for the employees table
CREATE POLICY "Allow all operations" ON wsc.employees 
FOR ALL USING (true);

-- Optional: Create similar policies for other tables if needed
-- Example for users table:
-- CREATE POLICY "Allow all operations" ON wsc.users 
-- FOR ALL USING (true);
