#import "Publication.h"

#include "adapt_service.h"

struct publication_callback {
    adapt_callback super_;
    __unsafe_unretained Publication* publication;
};

static void read_bytes(struct adapt_callback* self, void* data, size_t offset, size_t length) {
    @autoreleasepool {
        NSData* nsdata = ((struct publication_callback*)self)->publication.input;
        [nsdata getBytes:data range:NSMakeRange(offset, length)];
    }
}

static void process_message(struct adapt_callback * self, const void* data, size_t length) {
    @autoreleasepool {
        NSData* msgbody = [[NSData alloc] initWithBytes:data length:length];
        NSError *error = nil;
        id parsedMessage = [NSJSONSerialization JSONObjectWithData:msgbody options:0 error:&error];
        if (!error) {
            Publication* publication = ((struct publication_callback*)self)->publication;
            [publication performSelectorOnMainThread:@selector(processMessageFromContent:)
                            withObject:parsedMessage waitUntilDone:NO];
        }
    }
}

static struct adapt_callback* MakeContentCallback(Publication* publication) {
    struct publication_callback* d = (struct doc_callback*)malloc(sizeof(struct publication_callback));
    d->publication = publication;
    d->super_.content_length = [publication.input length];
    d->super_.read_bytes = read_bytes;
    d->super_.process_message = process_message;
    return &d->super_;
}

@implementation Publication

- (id)init
{
    self = [super init];
    if (self) {
        
    }
    self.bootstrapURL = @"";
    [[NSUserDefaults standardUserDefaults] setBool:TRUE forKey:@"WebKitDeveloperExtras"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    return self;
}

- (NSString *)windowNibName
{
    return @"Publication";
}

- (void)windowControllerDidLoadNib:(NSWindowController *)aController
{
    [super windowControllerDidLoadNib:aController];
    [[self.webview mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    [self.webview setFrameLoadDelegate: self];
    //[self.docwindow setDelegate: self];
}

+ (BOOL)autosavesInPlace
{
    return YES;
}

- (BOOL)readFromData:(NSData *)data ofType:(NSString *)typeName error:(NSError **)outError
{
    self.input = data;
    adapt_callback* callback = MakeContentCallback(self);
    adapt_serving_context* context = adapt_start_serving(callback);
    const char* url = adapt_get_bootstrap_url(context);
    if (url) {
        self.bootstrapURL = [NSString stringWithCString:url encoding:NSUTF8StringEncoding];
    }
    self.callback = callback;
    self.serving_context = context;
    return YES;
}

- (void)close
{
    adapt_stop_serving(self.serving_context);
    free(self.callback);
    self.bootstrapURL = @"";
    self.callback = NULL;
    self.serving_context = NULL;
}

- (void)restoreDocumentWindowWithIdentifier:(NSString *)identifier state:(NSCoder *)state
                          completionHandler:(void (^)(NSWindow *, NSError *))completionHandler
{
    [super restoreDocumentWindowWithIdentifier:identifier state:state completionHandler:completionHandler];
}


- (void)processMessageFromContent:(id)message
{
    if(![message isKindOfClass:[NSDictionary class]]) {
        return;
    }
    NSDictionary* dict = message;
    id type = [dict objectForKey:@"t"];
    if (![type isKindOfClass:[NSString class]]) {
        return;
    }
    if ([[dict objectForKey:@"i"] isEqualToString:@"pdf"]) {
        if ([type isEqualToString:@"loaded"]) {
            [self startExport];
            [self exportPage];
            [self sendExportCommand: @"a:'moveToPage',where:'next',load:true"];
        }
        if ([type isEqualToString:@"nav"]) {
            [self exportPage];
            if ([[dict objectForKey:@"last"] boolValue]) {
                [self finishExport];
            } else {
                [self sendExportCommand: @"a:'moveToPage',where:'next',load:true"];
            }
        }
    }
}

- (void)sendCommand:(NSString*)body
{
    NSString* script = [NSString stringWithFormat:@"adapt_command({%@})", body];
    [[self.webview windowScriptObject] evaluateWebScript:script];
}

- (void)sendExportCommand:(NSString*)body
{
    NSString* script = [NSString stringWithFormat:@"adapt_command({%@})", body];
    [[self.printView windowScriptObject] evaluateWebScript:script];
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    if (frame == [self.mainView mainFrame]) {
        const char* initCall = adapt_get_init_call(self.serving_context, "main");
        NSString* init = [NSString stringWithCString:initCall encoding:NSUTF8StringEncoding];
        [[self.mainView windowScriptObject] evaluateWebScript:init];
    } else if (self.pdfView != nil && frame == [self.pdfView mainFrame]) {
        const char* initCall = adapt_get_init_call(self.serving_context, "pdf");
        NSString* init = [NSString stringWithCString:initCall encoding:NSUTF8StringEncoding];
        [[self.pdfView windowScriptObject] evaluateWebScript:init];
    }
}

- (void) startExport {
    NSSize size = NSMakeSize(self.pdfWidth, self.pdfHeight);
	self.pdfData = [NSMutableData data];
	CGDataConsumerRef consumer = CGDataConsumerCreateWithCFData((CFMutableDataRef) self.pdfData);
	CGRect mediaBox = CGRectMake( 0, 0, size.width, size.height );
	self.pdfContext = CGPDFContextCreate(consumer, &mediaBox, NULL);
	CGDataConsumerRelease(consumer);
    
	NSAssert( self.pdfContext != NULL, @"could not create PDF context");
}

- (void) finishExport {
	CGPDFContextClose(self.pdfContext);
	CGContextRelease(self.pdfContext);
    self.pdfContext = nil;
    [self.pdfData writeToFile:self.pdfName atomically:YES];
    self.pdfData = nil;
    [[self.printView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:@"about:"]]];
}

- (void) exportPage
{
	CGPDFContextBeginPage(self.pdfContext, NULL);
    CGContextScaleCTM(self.pdfContext, 0.75, 0.75);
    NSGraphicsContext *gc = [NSGraphicsContext graphicsContextWithGraphicsPort:self.pdfContext flipped:YES];
    NSRect rect = NSMakeRect(0, 0, self.pdfWidth * 4 / 3, self.pdfHeight * 4 / 3);
    [[[[self.printView mainFrame] frameView] documentView] displayRectIgnoringOpacity:rect inContext:gc];
	CGPDFContextEndPage(self.pdfContext);
}

- (void)setupPDFExport
{
    self.pdfName = @"/Users/peter/Documents/capture.pdf";
    self.pdfWidth = 792;
    self.pdfHeight = 612;
    float width = self.pdfWidth * 4 / 3;
    float height = self.pdfHeight * 4 / 3;
    [self.printView setFrame:NSMakeRect(-width, 0, width, height)];
    [[self.printView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    [self.printView setFrameLoadDelegate: self];
}

- (IBAction)exportToPDF:(id)sender
{
    NSSavePanel* savePanel = [NSSavePanel savePanel];
    [savePanel setAllowedFileTypes:@[@"pdf"]];
    [savePanel setAccessoryView:self.accessoryView];
    // [savePanel setDirectoryURL:someURL];
    [savePanel beginSheetModalForWindow:self.windowForSheet completionHandler:^(NSInteger result){
        if (result == NSFileHandlingPanelOKButton) {
            // Close panel before handling errors
            [savePanel orderOut:self];
            [self setupPDFExport];
        }
    }];
}

- (IBAction)firstPage:(id)sender {
    [self sendCommand: @"a:'moveToPage',where:'first'"];
}

- (IBAction)lastPage:(id)sender {
    [self sendCommand: @"a:'moveToPage',where:'last'"];
}

- (IBAction)previousPage:(id)sender {
    [self sendCommand: @"a:'moveToPage',where:'previous'"];
}

- (IBAction)nextPage:(id)sender {
    [self sendCommand: @"a:'moveToPage',where:'next'"];
}

@end
