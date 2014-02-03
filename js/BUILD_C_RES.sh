#!/bin/bash

closure_flags="--compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT --warning_level VERBOSE"
#closure_flags="--compilation_level ADVANCED_OPTIMIZATIONS --warning_level VERBOSE"

function compile() {
    java -jar ../../tools/closure/compiler.jar $closure_flags \
         closure/goog/base.js adapt/base.js adapt/task.js adapt/taskutil.js adapt/net.js adapt/cfi.js adapt/expr.js adapt/css.js adapt/csstok.js adapt/cssparse.js adapt/cssvalid.js adapt/geom.js adapt/cssprop.js adapt/xmldoc.js adapt/font.js adapt/sha1.js adapt/csscasc.js adapt/vtree.js adapt/cssstyler.js adapt/vgen.js adapt/pm.js adapt/layout.js adapt/ops.js adapt/epub.js adapt/devel.js adapt/viewer.js
}

function maybecompress() {
  if [ "$1" = "-" ]; then
    gzip
  else
    gzip < "$1"
  fi
}

function typeFromName() {
    case "$1" in
        *.js) echo "application/javascript";;
        *.txt) echo "text/plain";;
        *.css) echo "text/css";;
        *.xml) echo "text/xml";;
        *) echo "application/octet-stream";;
    esac
}

count=0

function bindump() {
    count=`expr $count + 1`
    echo "static const char name$count[] = \"$2\";"
    echo "static const char type$count[] = \""`typeFromName "$2"`"\";"
    echo "static const unsigned char data$count[] = {"
    maybecompress "$1" | od -v -t u1 | \
        sed -e 's/^[0-9][0-9]*[ \t]*//' -e '/^$/d' -e 's/$/ /' -e 's/\([0-9]\)[ \t][ \t]*/\1,/g'
    echo "0};"
    echo "#define size$count (sizeof(data$count) - 1)"
    echo "#define compressed$count 1"
    echo
}

mkdir -p ../clang/generated

(echo "#include \"clang/resources/adapt_resources.h\""
echo "#include <string.h>"
echo
compile | bindump - adapt.js
count=1
bindump adapt/user-agent-base.css user-agent-base.css
bindump adapt/user-agent-page.css user-agent-page.css
bindump adapt/user-agent.xml user-agent.xml
bindump adapt/validation.txt validation.txt

if [ -e "../../MathJax" ]; then
    echo "Using MathJax" >&2
    for file in `cd ../../MathJax;echo MathJax.js;echo config/MML_HTMLorMML.js;find jax/input/MathML;find jax/output/HTML-CSS`
    do
        if [ ! -d "../../MathJax/$file" ]; then
            bindump "../../MathJax/$file" "MathJax/$file"
        fi
    done
fi

echo "const struct adapt_resource adapt_resources[] = {"
i=0
while [ $i -ne $count ]
do
i=`expr $i + 1`
echo "{name$i, type$i, compressed$i, data$i, size$i},"
done
echo "{0}};"

echo "#define hash_table_size (2 * $count + 1)"
cat << EOF

static struct adapt_resource* hash_table[hash_table_size];
static int hash_table_initialized;

static unsigned int string_hash(const char* s) {
    unsigned int hash = 7;
    while (*s) {
        hash = hash * 31 + ((*s) & 0xFF);
        s++;
    }
    return hash;
}

const struct adapt_resource* adapt_resource_find(const char* file_name) {
    if (hash_table_initialized) {
        // Resources have been hashed
        unsigned int hash = string_hash(file_name);
        int i = hash % hash_table_size;
        while (hash_table[i]) {
            if (strcmp(file_name, hash_table[i]->name) == 0) {
                return hash_table[i];
            }
            i = (i + 1) % hash_table_size;
        }
    } else {
        int i = 0;
        while (adapt_resources[i].name) {
            if (strcmp(file_name, adapt_resources[i].name) == 0) {
                return &adapt_resources[i];
            }
            i++;
        }
    }
    return 0;
}

void adapt_resource_init() {
    if (hash_table_initialized) {
        return;
    }
    int i = 0;
    while (adapt_resources[i].name) {
        unsigned int hash = string_hash(adapt_resources[i].name);
        int k = hash % hash_table_size;
        while (hash_table[k]) {
            k = (k + 1) % hash_table_size;
        }
        hash_table[k] = &adapt_resources[i];
        i++;
    }
    hash_table_initialized = 1;
}

EOF
) > ../clang/generated/adapt_resources.c

