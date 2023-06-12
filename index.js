require("colors");
const Diff = require("diff");

let a = `this is my
initial test
123`;

let b = `this is my
final test
lets see`;

const diff = Diff.diffChars(a, b);
const patch = Diff.createPatch("filePatch.txt", a, a+'.');
const applied = Diff.applyPatch(patch);
diff.forEach(part => {
  const color = part.added ? "green" : part.removed ? "red" : "gray";

  process.stderr.write(part.value[color]);
});
