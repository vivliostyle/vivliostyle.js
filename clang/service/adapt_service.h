#ifndef ADAPT_CLANG_SERVICE__ADAPT_SERVICE_H
#define ADAPT_CLANG_SERVICE__ADAPT_SERVICE_H

typedef struct adapt_callback {
    unsigned long content_length;
    void (*read_bytes)(struct adapt_callback* self, void* buffer, size_t offset, size_t length);
    void (*process_message)(struct adapt_callback* self, const void* buffer, size_t length);
} adapt_callback;

typedef struct adapt_serving_context adapt_serving_context;

adapt_serving_context* adapt_start_serving(adapt_callback* callback);
const char* adapt_get_bootstrap_url(adapt_serving_context* context);
const char* adapt_get_init_call(adapt_serving_context* context, const char* instance_id, const char* extra_config);
void adapt_stop_serving(adapt_serving_context*);

#endif /* ADAPT_CLANG_SERVICE__ADAPT_SERVICE_H */
