# Verification notes

Prepared on 26 October 2026.

## Passed

- Rust compilation with Rust 1.97.1 and the committed Cargo.lock.
- Rust formatting and Clippy across all targets, with warnings treated as errors.
- Two Rust authentication/validation tests.
- Full API workflow integration test: demo login, student registration, rejection of public role escalation, duplicate email, no password hashes in responses, worker directory, authorization and ownership checks, specialist visibility, competing claim requests with exactly one success, invalid transitions, messages, start/resolve, required resolution note, reopening, specialty-safe administrator assignment, overdue counts and cancellation.
- TypeScript check with no errors.
- Expo Doctor: all 20 compatibility/configuration checks passed.
- Three frontend tests for overdue status and deadline boundary presentation.
- Expo SDK 58 exports for Android, iOS and web. Native exports include Hermes bundles; this is not a signed APK/IPA build.
- Browser smoke checks against the real running Rust API: student sign-in, live complaint list, complaint detail/thread, profile, logout, administrator statistics and contacts, and a worker accepting, starting and completing a repair with a required note (see screenshots).

## Environment limits

Docker Desktop could not start in the preparation environment. A native temporary PostgreSQL server was also prevented from allocating shared memory. The API integration test was therefore run against PGlite (the PostgreSQL WASM engine) over its PostgreSQL wire-protocol adapter, with a single database connection. The two claim requests were issued concurrently through the application, but this does **not** validate native PostgreSQL lock scheduling under multiple database connections. The committed test defaults to eight connections when run against your Docker PostgreSQL instance. Run the README's integration-test command there before your presentation.

Android/iOS bundles compiled successfully, but no physical device, emulator, native signed build or camera/phone-handler integration was exercised here. Check your matching Expo Go/development build and Wi-Fi API address on your device.

`npm audit` reports upstream advisories in Expo CLI tooling dependencies (`node-forge` and `zod`, inherited through the Expo toolchain). This project does not call these libraries directly. The registry did not provide a patched compatible Expo toolchain during preparation; no forced major-version downgrade or incompatible override was applied. Review upstream updates before any public deployment.

## Reproduce

See the README's Checks section. Use a dedicated `roomline_test` PostgreSQL database for integration tests. No test-only database package or temporary server is a dependency of the delivered application.
