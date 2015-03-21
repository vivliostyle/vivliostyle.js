//
//  Document.h
//  adapt_cc_sample
//
//  Created by Peter Sorotokin on 1/18/15.
//  Copyright (c) 2015 Peter Sorotokin. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#include "DocumentView.h"

#include "adapt_document.h"

@interface Document : NSDocument

@property AdaptDocument* adapt_document;
@property AdaptDocumentRenderer* adapt_document_renderer;
@property (weak) IBOutlet DocumentView* view;

@end

