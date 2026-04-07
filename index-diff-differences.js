const { diffDifferences, getNewChanges, calculateNewChanges, extractTheDiffs } = require('./helpers');

const oldDiff = `diff --git a/helpers.js b/helpers.js
index f41af68..19d654a 100644
--- a/helpers.js
+++ b/helpers.js
@@ -78,3 +78,7 @@ module.exports.convertGitDiffToPatch = (gitDiffOutput) =>{
 
   return patches;
 }
+
+const diffDifferences = (diffOld, diffNew) => {
+    
+}
`;

const newDiff = `diff --git a/helpers.js b/helpers.js
index f41af68..468a6da 100644
--- a/helpers.js
+++ b/helpers.js
@@ -39,7 +39,7 @@ const reversePatch = parsedDiff => {
   return parsedDiff;
 };

-module.exports.convertGitDiffToPatch = (gitDiffOutput) =>{
+module.exports.convertGitDiffToPatch = gitDiffOutput => {
   const patches = [];
   let currentPatch = null;

@@ -52,7 +52,7 @@ module.exports.convertGitDiffToPatch = (gitDiffOutput) =>{
       currentPatch = {
         oldFile: line.split(' ')[2].substring(2),
         newFile: line.split(' ')[3].substring(2),
-        hunks: []
+        hunks: [],
       };
     } else if (line.startsWith('@@')) {
       // Start of a new hunk
@@ -63,7 +63,7 @@ module.exports.convertGitDiffToPatch = (gitDiffOutput) =>{
       const hunk = {
         oldStart,
         newStart,
-        lines: []
+        lines: [],
       };
       currentPatch.hunks.push(hunk);
     } else if (line.startsWith('+') || line.startsWith('-')) {
@@ -77,4 +77,26 @@ module.exports.convertGitDiffToPatch = (gitDiffOutput) =>{
   }

   return patches;
-}
+};
+
+const extractTimestamp = diffSection => {
+  const timestampRegex = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/m;
+  const match = diffSection.match(timestampRegex);
+  const timestamp = match ? parseInt(match[1], 10) * 1000 : 0; // Convert to milliseconds
+  return new Date(timestamp);
+};
+
+export const diffDifferences = (oldDiff, newDiff) => {
+  const oldSections = oldDiff.split(/^diff --git/m).slice(1);
+  const newSections = newDiff.split(/^diff --git/m).slice(1);
+
+  const oldTimestamp = extractTimestamp(oldSections[oldSections.length - 1]);
+  const newTimestamp = extractTimestamp(newSections[newSections.length - 1]);
+
+  // Compare the timestamps to determine the newer changes
+  if (newTimestamp.getTime() > oldTimestamp.getTime()) {
+    return newSections.join('\n\n');
+  } else {
+    return ''; // No new changes
+  }
+};
`;

// const diff = diffDifferences(oldDiff, newDiff);
// const diff = getNewChanges(oldDiff, newDiff);
const diff = extractTheDiffs(oldDiff, newDiff);

console.log(diff);
