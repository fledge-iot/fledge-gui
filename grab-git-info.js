const { gitDescribe } = require('git-describe');
const { writeFileSync } = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/git-version.json');
gitDescribe(__dirname, {
  longSemver: true,
  dirtySemver: false,
})
  .then((gitInfo) => {
    const infoJson = JSON.stringify(gitInfo, null, 2);
    writeFileSync(file, infoJson);
  })
  .catch((err) => {
    console.error(err)}
    );

