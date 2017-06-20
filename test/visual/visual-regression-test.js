/**
 * Copyright 2017 Vivliostyle Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 */

const testCaseGroups = require("../files/file-list");
const testCaseRelativeDir = "../files/";

function resolveTestCasePath(path) {
    return testCaseRelativeDir + path;
}

function run(pathParam) {
    browser.url("visual/visual-regression-test.html?x=" + pathParam);
    browser.waitUntil(() => {
        const classValue = browser.getAttribute("html", "class");
        return classValue.indexOf("reftest-wait") < 0;
    }, 60000);
    const report = browser.checkDocument();
    report.forEach((result) => expect(result.isExactSameImage).toBe(true));
}

function test(entry) {
    it(entry.title, () => {
        const files = Array.isArray(entry.file) ? entry.file : [entry.file];
        const pathParam = files.map(resolveTestCasePath).join("&x=");
        run(pathParam);
    });
}

function testGroup(group) {
    describe(group.category, () => {
        const entries = group.files;
        entries.forEach(test);
    });
}

describe("Visual regression tests", () => {

    testCaseGroups.forEach(testGroup);
});
