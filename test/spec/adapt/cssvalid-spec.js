describe("cssvalid", function() {
  describe("ValidatorSet", function() {
    it("sould parse simple validator and simple rule", function() {
      var validatorSet = new adapt.cssvalid.ValidatorSet();
      validatorSet.initBuiltInValidators();
      validatorSet.parse("foo = bar | baz;");
      var handler = new adapt.csscasc.CascadeParserHandler(null, null, null, null, null,
	    		                                           validatorSet, true);
      adapt.task.start(function() {
        adapt.cssparse.parseStylesheetFromText(".test { foo: bar; }", handler, null, null, null).then(
          function(result) {
            expect(result).toBe(true);
          });
      });
    });
  });
});
