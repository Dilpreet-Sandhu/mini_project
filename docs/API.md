# Roomline API

Base URL: `http://localhost:3000`. JSON requests use `Content-Type: application/json`. Protected routes require `Authorization: Bearer <access_token>`.

Successful responses are `{ "data": ..., "message": "..." }`. Application errors return `{ "message": "..." }` with the appropriate status: 400 validation, 401 authentication, 403 access denied, 404 unknown record, 409 stale/invalid transition or duplicate email, 500 internal error. Axum may return plain text for malformed JSON, invalid paths, unsupported content types or unknown fields (422).

## Routes

| Method | Path | Access | Request / result |
| --- | --- | --- | --- |
| GET | `/health` | Public | `{status:"ok"}` (outside the envelope) |
| POST | `/auth/register` | Public | `name,email,password,phone,hostel,room` → token + student |
| POST | `/auth/login` | Public | `email,password` → token + user |
| GET | `/user/me` | Signed in | Current profile |
| PATCH | `/user/me` | Signed in | `name,phone,hostel?,room?` → saved profile |
| GET | `/user/workers` | Signed in | Worker directory, without password hashes |
| GET | `/complaint` | Signed in | Server-filtered complaint list, newest first |
| POST | `/complaint` | Student | `title,description,category,priority` → detail |
| GET | `/complaint/{id}` | Authorized participant | Complaint and ordered events |
| POST | `/complaint/{id}/claim` | Matching worker | No body → detail |
| PATCH | `/complaint/{id}/status` | Owner/assigned worker | `status,note?` → detail |
| POST | `/complaint/{id}/comment` | Authorized participant | `body` → detail |
| PATCH | `/complaint/{id}/assign` | Admin | `worker_id` → detail |
| GET | `/admin/stats` | Admin | `overview` + `workers` metrics |
| POST | `/admin/workers` | Admin | `name,email,password,phone,specialty` → worker |

Collection URLs have **no trailing slash**.

Categories/specialties: `electrical`, `plumbing`, `carpentry`, `housekeeping`, `general`.
Priorities: `low`, `normal`, `high`. Statuses: `pending`, `in_progress`, `resolved`, `cancelled`.

`GET /complaint/{id}` and mutation responses return:

```json
{
  "data": {
    "complaint": {
      "id": "uuid",
      "student_id": "uuid",
      "assigned_to": null,
      "title": "Ceiling fan stopped working",
      "description": "The fan does not turn on when I use the wall switch.",
      "category": "electrical",
      "priority": "normal",
      "status": "pending",
      "hostel": "Maple House",
      "room": "B-204",
      "student_name": "Aarav Singh",
      "student_phone": "9876500001",
      "worker_name": null,
      "created_at": "2026-10-26T09:00:00Z",
      "updated_at": "2026-10-26T09:00:00Z",
      "cycle_started_at": "2026-10-26T09:00:00Z",
      "due_at": "2026-10-29T09:00:00Z",
      "resolved_at": null,
      "resolution_note": null
    },
    "events": []
  },
  "message": "Complaint fetched"
}
```

Events include `id,complaint_id,actor_id,actor_name,actor_role,kind,body,created_at`. Kinds: `created,assigned,started,resolved,reopened,cancelled,comment`.

## Visibility

Students can read only their own complaints. Workers can read their assigned complaints (including resolved/cancelled ones), plus unassigned **pending** complaints matching their specialty. Administrators can read all complaints. Contacts are visible to signed-in users. Every data access and workflow action is checked on the server.

Room details are copied from the student profile when a complaint is created, preserving its original location even if the student later moves. Profile changes cannot alter a user's role or specialty. Registration rejects extra fields including `role`.

## Status changes

```json
{"status":"in_progress"}
```

Assigned worker, from pending only.

```json
{"status":"resolved","note":"Replaced the capacitor and tested the fan."}
```

Assigned worker, from in-progress only. Resolution note: 5–2000 characters.

```json
{"status":"pending","note":"The same problem is happening again."}
```

Owning student, from resolved only. Reopen reason: 5–2000 characters. Resets assignment, completion data, deadline and cycle start. Keeps the original complaint and its audit events.

```json
{"status":"cancelled"}
```

Owning student, from pending only. A cancelled thread cannot receive new comments.

Title: 4–120 characters; description: 10–3000; comment: 1–2000; name: 2–80; hostel: 1–80; room: 1–20; phone: 7–24. Passwords are 8–72 UTF-8 bytes due to bcrypt's input limit. Times are stored in UTC and displayed in the device's local time. Access tokens expire after 24 hours.
