import vivliostyle from "../../../src/js/models/vivliostyle";

export default function() {
    beforeAll(function() {
        vivliostyle.setInstance({
            viewer: {
                ZoomType: {
                    FIT_INSIDE_VIEWPORT: "fit inside viewport"
                }
            },
            constants: null
        });
    });

    afterAll(function() {
        vivliostyle.setInstance({
            viewer: null,
            constants: null
        });
    });
}
