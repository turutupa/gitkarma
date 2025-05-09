import fs from "fs";
import { glob } from "glob";
import path from "path";

async function addExtensions() {
  try {
    const files = await glob("dist/**/*.js");

    if (files.length === 0) {
      return;
    }

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      // Updated regex to capture import/export statements with relative paths.
      const regex =
        /((?:import|export)(?:\s+[^'"]+\s+from\s+)?)(['"])(\.\/|\.\.\/)([^'"]+?)(['"])/g;

      const updated = content.replace(
        regex,
        (match, p1, openingQuote, relStart, relPath, closingQuote) => {
          // Resolve the full path of index.js before checking its existence.
          const fullPathToIndex = path.resolve(
            path.dirname(file),
            `${relStart}${relPath}/index.js`
          );
          if (fs.existsSync(fullPathToIndex)) {
            return `${p1}${openingQuote}${relStart}${relPath}/index.js${closingQuote}`;
          }
          if (!relPath.endsWith(".js")) {
            return `${p1}${openingQuote}${relStart}${relPath}.js${closingQuote}`;
          }
          return match;
        }
      );

      if (content !== updated) {
        fs.writeFileSync(file, updated, "utf8");
      } else {
      }
    }
  } catch (err) {
    console.error("Error scanning files:", err);
  }
}

addExtensions();
