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
    struct publication_callback* d = calloc(sizeof(struct publication_callback), 1);
    d->publication = publication;
    d->super_.content_length = [publication.input length];
    d->super_.read_bytes = read_bytes;
    d->super_.process_message = process_message;
    return &d->super_;
}

// In pixels
static const int fontSizes[] = {12, 14, 16, 19, 23, 28};
static const int defaultFontSizeIndex = 2;
static const int maxFontSizeIndex = sizeof fontSizes / sizeof(int) - 1;

@implementation Publication

- (id)init
{
    self = [super init];
    self.fontSizeIndex = defaultFontSizeIndex;
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
    [[self.mainView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    [self.mainView setFrameLoadDelegate: self];
    [self.ePageToolbarItem setView:self.ePageView];
    [self.ePageToolbarItem setMinSize: NSMakeSize(100, 32)];
    [self.ePageToolbarItem setMaxSize: NSMakeSize(100, 32)];
    [self.textSizeToolbarItem setView:self.textSizeView];
    [self.textSizeToolbarItem setMinSize: NSMakeSize(64, 32)];
    [self.textSizeToolbarItem setMaxSize: NSMakeSize(64, 32)];
}

+ (BOOL)autosavesInPlace
{
    return NO;
}

- (BOOL)readFromURL:(NSURL *)absoluteURL ofType:(NSString *)typeName error:(NSError **)outError
{
    if ([typeName isEqual:@"EPUB Publication"] || [typeName isEqual:@"Zip Archive"] || [typeName isEqual:@"FictionBook 2.0 eBook"]) {
        return [super readFromURL:absoluteURL ofType:typeName error:outError];
    }
    absoluteURL = [absoluteURL filePathURL];
    if (absoluteURL) {
        // it'd be nice to use this, but it's only available in 10.9:
        // char* path = malloc(PATH_MAX + 1);
        // [absoluteURL getFileSystemRepresentation:path maxLength:PATH_MAX]
        NSString* pathStr = [absoluteURL path];
        if (pathStr) {
            const char * path = [pathStr cStringUsingEncoding:NSUTF8StringEncoding];
            adapt_callback* callback = MakeContentCallback(self);
            callback->packaging_type = ADAPT_PACKAGE_FILE_SYSTEM;
            callback->base_path = strcpy(malloc(strlen(path)+1), path);
            self.callback = callback;
            self.absoluteURL = absoluteURL;
            self.typeName = typeName;
            return [self finishReading];
        }
    }
    return NO;
}

- (BOOL)readFromData:(NSData *)data ofType:(NSString *)typeName error:(NSError **)outError
{
    if ([typeName isEqual:@"EPUB Publication"] || [typeName isEqual:@"Zip Archive"] || [typeName isEqual:@"FictionBook 2.0 eBook"]) {
        self.input = data;
        self.typeName = typeName;
        adapt_callback* callback = MakeContentCallback(self);
        callback->packaging_type = [typeName isEqual:@"FictionBook 2.0 eBook"] ? ADAPT_PACKAGE_SINGLE_FILE : ADAPT_PACKAGE_ZIP;
        self.callback = callback;
        return [self finishReading];
    }
    return NO;
}

- (BOOL)finishReading
{
    adapt_serving_context* context = adapt_start_serving(self.callback);
    if (!context) {
        return NO;
    }
    const char* url = adapt_get_bootstrap_url(context);
    if (!url) {
        return NO;
    }
    self.bootstrapURL = [NSString stringWithCString:url encoding:NSUTF8StringEncoding];
    self.serving_context = context;
    if (self.mainView) {
        [[self.mainView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    }
    return YES;
}

- (void)close
{
    [self closeFile];
    [super close];
}

- (void)closeFile
{
    adapt_stop_serving(self.serving_context);
    if (self.callback->base_path) {
        free((char *)self.callback->base_path);
    }
    free(self.callback);
    self.bootstrapURL = @"";
    self.callback = NULL;
    self.serving_context = NULL;
}

- (NSString*)getMetadataValue:(NSString*)name {
    if (self.metadata) {
        id items = [self.metadata objectForKey:name];
        if ([items isKindOfClass:[NSArray class]]) {
            NSArray* itemList = items;
            if ([itemList count] > 0) {
                id itemObj = [itemList firstObject];
                if ([itemObj isKindOfClass:[NSDictionary class]]) {
                    NSDictionary* itemDict = itemObj;
                    id value = [itemDict objectForKey:@"v"];
                    if ([value isKindOfClass:[NSString class]]) {
                        return value;
                    }
                }
            }
        }
    }
    return nil;
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
    if ([type isEqualToString:@"error"] && [[dict objectForKey:@"content"] isKindOfClass:[NSString class]]) {
        NSString* content = [dict objectForKey:@"content"];
        printf("Error: %s\n", [content cStringUsingEncoding:NSUTF8StringEncoding]);
    }
    if ([[dict objectForKey:@"i"] isEqualToString:@"main"]) {
        if ([type isEqualToString:@"loaded"]) {
            id metadataObj = [dict objectForKey:@"metadata"];
            if ([metadataObj isKindOfClass:[NSDictionary class]]) {
                self.metadata = metadataObj;
            }
        } else if ([type isEqualToString:@"nav"]) {
            double epage = [[dict objectForKey:@"epage"] doubleValue];
            double epageCount = [[dict objectForKey:@"epageCount"] doubleValue];
            [self.readingPosition setMaxValue:epageCount];
            [self.readingPosition setDoubleValue:epage];
            // +1 to convert to one-based index, +0.05 to deal with round-off errors near integer
            // epage values (which occur when navigating to an epage).
            int epageHuman = (int)(epage + 1.05);
            [self.ePageCurrent setIntValue: epageHuman];
            [self.ePageTotal setStringValue: [NSString stringWithFormat:@"/%d", (int)epageCount]];
            self.isAtLastPage = [[dict objectForKey:@"last"] boolValue];
            self.isAtFirstPage = [[dict objectForKey:@"first"] boolValue];
        } else if ([type isEqualToString:@"hyperlink"]) {
            id urlObj = [dict objectForKey:@"href"];
            if ([urlObj isKindOfClass:[NSString class]]) {
                NSString* url = urlObj;
                if ([[dict objectForKey:@"internal"] boolValue]) {
                    [self sendCommand: [NSString stringWithFormat:@"a:'moveTo',url:'%@'", url]];
                } else {
                    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:url]];
                }
            }
        }
    } else if ([[dict objectForKey:@"i"] isEqualToString:@"pdf"]) {
        if (self.pdfCancel) {
            return;
        }
        if ([type isEqualToString:@"loaded"]) {
            [self startExport];
        }
        if ([type isEqualToString:@"nav"]) {
            [self exportPage];
            if ([[dict objectForKey:@"last"] boolValue]) {
                [self finishExport];
            } else {
                [self sendExportCommand: @"a:'moveTo',where:'next'"];
            }
        }
    }
}

- (void)sendCommand:(NSString*)body
{
    NSString* script = [NSString stringWithFormat:@"adapt_command({%@})", body];
    [[self.mainView windowScriptObject] evaluateWebScript:script];
}

- (void)sendExportCommand:(NSString*)body
{
    NSString* script = [NSString stringWithFormat:@"adapt_command({%@})", body];
    [[self.pdfView windowScriptObject] evaluateWebScript:script];
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    if (frame == [self.mainView mainFrame]) {
        const char* initCall = adapt_get_init_call(self.serving_context, "main", "autoresize:true");
        NSString* init = [NSString stringWithCString:initCall encoding:NSUTF8StringEncoding];
        [[self.mainView windowScriptObject] evaluateWebScript:init];
    } else if (self.pdfView != nil && frame == [self.pdfView mainFrame]) {
        char viewportStr[512];
        float marginLeft = self.pdfLeftMargin * 4 / 3;
        float marginRight = self.pdfRightMargin * 4 / 3;
        float marginTop = self.pdfTopMargin * 4 / 3;
        float marginBottom = self.pdfBottomMargin * 4 / 3;
        float width = self.pdfWidth * 4 / 3 - marginLeft - marginRight;
        float height = self.pdfHeight * 4 / 3 - marginTop - marginBottom;
        float fontSize = round(self.pdfFontSize * 4 / 3);
        if (fontSize < 6) {
            fontSize = 6;
        } else if (fontSize > 24) {
            fontSize = 24;
        }
        sprintf(viewportStr,
            "viewport:{'margin-left':%f,'margin-right':%f,'margin-top':%f,"
            "'margin-bottom':%f,width:%f,height:%f},fontSize:%f,load:true",
            marginLeft, marginRight, marginTop, marginBottom, width, height, fontSize);
        const char* initCall = adapt_get_init_call(self.serving_context, "pdf", viewportStr);
        NSString* init = [NSString stringWithCString:initCall encoding:NSUTF8StringEncoding];
        [[self.pdfView windowScriptObject] evaluateWebScript:init];
    }
}

- (void) startExport {
	self.pdfData = [NSMutableData data];
	CGDataConsumerRef consumer = CGDataConsumerCreateWithCFData((CFMutableDataRef) self.pdfData);
	CGRect mediaBox = CGRectMake( 0, 0, self.pdfWidth, self.pdfHeight );
    NSMutableDictionary* pdfMetadata = [[NSMutableDictionary alloc] init];
    NSString* title = [self getMetadataValue:@"http://purl.org/dc/terms/title"];
    if (title) {
        [pdfMetadata setObject:title forKey:(NSString*)kCGPDFContextTitle];
    }
    NSString* creator = [self getMetadataValue:@"http://purl.org/dc/terms/creator"];
    if (creator) {
        [pdfMetadata setObject:creator forKey:(NSString*)kCGPDFContextAuthor];
    }
    NSString* subject = [self getMetadataValue:@"http://purl.org/dc/terms/subject"];
    if (subject) {
        [pdfMetadata setObject:subject forKey:(NSString*)kCGPDFContextSubject];
    }
    // "Creator" is an app that produced PDF.
    [pdfMetadata setObject:@"Publication Viewer - Adaptive Layout" forKey:(NSString*)kCGPDFContextCreator];

	self.pdfContext = CGPDFContextCreate(consumer, &mediaBox, (CFDictionaryRef)pdfMetadata);
	CGDataConsumerRelease(consumer);
	NSAssert( self.pdfContext != NULL, @"could not create PDF context");
    if (self.pdfProgressWindow == nil) {
        [NSBundle loadNibNamed: @"PDFProgress" owner: self];
    }
    [NSApp beginSheet: self.pdfProgressWindow modalForWindow: self.windowForSheet modalDelegate: self
       didEndSelector: @selector(didEndExport:returnCode:contextInfo:) contextInfo: nil];
    self.pdfCurrentPage = 0;
    [self.pdfProgressLabel setStringValue: @"Preparing to render PDF"];
}

- (void)didEndExport:(NSWindow *)sheet returnCode:(NSInteger)returnCode contextInfo:(void *)contextInfo
{
    [self.pdfProgressWindow orderOut:self];    
}

- (void) finishExport {
	CGPDFContextClose(self.pdfContext);
	CGContextRelease(self.pdfContext);
    self.pdfContext = nil;
    [self.pdfData writeToURL:self.pdfURL atomically:YES];
    [self endExport];
}

- (void) endExport {
    if (self.pdfContext) {
        CGPDFContextClose(self.pdfContext);
        CGContextRelease(self.pdfContext);
        self.pdfContext = nil;
    }
    self.pdfData = nil;
    [[self.pdfView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:@"about:"]]];
    [NSApp endSheet:self.pdfProgressWindow];
}

- (void) exportPage
{
    if (!self.pdfContext) {
        return;
    }
    self.pdfCurrentPage++;
    [self.pdfProgressLabel setStringValue: [NSString stringWithFormat:@"Page: %d", self.pdfCurrentPage]];
	CGPDFContextBeginPage(self.pdfContext, NULL);
    CGContextScaleCTM(self.pdfContext, 0.75, 0.75);
    NSGraphicsContext *gc = [NSGraphicsContext graphicsContextWithGraphicsPort:self.pdfContext flipped:YES];
    NSRect rect = NSMakeRect(0, 0, self.pdfWidth * 4 / 3, self.pdfHeight * 4 / 3);
    [[[[self.pdfView mainFrame] frameView] documentView] displayRectIgnoringOpacity:rect inContext:gc];
	CGPDFContextEndPage(self.pdfContext);
}

- (void)setupPDFExport
{
    self.pdfTopMargin = [self.pdfMarginTopPt floatValue];
    self.pdfLeftMargin = [self.pdfMarginLeftPt floatValue];
    self.pdfBottomMargin = [self.pdfMarginBottomPt floatValue];
    self.pdfRightMargin = [self.pdfMarginRightPt floatValue];
    self.pdfWidth = [self.pdfWidthPt floatValue];
    self.pdfHeight = [self.pdfHeightPt floatValue];
    self.pdfFontSize = atof([[self.pdfFontSizePt stringValue] cStringUsingEncoding:NSUTF8StringEncoding]);
    self.pdfCancel = NO;
    
    float contentWidth = self.pdfWidth - self.pdfLeftMargin - self.pdfRightMargin;
    float contentHeight = self.pdfHeight - self.pdfTopMargin - self.pdfBottomMargin;
    if (contentWidth < 200 || contentHeight < 200) {
        NSAlert *alert = [[NSAlert alloc] init];
        [alert addButtonWithTitle:@"Dismiss"];
        [alert setMessageText:@"Page size is too small!"];
        [alert setInformativeText:@"Content area dimensions must be 200pt or larger."];
        [alert setAlertStyle:NSCriticalAlertStyle];
        [alert beginSheetModalForWindow:self.windowForSheet modalDelegate:nil didEndSelector:nil contextInfo:NULL];
        return;
    }
    
    float width = self.pdfWidth * 4 / 3;
    float height = self.pdfHeight * 4 / 3;
    [self.pdfView setFrame:NSMakeRect(-width, 0, width, height)];
    [[self.pdfView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    [self.pdfView setFrameLoadDelegate: self];
}

- (void)removeDocumentProperties:(NSWindow *)sheet returnCode:(NSInteger)returnCode contextInfo:(void *)contextInfo
{
    [self.documentPropertiesWindow orderOut:self];
    self.documentPropertiesWindow = nil;
}

- (NSTextField*)makeLabel:(NSString*)text withFrame:(NSRect)rect align:(NSTextAlignment) alignment
{
    NSTextField* textField = [[NSTextField alloc] initWithFrame:rect];
    [textField setStringValue:text];
    [textField setBezeled:NO];
    [textField setDrawsBackground:NO];
    [textField setEditable:NO];
    [textField setSelectable:NO];
    [textField setAlignment: alignment];
    [[textField cell] setUsesSingleLineMode:YES];
    return textField;
}

- (void)endDocumentProperties:(id)sender
{
    [NSApp endSheet:self.documentPropertiesWindow];
}

- (NSArray*)makeDisplayMetadata
{
    NSMutableArray* displayMetadata = [[NSMutableArray alloc] init];
    NSArray* simpleNames = @[
        @[@"http://purl.org/dc/terms/title", @"Title:"],
        @[@"http://purl.org/dc/terms/creator", @"Author:"],
        @[@"http://purl.org/dc/terms/language", @"Language:"],
        @[@"http://purl.org/dc/terms/identifier", @"Identifier:"]
    ];
    for (NSArray* termAndName in simpleNames) {
        id items = [self.metadata objectForKey:[termAndName firstObject]];
        if ([items isKindOfClass:[NSArray class]]) {
            NSArray* itemList = items;
            if ([itemList count] > 0) {
                id item = [itemList firstObject];
                if ([item isKindOfClass:[NSDictionary class]]) {
                    id value = [item objectForKey:@"v"];
                    if ([value isKindOfClass:[NSString class]]) {
                        [displayMetadata addObject:@[[termAndName lastObject], value]];
                    }
                }
            }
        }
    }
    return displayMetadata;
}

- (IBAction)showDocumentProperties:(id)sender
{
    if (self.documentPropertiesWindow || !self.metadata)
        return;
    NSArray* displayMetadata = [self makeDisplayMetadata];
    unsigned long itemHeight = 22;
    unsigned long rowHeight = 25;
    unsigned long height = (2 + [displayMetadata count]) * rowHeight + 5;
    unsigned long width = 500;
    unsigned int labelWidth = 100;
    unsigned long y = height - rowHeight;
    NSRect rect = NSMakeRect(0, 0, width, height);
    self.documentPropertiesWindow = [[NSWindow alloc] initWithContentRect:rect
            styleMask:NSTitledWindowMask backing:NSBackingStoreBuffered defer:YES];
    NSView* view = self.documentPropertiesWindow.contentView;
    NSTextField* label = [self makeLabel:@"Document Properties" withFrame:NSMakeRect(0, y, width, itemHeight)
                                   align:NSCenterTextAlignment];
    [view addSubview:label];
    y -= rowHeight;
    
    for (NSArray* nameValuePair in displayMetadata) {
        NSString* propName = [nameValuePair firstObject];
        NSString* propValue = [nameValuePair lastObject];
        label = [self makeLabel:propName withFrame:NSMakeRect(0, y, labelWidth, itemHeight)
                          align:NSRightTextAlignment];
        [view addSubview:label];
        label = [self makeLabel:propValue withFrame:NSMakeRect(labelWidth, y, width - labelWidth, itemHeight)
                          align:NSLeftTextAlignment];
        [view addSubview:label];
        y -= rowHeight;
    }
    
    NSButton* button = [[NSButton alloc] initWithFrame:NSMakeRect((width - 100)/2, 0, 100, 22)];
    [button setButtonType:NSMomentaryPushInButton];
    [button setBezelStyle: NSRoundedBezelStyle];
    [button setTitle:@"Dismiss"];
    [button setTarget:self];
    [button setAction:@selector(endDocumentProperties:)];
    [view addSubview:button];
    
    [NSApp beginSheet: self.documentPropertiesWindow modalForWindow: self.windowForSheet modalDelegate: self
       didEndSelector: @selector(removeDocumentProperties:returnCode:contextInfo:) contextInfo: nil];
}

- (IBAction)cancelPDFExport:(id)sender
{
    self.pdfCancel = YES;
    [self endExport];
}

- (IBAction)exportToPDF:(id)sender
{
    NSSavePanel* savePanel = [NSSavePanel savePanel];
    [savePanel setAllowedFileTypes:@[@"pdf"]];
    [savePanel setAccessoryView:self.pdfExportAccessiory];
    // [savePanel setDirectoryURL:someURL];
    [savePanel beginSheetModalForWindow:self.windowForSheet completionHandler:^(NSInteger result){
        if (result == NSFileHandlingPanelOKButton) {
            // Close panel before handling errors
            self.pdfURL = [savePanel URL];
            [savePanel orderOut:self];
            [self setupPDFExport];
        }
    }];
}

- (IBAction)updatePageSizeTab:(id)sender {
    NSString* pageSize = [self.pdfPageSize titleOfSelectedItem];
    NSString* orientation = [self.pdfOrientation titleOfSelectedItem];
    if ([pageSize isEqualToString:@"Custom"]) {
        [self.pdfWidthPt setEnabled:YES];
        [self.pdfHeightPt setEnabled:YES];
        [self.pdfOrientation setEnabled:NO];
    } else {
        [self.pdfWidthPt setEnabled:NO];
        [self.pdfHeightPt setEnabled:NO];
        [self.pdfOrientation setEnabled:YES];
        NSString* width = @"612";
        NSString* height = @"792";
        if ([pageSize isEqualToString:@"US Legal"]) {
            width = @"792";
            height = @"1224";
        } else if ([pageSize isEqualToString:@"Tabloid"]) {
            width = @"612";
            height = @"1008";
        } else if ([pageSize isEqualToString:@"A3"]) {
            width = @"842";
            height = @"1190";
        } else if ([pageSize isEqualToString:@"A4"]) {
            width = @"595";
            height = @"842";
        } else if ([pageSize isEqualToString:@"A5"]) {
            width = @"420";
            height = @"595";
        }
        if ([orientation isEqualToString:@"Landscape"]) {
            NSString* tmp = width;
            width = height;
            height = tmp;
        }
        [self.pdfWidthPt setStringValue:width];
        [self.pdfHeightPt setStringValue:height];
    }
}

- (IBAction)navigationSliderChanged:(id)sender
{
    double pos = [self.readingPosition doubleValue];
    [self sendCommand: [NSString stringWithFormat:@"a:'moveTo',epage:%f", pos]];
}

- (IBAction)navigationEPageChanged:(id)sender
{
    double pos = [self.ePageCurrent intValue] - 1;
    [self sendCommand: [NSString stringWithFormat:@"a:'moveTo',epage:%f", pos]];
}

- (IBAction)increaseFontSize:(id)sender {
    if (self.fontSizeIndex < maxFontSizeIndex) {
        self.fontSizeIndex++;
        [self sendCommand: [NSString stringWithFormat:@"a:'configure',fontSize:%d", fontSizes[self.fontSizeIndex]]];
    }
}

- (IBAction)decreaseFontSize:(id)sender {
    if (self.fontSizeIndex > 0) {
        self.fontSizeIndex--;
        [self sendCommand: [NSString stringWithFormat:@"a:'configure',fontSize:%d", fontSizes[self.fontSizeIndex]]];
    }
}

- (IBAction)resetFontSize:(id)sender {
    if (self.fontSizeIndex != defaultFontSizeIndex) {
        self.fontSizeIndex = defaultFontSizeIndex;
        [self sendCommand: [NSString stringWithFormat:@"a:'configure',fontSize:%d", fontSizes[self.fontSizeIndex]]];
    }
}

- (IBAction)firstPage:(id)sender {
    [self sendCommand: @"a:'moveTo',where:'first'"];
}

- (IBAction)lastPage:(id)sender {
    [self sendCommand: @"a:'moveTo',where:'last'"];
}

- (IBAction)previousPage:(id)sender {
    [self sendCommand: @"a:'moveTo',where:'previous'"];
}

- (IBAction)nextPage:(id)sender {
    [self sendCommand: @"a:'moveTo',where:'next'"];
}

- (IBAction)toggleTOC:(id)sender {
    [self sendCommand: @"a:'toc',v:'toggle',autohide:true"];
}

- (IBAction)reloadPage:(id)sender {
    if (self.typeName) {
        [self closeFile];
        if (self.absoluteURL) {
            [self readFromURL: self.absoluteURL ofType: self.typeName error:nil];
        } else {
            [self readFromData: self.input ofType:self.typeName error:nil];
        }
    }
}

@end
