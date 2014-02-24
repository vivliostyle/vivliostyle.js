#ifndef ADAPT_CLANG_TEST__ADAPT_TESTSUITE_H
#define ADAPT_CLANG_TEST__ADAPT_TESTSUITE_H

#define ADAPT_TEST_TYPE_COMPARE_TO_BROWSER 'B'
#define ADAPT_TEST_TYPE_NO_RED 'R'

struct adapt_testcase {
    int test_type;
    int status;
    const char* relative_path;
};

int adapt_testsuite_open(const char* folder);
struct adapt_testcase* adapt_testsuite_next_testcase();
void adapt_testsuite_report(struct adapt_testcase* testcase, char status);
void adapt_testsuite_close();

#endif /* ADAPT_CLANG_TEST__ADAPT_TESTSUITE_H */
