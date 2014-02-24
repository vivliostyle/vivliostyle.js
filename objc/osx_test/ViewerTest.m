//
//  AppDelegate.m
//  ViewerTest
//
//  Created by Peter Sorotokin on 2/16/14.
//  Copyright (c) 2014 Google. All rights reserved.
//

#import "ViewerTest.h"

#include "clang/service/adapt_service.h"
#include "clang/test/adapt_testsuite.h"

struct viewer_test_callback {
    adapt_callback super_;
    __unsafe_unretained ViewerTest* owner;
};

static const char* suite = "/Users/peter/Sites/content/csstest/";
static struct adapt_testcase* testcase;

static void process_message(struct adapt_callback * self, const void* data, size_t length) {
    @autoreleasepool {
        NSData* msgbody = [[NSData alloc] initWithBytes:data length:length];
        NSError *error = nil;
        id parsedMessage = [NSJSONSerialization JSONObjectWithData:msgbody options:0 error:&error];
        if (!error) {
            ViewerTest* owner = ((struct viewer_test_callback*)self)->owner;
            [owner performSelectorOnMainThread:@selector(processMessageFromContent:)
                                          withObject:parsedMessage waitUntilDone:NO];
        }
    }
}

static struct adapt_callback* MakeContentCallback(ViewerTest* owner, const char* file) {
    struct  viewer_test_callback* d = calloc(sizeof(struct viewer_test_callback), 1);
    d->owner = owner;
    d->super_.packaging_type = ADAPT_PACKAGE_FILE_SYSTEM;
    d->super_.base_path = strcpy(malloc(strlen(file)+1), file);
    d->super_.process_message = process_message;
    return &d->super_;
}

@implementation ViewerTest

- (BOOL)loadAdaptFile:(const char*)path relaunch:(BOOL)relaunch
{
    if (!self.servingContext || relaunch) {
        [self closeAdaptFile];
        self.callback = MakeContentCallback(self, path);
        self.servingContext = adapt_start_serving(self.callback);
        if (!self.servingContext) {
            return NO;
        }
    } else {
        free ((char*)self.callback->base_path);
        self.callback->base_path = strcpy(malloc(strlen(path)+1), path);
        adapt_update_base_path_xml(self.servingContext);
    }
    const char* url = adapt_get_bootstrap_url(self.servingContext);
    if (!url) {
        [self closeAdaptFile];
        return NO;
    }
    self.bootstrapURL = [NSString stringWithCString:url encoding:NSUTF8StringEncoding];
    self.testViewLoaded = NO;
    [[self.testWebView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    return YES;
}

- (void)closeAdaptFile
{
    if (self.servingContext) {
        adapt_stop_serving(self.servingContext);
        self.servingContext = nil;
    }
    if (self.callback) {
        free((char *)self.callback->base_path);
        free(self.callback);
        self.callback = NULL;
    }
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    if (frame == [self.testWebView mainFrame]) {
        const char* initCall = adapt_get_init_call(self.servingContext, "main", "autoresize:true,load:true");
        NSString* init = [NSString stringWithCString:initCall encoding:NSUTF8StringEncoding];
        [[self.testWebView windowScriptObject] evaluateWebScript:init];
    } else if (frame == [self.referenceWebView mainFrame]) {
        self.referenceViewLoaded = YES;
        [self evaluateResultAndContinue];
    }
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
    else if ([type isEqualToString:@"nav"]) {
        self.testViewLoaded = YES;
        [self evaluateResultAndContinue];
    }
}

- (void)nextTest:(BOOL)relaunch
{
    testcase = adapt_testsuite_next_testcase();
    if (!testcase) {
        adapt_testsuite_close();
        return;
    }
    [self.nowRunning setStringValue: [NSString stringWithCString:testcase->relative_path encoding:NSUTF8StringEncoding]];
    char fileName[2048];
    sprintf(fileName, "%s%s", suite, testcase->relative_path);
    [self loadAdaptFile: fileName relaunch:relaunch];
    NSString* fileNameStr = [NSString stringWithCString:fileName encoding:NSUTF8StringEncoding];
    self.referenceViewLoaded = NO;
    [[self.referenceWebView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL fileURLWithPath:fileNameStr]]];
}

- (IBAction)skipTest:(id)sender {
    [self reportAndContinue:'S' relaunch:YES];
}

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    self.tests_still_passing = 0;
    self.tests_still_failing = 0;
    self.tests_newly_passing = 0;
    self.tests_newly_failing = 0;
    adapt_testsuite_open(suite);
    [self.testWebView setFrameLoadDelegate: self];
    [self.referenceWebView setFrameLoadDelegate: self];
    [self nextTest: YES];
}

- (void)evaluateResultAndContinue
{
    if (!self.referenceViewLoaded || !self.testViewLoaded) {
        return;
    }
    NSBitmapImageRep* referenceImage = [self snapshotToBitmap:self.referenceWebView];
    NSBitmapImageRep* testImage = [self snapshotToBitmap:self.testWebView];
    [self closeAdaptFile];
    char passed = [self compareImage: referenceImage with: testImage] ? 'P' : 'F';
    if (passed != 'P') {
        NSString* base = [[NSString stringWithUTF8String:suite] stringByAppendingString:@"result-images/"];
        NSFileManager* fileManager = [NSFileManager defaultManager];
        [fileManager createDirectoryAtPath:base withIntermediateDirectories:YES attributes:nil error:nil];
        NSString* name = [NSString stringWithUTF8String:testcase->relative_path];
        NSString* referenceName = [[base stringByAppendingString:name] stringByAppendingString: @"-ref.png"];
        NSData *referenceData = [referenceImage representationUsingType: NSPNGFileType properties: nil];
        [referenceData writeToFile: referenceName atomically: NO];
        NSString* testName = [[base stringByAppendingString:name] stringByAppendingString: @"-test.png"];
        NSData *testData = [testImage representationUsingType: NSPNGFileType properties: nil];
        [testData writeToFile: testName atomically: NO];
    }
    [self reportAndContinue:passed relaunch:NO];
}

- (void)reportAndContinue:(char)passed relaunch:(BOOL)relaunch
{
    if (passed == 'P') {
        if (testcase->status) {
            self.tests_still_passing++;
            [self.stillPassing setStringValue: [NSString stringWithFormat:@"%d", self.tests_still_passing]];
        } else {
            self.tests_newly_passing++;
            [self.newlyPassing setStringValue: [NSString stringWithFormat:@"%d", self.tests_newly_passing]];
        }
    } else {
        if (testcase->status) {
            self.tests_newly_failing++;
            [self.newlyFailing setStringValue: [NSString stringWithFormat:@"%d", self.tests_newly_failing]];
        } else {
            self.tests_still_failing++;
            [self.stillFailing setStringValue: [NSString stringWithFormat:@"%d", self.tests_still_failing]];
        }
    }
    int total = self.tests_newly_failing + self.tests_newly_passing + self.tests_still_failing + self.tests_still_passing;
    [self.totalTests setStringValue: [NSString stringWithFormat:@"%d", total]];
    adapt_testsuite_report(testcase, passed);
    [self nextTest: relaunch];
}

- (BOOL)compareImage: (NSBitmapImageRep*)image1 with: (NSBitmapImageRep*)image2
{
    float width = image1.pixelsWide;
    if (image2.pixelsWide != width) {
        return NO;
    }
    float height = image1.pixelsHigh;
    if (image2.pixelsHigh != height) {
        return NO;
    }
    float bitsPerPixel = image1.bitsPerPixel;
    if (image2.bitsPerPixel != bitsPerPixel) {
        return NO;
    }
    float stride1 = image1.bytesPerRow;
    unsigned char* data1 = image1.bitmapData;
    float stride2 = image2.bytesPerRow;
    unsigned char* data2 = image2.bitmapData;
    int rowLength = (int) width * (int) bitsPerPixel / 8;
    int diffCount = 0;
    for (int row = 0; row < height; row++) {
        for (int k = 0; k < rowLength; k++) {
            if (data1[k] != data2[k]) {
                diffCount++;
            }
        }
        data1 += (int)stride1;
        data2 += (int)stride2;
    }
    if (diffCount > 0) {
        return NO;
    }
    return YES;
}

- (NSBitmapImageRep*)snapshotToBitmap:(WebView*)view
{
    float scale = 1;
    float width = scale * view.bounds.size.width;
    float height = scale * view.bounds.size.height;
    NSBitmapImageRep *bitmap = [[NSBitmapImageRep alloc] initWithBitmapDataPlanes:nil
                                                        pixelsWide:width
                                                        pixelsHigh:height
                                                     bitsPerSample:8
                                                   samplesPerPixel:3
                                                          hasAlpha:NO
                                                          isPlanar:NO
                                                    colorSpaceName:NSCalibratedRGBColorSpace
                                                      bitmapFormat:0
                                                       bytesPerRow:(4 * width)
                                                      bitsPerPixel:32];
    
    [NSGraphicsContext saveGraphicsState];
    
    NSGraphicsContext *graphicsContext = [NSGraphicsContext graphicsContextWithBitmapImageRep:bitmap];
    [NSGraphicsContext setCurrentContext:graphicsContext];
    CGContextScaleCTM(graphicsContext.graphicsPort, scale, scale);
    
    [view displayRectIgnoringOpacity:view.bounds inContext:graphicsContext];
    
    [NSGraphicsContext restoreGraphicsState];
    return bitmap;
}

@end
