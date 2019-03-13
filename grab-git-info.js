const { gitDescribe } = require('git-describe');
const { writeFileSync } = require('fs');
const path = require('path');
gitDescribe(__dirname, {
  longSemver: true,
  dirtySemver: false,
})
  .then((gitInfo) => {
    const infoJson = JSON.stringify(gitInfo, null, 2);
    writeFileSync(path.join(__dirname, 'src/git-version.json'), infoJson);
  })
  .catch((err) => console.error(err));

