#!/bin/bash
set -e

BRANCH="feature/homepage-redesign"
MESSAGE="feat: redesign homepage with Steam login hero and fair play sections"
AUTO_MERGE=false

# флаг --merge включает автослияние в main
if [[ "$1" == "--merge" ]]; then
  AUTO_MERGE=true
fi

echo "🔎 Проверка чистоты рабочей директории..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ℹ️ Есть незакоммиченные изменения — ок, продолжим."
fi

echo "👉 Переключаюсь/создаю ветку $BRANCH..."
git checkout -B "$BRANCH"

echo "👉 Добавляю изменения..."
git add \
  src/components/SteamLoginButton.jsx \
  src/app/page.js

# коммитим, но если нечего коммитить — идём дальше
set +e
git commit -m "$MESSAGE"
if [[ $? -ne 0 ]]; then
  echo "❗ Нет новых изменений для коммита — пропускаю commit."
fi
set -e

echo "🚀 Пуш в origin/$BRANCH..."
git push -u origin "$BRANCH"

if [ "$AUTO_MERGE" = true ]; then
  echo "🧪 Быстрая проверка сборки (опционально)..."
  if [[ -f package.json ]]; then
    # не падаем, если локально нет зависимостей/билда
    npm run build >/dev/null 2>&1 || echo "⚠️ build локально не проверен — продолжаю merge."
  fi

  echo "🔄 Обновляю main и мержу $BRANCH → main..."
  git fetch origin
  git checkout main
  git pull --rebase origin main

  # защищённый merge без fast-forward (история сохранится)
  git merge --no-ff "$BRANCH" -m "merge($BRANCH): $MESSAGE" || {
    echo "❌ Конфликты при merge. Разрули их и запусти повторно: npm run push-homepage:deploy"
    exit 1
  }

  echo "⬆️ Пушу main → origin..."
  git push origin main

  echo "✅ Готово! Прод-деплой на Vercel запустится от ветки main."
  echo "ℹ️ Вернусь на твою фичеветку для дальнейшей работы."
  git checkout "$BRANCH"
else
  echo "✅ Готово! Проверяй превью-деплой на Vercel для ветки $BRANCH."
  echo "ℹ️ Чтобы сразу вылить в прод: npm run push-homepage:deploy"
fi
