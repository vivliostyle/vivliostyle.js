#!/bin/sh

# When specifying commit, branch should be specified too.
core_tag=
core_branch=background_layout-r#152
core_commit=09e721b487c008d8818cbfeba4e1aa1139e136d7
ui_tag=
ui_branch=background_layout-r#152
ui_commit=5a932ef95552b548ebab63566b37c2d989dec3b2

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
    git fetch origin ${core_branch}:remotes/origin/${core_branch}
    if [ "${core_branch}" != "master" ]; then
        git checkout -B ${core_branch} origin/${core_branch}
    fi
    git pull
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
    git fetch origin ${ui_branch}:remotes/origin/${ui_branch}
    if [ "${ui_branch}" != "master" ]; then
        git checkout -B ${ui_branch} origin/${ui_branch}
    fi
    git pull
    if [ "${ui_commit}" != "" ]; then
        git checkout ${ui_commit}
    fi
fi

ui_version=$(grep '^ *"version":' package.json | sed -e 's/^.*"\([^"]*\)",$/\1/')
if [ $(echo ${ui_version} | grep -- '-pre$') ]; then
    ui_version=${ui_version}.$(git rev-parse HEAD)
    npm --no-git-tag-version version ${ui_version}
fi
