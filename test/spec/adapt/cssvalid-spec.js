describe("cssvalid", function() {
  describe("ValidatorSet", function() {
    it("sould parse simple validator and simple rule", function(done) {
      var validatorSet = new adapt.cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = bar | baz;");
      var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
	    		                                           validatorSet, true);
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
      adapt.task.start(function() {
        adapt.cssparse.parseStylesheetFromText(
          ".test { foo: bar; }\n.test2 { foo: baz; }", handler, null, null, null).then(
          function(result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
      });
    });
    it("sould parse validator and space rule", function(done) {
      var validatorSet = new adapt.cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = SPACE(IDENT+);");
      var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
	    		                                           validatorSet, true);
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
      adapt.task.start(function() {
        adapt.cssparse.parseStylesheetFromText(
          ".test { foo: bar; }\n.test2 { foo: bar baz boo; }", handler, null, null, null).then(
          function(result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
      });
    });

    it("sould parse validator and comma rule", function(done) {
      var validatorSet = new adapt.cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = COMMA( IDENT+ );");
      var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
	    		                                           validatorSet, true);
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
      adapt.task.start(function() {
        adapt.cssparse.parseStylesheetFromText(
          ".test { foo: bar,baz; }\n .test2{ foo: bar; }", handler, null, null, null).then(
          function(result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
      });
    });

    it("sould parse validator and complex comma rule", function(done) {
      var validatorSet = new adapt.cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = none | COMMA( [ bar | baz ]+ );");
      var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
	    		                                           validatorSet, true);
      var warnListener = jasmine.createSpy("warn listener");
      vivliostyle.logging.logger.addListener(vivliostyle.logging.LogLevel.WARN, warnListener);
      adapt.task.start(function() {
        adapt.cssparse.parseStylesheetFromText(
          ".test { foo: none; }\n.test2 { foo: bar,baz; }\n .test3 { foo: bar; }", handler, null, null, null).then(
          function(result) {
            expect(result).toBe(true);
            expect(warnListener).not.toHaveBeenCalled();
            done();
          });
      });
    });
    
  });
});
