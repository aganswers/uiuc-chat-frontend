#!/bin/bash

# Find all files with merge conflicts and resolve them by choosing aidan-dev version
find . -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.md" | grep -v node_modules | while read file; do
    if grep -q "<<<<<<< HEAD" "$file"; then
        echo "Resolving conflicts in $file..."
        
        # Use sed to remove conflict markers and keep only aidan-dev version
        # This removes everything from "<<<<<<< HEAD" to "=======" (inclusive)
        # and removes ">>>>>>> aidan-dev" markers
        sed -i '' '/<<<<<<< HEAD/,/=======/d; />>>>>>> aidan-dev/d' "$file"
        
        echo "Resolved $file"
    fi
done

echo "All conflicts resolved!" 