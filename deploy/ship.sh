#!/bin/bash
set -e

MESSAGE="${1:-update}"

git add -A
git commit -m "$MESSAGE"
git push origin main

echo ""
echo "Push realizado. GitHub Actions vai fazer o deploy automaticamente."
echo "Acompanhe em: https://github.com/SEU_USER/viralzera/actions"
