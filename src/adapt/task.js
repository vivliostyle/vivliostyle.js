/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Vivliostyle Inc.
 * @fileoverview Support for asynchronous execution and cooperative multitasking.
 */
goog.require('vivliostyle.logging');
goog.require('adapt.base');

goog.provide('adapt.task');


/**
 * External timer. Only needed for testing.
 * @interface
 */
adapt.task.Timer = function() {};

/**
 * @return {number} current time in milliseconds.
 */
adapt.task.Timer.prototype.currentTime = function() {};

/**
 * Calls function after a given timeout.
 * @param {function(): void} fn function to call.
 * @param {number} delay timeout in milliseconds.
 * @return {number} unique number that can be used to clear the timeout.
 */
adapt.task.Timer.prototype.setTimeout = function(fn, delay) {};

/**
 * Calls function after a given timeout.
 * @param {number} token timeout token.
 * @return {void}.
 */
adapt.task.Timer.prototype.clearTimeout = function(token) {};


/**
 * Result of an asynchronous function that may be available immediately or
 * some time later. Similar to Deferred.
 * @template T
 * @interface
 */
adapt.task.Result = function() {};

/**
 * Call the given function when asynchronous function is finished. Callback
 * is executed in the task's context.
 * @param {function(T): void} callback
 * @return {void}
 */
adapt.task.Result.prototype.then = function(callback) {};

/**
 * Call the given asynchronous function when some asynchronous function is
 * finished. Callback is executed in the task's context.
 * @template T1
 * @param {function(T): !adapt.task.Result.<T1>} callback
 * @return {!adapt.task.Result.<T1>}
 */
adapt.task.Result.prototype.thenAsync = function(callback) {};

/**
 * Produce a Result that resolves to the given value when this Result is resolved.
 * @template T1
 * @param {T1} result
 * @return {!adapt.task.Result.<T1>}
 */
adapt.task.Result.prototype.thenReturn = function(result) {};

/**
 * Finish given frame with the result value when result becomes ready.
 * @param {!adapt.task.Frame.<T>} frame
 * @return {void}
 */
adapt.task.Result.prototype.thenFinish = function(frame) {};

/**
 * Check if this Result is still pending.
 * @return {boolean}
 */
adapt.task.Result.prototype.isPending = function() {};

/**
 * If this Result is resolved, return the value that it holds.
 * @return {?T}
 */
adapt.task.Result.prototype.get = function() {};


/**
 * @private
 * @type {adapt.task.Task}
 */
adapt.task.privateCurrentTask = null;

/**
 * @private
 * @type {adapt.task.Scheduler}
 */
adapt.task.primaryScheduler = null;


/**
 * Returns current task.
 * @return {adapt.task.Task}
 */
adapt.task.currentTask = function() {
    return adapt.task.privateCurrentTask;
};


/**
 * Create and return a new frame with the given name.
 * @param {string} name
 * @return {!adapt.task.Frame}
 */
adapt.task.newFrame = function(name) {
    if (!adapt.task.privateCurrentTask)
        throw new Error('E_TASK_NO_CONTEXT');
    if (!adapt.task.privateCurrentTask.name)
    	adapt.task.privateCurrentTask.name = name;
    var task = adapt.task.privateCurrentTask;
    var frame = new adapt.task.Frame(task, task.top, name);
    task.top = frame;
    frame.state = adapt.task.FrameState.ACTIVE;
    return frame;
};

/**
 * @return {adapt.task.EventSource}
 */
adapt.task.newEventSource = function() {
    return new adapt.task.EventSource();
};

/**
 * @param {adapt.task.Timer=} opt_timer
 * @return {adapt.task.Scheduler}
 */
adapt.task.newScheduler = function(opt_timer) {
    return new adapt.task.Scheduler(
        opt_timer || new adapt.task.TimerImpl());
};

/**
 * @template T
 * @param {T} opt_value
 * @return {!adapt.task.Result.<T>}
 */
adapt.task.newResult = function(opt_value) {
    return new adapt.task.SyncResultImpl(opt_value);
};

/**
 * Creates a new frame and runs code in its context, catching synchronous and
 * asynchronous errors. If an error occurs, onErr is run (in the context of
 * the same frame). As usual, onErr is supposed either produce a result or raise an
 * exception.
 * @template T
 * @param {function(!adapt.task.Frame.<T>):void} code
 * @param {function(!adapt.task.Frame.<T>,Error):void} onErr
 * @return {!adapt.task.Result.<T>}
 */
adapt.task.handle = function(name, code, onErr) {
	var frame = adapt.task.newFrame(name);
	frame.handler = onErr;
    try {
    	code(frame);
    } catch (err) {
    	// synchronous exception
    	frame.task.raise(err, frame);
    }
    return frame.result();
};

/**
 * @param {function(): !adapt.task.Result} func
 * @param {string=} opt_name
 * @return {adapt.task.Task}
 */
adapt.task.start = function(func, opt_name) {
	var scheduler = adapt.task.privateCurrentTask
		? adapt.task.privateCurrentTask.getScheduler() 
		: adapt.task.primaryScheduler || adapt.task.newScheduler();
	return scheduler.run(func, opt_name);
};

/**
 * Frame state.
 * @enum {number}
 */
adapt.task.FrameState = {
    INIT: 0, // before newFrame call
    ACTIVE: 1, // before finish call
    FINISHED: 2, // before callback complete
    DEAD: 3 // when callback is complete
};

/**
 * @constructor
 * @implements {adapt.task.Timer}
 */
adapt.task.TimerImpl = function() {};

/**
 * @override
 */
adapt.task.TimerImpl.prototype.currentTime = function() {
    return (new Date()).valueOf();
};

/**
 * @override
 */
adapt.task.TimerImpl.prototype.setTimeout = function(fn, delay) {
    return setTimeout(fn, delay);
};

/**
 * @override
 */
adapt.task.TimerImpl.prototype.clearTimeout = function(token) {
    clearTimeout(token);
};

/**
 * A class to create tasks.
 * @private
 * @param {adapt.task.Timer} timer
 * @constructor
 */
adapt.task.Scheduler = function(timer) {
    /** @type {adapt.task.Timer} */ this.timer = timer;
    /** @type {number} */ this.timeout = 1;
    /** @type {number} */ this.slice = 25;
    /** @type {number} */ this.sliceOverTime = 0;
    /**
     * @type {adapt.base.PriorityQueue}
     */
    this.queue = new adapt.base.PriorityQueue();
    /** @type {?number} */ this.wakeupTime = null;
    /** @type {?number} */ this.timeoutToken = null;
    /** @type {boolean} */ this.inTimeSlice = false;
    /** @type {number} */ this.order = 0;
    if (!adapt.task.primaryScheduler) {
    	adapt.task.primaryScheduler = this;
    }
};

/**
 * Sets time slice length.
 * @param {number} slice length in milliseconds.
 */
adapt.task.Scheduler.prototype.setSlice = function(slice) {
	this.slice = slice;
};

/**
 * Sets timeout between time slices.
 * @param {number} timeout in milliseconds.
 */
adapt.task.Scheduler.prototype.setTimeout = function(timeout) {
	this.timeout = timeout;
};

/**
 * Checks if the current time slice is over.
 * @return {boolean}
 */
adapt.task.Scheduler.prototype.isTimeSliceOver = function() {
    var now = this.timer.currentTime();
    return now >= this.sliceOverTime;
};

/**
 * @private
 * @return {void}
 */
adapt.task.Scheduler.prototype.arm = function() {
    if (this.inTimeSlice)
        return;
    var nextInQueue =
        /** @type {adapt.task.Continuation} */ (this.queue.peek());
    var newTime = nextInQueue.scheduledTime;
    var now = this.timer.currentTime();
    if (this.timeoutToken != null) {
        if (now + this.timeout > this.wakeupTime)
            return; // no use re-arming
        this.timer.clearTimeout(this.timeoutToken);
    }
    var timeout = newTime - now;
    if (timeout <= this.timeout)
        timeout = this.timeout;
    this.wakeupTime = now + timeout;
    var self = this;
    this.timeoutToken = this.timer.setTimeout(function() {
        self.timeoutToken = null;
        self.doTimeSlice();
    }, timeout);
};

/**
 * @private
 * @param {adapt.task.Continuation} continuation
 * @param {number=} opt_delay
 * @return {void}
 */
adapt.task.Scheduler.prototype.schedule = function(
        continuation, opt_delay) {
    var c = /** @type {adapt.task.Continuation} */ (continuation);
    var now = this.timer.currentTime();
    c.order = this.order++;
    c.scheduledTime = now + (opt_delay || 0);
    this.queue.add(c);
    this.arm();
};

/**
 * @private
 * @return {void}
 */
adapt.task.Scheduler.prototype.doTimeSlice = function() {
    if (this.timeoutToken != null) {
        this.timer.clearTimeout(this.timeoutToken);
        this.timeoutToken = null;
    }
    this.inTimeSlice = true;
    try {
        var now = this.timer.currentTime();
        this.sliceOverTime = now + this.slice;
        while (this.queue.length()) {
            var continuation =
                /** @type {adapt.task.Continuation} */ (this.queue.peek());
            if (continuation.scheduledTime > now)
                break; // too early
            this.queue.remove();
            continuation.resumeInternal();
            now = this.timer.currentTime();
            if (now >= this.sliceOverTime)
                break;
        }
    } catch (err) {
        vivliostyle.logging.logger.error(err);
    }
    this.inTimeSlice = false;
    if (this.queue.length())
        this.arm();
};

/**
 * @param {function(): !adapt.task.Result} func
 * @param {string=} opt_name
 * @return {adapt.task.Task}
 */
adapt.task.Scheduler.prototype.run = function(func, opt_name) {
    var task = new adapt.task.Task(this, opt_name || "");
    task.top = new adapt.task.Frame(task, null, 'bootstrap');
    task.top.state = adapt.task.FrameState.ACTIVE;
    task.top.then(function() {
        var done = function() {
            task.running = false;
            for (var i = 0; i < task.callbacks.length; i++) {
                var callback = task.callbacks[i];
                try {
                    callback();
                } catch (err) {
                    vivliostyle.logging.logger.error(err);
                }
            }
        };
        try {
            func().then(function(result) {
                task.result = result;
                done();
            });
        } catch (err) {
            task.raise(err);
            done();
        }
    });
    var savedTask = adapt.task.privateCurrentTask;
    adapt.task.privateCurrentTask = task;
    this.schedule(task.top.suspend('bootstrap'));
    adapt.task.privateCurrentTask = savedTask;
    return task;
};


/**
 * Task suspension point.
 * @param {adapt.task.Task} task
 * @template T
 * @constructor
 * @implements {adapt.base.Comparable}
 */
adapt.task.Continuation = function(task) {
    /** @type {adapt.task.Task} */ this.task = task;
    /** @type {number} */ this.scheduledTime = 0;
    /** @type {number} */ this.order = 0;
    /** @type {*} */ this.result = null;
};

/**
 * @param {adapt.base.Comparable} otherComp
 * @return {number}
 * @override
 */
adapt.task.Continuation.prototype.compare = function(otherComp) {
    // earlier wins
	var other = /** @type {adapt.task.Continuation} */ (otherComp);
    return other.scheduledTime - this.scheduledTime || other.order - this.order;
};


/**
 * Continuation's task
 * @return {adapt.task.Task}
 */
adapt.task.Continuation.prototype.getTask = function() {
    return this.task;
};

/**
 * Schedule task continuation after the given (optional) delay.
 * @param {T} result
 * @param {number=} opt_delay optional delay in milliseconds.
 */
adapt.task.Continuation.prototype.schedule = function(result, opt_delay) {
	this.result = result;
    this.task.scheduler.schedule(this, opt_delay);
};

/**
 * @private
 * @return {boolean}
 */
adapt.task.Continuation.prototype.resumeInternal = function() {
    var task = this.task;
    this.task = null;
    if (task && task.continuation == this) {
        task.continuation = null;
        var savedTask = adapt.task.privateCurrentTask;
        adapt.task.privateCurrentTask = task;
        task.top.finish(this.result);
        adapt.task.privateCurrentTask = savedTask;
        return true;
    }
    return false;
};


/**
 * An asynchronous, time-sliced task.
 * @private
 * @param {!adapt.task.Scheduler} scheduler
 * @param {string} name
 * @constructor
 */
adapt.task.Task = function(scheduler, name) {
    /** @type {!adapt.task.Scheduler} */ this.scheduler = scheduler;
    /** @type {string} */ this.name = name;
    /** @type {Array.<function(): void>} */ this.callbacks = [];
    /** @type {Error} */ this.exception = null;
    /** @type {boolean} */ this.running = true;
    /** @type {*} */ this.result = null;
    /** @type {*} */ this.waitTarget = null;
    /** @type {adapt.task.Frame} */ this.top = null;
    /** @type {adapt.task.Continuation} */ this.continuation = null;
};

/**
 * @return {string} task name.
 */
adapt.task.Task.prototype.getName = function() {
	return this.name;
};

/**
 * @param {Error} err exception to throw in the task's context.
 * @return {void}
 */
adapt.task.Task.prototype.interrupt = function(err) {
    this.raise(err || new Error('E_TASK_INTERRUPT'));
    if (this !== adapt.task.privateCurrentTask && this.continuation) {
        // blocked on something
        var continuation = new adapt.task.Continuation(this);
        this.waitTarget = 'interrupt';
        this.continuation = continuation;
        this.scheduler.schedule(continuation);
    }
};

/**
 * @return {adapt.task.Scheduler} this task's scheduler.
 */
adapt.task.Task.prototype.getScheduler = function() {
    return this.scheduler;
};

/**
 * @return {boolean} true if task is still running.
 */
adapt.task.Task.prototype.isRunning = function() {
    return this.running;
};

/**
 * Register a callback to be called when the task is done. Callback is not
 * executed in any task context. Multiple callbacks can be registered and
 * they will be called in the registration order.
 * @param {function(*):void} callback
 * @return {void}
 */
adapt.task.Task.prototype.whenDone = function(callback) {
    this.callbacks.push(callback);
};

/**
 * Wait for task to finish (from another task).
 * @return {!adapt.task.Result}
 */
adapt.task.Task.prototype.join = function() {
    var frame = adapt.task.newFrame('Task.join');
    if (!this.running) {
        frame.finish(this.result);
    } else {
        var continuation = frame.suspend(this);
        var self = this;
        this.whenDone(function() {
            continuation.schedule(self.result);
        });
    }
    return frame.result();
};

/**
 * Unwind the stack. We have two stacks: async (maintained by frame
 * parent link) and sync (regular JavaScript stack).
 */
adapt.task.Task.prototype.unwind = function() {
	// We have a sequence of frames on the stack.
	while(this.top && !this.top.handler) {
		this.top = this.top.parent;
	}
	if (this.top) {
		// found a handler
		var err = this.exception;
		this.exception = null;
		this.top.handler(this.top, err);
	} else {
        if (this.exception) {
            vivliostyle.logging.logger.error(this.exception, 'Unhandled exception in task', this.name);
        }
	}
};

/**
 * @private
 * @param {Error} err
 * @param {adapt.task.Frame=} opt_frame
 * @return {void}
 */
adapt.task.Task.prototype.raise = function(err, opt_frame) {
    this.fillStack(err);
    if (opt_frame) {
        var f = this.top;
        while (f && f != opt_frame) {
        	f = f.parent;
        }
        if (f == opt_frame) {
        	this.top = f;
        }    	
    }
    this.exception = err;
    this.unwind();
};

/**
 * Fill the stack trace in the exception
 * @param {Error} err exception
 */
adapt.task.Task.prototype.fillStack = function(err) {	
	var out = err['frameTrace'];
    if (!out) {
    	out = err["stack"] ? err["stack"] + "\n\t---- async ---\n" : "";
	    for (var f = this.top; f; f = f.parent) {
	        out += '\t';
	        out += f.getName();
	        out += '\n';
	    }
	    err['frameTrace'] = out;
    }
};


/**
 * @template T
 * @private
 * @param {T} value
 * @constructor
 * @implements {adapt.task.Result.<T>}
 */
adapt.task.SyncResultImpl = function(value) {
    /** @type {T} */ this.value = value;
};

/**
 * @override
 */
adapt.task.SyncResultImpl.prototype.then = function(callback) {
    callback(this.value);
};

/**
 * @override
 */
adapt.task.SyncResultImpl.prototype.thenAsync = function(callback) {
    return callback(this.value);
};

/**
 * @override
 */
adapt.task.SyncResultImpl.prototype.thenReturn = function(result) {
    return new adapt.task.SyncResultImpl(result);
};

/**
 * @override
 */
adapt.task.SyncResultImpl.prototype.thenFinish = function(frame) {
	frame.finish(this.value);
};

/**
 * @override
 */
adapt.task.SyncResultImpl.prototype.isPending = function() {
    return false;
};

/**
 * @override
 */
adapt.task.SyncResultImpl.prototype.get = function() {
    return this.value;
};


/**
 * @template T
 * @param {adapt.task.Frame.<T>} frame
 * @constructor
 * @implements {adapt.task.Result.<T>}
 */
adapt.task.ResultImpl = function(frame) {
    /** @const */ this.frame = frame;
};

/**
 * @override
 */
adapt.task.ResultImpl.prototype.then = function(callback) {
    this.frame.then(callback);
};

/**
 * @override
 */
adapt.task.ResultImpl.prototype.thenAsync = function(callback) {
    if (this.isPending()) {
        // thenAsync is special, do the trick with the context
        var frame = new adapt.task.Frame(this.frame.task,
            this.frame.parent, 'AsyncResult.thenAsync');
        frame.state = adapt.task.FrameState.ACTIVE;
        this.frame.parent = frame;
        this.frame.then(function(res1) {
            callback(res1).then(function(res2) {
                frame.finish(res2);
            });
        });
        return frame.result();
    } else {
        return callback(this.frame.res);
    }
};

/**
 * @override
 */
adapt.task.ResultImpl.prototype.thenReturn = function(result) {
    if (this.isPending()) {
        return this.thenAsync(function() {
        	return new adapt.task.SyncResultImpl(result);
        });
    } else {
    	return new adapt.task.SyncResultImpl(result);
    }
};

/**
 * @override
 */
adapt.task.ResultImpl.prototype.thenFinish = function(frame) {
    if (this.isPending()) {
        this.then(function(res) {
        	frame.finish(res);
        });
    } else {
    	frame.finish(this.frame.res);
    }	
};

/**
 * @override
 */
adapt.task.ResultImpl.prototype.isPending = function() {
    return this.frame.state == adapt.task.FrameState.ACTIVE;
};

/**
 * @override
 */
adapt.task.ResultImpl.prototype.get = function() {
    if (this.isPending())
    	throw new Error("Result is pending");
    return this.frame.res;
};


/**
 * Asynchronous execution frame. Corresponds to an asynchronous function
 * invocation.
 * @template T
 * @param {!adapt.task.Task} task
 * @param {adapt.task.Frame} parent
 * @param {string} name
 * @constructor
 */
adapt.task.Frame = function(task, parent, name) {
    /** @type {!adapt.task.Task} */ this.task = task;
    /** @type {adapt.task.Frame} */ this.parent = parent;
    /** @type {string} */ this.name = name;
    /** @type {*} */ this.res = null;
    /** @type {adapt.task.FrameState} */ this.state = adapt.task.FrameState.INIT;
    /** @type {?function(*): void} */ this.callback = null;
    /** @type {?function(!adapt.task.Frame,Error):void} */ this.handler = null;
};

/**
 * @private
 * @return {void}
 */
adapt.task.Frame.prototype.checkEnvironment = function() {
    if (!adapt.task.privateCurrentTask) {
        throw new Error('F_TASK_NO_CONTEXT');
    }
    if (this !== adapt.task.privateCurrentTask.top) {
        throw new Error('F_TASK_NOT_TOP_FRAME');
    }
};

/**
 * @return {!adapt.task.Result.<T>} to be returned as this asynchronous function
 *                              return value.
 */
adapt.task.Frame.prototype.result = function() {
    return new adapt.task.ResultImpl(this);
};

/**
 * @param {T} res
 */
adapt.task.Frame.prototype.finish = function(res) {
    this.checkEnvironment();
    if (!adapt.task.privateCurrentTask.exception)
        this.res = res;
    this.state = adapt.task.FrameState.FINISHED;
    var frame = this.parent;
    adapt.task.privateCurrentTask.top = frame;
    if (this.callback) {
	    try {
	        this.callback(res);
	    } catch (err) {
	        this.task.raise(err, frame);
	    }
	    // callback was called
	    this.state = adapt.task.FrameState.DEAD;
    }
};

/**
 * @return {!adapt.task.Task}
 */
adapt.task.Frame.prototype.getTask = function() {
    return this.task;
};

/**
 * @return {string} frame name.
 */
adapt.task.Frame.prototype.getName = function() {
    return this.name;
};

/**
 * @return {!adapt.task.Scheduler}
 */
adapt.task.Frame.prototype.getScheduler = function() {
    return this.task.scheduler;
};

/**
 * @private
 * @param {function(T): void} callback
 * @return {void}
 */
adapt.task.Frame.prototype.then = function(callback) {
    // legal to call when currentTask is null
    switch (this.state) {
        case adapt.task.FrameState.ACTIVE:
            if (this.callback) {
                throw new Error('F_TASK_FRAME_ALREADY_HAS_CALLBACK');
            } else {
                this.callback = callback;
            }
            break;
        case adapt.task.FrameState.FINISHED:
        	var task = this.task;
        	var frame = this.parent;
            try {
                callback(this.res);
                this.state = adapt.task.FrameState.DEAD;
            } catch (err) {
                this.state = adapt.task.FrameState.DEAD;
                task.raise(err, frame);
            }
            break;
        case adapt.task.FrameState.DEAD:
            throw new Error('F_TASK_DEAD_FRAME');
        default:
            throw new Error('F_TASK_UNEXPECTED_FRAME_STATE ' + this.state);
    }
};

/**
 * If this task was executed longer than task's slice parameter.
 * @return {!adapt.task.Result.<boolean>} holds true
 */
adapt.task.Frame.prototype.timeSlice = function() {
    var frame = adapt.task.newFrame('Frame.timeSlice');
    var scheduler = frame.getScheduler();
    if (scheduler.isTimeSliceOver()) {
        vivliostyle.logging.logger.debug("-- time slice --");
        frame.suspend().schedule(true);
    } else {
        frame.finish(true);
    }
    return frame.result();
};

/**
 * Yield to other tasks for the specified time.
 * @param {number} delay in milliseconds.
 * @return {!adapt.task.Result.<boolean>} holds true
 */
adapt.task.Frame.prototype.sleep = function(delay) {
    var frame = adapt.task.newFrame('Frame.sleep');
    frame.suspend().schedule(true, delay);
    return frame.result();
};

/**
 * Repeatedly execute the given function asynchronously until it returns false.
 * @param {function(): !adapt.task.Result.<boolean>} func
 * @return {!adapt.task.Result.<boolean>} holds true.
 */
adapt.task.Frame.prototype.loop = function(func) {
    var frame = adapt.task.newFrame('Frame.loop');
    var step = function(more) {
        try {
            while (more) {
                var result = func();
                if (result.isPending()) {
                    result.then(step);
                    return;
                } else {
                    result.then(function(m) {
                        more = m;
                    });
                }
            }
            frame.finish(true);
        } catch (err) {
        	frame.task.raise(err, frame);
        }
    };
    step(true);
    return frame.result();
};

/**
 * Similar to loop(), but provides a Frame for loop body function.
 * @param {function(!adapt.task.LoopBodyFrame):void} func
 * @return {!adapt.task.Result.<boolean>} holds true.
 */
adapt.task.Frame.prototype.loopWithFrame = function(func) {
    var task = adapt.task.privateCurrentTask;
    if (!task) {
    	throw new Error("E_TASK_NO_CONTEXT");
    }
    return this.loop(function() {
    	var result;
    	do {
		    var frame = new adapt.task.LoopBodyFrame(/** @type {!adapt.task.Task} */ (task), task.top);
		    task.top = frame;
		    frame.state = adapt.task.FrameState.ACTIVE;
		    func(frame);
		    result = frame.result();
    	} while(!result.isPending() && result.get());
    	return result;
    });
};

/**
 * @param {*=} opt_waitTarget
 * @return {adapt.task.Continuation.<T>}
 */
adapt.task.Frame.prototype.suspend = function(opt_waitTarget) {
    this.checkEnvironment();
    if (this.task.continuation)
        throw new Error('E_TASK_ALREADY_SUSPENDED');
    /** @type {adapt.task.Continuation.<T>} */ var continuation =
    	new adapt.task.Continuation(this.task);
    this.task.continuation = continuation;
    adapt.task.privateCurrentTask = null;
    this.task.waitTarget = opt_waitTarget || null;
    return continuation;
};

/**
 * @param {!adapt.task.Task} task
 * @param {adapt.task.Frame} parent
 * @constructor
 * @extends {adapt.task.Frame.<boolean>}
 */
adapt.task.LoopBodyFrame = function(task, parent) {
	adapt.task.Frame.call(this, task, parent, "loop");
};
goog.inherits(adapt.task.LoopBodyFrame, adapt.task.Frame);

/**
 * @return {void}
 */
adapt.task.LoopBodyFrame.prototype.continueLoop = function() {
	this.finish(true);
};

/**
 * @return {void}
 */
adapt.task.LoopBodyFrame.prototype.breakLoop = function() {
	this.finish(false);
};

/**
 * @param {adapt.base.Event} event
 * @constructor
 */
adapt.task.EventItem = function(event) {
    /** @type {adapt.base.Event} */ this.event = event;
    /** @type {adapt.task.EventItem} */ this.next = null;
};


/**
 * An class to listen to evens and present them as a readable asynchronous
 * stream to tasks.
 * @private
 * @constructor
 */
adapt.task.EventSource = function() {
    /** @type {adapt.task.Continuation.<boolean>} */ this.continuation = null;
    /**
     * @type {Array.<{target:!adapt.base.EventTarget,type:string,listener:!adapt.base.EventListener}>}
     * @const
     */
    this.listeners = [];
    /**
     *  @type {adapt.task.EventItem}
     */
    this.head = new adapt.task.EventItem(null);
    /** @type {adapt.task.EventItem} */ this.tail = this.head;
};

/**
 * Attaches as an event listener to an EventTarget.
 * @param {adapt.base.EventTarget} target
 * @param {string} type
 * @param {boolean=} opt_preventDefault
 * @return {void}
 */
adapt.task.EventSource.prototype.attach = function(target, type, opt_preventDefault) {
    var self = this;
    var listener = /** @param {adapt.base.Event} event */ function(event) {
    	if (opt_preventDefault) {
    		event.preventDefault();
    	}
        if (self.tail.event) {
            self.tail.next = new adapt.task.EventItem(event);
            self.tail = self.tail.next;
        } else {
            self.tail.event = event;
            var continuation = self.continuation;
            if (continuation) {
                self.continuation = null;
                continuation.schedule(true);
            }
        }
    };
    target.addEventListener(type, listener, false);
    this.listeners.push({target:target, type:type, listener:listener});
};

/**
 * @param {adapt.base.EventTarget} target
 * @param {string} type
 * @return {void}
 */
adapt.task.EventSource.prototype.detach = function(target, type) {
	var i = 0;
	var item = null;
	while (i < this.listeners.length) {
		item = this.listeners[i];
		if (item.type == type && item.target === target) {
			this.listeners.splice(i, 1);
		    item.target.removeEventListener(item.type, item.listener, false);
		    return;
		}
		i++;
	}
    throw new Error('E_TASK_EVENT_SOURCE_NOT_ATTACHED');
};

/**
 * Read next dispatched event, blocking the current task if needed.
 * @return {!adapt.task.Result.<adapt.base.Event>} 
 */
adapt.task.EventSource.prototype.nextEvent = function() {
    /** @type {!adapt.task.Frame.<adapt.base.Event>} */ var frame =
    	adapt.task.newFrame('EventSource.nextEvent');
    var self = this;
    var readEvent = function() {
        if (self.head.event) {
            var event = self.head.event;
            if (self.head.next)
                self.head = self.head.next;
            else
                self.head.event = null;
            frame.finish(event);
        } else if (self.continuation) {
            throw new Error('E_TASK_EVENT_SOURCE_OTHER_TASK_WAITING');
        } else {
        	/** @type {!adapt.task.Frame.<boolean>} */ var frameInternal =
                adapt.task.newFrame('EventSource.nextEventInternal');
            self.continuation = frameInternal.suspend(self);
            frameInternal.result().then(readEvent);
        }
    };
    readEvent();
    return frame.result();
};
