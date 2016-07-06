#!/bin/sh

# When specifying commit, branch should be specified too.
core_tag=2016.7
core_branch=
core_commit=
ui_tag=
ui_branch=fixed_view
ui_commit=19eed2a55235102ea6831c8b770aceebdac7bb39

core_repo=git://github.com/vivliostyle/vivliostyle.js.git
ui_repo=git://github.com/vivliostyle/vivliostyle-ui.git

if [ ! -e vivliostyle.js ]; then
    git clone --single-branch ${core_repo} vivliostyle.js
fi
cd vivliostyle.js
git checkout .
git checkout master

if [ "${core_tag}" != "" ]; then
    git fetch --tags
    git checkout ${core_tag}
else
    if [ "${core_branch}" != "master" ]; then
        git fetch origin ${core_branch}:remotes/origin/${core_branch}
        git checkout -B ${core_branch} origin/${core_branch}
    fi
    if [ "${core_commit}" != "" ]; then
        git checkout ${core_commit}
    fi
fi

core_version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
if [ $(echo ${core_version} | grep -- '-pre$') ]; then
    core_version=${core_version}.$(git rev-parse HEAD)
    npm --no-git-tag-version version ${core_version}
fi
core_version=$(echo ${core_version} | sed -e 's/\.0$//')
sed -i "" -e "s/%version%/${core_version}/" src/wrapper.js

cd ..

if [ ! -e vivliostyle-ui ]; then
    git clone --single-branch ${ui_repo} vivliostyle-ui
fi
cd vivliostyle-ui
git checkout .
git checkout master

if [ "${ui_tag}" != "" ]; then
    git fetch --tags
    git checkout ${ui_tag}
else
    if [ "${ui_branch}" != "master" ]; then
        git fetch origin ${ui_branch}:remotes/origin/${ui_branch}
        git checkout -B ${ui_branch} origin/${ui_branch}
    fi
    if [ "${ui_commit}" != "" ]; then
        git checkout ${ui_commit}
    fi
fi

ui_version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
if [ $(echo ${ui_version} | grep -- '-pre$') ]; then
    ui_version=${ui_version}.$(git rev-parse HEAD)
    npm --no-git-tag-version version ${ui_version}
fi
