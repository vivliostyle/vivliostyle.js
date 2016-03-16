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
  });
});
