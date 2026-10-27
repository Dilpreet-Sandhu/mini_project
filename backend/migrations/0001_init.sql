CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'worker', 'admin')),
    phone TEXT NOT NULL DEFAULT '',
    hostel TEXT,
    room TEXT,
    specialty TEXT CHECK (specialty IN ('electrical','plumbing','carpentry','housekeeping','general')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (role <> 'worker' OR specialty IS NOT NULL),
    CHECK (role <> 'student' OR (hostel IS NOT NULL AND room IS NOT NULL))
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('electrical','plumbing','carpentry','housekeeping','general')),
    priority TEXT NOT NULL CHECK (priority IN ('low','normal','high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','resolved','cancelled')),
    hostel TEXT NOT NULL,
    room TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    CHECK ((status = 'resolved') = (resolved_at IS NOT NULL)),
    CHECK (status <> 'in_progress' OR assigned_to IS NOT NULL)
);
CREATE INDEX complaints_student_idx ON complaints(student_id, created_at DESC);
CREATE INDEX complaints_queue_idx ON complaints(category, status, assigned_to);
CREATE INDEX complaints_worker_idx ON complaints(assigned_to, status);

CREATE TABLE complaint_events (
    id UUID PRIMARY KEY,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id),
    kind TEXT NOT NULL CHECK (kind IN ('created','assigned','started','resolved','reopened','cancelled','comment')),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX complaint_events_thread_idx ON complaint_events(complaint_id, created_at);
