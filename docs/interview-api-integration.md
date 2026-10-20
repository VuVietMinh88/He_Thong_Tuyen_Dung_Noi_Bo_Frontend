# Interview API integration — release dependency

Frontend base: `4ab577e8f5490ddd52b3f7331f0c75d5fbd3712e` (`develop`).
Backend contract: PR #191, `faba268fc3e174e2d11463db325f2ba021292342`.
At verification this Backend PR was open, not merged or deployed; its CI succeeded.
Backend `develop` was `c6c374d686d4f02e252832d8ed81d4583926c840` and does not provide these features.
This Frontend branch must not be deployed against that older Backend.

## Requests (relative to VITE_API_BASE_URL ending in /api/v1)

| Operation | Endpoint |
| --- | --- |
| Create/list interview | POST/GET `/applications/{applicationId}/interviews` |
| Personal calendar | GET `/interviews/me` (server chooses authenticated user) |
| Edit/cancel | PUT `/interviews/{id}`, POST `/interviews/{id}/cancel` |
| Resource conflicts | POST `/interviews/conflicts` |
| Create/read/save own scorecard | POST/GET/PUT `/interviews/{id}/evaluations/me` |
| Submit scorecard | POST `/interviews/{id}/evaluations/me/submit` |
| Peer scorecards | GET `/interviews/{id}/evaluations` after server confirms own submission |
| Reopen metadata/action | GET `/interviews/{id}/evaluations/{formId}/status`, POST `.../reopen` |

Evaluation answers contain only criterionId, score and comment. The viewed version and mapped conclusion
accompany writes. Scores, weights, actor and submission timestamps are not trusted from the client.
Server snapshots supply criteria; RECOMMENDED/NOT_RECOMMENDED map to HIRE/NO_HIRE.
HTTP 409 never triggers an automatic overwrite. Explicit reload warns about losing unsaved edits.
Reopening uses metadata, the viewed version and a mandatory reason; it does not require disclosing peers' scores.
Opening another evaluator's form still requires an authorized source of interviewId/formId; there is no fallback
that discovers these identifiers by fetching confidential forms.

## Contract gaps — not implemented by guessing

- PR #191 has no scoped participant picker matching the deployed `/applications/{id}/interview-participants`.
  The existing picker now reports that dependency instead of returning mock identities.
- Its InterviewView contains logistics and participant UUIDs, not candidate names, email, participant names or CVs.
  These fields remain absent unless provided by an independently authorized API; no fabricated profiles are shown.
- The legacy assigned-profile endpoint has no verified counterpart here. It reports unavailable, never a sample CV.
- Bulk scheduling/invitations require the later Backend PRs #192–#200 and V57/V58. They are unavailable against #191.
- The Backend has no generic manual COMPLETED status operation; the corresponding UI action is disabled.
- General evaluation notes are not a field of EvaluationSaveRequest. The general-notes field is disabled in
  the server-backed form; per-criterion comments remain supported.
- Summary/result-notification APIs outside the individual scorecard contract are unchanged and need separate verification.

## Validation and release

Use the test-only GitHub Actions workflow for `npm test` and TypeScript/Vite build. It has read-only permissions,
no deployment job, no secrets and no production environment. Legacy tests asserting mock/offline success must
be reviewed against the real contract; a red CI must be reported, not treated as an acceptable release.
Local full tests/build were not run. TypeScript-only checks and diff review are reported separately in the PR.
Runtime integration, permission checks and CORS still require a test environment with the selected Backend.
Do not alter VPS, real PostgreSQL, SMTP, secrets or DEPLOY_ENABLED for this change.
