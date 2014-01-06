echo "#include \"adapt.h\""
echo

function maybecompress() {
  if [ "$1" = "1" ]
  then
     gzip
  else
     cat
  fi
}

function bindump() {
    echo "static const char name$1[] = \"$2\";"
    echo "static const char type$1[] = \"$3\";"
    echo "static const unsigned char data$1[] = {"
    maybecompress "$4" | od -v -t u1 | \
        sed -e 's/^[0-9][0-9]*[ \t]*//' -e '/^$/d' -e 's/$/ /' -e 's/\([0-9]\)[ \t][ \t]*/\1,/g'
    echo "0};"
    echo "#define size$1 (sizeof(data$1) - 1)"
    echo "#define compressed$1 $4"
    echo
}

./BUILD.sh | bindump 1 adapt.js application/javascript 1
cat adapt/user-agent-base.css | bindump 2 user-agent-base.css text/css 1
cat adapt/user-agent-page.css | bindump 3 user-agent-page.css text/css 1
cat adapt/user-agent.xml | bindump 4 user-agent.xml text/xml 1
cat adapt/validation.txt | bindump 5 validation.txt text/plain 1

echo "const struct adapt_resource adapt_resources[] = {"
for c in 1 2 3 4 5
do
echo "{name$c, type$c, compressed$c, data$c, size$c},"
done
echo "{0}};"

