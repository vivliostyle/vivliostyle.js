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

@property (assign) IBOutlet NSWindow *window;
@property (weak) IBOutlet WebView* testWebView;
@property (weak) IBOutlet WebView* referenceWebView;

@property NSString* bootstrapURL;
@property struct adapt_callback* callback;
@property struct adapt_serving_context* servingContext;

@end
