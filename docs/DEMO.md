# A five-minute teacher walkthrough

Start PostgreSQL, seed the database, start the backend and open Expo. All demo accounts use `Roomline123!`.

1. **Student** — Sign in as `student@roomline.local`. Show the active request list, category buttons, search and status filters. Open an existing complaint to show the location, deadline and thread. Return and tap **+**. Submit “Ceiling light stopped working”, choose Electrical, add details and select normal priority.
2. **Directory and profile** — Show People with specialty filters and worker phone/email details. Show the student's hostel and room in Profile. Sign out.
3. **Worker** — Sign in as `electrician@roomline.local`. Find the new electrical complaint. Accept it, start work, add a message, then select **Mark as fixed** and describe the repair. Show History. The worker cannot see other specialties' unassigned complaints. Sign out.
4. **Student confirmation** — Sign back in as the student, open History and show the repaired request with its audit events and worker note. If desired, reopen it with an explanation; it returns to the electrical queue with a fresh service target. Sign out.
5. **Administrator** — Sign in as `admin@roomline.local`. Show Overview: total, overdue, unassigned, completed counts, on-time percentage and average time for each worker. The seed includes an overdue electrical request. Open Requests, select a pending job and assign a specialist. Open People and show the add-worker form.

## Explain the technical choices

- Expo gives one TypeScript/React Native codebase for Android and iOS, plus a web preview.
- Zustand stores the signed-in user, session, complaints, worker directory and administrator statistics. Screen-only form inputs use local React state.
- The Rust backend follows the same feature-folder and service-class pattern as the reference repository. Handlers receive requests; services validate access and execute SQL.
- PostgreSQL stores users, complaints and immutable thread/audit events. Each workflow update and its audit event are committed in one transaction.
- JWT middleware verifies the signature and expiry, then loads the user's current role from the database. The frontend's hidden tabs are not the authorization boundary.
- Worker acceptance uses a conditional SQL update. A job already accepted by another worker returns a conflict.
- UI updates are REST polling every 20 seconds while the app is active. Pull-to-refresh updates lists immediately. Thread messages persist in PostgreSQL.

For a short demonstration, use seeded accounts. Creating a public student account is also supported. Initial worker passwords are set by the administrator; password recovery and push notifications are possible future enhancements.
