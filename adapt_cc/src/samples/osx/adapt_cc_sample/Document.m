//
//  Document.m
//  adapt_cc_sample
//
//  Created by Peter Sorotokin on 1/18/15.
//  Copyright (c) 2015 Peter Sorotokin. All rights reserved.
//

#import "Document.h"

@interface Document ()

@end

@implementation Document

- (instancetype)init {
    self = [super init];
    if (self) {
      self.adapt_document = NULL;
      self.adapt_document_renderer = NULL;
    }
    return self;
}

- (void)windowControllerDidLoadNib:(NSWindowController *)aController {
  [super windowControllerDidLoadNib:aController];
  if (self.adapt_document_renderer) {
    [self.view setDocRenderer:self.adapt_document_renderer];
  }
}

+ (BOOL)autosavesInPlace {
  return YES;
}

- (NSString *)windowNibName {
  // Override returning the nib file name of the document
  // If you need to use a subclass of NSWindowController or if your document supports multiple NSWindowControllers, you should remove this method and override -makeWindowControllers instead.
  return @"Document";
}

- (NSData *)dataOfType:(NSString *)typeName error:(NSError **)outError {
  // Insert code here to write your document to data of the specified type. If outError != NULL, ensure that you create and set an appropriate error when returning nil.
  // You can also choose to override -fileWrapperOfType:error:, -writeToURL:ofType:error:, or -writeToURL:ofType:forSaveOperation:originalContentsURL:error: instead.
  [NSException raise:@"UnimplementedMethod" format:@"%@ is unimplemented", NSStringFromSelector(_cmd)];
  return nil;
}

- (BOOL)readFromData:(NSData *)data ofType:(NSString *)typeName error:(NSError **)outError {
  // Insert code here to read your document from the given data of the specified type. If outError != NULL, ensure that you create and set an appropriate error when returning NO.
  // You can also choose to override -readFromFileWrapper:ofType:error: or -readFromURL:ofType:error: instead.
  // If you override either of these, you should also override -isEntireFileLoaded to return NO if the contents are lazily loaded.
  [NSException raise:@"UnimplementedMethod" format:@"%@ is unimplemented", NSStringFromSelector(_cmd)];
  return YES;
}

- (BOOL)readFromURL:(NSURL *)url ofType:(NSString *)typeName error:(NSError *__autoreleasing *)outError {
  self.adapt_document = adapt_document_open((__bridge CFURLRef)(url));
  self.adapt_document_renderer = adapt_document_create_renderer(self.adapt_document);
  if (self.view) {
    [self.view setDocRenderer:self.adapt_document_renderer];
  }
  return TRUE;
}

- (IBAction)nextPage:(id)sender {
  adapt_document_renderer_next_page(self.adapt_document_renderer);
  [self.view setNeedsDisplay: TRUE];
}

- (IBAction)previousPage:(id)sender {
  adapt_document_renderer_previous_page(self.adapt_document_renderer);
  [self.view setNeedsDisplay: TRUE];
}


@end
