#if defined(_WIN32)
#define ADAPT_SERVICE_DLL
#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#endif

#include <sys/stat.h>
#include <stdio.h>
#include <string.h>

#include "clang/service/adapt_service.h"

#include "third_party/mongoose/mongoose.h"

#define MINIZ_HEADER_FILE_ONLY
#include "third_party/miniz/miniz.c"

#include "clang/resources/adapt_resources.h"

// This will need to be adjusted if we have too many resources.
#define MAX_RESOURCES 2048

static const char adapt_driver[] =
"<html xmlns='http://www.w3.org/1999/xhtml' "
    "style='position:absolute;left:0px;top:0px;width:100%;height:100%;margin:0px;overflow:hidden;'>"
"<head>"
"<meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'/>"
"<meta name='apple-mobile-web-app-capable' content='yes'/>"
"<script>CLOSURE_NO_DEPS=true;adapt_embedded=true;</script>"
"<script src='adapt.js'></script>"
"<script src='MathJax/MathJax.js?config=MML_HTMLorMML'></script>"
"<script>if(MathJax&amp;&amp;MathJax.Hub)MathJax.Hub.Config({jax:['input/MathML','output/HTML-CSS'],"
"showProcessingMessages:false,messageStyle:'none'});</script>"
"</head>"
"<body style='position:absolute;left:0px;top:0px;width:100%;height:100%;margin:0px;padding:0px;overflow:hidden;'>"
"</body>"
"</html>\r\n";

#define TYPE_UNKNOWN 0
#define TYPE_OPF 1
#define TYPE_XML 2

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

static int adapt_serve(struct mg_connection* connection) {
    struct mg_request_info* request = mg_get_request_info(connection);
    adapt_serving_context* context = (adapt_serving_context*)request->user_data;
    const char* uri = request->uri;
	// char buf[1024];
	// sprintf(buf, "Requested uri '%s'\n", uri);
	// OutputDebugStringA(buf);
    if (strncmp(uri, context->content_prefix, strlen(context->content_prefix)) == 0) {
        const char* file_name = uri + strlen(context->content_prefix);
        if (context->callback->packaging_type == ADAPT_PACKAGE_ZIP) {
            if (*file_name == '\0') {
                // Special case, query about file structure
                const char * r = strstr(request->query_string, "r=");
                if (r && adapt_serve_zip_metadata(connection, context, r+2)) {
                    return 1;
                }
            } else if (adapt_serve_zip_entry(connection, context, file_name)) {
                return 1;
            }
        } else if (context->callback->packaging_type == ADAPT_PACKAGE_SINGLE_FILE) {
            // plain fb2 file, no external resources
            if (strcmp(file_name, "file.fb2") == 0) {
                char buf[4096];
                size_t p = 0;
                mg_printf(connection,
                    "HTTP/1.1 200 Success\r\n"
                    "Content-Type: text/xml\r\n"
                    "Content-Length: %ld\r\n"
                    "\r\n",
                context->callback->content_length);
                do {
                    size_t len = context->callback->content_length - p;
                    if (len > sizeof buf) {
                        len = sizeof buf;
                    }
                    context->callback->read_bytes(context->callback, buf, p, len);
                    mg_write(connection, buf, len);
                    p += len;
                } while (p < context->callback->content_length);
                return 1;
            }
        } else if (context->callback->packaging_type == ADAPT_PACKAGE_FILE_SYSTEM) {
            if (*file_name != '\0') {
                return 0;
            }
        }
    } else if (strcmp(uri, context->msg_url) == 0) {
        int buf_size = 256;
        char* buf = (char*)malloc(buf_size);
        int len = 0;
        if (strcmp(request->request_method, "POST") == 0) {
            int r;
            while((r = mg_read(connection, buf + len, buf_size - len)) > 0) {
                len += r;
                if (len == buf_size) {
                    buf_size *= 2;
                    buf = (char*)realloc(buf, buf_size);
                }
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
            const struct adapt_resource* resource = adapt_resource_find(file_name);
            if (resource) {
                mg_printf(connection,
                        "HTTP/1.1 200 Success\r\n"
                        "Content-Type: %s\r\n"
                        "Content-Length: %d\r\n"
                        "%s"
                        "\r\n",
                        resource->type, resource->size,
                        resource->compressed ? "Content-Encoding: gzip\r\n" : "");
                mg_write(connection, resource->data, resource->size);
                return 1;
            }
        }
    }
    mg_write(connection, adapt_http_error, strlen(adapt_http_error));
    return 1;
}

static int adapt_port = 12345;

static int file_exists(const char* path) {
#if defined(_WIN32)
	int lenW = strlen(path);
	wchar_t * pathW = (wchar_t*)calloc(sizeof(wchar_t) * (lenW + 1), 1);
	WIN32_FILE_ATTRIBUTE_DATA info;
	BOOL result;
	MultiByteToWideChar(CP_UTF8, 0, path, -1, pathW, lenW);
	result = GetFileAttributesExW(pathW, GetFileExInfoStandard, &info);
	free(pathW);
	if (result) {
		return (info.dwFileAttributes & FILE_ATTRIBUTE_NORMAL) != 0;
	}
#else
    struct stat st;
    if (stat(path, &st) == 0) {
        return S_ISREG(st.st_mode);
    }
#endif
    return 0;
}

adapt_serving_context* adapt_start_serving(adapt_callback* callback) {
    int tries;
	int file_index;
    char* rewrites = 0;
    char* document_root = 0;
    adapt_serving_context* context = (adapt_serving_context*)calloc(sizeof(adapt_serving_context), 1);
    time_t timeval;
    adapt_resource_init();
    time(&timeval);
    sprintf(context->content_prefix, "/E%lx/", timeval);
    sprintf(context->html_prefix, "/H%lx/", timeval);
    sprintf(context->msg_url, "/M%lx", timeval);
    context->callback = callback;
    if (callback->packaging_type == ADAPT_PACKAGE_ZIP) {
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
            context->content_type = TYPE_OPF;
        } else {
            // This is not an epub. Maybe fb2.zip?
            mz_zip_archive_file_stat file_info;
            if (mz_zip_reader_file_stat(&context->zip, 0, &file_info)) {
                const char* filename = file_info.m_filename;
                size_t len = strlen(filename);
                if (len > 4 && strcmp(filename + len - 4, ".fb2") == 0) {
                    // This is FB2 file
                    context->content_type = TYPE_XML;
                    context->content = strcpy((char*)malloc(strlen(filename) + 1), filename);
                }
            }
        }
    } else if (callback->packaging_type == ADAPT_PACKAGE_FILE_SYSTEM) {
		size_t len;
		char* container_name;
		char* end;
        if (!callback->base_path) {
            free(context);
            return NULL;
        }
        // Go through the parent folder chain trying to find META-INF/container.xml (that will serve as
        // the package root)
        len = strlen(callback->base_path);
        container_name = (char*)malloc(len + 25);
        strcpy(container_name, callback->base_path);
        end = container_name + len;
        do {
            char * q = end - 1;
            while (container_name + 3 < q && *q != '/') {
                q--;
            }
            if (*q != '/') {
                break;
            }
            end = q;
            strcpy(end + 1, "META-INF/container.xml");
        } while (!file_exists(container_name));
        if (*end != '/') {
            free(context);
            return NULL;
        }
        if (len < 4 || strcmp(callback->base_path + len - 4, ".opf") == 0) {
            context->content_type = TYPE_OPF;
        } else {
            const char* path = callback->base_path + (end - container_name + 1);
            context->content = strcpy((char*)malloc(strlen(path)), path);
            context->content_type = TYPE_XML;
        }
        end[1] = '\0';
        rewrites = (char*)malloc(strlen(container_name) + strlen(context->content_prefix) + 2);
        sprintf(rewrites, "%s=%s", context->content_prefix, container_name);
        document_root = container_name;
    } else if (callback->packaging_type == ADAPT_PACKAGE_SINGLE_FILE) {
        // Assume it's FB2
        context->content_type = TYPE_XML;
        context->content = strcpy((char*)malloc(9), "file.fb2");
    }
    if (context->content_type == TYPE_UNKNOWN) {
        adapt_stop_serving(context);
        return NULL;
    }
    context->server_callbacks.begin_request = adapt_serve;
    context->options = (char**)calloc(sizeof(char*), 7);
    context->options[0] = strcpy((char*)malloc(16), "listening_ports");
    context->options[1] = (char*)calloc(100, 1);
    if (rewrites) {
        context->options[2] = strcpy((char*)malloc(24), "url_rewrite_patterns");
        context->options[3] = rewrites;
        context->options[4] = strcpy((char*)malloc(24), "document_root");
        context->options[5] = document_root;
    }
    tries = 0;
    do {
        sprintf(context->options[1], "127.0.0.1:%d", adapt_port);
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
    if (context->content_type == TYPE_OPF) {
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
