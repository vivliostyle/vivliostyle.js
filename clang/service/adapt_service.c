#if defined(_WIN32)
#define ADAPT_SERVICE_DLL
#define _CRT_SECURE_NO_WARNINGS
#include <windows.h>
#endif

#include <sys/stat.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "clang/service/adapt_service.h"

#include "third_party/mongoose/mongoose.h"
#include "third_party/woff/woff.h"

#define MINIZ_HEADER_FILE_ONLY
#include "third_party/miniz/miniz.c"

#include "clang/resources/adapt_resources.h"

// This will need to be adjusted if we have too many resources.
#define MAX_RESOURCES 2048

#ifdef _WIN32
// IE only takes WOFF
static int adapt_convert_to_woff = 1;
#else
static int adapt_convert_to_woff = 0;
#endif

static const char adapt_driver[] =
"<html xmlns='http://www.w3.org/1999/xhtml' "
    "style='position:absolute;left:0px;top:0px;width:100%;height:100%;margin:0px;overflow:hidden;'>"
"<head>"
"<meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'/>"
"<meta name='apple-mobile-web-app-capable' content='yes'/>"
"<script>CLOSURE_NO_DEPS=true;adapt_embedded=true;</script>"
"<script src='adapt.js'></script>"
"<script src='MathJax/MathJax.js?config=MML_HTMLorMML'></script>"
"<script>if(window['MathJax']&amp;&amp;window['MathJax'].Hub)MathJax.Hub.Config({jax:['input/MathML','output/HTML-CSS'],"
"showProcessingMessages:false,messageStyle:'none'});</script>"
"</head>"
"<body style='position:absolute;left:0px;top:0px;width:100%;height:100%;margin:0px;padding:0px;overflow:hidden;'>"
"</body>"
"</html>\r\n";

#define TYPE_UNKNOWN 0
#define TYPE_OPF 1
#define TYPE_XML 2

struct adapt_obfuscation {
    unsigned char* mask;
    unsigned int mask_length;
    unsigned int length;
};

struct adapt_file_info {
    char* media_type;
    struct adapt_obfuscation* obfuscation;
};

struct adapt_serving_context {
    adapt_callback* callback;
    mz_zip_archive zip;
    struct adapt_file_info* file_info;
    char bootstrap_url[64];
    char content_prefix[64];
    char html_prefix[64];
    char msg_url[64];
    char* init_call;
    char* content;
    char** options;
    int content_type;
    size_t prefix_len;
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

/*============================== Filter output ==============================*/

struct adapt_sink;

typedef void (*adapt_sink_write_fn)(struct adapt_sink* data, size_t file_offset, const unsigned char* buf, size_t length);

struct adapt_sink {
    adapt_sink_write_fn write;
};

/*---------------- connection writer ----------------*/

struct adapt_sink_connection {
    struct adapt_sink super;
    struct mg_connection* connection;
};

static void adapt_sink_connection_write(struct adapt_sink* sink, size_t file_offset,
                                        const unsigned char* buf, size_t length) {
    if (length > 0) {
        mg_write(((struct adapt_sink_connection*)sink)->connection, buf, length);
    }
}

/*---------------- safari bug filter ----------------*/

struct adapt_sink_safari_bug {
    struct adapt_sink super;
    struct adapt_sink* next;
    int state;
};

static void adapt_sink_safari_bug_write(struct adapt_sink* sink, size_t file_offset,
                                        const unsigned char* buf, size_t length) {
    // Replace '<audio'/'<video' with '<audi_/<vide_' to avoid crash in Safari code.
    struct adapt_sink_safari_bug* self = (struct adapt_sink_safari_bug*)sink;
    struct adapt_sink* next = self->next;
    size_t count = 0;
    int state = self->state;
    int k = 0;
    while (k < length) {
        char c = buf[k];
        switch (state){
            case 1:
                if (c == '<') {
                    state = 2;
                }
                break;
            case 2:
                if (c == 'a') {
                    state = 3;
                } else if (c == 'v') {
                    state = 6;
                } else if (c == '!') {
                    state = 10;
                } else if (c != '/') {
                    state = 1;
                }
                break;
            case 3:
                state = c == 'u' ? 4 : 1;
                break;
            case 4:
                state = c == 'd' ? 5 : 1;
                break;
            case 5:
                state = c == 'i' ? 9 : 1;
                break;
            case 6:
                state = c == 'i' ? 7 : 1;
                break;
            case 7:
                state = c == 'd' ? 8 : 1;
                break;
            case 8:
                state = c == 'e' ? 9 : 1;
                break;
            case 9:
                state = 1;
                if (c == 'o') {
                    unsigned char out_ch = '_';
                    if (k > 0) {
                        next->write(next, file_offset + count, buf, k);
                        count += k;
                    }
                    next->write(next, file_offset + count, &out_ch, 1);
                    k++;
                    length -= k;
                    buf += k;
                    k = 0;
                    continue;
                }
                break;
            case 10:
                state = c == '[' ? 11 : 1;
                break;
            case 11:
                state = c == 'C' ? 12 : 1;
                break;
            case 12:
                state = c == 'D' ? 13 : 1;
                break;
            case 13:
                state = c == 'A' ? 14 : 1;
                break;
            case 14:
                state = c == 'T' ? 15 : 1;
                break;
            case 15:
                state = c == 'A' ? 16 : 1;
                break;
            case 16:
                state = c == '[' ? 17 : 1;
                break;
            case 17:
                if (c == ']') {
                    state = 18;
                }
                break;
            case 18:
                state = c == ']' ? 19 : 17;
                break;
            case 19:
                state = c == '>' ? 1 : 17;
                break;
        }
        k++;
    }
    self->state = state;
    if (length > 0) {
        next->write(next, file_offset + count, buf, length);
    }
}

/*---------------- deobfuscation filter ----------------*/

struct adapt_sink_deobfuscate {
    struct adapt_sink super;
    struct adapt_sink* next;
    const struct adapt_obfuscation* obfuscation;
};

static void adapt_sink_deobfuscate_write(struct adapt_sink* sink, size_t file_offset,
                                        const unsigned char* buf, size_t length) {
    struct adapt_sink_deobfuscate* self = (struct adapt_sink_deobfuscate*)sink;
    struct adapt_sink* next = self->next;
    size_t count = 0;
    while (file_offset + count < self->obfuscation->length && count < length) {
        unsigned char tmpbuf[2048];
        int tmpindex = 0;
        while (file_offset + count < self->obfuscation->length && tmpindex < sizeof tmpbuf && count < length) {
            unsigned int mask_index = (file_offset + count) % self->obfuscation->mask_length;
            tmpbuf[tmpindex++] = self->obfuscation->mask[mask_index] ^ buf[count++];
        }
        next->write(next, file_offset + count, tmpbuf, tmpindex);
    }
    next->write(next, file_offset + count, buf + count, length - count);
}

/*---------------- deflate filter ----------------*/

struct adapt_sink_inflator {
    struct adapt_sink super;
    struct adapt_sink* next;
    size_t inflated_file_offset;
    tinfl_decompressor inflator;
    unsigned char* buffer;
    size_t buffer_offset;
};

#define INFLATOR_BUFFER_SIZE (32*1024)

static void adapt_sink_inflator_write(struct adapt_sink* sink, size_t file_offset,
                                     const unsigned char* buf, size_t length) {
    struct adapt_sink_inflator* self = (struct adapt_sink_inflator*)sink;
    struct adapt_sink* next = self->next;
    size_t count = 0;
    size_t buf_size;
    size_t tmp_size;
    int status;
    if (!self->buffer && length > 0) {
        self->buffer = malloc(INFLATOR_BUFFER_SIZE);
    }
    while (1) {
        tmp_size = INFLATOR_BUFFER_SIZE - self->buffer_offset;
        buf_size = length - count;
        status = tinfl_decompress(&self->inflator, buf + count, &buf_size,
                                  self->buffer, self->buffer + self->buffer_offset, &tmp_size,
                                  length > 0 ? TINFL_FLAG_HAS_MORE_INPUT : 0);
        if (buf_size > 0) {
            count += buf_size;
        }
        if (tmp_size > 0 || length == 0) {
            next->write(next, self->inflated_file_offset, self->buffer + self->buffer_offset, tmp_size);
            self->inflated_file_offset += tmp_size;
            self->buffer_offset = (self->buffer_offset + tmp_size + INFLATOR_BUFFER_SIZE) % INFLATOR_BUFFER_SIZE;
        }
        if (status == TINFL_STATUS_DONE || (buf_size == 0 && tmp_size == 0)) {
            break;
        }
    }
    if (self->buffer && length == 0) {
        // End of stream
        free(self->buffer);
        self->buffer = NULL;
    }
}

/*---------------- otf->woff filter ----------------*/

struct adapt_sink_woff {
    struct adapt_sink super;
    struct adapt_sink* next;
    uint8_t* buffer;
    size_t buffer_used;
    size_t buffer_size;
};

static void adapt_sink_woff_write(struct adapt_sink* sink, size_t file_offset,
                                     const unsigned char* buf, size_t length) {
    struct adapt_sink_woff* self = (struct adapt_sink_woff*)sink;
    if (length > 0) {
        if (self->buffer_used + length > self->buffer_size) {
            size_t new_size = 2 * self->buffer_size + length;
            self->buffer = (uint8_t*)realloc(self->buffer, new_size);
            self->buffer_size = new_size;
        }
        memcpy(self->buffer + self->buffer_used, buf, length);
        self->buffer_used += length;
    } else if (self->buffer) {
        // End of stream
        uint32_t woffLen = 0;
        uint32_t status = eWOFF_ok;
        const uint8_t * woffData = woffEncode(self->buffer, (uint32_t)self->buffer_used,
                                              0, 0, &woffLen, &status);
        if (woffLen > 0) {
            self->next->write(self->next, 0, woffData, woffLen);
        }
        free((void *) woffData);
        free(self->buffer);
        self->buffer = NULL;
        self->buffer_used = 0;
        self->buffer_size = 0;
        self->next->write(self->next, woffLen, NULL, 0);
    }
}

/*------------------ filter writer -----------------*/
 
static size_t adapt_sink_write(void *pOpaque, mz_uint64 ofs, const void *pBuf, size_t n) {
    struct adapt_sink* sink = (struct adapt_sink*)pOpaque;
    sink->write(sink, (size_t)ofs, pBuf, n);
    return n;
}

/*============================ end of filters =================================*/

static int adapt_serve_zip_entry(struct mg_connection* connection, adapt_serving_context* context,
                                 const char* file_name) {
    int file_index = mz_zip_reader_locate_file(&context->zip, file_name, NULL,
                                               MZ_ZIP_FLAG_CASE_SENSITIVE);
    mz_zip_archive_file_stat file_info;
    if (mz_zip_reader_file_stat(&context->zip, file_index, &file_info)) {
        if (file_index >= 0) {
            // Possible filters
            struct adapt_sink_connection sink_connection;
            struct adapt_sink_safari_bug filter_safari_bug;
            struct adapt_sink_deobfuscate filter_deobfuscate;
            struct adapt_sink_inflator filter_inflator;
            struct adapt_sink_woff filter_woff;
            // Build filter chain.
            char* media_type = context->file_info ? context->file_info[file_index].media_type : NULL;
            struct adapt_sink* sink = &sink_connection.super;
            int known_length = 1;
            int flush = 0;
            sink_connection.super.write = adapt_sink_connection_write;
            sink_connection.connection = connection;
            if (media_type && strcmp(media_type, "application/xhtml+xml") == 0) {
                filter_safari_bug.super.write = adapt_sink_safari_bug_write;
                filter_safari_bug.state = 1;
                filter_safari_bug.next = sink;
                sink = &filter_safari_bug.super;
            } else if (media_type && adapt_convert_to_woff &&
                            (strcmp(media_type, "application/x-font-truetype") == 0
                            || strcmp(media_type, "application/x-font-opentype") == 0
                            || strcmp(media_type, "application/vnd.ms-opentype") == 0
                            || strcmp(media_type, "font/truetype") == 0
                            || strcmp(media_type, "font/opentype") == 0)) {
                filter_woff.buffer = NULL;
                filter_woff.buffer_size = 0;
                filter_woff.buffer_used = 0;
                filter_woff.super.write = adapt_sink_woff_write;
                filter_woff.next = sink;
                sink = &filter_woff.super;
                known_length = 0;
                flush = 1;
            }
            if (context->file_info && context->file_info[file_index].obfuscation) {
                if (file_info.m_method == 0) {
                    /* Stored and obfuscated: obfuscation applied after deflate. */
                    filter_inflator.super.write = adapt_sink_inflator_write;
                    tinfl_init(&filter_inflator.inflator);
                    filter_inflator.inflated_file_offset = 0;
                    filter_inflator.buffer_offset = 0;
                    filter_inflator.next = sink;
                    sink = &filter_inflator.super;
                    known_length = 0;
                    flush = 1;
                }
                filter_deobfuscate.super.write = adapt_sink_deobfuscate_write;
                filter_deobfuscate.obfuscation = context->file_info[file_index].obfuscation;
                filter_deobfuscate.next = sink;
                sink = &filter_deobfuscate.super;
            }
            mg_printf(connection, "HTTP/1.1 200 Success\r\n");
            if (known_length) {
                mg_printf(connection, "Content-Length: %d\r\n", (int)file_info.m_uncomp_size);
            }
            if (media_type) {
                mg_printf(connection,
                          "Content-Type: %s\r\n\r\n",
                          media_type);
            } else {
                mg_printf(connection, "\r\n");
            }
            mz_zip_reader_extract_to_callback(&context->zip, file_index,
                                              adapt_sink_write, sink, MZ_ZIP_FLAG_CASE_SENSITIVE);
            if (flush) {
                sink->write(sink, (size_t)file_info.m_uncomp_size, NULL, 0);
            }
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

static void url_decode_name(const char* in, char* out, int out_size) {
    char* last = out + out_size - 1;
    while (out < last && *in) {
        int c = (*in) & 0xFF;
        if ( c == '%') {
            int cc = -1;
            sscanf(in, "%%%02X", &cc);
            if (cc < 0) {
                break;
            }
            *out = (char) cc;
            in += 3;
        } else {
            *out = c;
            ++out;
        }
        ++in;
    }
    *out = '\0';
}

static char* adapt_read_connection(struct mg_connection* connection, int* len_out) {
    int buf_size = 256;
    char* buf = (char*)malloc(buf_size + 1);
    int len = 0;
    int r;
    while((r = mg_read(connection, buf + len, buf_size - len)) > 0) {
        len += r;
        if (len == buf_size) {
            buf_size *= 2;
            buf = (char*)realloc(buf, buf_size + 1);
        }
    }
    buf[len] = '\0';
    *len_out = len;
    return buf;
}

static void adapt_file_info_clear(struct adapt_file_info* file_info) {
    if (file_info->media_type) {
        free(file_info->media_type);
    }
    if (file_info->obfuscation) {
        free(file_info->obfuscation->mask);
        free(file_info->obfuscation);
    }
    memset(file_info, 0, sizeof(struct adapt_file_info));
}

static int adapt_serve_zip_metadata(const char* method, struct mg_connection* connection,
                adapt_serving_context* context, const char* item) {
    if (strcmp(item, "list") == 0 && strcmp(method, "GET") == 0) {
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
    } else if (strcmp(item, "manifest") == 0 && strcmp(method, "POST") == 0) {
        char file_name[MZ_ZIP_MAX_ARCHIVE_FILENAME_SIZE+1];
        int len = 0;
        char* buf = adapt_read_connection(connection, &len);
        if (buf) {
            char* s = buf;
            int file_index;
            if (!context->file_info) {
                int file_count = mz_zip_reader_get_num_files(&context->zip);
                context->file_info = calloc(sizeof(struct adapt_file_info), file_count);
            }
            while (1) {
                char* url = s;
                char* media_type;
                char* obfuscation_str = NULL;
                s = strpbrk(s, " \n");
                if (!s) {
                    break;
                }
                if (*s == '\n') {
                    continue;
                }
                *s = '\0';
                s++;
                url_decode_name(url, file_name, sizeof file_name);
                media_type = s;
                s = strpbrk(s, " \n");
                if (!s) {
                    break;
                }
                if (*s == ' ') {
                    /* Have obfuscation data */
                    *s = '\0';
                    s++;
                    obfuscation_str = s;
                    s = strpbrk(s, " \n");
                    if (!s) {
                        break;
                    }
                    if (*s != '\n') {
                        /* Need to reach end of line */
                        *s = '\0';
                        s = strchr(s, '\n');
                        if (!s) {
                            break;
                        }
                    }
                }
                *s = '\0';
                s++;
                file_index = mz_zip_reader_locate_file(&context->zip, file_name, NULL,
                                                   MZ_ZIP_FLAG_CASE_SENSITIVE);
                if (file_index >= 0) {
                    struct adapt_file_info* file_info = &context->file_info[file_index];
                    adapt_file_info_clear(file_info);
                    file_info->media_type = strcpy((char *)malloc(strlen(media_type) + 1), media_type);
                    if (obfuscation_str) {
                        char* sep = strchr(obfuscation_str, ':');
                        if (sep) {
                            *sep = '\0';
                            unsigned int length = atoi(obfuscation_str);
                            if (length < 2048) { /* Sanity check */
                                char* mask_hex = sep + 1;
                                size_t mask_hex_length = strlen(mask_hex);
                                if (mask_hex_length % 2 == 0 && mask_hex_length <= 128) { /* Sanity check */
                                    struct adapt_obfuscation* obfuscation =
                                        (struct adapt_obfuscation*)calloc(sizeof(struct adapt_obfuscation), 1);
                                    obfuscation->length = length;
                                    obfuscation->mask_length = (unsigned int)(mask_hex_length / 2);
                                    obfuscation->mask = calloc(1, obfuscation->mask_length);
                                    for (unsigned int k = 0; k < mask_hex_length; k += 2) {
                                        char t[] = {mask_hex[k], mask_hex[k+1], '\0'};
                                        obfuscation->mask[k/2] = (unsigned char)strtol(t, NULL, 16);
                                    }
                                    file_info->obfuscation = obfuscation;
                                }
                            }
                        }
                    }
                }
            }
            free(buf);
        }
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
                if (r && adapt_serve_zip_metadata(request->request_method, connection, context, r+2)) {
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
        if (strcmp(request->request_method, "POST") == 0) {
            int len = 0;
            char* buf = adapt_read_connection(connection, &len);
            if (buf) {
                context->callback->process_message(context->callback, buf, len);
                free(buf);
            }
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
            size_t prefix_len = (end - container_name + 1);
            const char* path = callback->base_path + prefix_len;
            context->content = strcpy((char*)malloc(strlen(path) + 1), path);
            context->content_type = TYPE_XML;
            context->prefix_len = prefix_len;
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

void adapt_update_base_path_xml(adapt_serving_context* context) {
    if (context->content_type == TYPE_XML && context->prefix_len > 0) {
        const char* path = context->callback->base_path + context->prefix_len;
        free(context->content);
        context->content = strcpy((char*)malloc(strlen(path) + 1), path);
    }
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
    int i;
    if (context->server_context) {
        mg_stop(context->server_context);
    }
    if (context->options) {
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
    if (context->file_info) {
        int file_count = mz_zip_reader_get_num_files(&context->zip);
        for (i = 0; i < file_count; i++) {
            adapt_file_info_clear(&context->file_info[i]);
        }
        free(context->file_info);
    }
    mz_zip_reader_end(&context->zip);
    free(context);
}
