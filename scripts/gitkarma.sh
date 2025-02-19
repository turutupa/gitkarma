#!/bin/bash

# Define your ASCII art as an array of lines.
lines=(
"             d8b 888    888                                               "
"             Y8P 888    888                                               "
"                 888    888                                               "
"     .d88b.  888 888888 888  888  8888b.  888d888 88888b.d88b.   8888b.   "
"    d88P\"88b 888 888    888 .88P     \"88b 888P\"   888 \"888 \"88b     \"88b  "
"    888  888 888 888    888888K  .d888888 888     888  888  888 .d888888  "
"    Y88b 888 888 Y88b.  888 \"88b 888  888 888     888  888  888 888  888  "
"     \"Y88888 888  \"Y888 888  888 \"Y888888 888     888  888  888 \"Y888888  "
"         888                                                              "
"    Y8b d88P                                                              "
"     \"Y88P\" "
)

# Determine the maximum length among all lines.
max_len=0
for line in "${lines[@]}"; do
  # Get the length of the line (in characters)
  len=${#line}
  if (( len > max_len )); then
    max_len=$len
  fi
done

# Get terminal width (number of columns)
term_width=$(tput cols)

# Calculate left padding (same for all lines) so that the block is centered.
if (( term_width > max_len )); then
  padding=$(( (term_width - max_len) / 2 ))
else
  padding=0
fi

# Create a string consisting of the calculated number of spaces.
pad=$(printf "%${padding}s" "")

# Print each line with the left padding applied.
echo ""
echo ""
for line in "${lines[@]}"; do
  echo "${pad}${line}"
done
echo ""
echo ""
