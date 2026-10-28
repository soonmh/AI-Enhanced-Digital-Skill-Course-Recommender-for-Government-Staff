# Deploying for user testing (cloud platform)

How to put the system online for testers on a cloud platform. Railway and Render can host every piece (Render needs a Dockerfile for the PHP backend); Vercel can host only the Next.js frontend.

## 1. Services

| Service | Command / setup | Notes |
|---------|-----------------|-------|
| PostgreSQL | Managed database add-on | |
| Redis | Managed Redis add-on | Required: cache, sessions and the online-users list |
| Backend (Laravel) | Serve `backend/public` with php-fpm (nginx) or FrankenPHP | **Don't use `php artisan serve`**: it handles one request at a time, so testers would queue behind each other's AI calls. Railway's builder serves Laravel properly by default. |
| Queue worker | `php artisan queue:work --tries=1` | Same code and env as the backend. Pre-generates AI insights after each assessment. |
| Frontend (Next.js) | `npm ci && npm run build`, then `npm start` | `next start` listens on `$PORT` |
| Scheduler (optional) | `php artisan schedule:work` | Nightly `recommendations:precompute`; you can run it by hand instead |
| Real-time server | Not needed | Notifications still arrive through the 30-second polling |

## 2. Backend environment variables

```env
APP_NAME="DSRA"
APP_ENV=production
APP_DEBUG=false                  # true would show stack traces and settings to testers
APP_KEY=                         # output of: php artisan key:generate --show
APP_URL=https://<backend-domain> # also the base of uploaded-proof links (APP_URL/storage/...)
LOG_CHANNEL=stderr               # errors show up in the platform's logs
LOG_LEVEL=info

DB_CONNECTION=pgsql
DB_URL=                          # the platform's PostgreSQL URL (or DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD)

REDIS_CLIENT=predis
REDIS_URL=                       # the platform's Redis URL (or REDIS_HOST, REDIS_PASSWORD, REDIS_PORT)
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=database

SESSION_DOMAIN=null              # the local value "localhost" breaks sign-in on a real domain
SANCTUM_STATEFUL_DOMAINS=<frontend-domain>

FILESYSTEM_DISK=local
MAIL_MAILER=log                  # password-reset emails only reach the log until SMTP is configured

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
RECOMMENDATION_AB_TESTING=false  # every tester gets the hybrid recommendation engine
```

## 3. Frontend environment variables

```env
NEXT_PUBLIC_API_URL=https://<backend-domain>  # baked in at build time: rebuild after changing it
NEXTAUTH_URL=https://<frontend-domain>
NEXTAUTH_SECRET=                              # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Leave `NEXT_PUBLIC_REALTIME_URL` unset when the real-time server isn't deployed. The browser console then shows WebSocket connection errors; they're harmless.

PDF export runs Chrome on the frontend server through Puppeteer. `npm ci` downloads Chrome, but it also needs system libraries on Linux and won't run on Vercel. If the export fails, leave it out of the test.

## 4. Backend build and release

```bash
# Build
composer install --no-dev --optimize-autoloader

# Release (every deploy)
php artisan migrate --force
php artisan storage:link --force
php artisan config:cache
php artisan route:cache
```

## 5. First deploy: data and demo accounts

```bash
php artisan db:seed --force
```

This creates roles, courses, job roles and the demo accounts from the README, whose password (`pass123`) is public. Change every demo password straight away: run `php artisan tinker` in the platform's shell, then

```php
App\Models\User::where('email', 'like', '%@test.com')->get()->each(fn ($u) => $u->update(['password' => 'choose-a-strong-password']));
```

The User model hashes the new password automatically.

## 6. Before testers arrive

- [ ] `APP_DEBUG=false` and `APP_ENV=production`
- [ ] Demo account passwords changed
- [ ] `RECOMMENDATION_AB_TESTING=false`
- [ ] Sign up as a new user, take an assessment and open the recommendations yourself
- [ ] **HODs:** self-registered testers have no HOD, so their certificates can't be endorsed until one is assigned in Admin → Users. A newly assigned HOD must sign in again to see My Team.
- [ ] **Uploaded completion proofs** are publicly reachable by URL. Ask testers not to upload documents with sensitive personal data. On platforms with a temporary filesystem the files are lost on every redeploy unless you attach a volume to `backend/storage`.
- [ ] **Gemini quota:** many testers at once may hit the API rate limit. Course explanations then show template text and fill in on a later visit.
- [ ] After testers have taken assessments, run `php artisan recommendations:precompute --force` so collaborative filtering can find similar peers.
