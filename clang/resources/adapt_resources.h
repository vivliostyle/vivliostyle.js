#ifndef ADAPT_CLANG_RESOURCES__ADAPT_RESOURCES_H
#define ADAPT_CLANG_RESOURCES__ADAPT_RESOURCES_H

struct adapt_resource {
    const char* name;
    const char* type;
    int compressed;
    const unsigned char* data;
    int size;
};

extern const struct adapt_resource adapt_resources[];

extern const struct adapt_resource* adapt_resource_find(const char* name);
extern void adapt_resource_init();

#endif  /* ADAPT_CLANG_RESOURCES__ADAPT_RESOURCES_H */
