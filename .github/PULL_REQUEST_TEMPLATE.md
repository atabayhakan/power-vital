## Summary

<!-- Brief description of what this PR does -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Refactor (no functional change)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Dependency upgrade

## CI status (auto-updates once PR is opened)

- [ ] `Frontend CI` — typecheck + vitest + build ✅
- [ ] `Backend CI` — tsc + vitest (unit only) ✅
- [ ] `OpenAPI drift check` — frontend types vs backend spec ✅
- [ ] `Lint` — frontend + backend ESLint pass ✅
- [ ] `Dependency review` — no new moderate+ vulnerabilities ✅
- [ ] `CodeQL` — no new security alerts ✅
- [ ] `i18n coverage` — TR/RU/KG locale parity (only on locale/UI PRs) ✅
- [ ] `Bundle budget` — vite build + per-chunk size check (only on frontend PRs) ✅
- [ ] `Backend integration` — MySQL container, full test suite (only on integration-file PRs) ✅

## Backend changes

If you touched anything under `backend/src/`, please run:

```bash
npm --prefix frontend run openapi:generate
git add frontend/src/api/types.ts
```

The CI drift check (`OpenAPI drift check` workflow) will fail if
`frontend/src/api/types.ts` is out of sync with the OpenAPI spec served
by the backend.

## Frontend changes

- [ ] I ran `npm run typecheck` (0 errors)
- [ ] I ran `npm run build` (success)
- [ ] I ran `npm test` (100% pass)

## Backend changes

- [ ] I ran `npm run build` (dist/ generated)
- [ ] I ran `npm run test:unit` (unit tests pass, integration tests skipped — those need MySQL)

## Test plan

<!-- How was this tested? -->

## Checklist

- [ ] My code follows the project's style guide
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published