#!/bin/bash

echo "🔧 Fixing all remaining import issues..."

# Create comprehensive import mapping
declare -A IMPORT_MAP=(
    ["@/components/TopicMatchingPopup"]="@/components/topics/TopicMatchingPopup"
    ["@/components/MatchingActivityPopup"]="@/components/matching"
    ["@/components/MatchingListPopup"]="@/components/matching"
    ["@/components/SubtopicMatchingButton"]="@/components/matching"
    ["@/components/ParentTopicMatchingButton"]="@/components/matching"
    ["@/components/ContentDifficultyIndicator"]="@/components/content"
    ["@/components/ContentRatingButtons"]="@/components/content"
    ["@/components/ContentGroupCard"]="@/components/content"
    ["@/components/GroupedContentCard"]="@/components/content"
    ["@/components/ContentThumbnailGallery"]="@/components/content"
    ["@/components/MarkdownRenderer"]="@/components/shared"
    ["@/components/LeaderboardPanel"]="@/components/shared"
    ["@/components/AssignmentPanel"]="@/components/shared"
    ["@/components/PersonalContentPanel"]="@/components/personal"
    ["@/components/SimpleContentProgressPanel"]="@/components/content"
    ["@/components/Header"]="@/components/shared"
    ["@/components/LiveClassMonitor"]="@/components/live-class"
    ["@/components/LiveClassPanel"]="@/components/live-class"
    ["@/components/CenteredObjectUploader"]="@/components/shared"
)

# Fix each import pattern
for old_import in "${!IMPORT_MAP[@]}"; do
    new_import="${IMPORT_MAP[$old_import]}"
    echo "Fixing: $old_import -> $new_import"
    
    # Fix various import patterns
    find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from ['\"]$old_import['\"]|from \"$new_import\"|g"
    find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|import {\([^}]*\)} from ['\"]$old_import['\"]|import {\1} from \"$new_import\"|g"
    find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|import \([A-Za-z][A-Za-z0-9]*\) from ['\"]$old_import['\"]|import {\1} from \"$new_import\"|g"
done

# Fix named vs default import mismatches
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|import { ContentDifficultyIndicator }|import { ContentDifficultyIndicator }|g'
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|import { MarkdownRenderer }|import { MarkdownRenderer }|g'
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|import { Header }|import { Header }|g'

echo "✅ All import fixes applied!"