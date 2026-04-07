const diff = require('diff');
const parseDiff = require('parse-diff');

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

module.exports.convertGitDiffToPatch = gitDiffOutput => {
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
        hunks: [],
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
        lines: [],
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
};

const extractTimestamp = diffSection => {
  const timestampRegex = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/m;
  const match = diffSection.match(timestampRegex);
  const timestamp = match ? parseInt(match[1], 10) * 1000 : 0; // Convert to milliseconds
  return new Date(timestamp);
};

module.exports.diffDifferences = (oldDiff, newDiff) => {
  const oldSections = oldDiff.split(/^diff --git/m).slice(1);
  const newSections = newDiff.split(/^diff --git/m).slice(1);

  const oldTimestamp = extractTimestamp(oldSections[oldSections.length - 1]);
  const newTimestamp = extractTimestamp(newSections[newSections.length - 1]);

  // Compare the timestamps to determine the newer changes
  if (newTimestamp.getTime() > oldTimestamp.getTime()) {
    return newSections.join('\n\n');
  } else {
    return ''; // No new changes
  }
};

module.exports.getNewChanges = (prevDiff, currDiff) => {
  // Split the diff outputs into arrays of lines
  const prevLines = prevDiff.split('\n');
  const currLines = currDiff.split('\n');

  // Find the starting indices of the old and new changes in the current diff
  let oldStartIdx = -1;
  for (let i = 0; i < currLines.length; i++) {
    if (/\-\-\-\s/.test(currLines[i])) {
      oldStartIdx = i;
      break;
    }
  }
  let newStartIdx = -1;
  for (let i = 0; i < currLines.length; i++) {
    if (/\+\+\+\s/.test(currLines[i])) {
      newStartIdx = i;
      break;
    }
  }

  // Extract the new changes from the current diff, if any
  let newChanges = '';
  if (newStartIdx >= 0) {
    newChanges = currLines.slice(newStartIdx + 1).join('\n');
  }

  // Remove the old changes from the new changes, if any
  if (oldStartIdx >= 0) {
    const oldChanges = prevLines.slice(oldStartIdx + 1).join('\n');
    const regex = new RegExp(`^${oldChanges}`, 'm');
    newChanges = newChanges.replace(regex, '');
  }

  // Return the new changes
  return newChanges;
};

module.exports.calculateNewChanges = (oldDiff, newDiff) => {
  const oldLines = oldDiff.split('\n');
  const newLines = newDiff.split('\n');

  let diffStarted = false;
  let diffLines = [];

  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i];

    if (line.startsWith('@@')) {
      diffStarted = true;
      diffLines.push(line);
    } else if (diffStarted) {
      if (!line.startsWith('+') && !line.startsWith('-')) {
        diffLines.push(line);
      }
    }
  }

  return diffLines.join('\n');
};

const IsImportantLine = line => {
  return line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@');
};

module.exports.extractTheDiffs = (oldDiff, newDiff) => {
  const oldLines = oldDiff.split('\n');
  const newLines = newDiff.split('\n');

  const length = Math.max(oldDiff.length, newLines.length);

  const diffs = [];

  for (let index = 0; index < length; index++) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];

    if (oldLine && newLine) {
      if (oldLine === newLine) {
        if (IsImportantLine(oldLine)) {
          diffs.push(oldLine);
        }
      } else {
        diffs.push(newLine);
      }
    } else if (newLine) {
      diffs.push(newLine);
    }
  }

  return diffs.join('\n');
};
