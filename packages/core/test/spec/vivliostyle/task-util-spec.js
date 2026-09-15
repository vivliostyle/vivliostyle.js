import * as adapt_task from "../../../src/vivliostyle/task";
import * as adapt_taskutil from "../../../src/vivliostyle/task-util";

describe("task-util", function () {
  describe("Fetcher", function () {
    it("starts its fetch function once", function (done) {
      var callCount = 0;

      adapt_task.start(function () {
        var fetcher = new adapt_taskutil.Fetcher(function () {
          callCount++;
          return adapt_task.newResult("result");
        });

        fetcher.start();
        fetcher.get().then(function () {
          fetcher.start();
          setTimeout(function () {
            expect(callCount).toBe(1);
            done();
          }, 0);
        });
        return adapt_task.newResult(true);
      });
    });
  });
});
