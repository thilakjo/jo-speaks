#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "INFO: Starting full test run..."

# Load environment variables if .env file exists in project root
if [ -f .env ]; then
    echo "INFO: Loading environment variables from project root .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Backend Tests
echo "INFO: === Running Backend Tests ==="
cd backend

# Ensure backend .env is also considered if it exists (might be redundant if project root .env has all keys)
if [ -f .env ]; then
    echo "INFO: Loading environment variables from backend/.env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Check if necessary env vars are set (especially for Supabase and Google)
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$GOOGLE_API_KEY" ]; then
    echo "ERROR: SUPABASE_URL, SUPABASE_ANON_KEY, or GOOGLE_API_KEY are not set."
    echo "ERROR: Please ensure they are in your .env file and loaded correctly."
    exit 1
fi

echo "INFO: Starting backend server for tests..."
# Start backend in the background
python -m uvicorn main:app --host ${API_HOST:-0.0.0.0} --port ${API_PORT:-8000} --log-level warning & # Use warning to reduce noise
UVICORN_PID=$!
echo "INFO: Backend server started with PID: $UVICORN_PID. Waiting a few seconds for it to initialize..."
sleep 5 # Give server time to start, especially with startup events

# Check if server is up before running tests
if ! curl -sf http://${API_HOST:-127.0.0.1}:${API_PORT:-8000}/health > /dev/null; then
    echo "ERROR: Backend server failed to start or is not healthy."
    kill $UVICORN_PID
    exit 1
fi
echo "INFO: Backend server health check passed."

echo "INFO: Running pytest..."
# Run pytest. Using --disable-warnings and -q for quieter output.
# --maxfail=1 to stop on first failure.
# Adding -s to show print statements from tests for debugging
pytest -s --maxfail=1 --disable-warnings -q tests/
PYTEST_EXIT_CODE=$?

echo "INFO: Shutting down backend server (PID: $UVICORN_PID)..."
kill $UVICORN_PID
wait $UVICORN_PID 2>/dev/null || echo "INFO: Backend server shutdown complete (or was already down)."

if [ $PYTEST_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Backend tests failed with exit code $PYTEST_EXIT_CODE."
    exit $PYTEST_EXIT_CODE
fi
echo "INFO: Backend tests passed successfully."

# Frontend Tests
echo "INFO: === Running Frontend Tests ==="
cd ../frontend

# Ensure frontend .env is also considered if it exists
if [ -f .env ]; then
    echo "INFO: Loading environment variables from frontend/.env file..."
    # VITE_ vars are typically not exported this way for npm scripts but read by vite
    # Ensure VITE_API_URL is correctly set in frontend/.env for the build and test steps
fi

if ! grep -q "VITE_API_URL=http://localhost:8000" .env && ! grep -q "VITE_API_URL=http://127.0.0.1:8000" .env;
then
    echo "WARNING: VITE_API_URL in frontend/.env does not seem to be pointing to http://localhost:8000 or http://127.0.0.1:8000"
    echo "INFO: Proceeding, but ensure it's correct for actual app usage."
fi


echo "INFO: Installing frontend dependencies (npm install)..."
npm install

# echo "INFO: Running frontend tests (npm run test)..."
# npm run test -- --watchAll=false # Placeholder, as Jest/RTL tests are not implemented yet
# FRONTEND_TEST_EXIT_CODE=$?
# if [ $FRONTEND_TEST_EXIT_CODE -ne 0 ]; then
#     echo "ERROR: Frontend tests failed with exit code $FRONTEND_TEST_EXIT_CODE."
#     # exit $FRONTEND_TEST_EXIT_CODE # Optional: make frontend tests blocking
# else
#     echo "INFO: Frontend tests passed successfully (or were skipped)."
# fi
echo "INFO: Frontend tests skipped (Jest/RTL setup not yet complete)."

echo "INFO: Building frontend (npm run build)..."
npm run build
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "ERROR: Frontend build failed with exit code $BUILD_EXIT_CODE."
    exit $BUILD_EXIT_CODE
fi
echo "INFO: Frontend build completed successfully."

echo "INFO: === Full test run completed successfully! ===" 