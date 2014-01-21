#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface Publication : NSDocument

- (void)processMessageFromContent:(id)message;
- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame;

@property (weak) IBOutlet NSSlider* readingPosition;
@property (weak) IBOutlet NSTextField* ePageCurrent;
@property (weak) IBOutlet NSTextField* ePageTotal;
@property (weak) IBOutlet NSView* ePageView;
@property (weak) IBOutlet WebView* mainView;
@property (weak) IBOutlet WebView* pdfView;
@property (weak) IBOutlet NSToolbarItem* ePageToolbarItem;
@property NSData* input;
@property NSString* bootstrapURL;
@property struct adapt_callback* callback;
@property struct adapt_serving_context* serving_context;

@property BOOL isAtFirstPage;
@property BOOL isAtLastPage;

// Navigation buttons/medu items
@property (weak) IBOutlet NSMenuItem* menuFirstPage;
@property (weak) IBOutlet NSMenuItem* menuLastPage;
@property (weak) IBOutlet NSMenuItem* menuPreviousPage;
@property (weak) IBOutlet NSMenuItem* menuNextPage;

@property (weak) IBOutlet NSToolbarItem* toolbarFirstPage;
@property (weak) IBOutlet NSToolbarItem* toolbarLastPage;
@property (weak) IBOutlet NSToolbarItem* toolbarPreviousPage;
@property (weak) IBOutlet NSToolbarItem* toolbarNextPage;

// For PDF Conversion UI
@property IBOutlet NSView* pdfExportAccessiory;
@property (weak) IBOutlet NSPopUpButton* pdfPageSize;
@property (weak) IBOutlet NSPopUpButton* pdfOrientation;
@property (weak) IBOutlet NSTextField* pdfWidthPt;
@property (weak) IBOutlet NSTextField* pdfHeightPt;
@property (weak) IBOutlet NSTextField* pdfMarginTopPt;
@property (weak) IBOutlet NSTextField* pdfMarginLeftPt;
@property (weak) IBOutlet NSTextField* pdfMarginBottomPt;
@property (weak) IBOutlet NSTextField* pdfMarginRightPt;
@property (weak) IBOutlet NSComboBox* pdfFontSizePt;

@property IBOutlet NSWindow* pdfProgressWindow;
@property (weak) IBOutlet NSTextField* pdfProgressLabel;


// For PDF conversion processing
@property CGContextRef pdfContext;
@property NSMutableData* pdfData;
@property NSURL* pdfURL;
@property float pdfWidth;
@property float pdfHeight;
@property float pdfTopMargin;
@property float pdfBottomMargin;
@property float pdfLeftMargin;
@property float pdfRightMargin;
@property float pdfFontSize;
@property int pdfCurrentPage;
@property BOOL pdfCancel;

@end
