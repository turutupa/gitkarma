#!/bin/bash

# Define dirs
PROJECT_ROOT=$(pwd)
TIGERBEETLE_DIR="$PROJECT_ROOT/tigerbeetle"

# Create the TigerBeetle directory if it doesn't exist
mkdir -p "$TIGERBEETLE_DIR"

# Function to check if TigerBeetle is installed
is_tigerbeetle_installed() {
  [ -f "$TIGERBEETLE_DIR/tigerbeetle" ]
}

# Function to download and install TigerBeetle
install_tigerbeetle() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    URL="https://mac.tigerbeetle.com"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    URL="https://linux.tigerbeetle.com"
  elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
    URL="https://windows.tigerbeetle.com"
    powershell -command "curl.exe -Lo $TIGERBEETLE_DIR/tigerbeetle.zip $URL; Expand-Archive $TIGERBEETLE_DIR/tigerbeetle.zip -DestinationPath $TIGERBEETLE_DIR; .\$TIGERBEETLE_DIR\tigerbeetle version"
    return
  else
    echo "Unsupported OS: $OSTYPE"
    exit 1
  fi

  echo "Downloading TigerBeetle from $URL..."
  curl -Lo $TIGERBEETLE_DIR/tigerbeetle.zip $URL
  unzip $TIGERBEETLE_DIR/tigerbeetle.zip -d $TIGERBEETLE_DIR
  chmod +x "$TIGERBEETLE_DIR/tigerbeetle"
  
  # Clean up zip file
  rm $TIGERBEETLE_DIR/tigerbeetle.zip
}

# Check if TigerBeetle is installed
if ! is_tigerbeetle_installed; then
  echo "TigerBeetle is not installed. Installing..."
  install_tigerbeetle
else
  echo "TigerBeetle is already installed."
fi

# Create the data file if it doesn't exist
if [ ! -f "$TIGERBEETLE_DIR/0_0.tigerbeetle" ]; then
  # Each TigerBeetle node uses a single data file to store its state. Create the data file using the format command:
  echo "Creating TigerBeetle data file..."
  "$TIGERBEETLE_DIR/tigerbeetle" format --development --replica=0 --replica-count=1 "$TIGERBEETLE_DIR/0_0.tigerbeetle"
fi

# Start the TigerBeetle server
echo "Starting TigerBeetle server..."
"$TIGERBEETLE_DIR/tigerbeetle" start --development --addresses=3001 "$TIGERBEETLE_DIR/0_0.tigerbeetle" 
