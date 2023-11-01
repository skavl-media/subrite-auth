# Contributing

## Release process

Follow these steps:

### Update `CHANGELOG.md`

* Add a new section for the new version at the top of the file.
* Add a link for the new version at the bottom of the file.

### Update `package.json`

The new version should match the version in `CHANGELOG.md`.

### Commit changes

    git add .
    git commit -m "Release vX.Y.Z"

### Publish to npm

    npm publish --access public --tag vX.Y.Z
