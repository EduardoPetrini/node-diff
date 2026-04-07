require("colors");
const Diff = require("diff");
const fs = require("fs").promises;

const start = async () => {
  const diffContent = (await fs.readFile("./.gitignore.diff")).toString();
  const fileContent = (await fs.readFile("./.gitignore")).toString();

  const patches = Diff.parsePatch(diffContent);
  const reversedPatchHunks = patches[0].hunks.map(hunk => {
    return {
      oldStart: hunk.newStart,
      oldLines: hunk.newLines,
      newStart: hunk.oldStart,
      newLines: hunk.oldLines,
      lines: hunk.lines.map(line => {
        if (line.startsWith("+")) {
          return "-" + line.slice(1);
        } else if (line.startsWith("-")) {
          return "+" + line.slice(1);
        } else {
          return line;
        }
      }),
    };
  });

  const reversedPatch = [{ ...patches[0], hunks: reversedPatchHunks }];

  const reversedDiff = Diff.createPatch(".gitignore", fileContent, reversedPatchHunks);

  fs.writeFileSync(".gitignore.rev", reversedDiff);

  // const patchContent = Diff.applyPatch(fileContent, reversedPatch[0].hunks);

  // await fs.writeFile(".gitignore.old", patchContent);
  debugger;
};

start().catch(console.error).finally(process.exit);
