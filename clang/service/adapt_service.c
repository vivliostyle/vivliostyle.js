#if defined(_WIN32)
#define ADAPT_SERVICE_DLL
#define _CRT_SECURE_NO_WARNINGS
#endif

#include <stdio.h>
#include <string.h>

#include "clang/service/adapt_service.h"

#include "third_party/mongoose/mongoose.h"

#define MINIZ_HEADER_FILE_ONLY
#include "third_party/miniz/miniz.c"

#include "clang/resources/adapt_resources.h"

static const char adapt_driver[] =
"<html xmlns='http://www.w3.org/1999/xhtml' "
    "style='position:absolute;left:0px;top:0px;width:100%;height:100%;margin:0px;overflow:hidden;'>"
"<head>"
"<meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'/>"
"<meta name='apple-mobile-web-app-capable' content='yes'/>"
"<script>CLOSURE_NO_DEPS = true;adapt_embedded=true;</script>"
"<script src='adapt.js'></script>"
"</head>"
"<body style='position:absolute;left:0px;top:0px;width:100%;height:100%;margin:0px;padding:0px;overflow:hidden;'>"
"</body>"
"</html>\r\n";

#define TYPE_UNKNOWN 0
#define TYPE_EPUB 1
#define TYPE_FB2 2

struct adapt_serving_context {
    adapt_callback* callback;
    mz_zip_archive zip;
    char bootstrap_url[64];
    char content_prefix[64];
    char html_prefix[64];
    char msg_url[64];
    char* init_call;
    char* content;
    char** options;
    int content_type;
    struct mg_callbacks server_callbacks;
    struct mg_context* server_context;
};

static size_t adapt_file_read_func(void *pOpaque, mz_uint64 file_ofs, void *pBuf, size_t n) {
    adapt_callback* callback = (adapt_callback*)pOpaque;
    if (file_ofs + n > callback->content_length) {
        if (file_ofs > callback->content_length) {
            return 0;
        }
        n = (size_t)callback->content_length - (size_t)file_ofs;
    }
    callback->read_bytes(callback, pBuf, (size_t)file_ofs, n);
    return n;
}

static size_t adapt_write_resource(void *pOpaque, mz_uint64 file_ofs, const void *pBuf, size_t n) {
    struct mg_connection* connection = (struct mg_connection*)pOpaque;
    return mg_write(connection, pBuf, n);
}

static int adapt_serve_zip_entry(struct mg_connection* connection, adapt_serving_context* context,
                                 const char* file_name) {
    int file_index = mz_zip_reader_locate_file(&context->zip, file_name, NULL,
                                               MZ_ZIP_FLAG_CASE_SENSITIVE);
    mz_zip_archive_file_stat file_info;
    if (mz_zip_reader_file_stat(&context->zip, file_index, &file_info)) {
        if (file_index >= 0) {
            mg_printf(connection,
                      "HTTP/1.1 200 Success\r\n"
                      "Content-Length: %d\r\n"
                      "\r\n",
                      (int)file_info.m_uncomp_size);
            mz_zip_reader_extract_to_callback(&context->zip, file_index, adapt_write_resource, connection,
                                              MZ_ZIP_FLAG_CASE_SENSITIVE);
            return 1;
        }
        mg_printf(connection,
                  "HTTP/1.1 404 Not found\r\n"
                  "Content-Length: 0\r\n"
                  "\r\n");
        return 1;
    }
    return 0;
}

static void url_encode_name(const char* in, char* out, int out_size) {
    char* last = out + out_size - 4;
    while (out < last && *in) {
        int c = (*in) & 0xFF;
        if ( c <= ' ' || c >= 127 || c == '%' || c == '"' || c == ':' || c == '?' || c == '#' || c == '&') {
            sprintf(out, "%%%02X", c);
            out += 3;
        } else {
            *out = c;
            ++out;
        }
        ++in;
    }
    *out = '\0';
}

static int adapt_serve_zip_metadata(struct mg_connection* connection, adapt_serving_context* context,
                                 const char* item) {
    if (strcmp(item, "list") == 0) {
        // URL-encoding may turn one character into three.
        char name_buffer[MZ_ZIP_MAX_ARCHIVE_FILENAME_SIZE * 3 + 4];
        int file_index = 0;
        mz_zip_archive_file_stat file_info;
        const char* sep = "";
        mg_printf(connection,
                  "HTTP/1.1 200 Success\r\n"
                  "Content-Type: text/plain\r\n"
                  "\r\n[");
        while (mz_zip_reader_file_stat(&context->zip, file_index, &file_info)) {
            ++file_index;
            url_encode_name(file_info.m_filename, name_buffer, sizeof name_buffer);
            mg_printf(connection, "%s{\"n\":\"%s\",\"m\":%d,\"c\":%llu,\"u\":%llu}",
                      sep, name_buffer, file_info.m_method, file_info.m_comp_size, file_info.m_uncomp_size);
            sep = ",";
        }
        mg_printf(connection, "]\r\n");
        return 1;
    }
    return 0;
}

static const char adapt_http_error[] = "HTTP/1.1 500 Unrecognized request\r\n\r\n";

// void __stdcall OutputDebugStringA(const char* s);

static int adapt_serve(struct mg_connection* connection) {
    struct mg_request_info* request = mg_get_request_info(connection);
    adapt_serving_context* context = (adapt_serving_context*)request->user_data;
    const char* uri = request->uri;
	// char buf[1024];
	// sprintf(buf, "Requested uri '%s'\n", uri);
	// OutputDebugStringA(buf);
    if (strncmp(uri, context->content_prefix, strlen(context->content_prefix)) == 0) {
        const char* file_name = uri + strlen(context->content_prefix);
        if (*file_name == '\0') {
            // Special case, query about file structure
            const char * r = strstr(request->query_string, "r=");
            if (r && adapt_serve_zip_metadata(connection, context, r+2)) {
                return 1;
            }
        } else {
            if (adapt_serve_zip_entry(connection, context, file_name)) {
                return 1;
            }
        }
    } else if (strcmp(uri, context->msg_url) == 0) {
        char* buf = NULL;
        int len = 0;
        if (strcmp(request->request_method, "POST") == 0) {
            buf = (char*)malloc(4096);
            len = mg_read(connection, buf, 4096);
            if (len < 0) {
                len = 0;
            }
        }
        context->callback->process_message(context->callback, buf, len);
        if (buf) {
            free(buf);
        }
        mg_printf(connection,
                  "HTTP/1.1 200 Success\r\n"
                  "Content-Length: 4\r\n"
                  "\r\nOK\r\n");
        return 1;
    } else if (strncmp(uri, context->html_prefix, strlen(context->html_prefix)) == 0) {
        const char* file_name = uri + strlen(context->html_prefix);
        if (strcmp(file_name, "driver.xhtml") == 0) {
            mg_printf(connection,
                      "HTTP/1.1 200 Success\r\n"
                      "Content-Type: application/xhtml+xml\r\n"
                      "Content-Length: %ld\r\n"
                      "\r\n",
                      strlen(adapt_driver));
            mg_write(connection, adapt_driver, sizeof adapt_driver);
            return 1;
        } else {
            int i = 0;
            while (adapt_resources[i].name) {
                if (strcmp(file_name, adapt_resources[i].name) == 0) {
                    mg_printf(connection,
                              "HTTP/1.1 200 Success\r\n"
                              "Content-Type: %s\r\n"
                              "Content-Length: %d\r\n"
                              "%s"
                              "\r\n",
                              adapt_resources[i].type, adapt_resources[i].size,
                              adapt_resources[i].compressed ? "Content-Encoding: gzip\r\n" : "");
                    mg_write(connection, adapt_resources[i].data, adapt_resources[i].size);
                    return 1;
                }
                i++;
            }
        }
    }
    mg_write(connection, adapt_http_error, strlen(adapt_http_error));
    return 1;
}

static int adapt_port = 12345;

adapt_serving_context* adapt_start_serving(adapt_callback* callback) {
    int tries;
	int file_index;
    adapt_serving_context* context = (adapt_serving_context*)calloc(sizeof(adapt_serving_context), 1);
    time_t timeval;
    time(&timeval);
    sprintf(context->content_prefix, "/E%lx/", timeval);
    sprintf(context->html_prefix, "/H%lx/", timeval);
    sprintf(context->msg_url, "/M%lx", timeval);
    context->callback = callback;
    context->zip.m_pRead = adapt_file_read_func;
    context->zip.m_pIO_opaque = callback;
    if (!mz_zip_reader_init(&context->zip, callback->content_length, MZ_ZIP_FLAG_CASE_SENSITIVE)) {
        free(context);
        return NULL;
    }
    // Check if this is an epub file.
    file_index = mz_zip_reader_locate_file(&context->zip, "META-INF/container.xml", NULL,
                                               MZ_ZIP_FLAG_CASE_SENSITIVE);
    context->content_type = TYPE_UNKNOWN;
    if (file_index >= 0) {
        // This looks like epub
        context->content_type = TYPE_EPUB;
    } else {
        // This is not an epub. Maybe fb2.zip?
        mz_zip_archive_file_stat file_info;
        if (mz_zip_reader_file_stat(&context->zip, 0, &file_info)) {
            const char* filename = file_info.m_filename;
            size_t len = strlen(filename);
            if (len > 4 && strcmp(filename + len - 4, ".fb2") == 0) {
                // This is FB2 file
                context->content_type = TYPE_FB2;
                context->content = strcpy((char*)malloc(strlen(filename) + 1), filename);
            }
        }
    }
    if (context->content_type == TYPE_UNKNOWN) {
        adapt_stop_serving(context);
        return NULL;
    }
    context->server_callbacks.begin_request = adapt_serve;
    context->options = (char**)calloc(sizeof(char*), 3);
    context->options[0] = strcpy((char*)malloc(16), "listening_ports");
    context->options[1] = (char*)calloc(100, 1);
    tries = 0;
    do {
        sprintf(context->options[1], "%d", adapt_port);
        context->server_context = mg_start(&context->server_callbacks, context, (const char**)context->options);
        sprintf(context->bootstrap_url, "http://127.0.0.1:%d%sdriver.xhtml",
                adapt_port, context->html_prefix);
        adapt_port++;
        tries++;
    } while (!context->server_context && tries < 10);
    return context;
}

const char* adapt_get_bootstrap_url(adapt_serving_context* context) {
    return context->bootstrap_url;
}

const char* adapt_get_init_call(adapt_serving_context* context, const char* instance_id, const char* config) {
	size_t size;
    if (context->init_call) {
        free(context->init_call);
    }
    size = 256 + (context->content ? strlen(context->content) : 0) +
       (config ? strlen(config) : 0) + strlen(instance_id);
    context->init_call = (char*)calloc(size, 1);
    if (context->content_type == TYPE_EPUB) {
        sprintf(context->init_call,
                "adapt_initEmbed('%s','%s',{\"a\":\"loadEPUB\",\"url\":\"%s\",\"zipmeta\":true%s%s});",
                context->msg_url, instance_id, context->content_prefix,
                config ? "," : "", config ? config : "");
    } else {
        sprintf(context->init_call,
                "adapt_initEmbed('%s','%s',{\"a\":\"loadXML\",\"url\":\"%s%s\"%s%s});",
                context->msg_url, instance_id, context->content_prefix, context->content,
                config ? "," : "", config ? config : "");
    }
    return context->init_call;
}

void adapt_stop_serving(adapt_serving_context* context) {
    if (context->server_context) {
        mg_stop(context->server_context);
    }
    if (context->options) {
        int i;
        for (i = 0; context->options[i]; i++) {
            free(context->options[i]);
        }
        free(context->options);
    }
    if (context->init_call) {
        free(context->init_call);
    }
    if (context->content) {
        free(context->content);
    }
    mz_zip_reader_end(&context->zip);
    free(context);
}
