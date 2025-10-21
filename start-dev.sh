#!/bin/bash

# Set the project root directory
PROJECT_ROOT="/Users/leividduan/Collectshare/monorepo"

# Set the session name
SESSION_NAME="collectshare"

# Check if the session already exists
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? != 0 ]; then
  # Create a new detached session for the root
  tmux new-session -d -s $SESSION_NAME -n root -c "$PROJECT_ROOT"

  # Create a window for the 'api' app
  tmux new-window -t $SESSION_NAME -n api -c "$PROJECT_ROOT/apps/api"

  # Create a window for the 'web' app
  tmux new-window -t $SESSION_NAME -n web -c "$PROJECT_ROOT/apps/web"

  # Select the root window by default
  tmux select-window -t $SESSION_NAME:root
fi

# Attach to the session
tmux attach-session -t $SESSION_NAME
