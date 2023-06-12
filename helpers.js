const diff = require('diff');

module.exports.reverseChangesFromDiff = (diffContent, newContent) => {
  const parsedDiff = diff.parsePatch(diffContent)[0];
  const reversedPatch = reversePatch(parsedDiff);

  const reversedContent = diff.applyPatch(newContent, reversedPatch);

  return reversedContent;
};

// https://github.com/kpdecker/jsdiff/issues/105
const reversePatch = parsedDiff => {
  const { oldFileName, newFileName, oldHeader, newHeader, hunks } = parsedDiff;

  parsedDiff.oldFileName = newFileName;
  parsedDiff.oldHeader = newHeader;
  parsedDiff.newFileName = oldFileName;
  parsedDiff.newHeader = oldHeader;

  for (const hunk of hunks) {
    const { oldLines, oldStart, newLines, newStart, lines } = hunk;
    hunk.oldLines = newLines;
    hunk.oldStart = newStart;
    hunk.newLines = oldLines;
    hunk.newStart = oldStart;

    hunk.lines = lines.map(l => {
      if (l.startsWith('-')) {
        return `+${l.slice(1)}`;
      }
      if (l.startsWith('+')) {
        return `-${l.slice(1)}`;
      }
      return l;
    });
  }

  return parsedDiff;
};

module.exports.convertGitDiffToPatch = (gitDiffOutput) =>{
  const patches = [];
  let currentPatch = null;

  gitDiffOutput.split('\n').forEach(line => {
    if (line.startsWith('diff --git')) {
      // Start of a new patch
      if (currentPatch) {
        patches.push(currentPatch);
      }
      currentPatch = {
        oldFile: line.split(' ')[2].substring(2),
        newFile: line.split(' ')[3].substring(2),
        hunks: []
      };
    } else if (line.startsWith('@@')) {
      // Start of a new hunk
      const hunkHeader = line.substring(3);
      const hunkInfo = hunkHeader.split(' ');
      const oldStart = parseInt(hunkInfo[1].split(',')[0].substring(1), 10);
      const newStart = parseInt(hunkInfo[2].split(',')[0].substring(1), 10);
      const hunk = {
        oldStart,
        newStart,
        lines: []
      };
      currentPatch.hunks.push(hunk);
    } else if (line.startsWith('+') || line.startsWith('-')) {
      // Line change within a hunk
      currentPatch.hunks[currentPatch.hunks.length - 1].lines.push(line);
    }
  });

  if (currentPatch) {
    patches.push(currentPatch);
  }

  return patches;
}
