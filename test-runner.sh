#!/bin/bash

echo "🧪 Running Job Tracker Tests..."
echo "================================"

cd "$(dirname "$0")"

echo "📦 Compiling project..."
mvn clean compile test-compile -q

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

echo "🔬 Running tests..."
mvn test -q

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
else
    echo ""
    echo "❌ Some tests failed"
    exit 1
fi