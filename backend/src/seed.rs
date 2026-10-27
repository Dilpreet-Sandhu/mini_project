use crate::{auth::service::AuthService, complaint::service::ComplaintService, error::AppError};
use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn run(pool: &PgPool) -> Result<(), AppError> {
    let password = AuthService::hash_password("Roomline123!".into()).await?;
    let mut tx = pool.begin().await?;
    let accounts = [
        (
            1_u128,
            "Aarav Singh",
            "student@roomline.local",
            "student",
            "9876500001",
            None,
        ),
        (
            2,
            "Kabir Sharma",
            "electrician@roomline.local",
            "worker",
            "9876500002",
            Some("electrical"),
        ),
        (
            3,
            "Meera Kaur",
            "plumber@roomline.local",
            "worker",
            "9876500003",
            Some("plumbing"),
        ),
        (
            4,
            "Rohan Verma",
            "carpenter@roomline.local",
            "worker",
            "9876500004",
            Some("carpentry"),
        ),
        (
            5,
            "Simran Gill",
            "housekeeping@roomline.local",
            "worker",
            "9876500005",
            Some("housekeeping"),
        ),
        (
            6,
            "Dev Patel",
            "general@roomline.local",
            "worker",
            "9876500006",
            Some("general"),
        ),
        (
            7,
            "Hostel Administrator",
            "admin@roomline.local",
            "admin",
            "9876500007",
            None,
        ),
        (
            8,
            "Isha Kapoor",
            "student2@roomline.local",
            "student",
            "9876500008",
            None,
        ),
    ];
    for (id, name, email, role, phone, specialty) in accounts {
        sqlx::query("INSERT INTO users (id,name,email,password,role,phone,hostel,room,specialty) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING")
            .bind(Uuid::from_u128(id)).bind(name).bind(email).bind(&password).bind(role).bind(phone)
            .bind(if role == "student" { Some("Maple House") } else { None })
            .bind(if role == "student" { Some(if id == 8 { "B-108" } else { "B-204" }) } else { None })
            .bind(specialty).execute(&mut *tx).await?;
    }
    let examples = [
        (
            101_u128,
            1_u128,
            None,
            "Ceiling fan stopped working",
            "The fan in my room does not turn on, even after checking the wall switch. Please take a look.",
            "electrical",
            "high",
            "pending",
            2_i64,
        ),
        (
            102,
            1,
            Some(3_u128),
            "Bathroom tap keeps dripping",
            "The bathroom tap leaks continuously. The water is collecting near the drain.",
            "plumbing",
            "normal",
            "in_progress",
            18,
        ),
        (
            103,
            1,
            Some(2),
            "Study light is flickering",
            "The desk tube light flickers after a few minutes of use. It is difficult to study at night.",
            "electrical",
            "normal",
            "resolved",
            48,
        ),
        (
            104,
            1,
            Some(4),
            "Wardrobe door is loose",
            "The left door of the wardrobe is hanging loose at the top hinge and needs tightening.",
            "carpentry",
            "low",
            "resolved",
            96,
        ),
        (
            105,
            8,
            Some(2),
            "Power socket has stopped working",
            "The socket next to the desk is not supplying power. Other sockets in the room work normally.",
            "electrical",
            "high",
            "in_progress",
            30,
        ),
        (
            106,
            8,
            None,
            "Common room needs cleaning",
            "The floor near the shared dining area needs cleaning after yesterday's event.",
            "housekeeping",
            "normal",
            "pending",
            10,
        ),
    ];
    for (id, student, worker, title, description, category, priority, status, hours) in examples {
        let id = Uuid::from_u128(id);
        let created = Utc::now() - Duration::hours(hours);
        let resolved = if status == "resolved" {
            Some(created + Duration::hours(if category == "electrical" { 12 } else { 20 }))
        } else {
            None
        };
        let result = sqlx::query("INSERT INTO complaints (id,student_id,assigned_to,title,description,category,priority,status,hostel,room,created_at,updated_at,cycle_started_at,due_at,resolved_at,resolution_note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Maple House',$9,$10,$11,$10,$12,$13,$14) ON CONFLICT DO NOTHING")
            .bind(id).bind(Uuid::from_u128(student)).bind(worker.map(Uuid::from_u128))
            .bind(title).bind(description).bind(category).bind(priority).bind(status)
            .bind(if student == 8 { "B-108" } else { "B-204" }).bind(created).bind(resolved.unwrap_or(created))
            .bind(created + Duration::hours(ComplaintService::sla_hours(priority)?))
            .bind(resolved).bind(if status == "resolved" { Some("Replaced the faulty part and tested it with the student.") } else { None })
            .execute(&mut *tx).await?;
        if result.rows_affected() == 0 {
            continue;
        }
        for (offset, actor, kind, body) in [
            (
                0_i64,
                student,
                "created",
                "Complaint submitted to the specialist queue",
            ),
            (
                1,
                worker.unwrap_or(student),
                "assigned",
                "Accepted the complaint",
            ),
            (
                2,
                worker.unwrap_or(student),
                "started",
                "Work has started on this complaint",
            ),
            (
                3,
                worker.unwrap_or(student),
                "resolved",
                "Replaced the faulty part and tested it with the student.",
            ),
        ] {
            if offset == 1 && worker.is_none() {
                continue;
            }
            if offset == 2 && status == "pending" {
                continue;
            }
            if offset == 3 && status != "resolved" {
                continue;
            }
            sqlx::query("INSERT INTO complaint_events (id,complaint_id,actor_id,kind,body,created_at) VALUES ($1,$2,$3,$4,$5,$6)")
                .bind(Uuid::new_v4()).bind(id).bind(Uuid::from_u128(actor)).bind(kind).bind(body)
                .bind(if offset == 3 { resolved.unwrap_or(created) } else { created + Duration::minutes(offset * 10) }).execute(&mut *tx).await?;
        }
    }
    tx.commit().await?;
    println!("Demo data ready. Password for all demo accounts: Roomline123!");
    println!(
        "Student: student@roomline.local | Worker: electrician@roomline.local | Admin: admin@roomline.local"
    );
    Ok(())
}
