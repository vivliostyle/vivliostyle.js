#include <stdio.h>
#include <strings.h>

#include "clang/test/adapt_testsuite.h"

static struct adapt_testcase testcase;
static FILE* input_file;
static FILE* output_file;
static char buffer[2048];

int adapt_testsuite_open(const char* folder) {
    strcpy(buffer, folder);
    strcat(buffer, "index.test");
    input_file = fopen(buffer, "r");
    strcpy(buffer, folder);
    strcat(buffer, "result.test");
    output_file = fopen(buffer, "w");
    if (input_file && output_file) {
        return 1;
    }
    if (input_file) {
        fclose(input_file);
    }
    if (output_file) {
        fclose(output_file);
    }
    return 0;
}

struct adapt_testcase* adapt_testsuite_next_testcase() {
    while (input_file && fgets(buffer, sizeof buffer, input_file) != NULL) {
        const char* status = strtok(buffer, " \t\r\n\f");
        if (!status || *status == '#') {
            continue;
        }
        testcase.status = *status == 'P';
        const char * type = strtok(NULL, " \t\r\n\f");
        if (!type) {
            return NULL;
        }
        testcase.test_type = *type;
        testcase.relative_path = strtok(NULL, " \t\r\n\f");
        if (!testcase.relative_path) {
            return NULL;
        }
        return &testcase;
    }
    return NULL;
}

void adapt_testsuite_report(struct adapt_testcase* testcase, char status) {
    fprintf(output_file, "%c %c %s\n", status, (char)testcase->test_type, testcase->relative_path);
    fflush(output_file);
}

void adapt_testsuite_close() {
    fclose(input_file);
    fclose(output_file);
}
