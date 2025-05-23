#!/bin/bash

# Create .env file
cat > .env << EOL
# Supabase Configuration
SUPABASE_URL=$1
SUPABASE_KEY=$2
SUPABASE_SERVICE_ROLE_KEY=$3

# Database Configuration
DATABASE_URL=$4

# Google API Configuration
GOOGLE_API_KEY=$5

# AWS Configuration
AWS_ACCESS_KEY_ID=$6
AWS_SECRET_ACCESS_KEY=$7
AWS_BUCKET_NAME=$8
AWS_REGION=$9

# Pinecone Configuration
PINECONE_API_KEY=${10}
PINECONE_ENVIRONMENT=${11}
PINECONE_INDEX_NAME=${12}

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0
VITE_API_URL=http://localhost:8000
EOL

echo "Environment file created successfully!" 