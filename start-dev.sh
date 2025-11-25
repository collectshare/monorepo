#!/bin/bash

# Set the project root directory
PROJECT_ROOT="/Users/leividduan/Collectshare/monorepo"

# Set the session name
SESSION_NAME="collectshare"

# Check if the session already exists
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? != 0 ]; then
  # 1. Cria a sessão (já cria a primeira janela 'root')
  tmux new-session -d -s $SESSION_NAME -n root -c "$PROJECT_ROOT"
  # Divide a janela 'root' horizontalmente (dois terminais lado a lado)
  tmux split-window -h -t $SESSION_NAME:root -c "$PROJECT_ROOT"

  # 2. Cria a janela 'api'
  tmux new-window -t $SESSION_NAME -n api -c "$PROJECT_ROOT/apps/api"
  # Divide a janela 'api' horizontalmente
  tmux split-window -h -t $SESSION_NAME:api -c "$PROJECT_ROOT/apps/api"

  # 3. Cria a janela 'web'
  tmux new-window -t $SESSION_NAME -n web -c "$PROJECT_ROOT/apps/web"
  # Divide a janela 'web' horizontalmente
  tmux split-window -h -t $SESSION_NAME:web -c "$PROJECT_ROOT/apps/web"

  # (Opcional) Seleciona a janela root como inicial
  tmux select-window -t $SESSION_NAME:root
fi

# Attach to the session
tmux attach-session -t $SESSION_NAME