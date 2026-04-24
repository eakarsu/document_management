# Fix package.json duplicates:
cp backend/package.json backend/package.json.backup
awk '!seen[$0]++' backend/package.json.backup > backend/package.json
rm backend/package.json.backup

# Verify fix:
echo "Seed scripts count (should be 2):"
grep "seed:" backend/package.json | wc -l

# Add to .gitignore:
echo "" >> .gitignore
echo "# Recovery artifacts" >> .gitignore
echo "backup-*/" >> .gitignore
echo "*.sh" >> .gitignore
echo "my_lost.txt" >> .gitignore

# Stage everything:
git add .gitignore backend/package.json frontend/src/app/documents/\[id\]/edit/page.tsx
git add Screenshot*.png

# Show what will be committed:
echo ""
echo "Files to be committed:"
git diff --cached --name-only

# Commit:
read -p "Press Enter to commit or Ctrl+C to cancel..."
git commit -m "Restore lost changes: API endpoints, seed scripts, navigation, logging"

# Push:
read -p "Press Enter to push or Ctrl+C to cancel..."
git push origin main

echo ""
echo "✅ Done! All changes pushed to main."

