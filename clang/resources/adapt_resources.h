#ifndef EPUBViewer_adapt_h
#define EPUBViewer_adapt_h

struct adapt_resource {
    const char* name;
    const char* type;
    int compressed;
    const unsigned char* data;
    int size;
};

extern const struct adapt_resource adapt_resources[];

#endif
