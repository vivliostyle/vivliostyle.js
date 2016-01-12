var fs = require("fs");

var specs = {};
var trProperties = {};
var draftProperties = {};

var ignoreSpecs = {
    "css-2d-transforms-1": true,
    "css-align-3": true,
    "css-box-3": true,
    "css-round-display-1": true,
    "svg": true,
    "svg2": true
};

var orderedSpecs = [
    "css21",
    "css-page-3",
    "css-color-3",
    "css-color-4",
    "css-backgrounds-3",
    "css-backgrounds-4",
    "css-images-3",
    "css-images-4",
    "css-fonts-3",
    "css-text-3",
    "css-text-4",
    "css-text-decor-3",
    "css-multicol-1",
    "css-multicol-2",
    "css-ui-3",
    "css-writing-modes-3",
    "css-speech-1",
    "css-flexbox-1",
    "css-lists-3",
    "css-masking-1",
    "css-position-3",
    "css-break-3",
    "css-transforms-1",
    "css-ruby-1",
    "css-overflow-3",
    "css-shapes-1",
    "css-shapes-2",
    "css-regions-1",
    "css-exclusions-1",
    "css-size-adjust-1",
    "css-inline-3",
    "css-page-floats-3",
    "uncategorized"
];

var specs = {"uncategorized": {
    name: "uncategorized",
    title: "Uncategorized"
}};

var rawData = JSON.parse(fs.readFileSync("anchors.json", "utf8"));
for (var key in rawData) {
    var rawSpecData = rawData[key];
    var name = rawSpecData["name"];
    if (ignoreSpecs[name]) continue;
    var spec = specs[name] = {
        name: name,
        title: rawSpecData["title"],
        base_uri: rawSpecData["base_uri"],
        draft_uri: rawSpecData["draft_uri"],
        uri: rawSpecData["base_uri"] || rawSpecData["draft_uri"]
    };
    specs[name] = spec;

    function parseAnchors(anchors, propertyMap) {
        anchors.forEach(function(anchor) {
            if (anchor["type"] === "property") {
                anchor["spec"] = spec;
                var anchors = propertyMap[anchor["title"]];
                if (!anchors) {
                    propertyMap[anchor["title"]] = anchors = [];
                }
                anchors.push(anchor);
                anchors.sort(function(a1, a2) {
                    return a1.spec.name.localeCompare(a2.spec.name);
                });
            }
            if (anchor["children"]) {
                parseAnchors(anchor["children"], propertyMap);
            }
        });
    }

    if (rawSpecData["anchors"]) parseAnchors(rawSpecData["anchors"], trProperties);
    if (rawSpecData["draft_anchors"]) parseAnchors(rawSpecData["draft_anchors"], draftProperties);
}

var rawValidations = fs.readFileSync("../resources/validation.txt", "utf8");
var propDefs = rawValidations.replace(/\r*\n +/g, " ").split("\n").filter(function(line) {
    return line.match(/^[[a-z][^=]*=/);
}).map(function(line) {
    return line.trim();
});

var properties = propDefs.map(function(propdef) {
    var parts = propdef.match(/^(\[([^\]]+)\])?([^=^\s]+)\s*=\s*(.+)$/);
    return {
        prefixes: parts[2] ? parts[2].split(",") : [],
        name: parts[3],
        value: parts[4]
    };
}).sort(function(prop1, prop2) {
    var spec1 = (trProperties[prop1.name] || draftProperties[prop1.name]);
    var spec1Name = (spec1 && spec1[0] && spec1[0].spec && spec1[0].spec.name) || "";
    var spec2 = (trProperties[prop2.name] || draftProperties[prop2.name]);
    var spec2Name = (spec2 && spec2[0] && spec2[0].spec && spec2[0].spec.name) || "";
    return (orderedSpecs.indexOf(spec1Name) - orderedSpecs.indexOf(spec2Name))
        || prop1.name.localeCompare(prop2.name);
});

var sectionedProperties = {};
properties.forEach(function(prop) {
    function sectionProperty(specProperties) {
        var specProp = specProperties[prop.name];
        if (specProp) {
            specProp.forEach(function (s) {
                var specName = s.spec.name;
                var props = sectionedProperties[specName];
                if (!props) {
                    props = sectionedProperties[specName] = [];
                }
                if (!props.some(function (p) {
                        return p.name === prop.name;
                    })) {
                    props.push(prop);
                }
            });
        }
    }
    sectionProperty(trProperties);
    sectionProperty(draftProperties);
    if (!trProperties[prop.name] && !draftProperties[prop.name]) {
        var props = sectionedProperties["uncategorized"];
        if (!props) {
            props = sectionedProperties["uncategorized"] = [];
        }
        props.push(prop);
    }
});

var sectionedPropertiesView = [];
orderedSpecs.forEach(function(specName) {
    var props = sectionedProperties[specName];
    sectionedPropertiesView.push({
        spec: specs[specName],
        properties: props.map(function(p) {
            var trData = trProperties[p.name];
            var draftData = draftProperties[p.name];
            return {
                prefixes: p.prefixes.join(", "),
                name: p.name,
                value: p.value,
                trData: trData,
                draftData: draftData,
                spec: (trData && trData[0]) || (draftData && draftData[0])
            };
        }).sort(function(p1, p2) {
                return p1.name.localeCompare(p2.name);
        })
    });
});

var template = fs.readFileSync("property-doc-template.mustache", "utf8");
var markdown = require("mustache").render(template, {properties: sectionedPropertiesView});

fs.writeFileSync("property-doc-generated.md", markdown);
