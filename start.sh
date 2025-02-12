#!/bin/bash

SESSION_NAME="gitkarma_server"
WINDOW_NAME="gitkarma_api"
GO_PORT=4000

create_tmux_session() {
    tmux new-session -d -s "$SESSION_NAME" -n "$WINDOW_NAME" "cd api && go run main.go; exec zsh"
    
    # Create a new pane for ngrok
    tmux split-window -h "ngrok http $GO_PORT; exec zsh"
    tmux select-pane -R
    
    # Create a new pane for docker-compose
    tmux split-window -v "docker-compose up; exec zsh"
    tmux select-pane -t 0
    
    # Create a new pane for running run-tb.sh
    tmux split-window -v "bash run-tb.sh; exec zsh"
    tmux select-pane -t 0
    
    tmux select-layout even-horizontal
    tmux attach -t "$SESSION_NAME"
}

create_tmux_window() {
    tmux new-window -t "$SESSION_NAME:" -n "$WINDOW_NAME"
    tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME" "cd api && go run main.go; exec zsh" C-m
    
    # Create a new pane for ngrok
    tmux split-window -h "ngrok http $GO_PORT; exec zsh"
    tmux select-pane -R
    
    # Create a new pane for docker-compose
    tmux split-window -v "docker-compose up; exec zsh"
    tmux select-pane -t 0
    
    # Create a new pane for running run-tb.sh
    tmux split-window -v "bash run-tb.sh; exec zsh"
    tmux select-pane -t 0
    
    tmux select-layout even-horizontal
    tmux attach -t "$SESSION_NAME"
}

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists. Creating a new window..."
    create_tmux_window
else
    echo "Creating a new tmux session..."
    create_tmux_session
fi

wait
