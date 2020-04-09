const path = require('path');
const readYamlFile = require('read-yaml-file');
const Deploy = require('./lib/deploy');

const configPath = path.join(process.cwd(), '_config.yml');

readYamlFile(configPath).then((data) => {
  if (data.deploy) {
    new Deploy(data.deploy);
  }
});
