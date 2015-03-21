#import "DocumentView.h"

#import <CoreGraphics/CoreGraphics.h>
#import <AppKit/AppKit.h>
#import <AppKit/NSBezierPath.h>

@implementation DocumentView

- (id)initWithFrame:(NSRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    self.renderer = NULL;
  }
  return self;
}

- (void)setDocRenderer: (AdaptDocumentRenderer*)renderer {
  self.renderer = renderer;
  adapt_document_renderer_set_size(self.renderer, self.frame.size.width,
      self.frame.size.height);
}

- (void)drawRect:(NSRect)dirtyRect {
  [super drawRect:dirtyRect];
  [[NSColor whiteColor] set];
  [NSBezierPath fillRect:self.frame];
  if (self.renderer) {
    if (self.frame.size.width != self.oldSize.width
        || self.frame.size.height != self.oldSize.height) {
      self.oldSize = self.frame.size;
      adapt_document_renderer_set_size(self.renderer, self.frame.size.width,
          self.frame.size.height);
    }
    CGContextRef context = NSGraphicsContext.currentContext.graphicsPort;
    adapt_document_renderer_render(self.renderer, context, dirtyRect);
  }
}

@end
