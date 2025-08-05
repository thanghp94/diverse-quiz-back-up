#!/bin/bash

# Fix remaining import statements for reorganized components
echo "Fixing import statements for reorganized components..."

# Fix Header imports
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from.*@/components/Header|from "@/components/shared"|g' 
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|import Header from "@/components/shared"|import { Header } from "@/components/shared"|g'

# Fix TopicListItem imports 
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from.*@/components/TopicListItem|from "@/components/topics/TopicListItem"|g'

# Fix TopicQuizRunner imports
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from.*@/components/TopicQuizRunner|from "@/components/topics/TopicQuizRunner"|g'

# Fix other scattered component imports
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from.*@/components/ContentPopup[^/]|from "@/components/content"|g'
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|import ContentPopup from "@/components/content"|import { ContentPopup } from "@/components/content"|g'

echo "Import fixes applied!"