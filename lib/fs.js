const P = require('bluebird');
const fs = require('fs');
const { join, dirname } = require('path');

const statSync = fs.statSync;
const readdirAsync = P.promisify(fs.readdir);
const accessAsync = P.promisify(fs.access);
const mkdirAsync = P.promisify(fs.mkdir);
const writeFileAsync = P.promisify(fs.writeFile);
const rmdirAsync = P.promisify(fs.rmdir);
const unlinkAsync = P.promisify(fs.unlink);
const copyFileAsync = P.promisify(fs.copyFile);

function _pathError(path) {
  if (!path) {
    throw new TypeError('path is required!');
  }
}

function _readAndGetFilesInfo(path) {
  return readdirAsync(path).map(filename => {
    const fullPath = join(path, filename);
    const stats = statSync(fullPath);

    return {
      filename,
      isDirectory: stats.isDirectory(),
      path: fullPath,
    };
  });
}

function _checkParent(path) {
  _pathError(path);

  const dir = dirname(path);

  return mkdirAsync(dir).catch(err => {
    if (err.cause.code !== 'EEXIST') throw err;
  });
}

function exists(path) {
  _pathError(path);

  return accessAsync(path, fs.constants.F_OK)
    .then(
      () => true,
      () => false
    )
    .then(exist => {
      return exist;
    });
}

function emptyDir(path, isRemove = false) {
  _pathError(path);

  return _readAndGetFilesInfo(path)
    .filter(file => file.filename !== '.git')
    .each(file => {
      if (file.isDirectory) {
        return emptyDir(file.path, true);
      } else {
        return unlinkAsync(file.path);
      }
    })
    .then(() => {
      if (isRemove) return rmdirAsync(path);
    });
}

function writeFile(path, data) {
  _pathError(path);

  return _checkParent(path).then(() => writeFileAsync(path, data));
}

function copyDir(publicDir, deployDir) {
  return _readAndGetFilesInfo(publicDir).each(file => {
    const destDir = join(deployDir, file.filename);

    if (file.isDirectory) {
      return copyDir(file.path, destDir);
    } else {
      return _checkParent(destDir).then(() =>
        copyFileAsync(file.path, destDir)
      );
    }
  });
}

exports.exists = exists;
exports.emptyDir = emptyDir;
exports.writeFile = writeFile;
exports.copyDir = copyDir;
