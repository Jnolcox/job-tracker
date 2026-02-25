#!/bin/bash

# Bulk Data Loader for Job Tracking Application
# This script loads 19 job applications via the REST API

BASE_URL="http://localhost:8080/api/v1"

# Configuration - UPDATE THESE VALUES
EMAIL="test@example.com"
PASSWORD="password"

echo "=== Job Tracking Bulk Data Loader ==="
echo ""

# Login and get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to login. Response: $LOGIN_RESPONSE"
  echo ""
  echo "If you haven't registered yet, run:"
  echo "curl -X POST ${BASE_URL}/auth/register -H 'Content-Type: application/json' -d '{\"firstName\":\"Your\",\"lastName\":\"Name\",\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}'"
  exit 1
fi

echo "Login successful!"
echo ""

# Function to create a job application
create_job() {
  local data="$1"
  local company=$(echo "$data" | jq -r '.companyName')

  response=$(curl -s -X POST "${BASE_URL}/job-applications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "$data")

  if echo "$response" | grep -q '"id"'; then
    echo "Created: $company"
  else
    echo "Failed: $company - $response"
  fi
}

echo "Loading 19 job applications..."
echo ""

# 1. Lab49
create_job '{
  "companyName": "Lab49",
  "positionTitle": "Software Engineer",
  "status": "TECH_SCREEN",
  "salaryMin": 155000,
  "salaryMax": 185000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Senior\nSource: LinkedIn\nNext Action: Prepare for interview\n50% dev, 50% test automation",
  "appliedDate": "2026-01-28T00:00:00"
}'

# 2. NYDIG
create_job '{
  "companyName": "NYDIG",
  "positionTitle": "Software Engineer",
  "status": "TECH_SCREEN",
  "salaryMin": 225000,
  "salaryMax": 250000,
  "location": "New York, NY",
  "rtoType": "ONSITE",
  "notes": "Level: Staff\nSource: LinkedIn\nNext Action: Prepare for interview\nGreat fit, waiting on next round",
  "appliedDate": "2026-01-28T00:00:00"
}'

# 3. Elastic
create_job '{
  "companyName": "Elastic",
  "positionTitle": "Software Engineer",
  "status": "APPLIED",
  "salaryMin": 150000,
  "salaryMax": 200000,
  "location": "New York, NY",
  "rtoType": "ONSITE",
  "notes": "Level: Mid\nSource: Company Website\nNext Action: Wait for response",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 4. Garner Health
create_job '{
  "companyName": "Garner Health",
  "positionTitle": "Software Engineer",
  "status": "APPLIED",
  "salaryMin": 190000,
  "salaryMax": 240000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: Wait for response",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 5. Omada Health
create_job '{
  "companyName": "Omada Health",
  "positionTitle": "Software Engineer",
  "status": "APPLIED",
  "salaryMin": 155000,
  "salaryMax": 180000,
  "location": "Remote",
  "rtoType": "REMOTE",
  "notes": "Level: Mid\nSource: Company Website\nNext Action: Wait for response",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 6. Walk Me
create_job '{
  "companyName": "Walk Me",
  "positionTitle": "Full Stack Engineer",
  "status": "RECRUITER_SCREEN",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "ONSITE",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: Schedule call",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 7. Hello Fresh
create_job '{
  "companyName": "Hello Fresh",
  "positionTitle": "Software Engineer",
  "status": "REJECTED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: None",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 8. CLEAR
create_job '{
  "companyName": "CLEAR",
  "positionTitle": "Software Engineer",
  "status": "REJECTED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: Company Website\nNext Action: None",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 9. Gemini
create_job '{
  "companyName": "Gemini",
  "positionTitle": "Software Engineer",
  "status": "REJECTED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Staff\nSource: LinkedIn\nNext Action: None",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 10. Blink Health
create_job '{
  "companyName": "Blink Health",
  "positionTitle": "Software Engineer",
  "status": "REJECTED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Staff\nSource: LinkedIn\nNext Action: None",
  "appliedDate": "2026-01-28T00:00:00"
}'

# 11. ZocDoc
create_job '{
  "companyName": "ZocDoc",
  "positionTitle": "Software Engineer",
  "status": "APPLIED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: Wait for response",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 12. Charlie Health
create_job '{
  "companyName": "Charlie Health",
  "positionTitle": "Software Engineer",
  "status": "REJECTED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: None",
  "appliedDate": "2026-01-29T00:00:00"
}'

# 13. MarketAxess
create_job '{
  "companyName": "MarketAxess",
  "positionTitle": "Data Engineer",
  "status": "TECH_SCREEN",
  "salaryMin": 180000,
  "salaryMax": 220000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Senior\nSource: LinkedIn\nNext Action: Prepare for interview\n20%-25% bonus, $275,000 TC",
  "appliedDate": "2026-01-28T00:00:00"
}'

# 14. Paperless Post
create_job '{
  "companyName": "Paperless Post",
  "positionTitle": "Software Engineer",
  "status": "APPLIED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: Wait for response",
  "appliedDate": "2026-01-28T00:00:00"
}'

# 15. Data Dog
create_job '{
  "companyName": "Data Dog",
  "positionTitle": "Software Engineer",
  "status": "REJECTED",
  "salaryMin": 150000,
  "salaryMax": 190000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Staff\nSource: LinkedIn\nNext Action: None",
  "appliedDate": "2026-01-28T00:00:00"
}'

# 16. Mastercard
create_job '{
  "companyName": "Mastercard",
  "positionTitle": "Software Engineer",
  "status": "APPLIED",
  "salaryMin": 138000,
  "salaryMax": 221000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Senior\nSource: Company Website\nNext Action: Wait for response\nR-265624",
  "appliedDate": "2026-01-31T00:00:00"
}'

# 17. Payments Startup
create_job '{
  "companyName": "Payments Startup",
  "positionTitle": "Software Engineer",
  "status": "TECH_SCREEN",
  "salaryMin": 200000,
  "salaryMax": 240000,
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Senior\nSource: LinkedIn\nNext Action: Prepare for interview\nRecruiter: Lec Sang",
  "appliedDate": "2026-02-02T00:00:00"
}'

# 18. TEK Systems
create_job '{
  "companyName": "TEK Systems",
  "positionTitle": "Software Engineer",
  "status": "RECRUITER_SCREEN",
  "location": "New York, NY",
  "rtoType": "HYBRID_3",
  "notes": "Level: Mid\nSource: LinkedIn\nNext Action: Wait for response\nRecruiter: Katy Bartlett",
  "appliedDate": "2026-02-02T00:00:00"
}'

# 19. Wex
create_job '{
  "companyName": "Wex",
  "positionTitle": "Software Engineer",
  "status": "TECH_SCREEN",
  "salaryMin": 150000,
  "salaryMax": 180000,
  "location": "Remote",
  "rtoType": "REMOTE",
  "notes": "Level: Senior\nSource: LinkedIn\nNext Action: Prepare for interview",
  "appliedDate": "2026-02-03T00:00:00"
}'

echo ""
echo "=== Data loading complete ==="
echo ""
echo "View your applications at: http://localhost:3000"
