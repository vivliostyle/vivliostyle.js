#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface Publication : NSDocument

- (void)processMessageFromContent:(id)message;
- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame;

@property (weak) IBOutlet WebView* mainVview;
@property (weak) IBOutlet WebView* pdfView;
@property IBOutlet NSView* pdfExportAccessiory;
@property NSData* input;
@property NSString* bootstrapURL;
@property struct adapt_callback* callback;
@property struct adapt_serving_context* serving_context;

// For PDF conversion
@property CGContextRef pdfContext;
@property NSMutableData* pdfData;
@property NSString* pdfName;
@property float pdfWidth;
@property float pdfHeight;
@property float topMargin;
@property float bottomMargin;
@property float leftMargin;
@property float rightMargin;

@end
