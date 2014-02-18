//
//  AppDelegate.m
//  ViewerTest
//
//  Created by Peter Sorotokin on 2/16/14.
//  Copyright (c) 2014 Google. All rights reserved.
//

#import "ViewerTest.h"

#include "clang/service/adapt_service.h"

struct viewer_test_callback {
    adapt_callback super_;
    __unsafe_unretained ViewerTest* owner;
};

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

- (BOOL)loadAdaptFile:(const char*)path
{
    self.callback = MakeContentCallback(self, path);
    adapt_serving_context* context = adapt_start_serving(self.callback);
    if (!context) {
        return NO;
    }
    const char* url = adapt_get_bootstrap_url(context);
    if (!url) {
        return NO;
    }
    self.bootstrapURL = [NSString stringWithCString:url encoding:NSUTF8StringEncoding];
    self.servingContext = context;
    if (self.testWebView) {
        [[self.testWebView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL URLWithString:self.bootstrapURL]]];
    }
    return YES;
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    if (frame == [self.testWebView mainFrame]) {
        const char* initCall = adapt_get_init_call(self.servingContext, "main", "autoresize:true");
        NSString* init = [NSString stringWithCString:initCall encoding:NSUTF8StringEncoding];
        [[self.testWebView windowScriptObject] evaluateWebScript:init];
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
}

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
    const char* fileName = "/Users/peter/Sites/content/csstest/c14-classes-000.xht";
    [self.testWebView setFrameLoadDelegate: self];
    [self loadAdaptFile: fileName];
    NSString* fileNameStr = [NSString stringWithCString:fileName encoding:NSUTF8StringEncoding];
    [[self.referenceWebView mainFrame] loadRequest: [NSURLRequest requestWithURL:[NSURL fileURLWithPath:fileNameStr]]];
}

@end
