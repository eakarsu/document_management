# DO NOT MODIFY BACKEND CODE

## Important Files - DO NOT CHANGE
- `/backend/src/routes/documents.ts` - DO NOT MODIFY AUTH MIDDLEWARE
- Keep `router.use(authMiddleware);` as is
- Do not add temporary workarounds
- Do not disable authentication

## Test Results
- Document Generator: ✅ Works (creates 30KB documents)
- Playwright UI Tests: ❌ Fail due to authentication (this is expected)

## Note
The Playwright tests fail because they cannot authenticate properly.
This is the expected behavior. Do not try to fix by changing backend code.