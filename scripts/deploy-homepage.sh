#!/bin/bash
set -e

# 1) ветка с изменениями
BRANCH="feature/homepage-redesign"
MESSAGE="feat: homepage redesign + Steam CTA"

# 2) git
git checkout -B "$BRANCH"
git add src/components/SteamLoginButton.jsx src/app/page.js src/app/login/page.js vercel.json
git commit -m "$MESSAGE" || echo "no changes to commit"
git push -u origin "$BRANCH"

# 3) привязка проекта (если не привязан)
if ! vercel link --yes >/dev/null 2>&1; then
  vercel link --yes
fi

# 4) переменные окружения (опционально подтянуть локально)
vercel env pull .env.local || true

# 5) превью-деплой (на случай, если хочется проверить)
vercel --yes || true

# 6) прод-деплой
vercel --prod --yes
echo "✅ Deploy complete: production on Vercel updated."
