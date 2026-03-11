# scripts/AGENTS.md

Development, testing, and maintenance scripts for FreePic.

## Script Inventory

| Script                 | Lines | Purpose                                 |
| ---------------------- | ----- | --------------------------------------- |
| `seed.ts`              | 187   | Database seeding with test users/images |
| `verify-all-flows.sh`  | 127   | Full API verification test suite        |
| `verify-core-flows.sh` | 137   | Core functionality tests                |
| `pre-dev-check.sh`     | 47    | Pre-flight dev environment checks       |
| `dev-clean.sh`         | 8     | Clean Next.js cache and restart dev     |
| `poc/`                 | -     | Proof-of-concept experiments            |

## Where to Look

| Task                  | Script                          |
| --------------------- | ------------------------------- |
| Seed test data        | `npx tsx scripts/seed.ts`       |
| Run full verification | `./scripts/verify-all-flows.sh` |
| Check dev environment | `./scripts/pre-dev-check.sh`    |
| Clean cache           | `./scripts/dev-clean.sh`        |

## Usage Patterns

### Database Seeding

```bash
npx tsx scripts/seed.ts
# Seeds: 3 test users, sample images with tags
```

### Verification Testing

```bash
# Full verification (requires running server)
./scripts/verify-all-flows.sh

# Core flows only
./scripts/verify-core-flows.sh
```

### Pre-Dev Check

Validates:

- Next.js cache health
- Tailwind color consistency
- Database file exists
- TypeScript errors

## Conventions

- All `.sh` scripts use `set -e` (exit on error)
- Scripts use color output: `GREEN='\033[0;32m'`
- Test scripts output: `✓ PASS` / `✗ FAIL` format
- Bash scripts target macOS/Linux (not Windows compatible)

## Anti-Patterns

- **Don't** run verification scripts without server running
- **Don't** commit changes to `poc/` experiments
- **Don't** modify seed data without updating related tests
  - **Don't** modify seed data without updating related tests


  filePath: /Users/tangzhenhua/cursor_projects/no_copyright_web/scripts/AGENTS.md
  </invoke>
