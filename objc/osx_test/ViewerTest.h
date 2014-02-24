//
//  AppDelegate.h
//  ViewerTest
//
//  Created by Peter Sorotokin on 2/16/14.
//  Copyright (c) 2014 Google. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface ViewerTest : NSObject <NSApplicationDelegate>

- (void)processMessageFromContent:(id)message;

@property BOOL testViewLoaded;
@property BOOL referenceViewLoaded;

@property (assign) IBOutlet NSWindow *window;
@property (weak) IBOutlet WebView* testWebView;
@property (weak) IBOutlet WebView* referenceWebView;

@property (weak) IBOutlet NSTextField* totalTests;
@property (weak) IBOutlet NSTextField* stillPassing;
@property (weak) IBOutlet NSTextField* stillFailing;
@property (weak) IBOutlet NSTextField* newlyPassing;
@property (weak) IBOutlet NSTextField* newlyFailing;
@property (weak) IBOutlet NSTextField* nowRunning;


@property NSString* bootstrapURL;
@property struct adapt_callback* callback;
@property struct adapt_serving_context* servingContext;

@property int tests_still_passing;
@property int tests_still_failing;
@property int tests_newly_passing;
@property int tests_newly_failing;

@end
