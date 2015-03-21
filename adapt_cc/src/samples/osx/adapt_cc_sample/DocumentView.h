//
//  DocumentView.h
//  adapt_cc_sample
//
//  Created by Peter Sorotokin on 1/19/15.
//  Copyright (c) 2015 Peter Sorotokin. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#include "samples/osx/adapt_cc_sample/adapt_document.h"

@interface DocumentView : NSView

- (void)setDocRenderer: (AdaptDocumentRenderer*)renderer;

@property AdaptDocumentRenderer* renderer;
@property NSSize oldSize;

@end
