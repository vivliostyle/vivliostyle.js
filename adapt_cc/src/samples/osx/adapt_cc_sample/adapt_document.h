#ifndef samples_osx_adapt_cc_sample_adapt_document_h
#define samples_osx_adapt_cc_sample_adapt_document_h

#include <CoreFoundation/CoreFoundation.h>
#include <CoreGraphics/CGContext.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct AdaptDocument_ AdaptDocument;
typedef struct AdaptDocumentRenderer_ AdaptDocumentRenderer;

AdaptDocument* adapt_document_open(CFURLRef url);
AdaptDocumentRenderer* adapt_document_create_renderer(AdaptDocument* doc);
void adapt_document_renderer_set_size(
    AdaptDocumentRenderer* renderer, int width, int height);
void adapt_document_renderer_next_page(AdaptDocumentRenderer* renderer);
void adapt_document_renderer_previous_page(AdaptDocumentRenderer* renderer);
void adapt_document_renderer_render(
    AdaptDocumentRenderer* renderer, CGContextRef context, CGRect rect);

#ifdef __cplusplus
}
#endif


#endif
