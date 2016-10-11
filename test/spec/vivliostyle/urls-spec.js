describe("urls", function() {
    var module = vivliostyle.urls;
    var transformer = {
        transformURL: function(m1, baaseUrl) {
            return baaseUrl + "/" + m1;
        }
    };

    describe("transformURIs", function() {
        it("transform all urls in the attribute value.", function() {
            expect(module.transformURIs(
                'URL( "http://foo.com/test/?x=#bar" ),' +
                "url( #test ), " +
                "uRL('#test?x=\"') url other text",
                "aaa", transformer
            )).toEqual("url(\"aaa/http://foo.com/test/?x=#bar\"),url(aaa/#test ), url('aaa/#test?x=\"') url other text");
        });
    });

});
