/**
 * Copyright 2013 Google, Inc.
 * Copyright 2015 Trim-marks Inc.
 *
 * Vivliostyle.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Vivliostyle.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Vivliostyle.js.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @fileoverview Support for asynchronous execution and cooperative
 * multitasking.
 */
import * as logging from '../vivliostyle/logging';
import * as base from './base';

/**
 * External timer. Only needed for testing.
 */
export interface Timer {
  /**
   * @return current time in milliseconds.
   */
  currentTime(): number;

  /**
   * Calls function after a given timeout.
   * @param fn function to call.
   * @param delay timeout in milliseconds.
   * @return unique number that can be used to clear the timeout.
   */
  setTimeout(fn: () => void, delay: number): number;

  /**
   * Calls function after a given timeout.
   * @param token timeout token.
   * @return.
   */
  clearTimeout(token: number): void;
}

/**
 * Result of an asynchronous function that may be available immediately or
 * some time later. Similar to Deferred.
 * @template T
 */
export interface Result<T> {
  /**
   * Call the given function when asynchronous function is finished. Callback
   * is executed in the task's context.
   */
  then(callback: (p1: T) => void): void;

  /**
   * Call the given asynchronous function when some asynchronous function is
   * finished. Callback is executed in the task's context.
   * @template T1
   */
  thenAsync<T1>(callback: (p1: T) => Result<T1>): Result<T1>;

  /**
   * Produce a Result that resolves to the given value when this Result is
   * resolved.
   * @template T1
   */
  thenReturn<T1>(result: T1): Result<T1>;

  /**
   * Finish given frame with the result value when result becomes ready.
   */
  thenFinish(frame: Frame<T>): void;

  /**
   * Check if this Result is still pending.
   */
  isPending(): boolean;

  /**
   * If this Result is resolved, return the value that it holds.
   */
  get(): T|null;
}

export let privateCurrentTask: Task | null = null;

export let primaryScheduler: Scheduler | null = null;

/**
 * Returns current task.
 */
export const currentTask = (): Task | null => privateCurrentTask;

/**
 * Create and return a new frame with the given name.
 */
export function newFrame<T>(name: string): Frame<T> {
  if (!privateCurrentTask) {
    throw new Error('E_TASK_NO_CONTEXT');
  }
  if (!privateCurrentTask.name) {
    privateCurrentTask.name = name;
  }
  const task = privateCurrentTask;
  const frame = new Frame<T>(task, task.top, name);
  task.top = frame;
  frame.state = FrameState.ACTIVE;
  return frame;
};

export const newEventSource = (): EventSource => new EventSource();

export const newScheduler = (opt_timer?: Timer): Scheduler =>
    new Scheduler(opt_timer || new TimerImpl());

/**
 * @template T
 */
export function newResult<T> (opt_value: T): Result<T> {return new SyncResultImpl<T>(opt_value)};

/**
 * Creates a new frame and runs code in its context, catching synchronous and
 * asynchronous errors. If an error occurs, onErr is run (in the context of
 * the same frame). As usual, onErr is supposed either produce a result or raise
 * an exception.
 */
export function handle<T> (name: any, code: (p1: Frame<T>) => void,
     onErr: (p1: Frame<T>, p2: Error) => void): Result<T> {
      const frame = newFrame<T>(name);
      frame.handler = onErr;
      try {
        code(frame);
      } catch (err) {
        // synchronous exception
        frame.task.raise(err, frame);
      }
      return frame.result();
    };

export function start<T> (func: () => Result<T>, opt_name?: string): Task {
  const scheduler = privateCurrentTask ? privateCurrentTask.getScheduler() :
                                         primaryScheduler || newScheduler();
  return scheduler.run(func, opt_name);
};

/**
 * Frame state.
 * @enum {number}
 */
export enum FrameState {
  INIT,

  // before newFrame call
  ACTIVE,

  // before finish call
  FINISHED,

  // before callback complete
  DEAD
}

// when callback is complete
export class TimerImpl implements Timer {
  /**
   * @override
   */
  currentTime() {return (new Date()).valueOf();}

  /**
   * @override
   */
  setTimeout(fn: () => void, delay: number) {
    // HACK: casting to unknown type to prevent TypeScript error
    // [TS2352] Conversion of type 'Timer' to type 'number' may be a mistake because neither type sufficiently overlaps with the other.
    const timer: unknown = setTimeout(fn, delay);
    return timer as number;
  }

  /**
   * @override
   */
  clearTimeout(token: number) {
    clearTimeout(token);
  }
}

/**
 * A class to create tasks.
 */
export class Scheduler {
  timeout: number = 1;
  slice: number = 25;
  sliceOverTime: number = 0;
  queue: base.PriorityQueue;
  wakeupTime: number|null = null;
  timeoutToken: number|null = null;
  inTimeSlice: boolean = false;
  order: number = 0;

  constructor(public timer: Timer) {
    this.queue = new base.PriorityQueue();
    if (!primaryScheduler) {
      primaryScheduler = this;
    }
  }

  /**
   * Sets time slice length.
   * @param slice length in milliseconds.
   */
  setSlice(slice: number) {
    this.slice = slice;
  }

  /**
   * Sets timeout between time slices.
   * @param timeout in milliseconds.
   */
  setTimeout(timeout: number) {
    this.timeout = timeout;
  }

  /**
   * Checks if the current time slice is over.
   */
  isTimeSliceOver(): boolean {
    const now = this.timer.currentTime();
    return now >= this.sliceOverTime;
  }

  private arm(): void {
    if (this.inTimeSlice) {
      return;
    }
    const nextInQueue = (this.queue.peek() as Continuation<any>);
    const newTime = nextInQueue.scheduledTime;
    const now = this.timer.currentTime();
    if (this.timeoutToken != null) {
      if (now + this.timeout > this.wakeupTime) {
        return;
      }

      // no use re-arming
      this.timer.clearTimeout(this.timeoutToken);
    }
    let timeout = newTime - now;
    if (timeout <= this.timeout) {
      timeout = this.timeout;
    }
    this.wakeupTime = now + timeout;
    const self = this;
    this.timeoutToken = this.timer.setTimeout(() => {
      self.timeoutToken = null;
      self.doTimeSlice();
    }, timeout);
  }

  schedule(continuation: Continuation<any>, opt_delay?: number): void {
    const c = (continuation as Continuation<any>);
    const now = this.timer.currentTime();
    c.order = this.order++;
    c.scheduledTime = now + (opt_delay || 0);
    this.queue.add(c);
    this.arm();
  }

  private doTimeSlice(): void {
    if (this.timeoutToken != null) {
      this.timer.clearTimeout(this.timeoutToken);
      this.timeoutToken = null;
    }
    this.inTimeSlice = true;
    try {
      let now = this.timer.currentTime();
      this.sliceOverTime = now + this.slice;
      while (this.queue.length()) {
        const continuation = (this.queue.peek() as Continuation<any>);
        if (continuation.scheduledTime > now) {
          break;
        }

        // too early
        this.queue.remove();
        if (!continuation.canceled) {
          continuation.resumeInternal();
        }
        now = this.timer.currentTime();
        if (now >= this.sliceOverTime) {
          break;
        }
      }
    } catch (err) {
      logging.logger.error(err);
    }
    this.inTimeSlice = false;
    if (this.queue.length()) {
      this.arm();
    }
  }

  run(func: () => Result<any>, opt_name?: string): Task {
    const task = new Task(this, opt_name || '');
    task.top = new Frame<any>(task, null, 'bootstrap');
    task.top.state = FrameState.ACTIVE;
    task.top.then(() => {
      const done = () => {
        task.running = false;
        for (const callback of task.callbacks) {
          try {
            callback();
          } catch (err) {
            logging.logger.error(err);
          }
        }
      };
      try {
        func().then((result) => {
          task.result = result;
          done();
        });
      } catch (err) {
        task.raise(err);
        done();
      }
    });
    const savedTask = privateCurrentTask;
    privateCurrentTask = task;
    this.schedule(task.top.suspend('bootstrap'));
    privateCurrentTask = savedTask;
    return task;
  }
}

/**
 * Task suspension point.
 * @template T
 */
export class Continuation<T> implements base.Comparable {
  scheduledTime: number = 0;
  order: number = 0;
  result: any = null;
  canceled: boolean = false;

  constructor(public task: Task) {}

  /**
   * @override
   */
  compare(otherComp: base.Comparable): number {
    // earlier wins
    const other = (otherComp as Continuation<any>);
    return other.scheduledTime - this.scheduledTime || other.order - this.order;
  }

  /**
   * Continuation's task
   */
  getTask(): Task {
    return this.task;
  }

  /**
   * Schedule task continuation after the given (optional) delay.
   * @param opt_delay optional delay in milliseconds.
   */
  schedule(result: T, opt_delay?: number) {
    this.result = result;
    this.task.scheduler.schedule(this, opt_delay);
  }

  resumeInternal(): boolean {
    const task = this.task;
    this.task = null;
    if (task && task.continuation == this) {
      task.continuation = null;
      const savedTask = privateCurrentTask;
      privateCurrentTask = task;
      task.top.finish(this.result);
      privateCurrentTask = savedTask;
      return true;
    }
    return false;
  }

  /**
   * Cancel continuation
   */
  cancel() {
    this.canceled = true;
  }
}

/**
 * An asynchronous, time-sliced task.
 */
export class Task {
  callbacks: (() => void)[] = [];
  exception: Error | null = null;
  running: boolean = true;
  result: any = null;
  waitTarget: any = null;
  top: Frame<any> | null = null;
  continuation: Continuation<any> | null = null;

  constructor(public scheduler: Scheduler, public name: string) {}

  /**
   * @return task name.
   */
  getName(): string {
    return this.name;
  }

  /**
   * @param err exception to throw in the task's context.
   */
  interrupt(err: Error): void {
    this.raise(err || new Error('E_TASK_INTERRUPT'));
    if (this !== privateCurrentTask && this.continuation) {
      // blocked on something
      this.continuation.cancel();
      const continuation = new Continuation(this);
      this.waitTarget = 'interrupt';
      this.continuation = continuation;
      this.scheduler.schedule(continuation);
    }
  }

  /**
   * @return this task's scheduler.
   */
  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * @return true if task is still running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Register a callback to be called when the task is done. Callback is not
   * executed in any task context. Multiple callbacks can be registered and
   * they will be called in the registration order.
   */
  whenDone(callback: () => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Wait for task to finish (from another task).
   */
  join(): Result<any> {
    const frame = newFrame<any>('Task.join');
    if (!this.running) {
      frame.finish(this.result);
    } else {
      const continuation = frame.suspend(this);
      const self = this;
      this.whenDone(() => {
        continuation.schedule(self.result);
      });
    }
    return frame.result();
  }

  /**
   * Unwind the stack. We have two stacks: async (maintained by frame
   * parent link) and sync (regular JavaScript stack).
   */
  unwind() {
    // We have a sequence of frames on the stack.
    while (this.top && !this.top.handler) {
      this.top = this.top.parent;
    }
    if (this.top && this.top.handler && this.exception) {
      // found a handler
      const err = this.exception;
      this.exception = null;
      this.top.handler(this.top, err);
    } else {
      if (this.exception) {
        logging.logger.error(
            this.exception, 'Unhandled exception in task', this.name);
      }
    }
  }

  raise(err: Error, opt_frame?: Frame<any>): void {
    this.fillStack(err);
    if (opt_frame) {
      let f = this.top;
      while (f && f != opt_frame) {
        f = f.parent;
      }
      if (f == opt_frame) {
        this.top = f;
      }
    }
    this.exception = err;
    this.unwind();
  }

  /**
   * Fill the stack trace in the exception
   * @param err exception
   */
  fillStack(err: Error) {
    let out = err['frameTrace'];
    if (!out) {
      out = err['stack'] ? `${err['stack']}\n\t---- async ---\n` : '';
      for (let f = this.top; f; f = f.parent) {
        out += '\t';
        out += f.getName();
        out += '\n';
      }
      err['frameTrace'] = out;
    }
  }
}

/**
 * @template T
 */
export class SyncResultImpl<T> implements Result<T> {
  constructor(public value: T) {}

  /**
   * @override
   */
  then(callback: (T: any) => void) {
    callback(this.value);
  }

  /**
   * @override
   */
  thenAsync<T1>(callback: (p1: T) => Result<T1>) {
    return callback(this.value);
  }

  /**
   * @override
   */
  thenReturn<T1>(result: T1) {return new SyncResultImpl(result);}

  /**
   * @override
   */
  thenFinish(frame: Frame<T>) {
    frame.finish(this.value);
  }

  /**
   * @override
   */
  isPending() {return false;}

  /**
   * @override
   */
  get() {
    return this.value;
  }
}

/**
 * @template T
 */
export class ResultImpl<T> implements Result<T> {
  constructor(public readonly frame: Frame<T>) {}

  /**
   * @override
   */
  then(callback) {
    this.frame.then(callback);
  }

  /**
   * @override
   */
  thenAsync<T1>(callback: (p1: T) => Result<T1>): Result<T1>{
    if (this.isPending()) {
      // thenAsync is special, do the trick with the context
      const frame = new Frame<T | T1>(
          this.frame.task, this.frame.parent, 'AsyncResult.thenAsync');
      frame.state = FrameState.ACTIVE;
      this.frame.parent = frame as Frame<T>;
      this.frame.then((res1) => {
        callback(res1).then((res2) => {
          frame.finish(res2);
        });
      });
      return frame.result() as Result<T1>;
    } else {
      return callback(this.frame.res);
    }
  }

  /**
   * @override
   */
  thenReturn<T1>(result: T1) {
    if (this.isPending()) {
      return this.thenAsync(() => new SyncResultImpl(result));
    } else {
      return new SyncResultImpl(result);
    }
  }

  /**
   * @override
   */
  thenFinish(frame: Frame<T>) {
    if (this.isPending()) {
      this.then((res) => {
        frame.finish(res);
      });
    } else {
      frame.finish(this.frame.res);
    }
  }

  /**
   * @override
   */
  isPending() {
    return this.frame.state == FrameState.ACTIVE;
  }

  /**
   * @override
   */
  get() {
    if (this.isPending()) {
      throw new Error('Result is pending');
    }
    return this.frame.res;
  }
}

/**
 * Asynchronous execution frame. Corresponds to an asynchronous function
 * invocation.
 * @template T
 */
export class Frame<T> {
  res: any = null;
  state: FrameState;
  callback: ((p1: any) => void)|null = null;
  handler: ((p1: Frame<any>, p2: Error) => void)|null = null;

  constructor(public task: Task, public parent: Frame<T>, public name: string) {
    this.state = FrameState.INIT;
  }

  private checkEnvironment(): void {
    if (!privateCurrentTask) {
      throw new Error('F_TASK_NO_CONTEXT');
    }
    if (this !== privateCurrentTask.top) {
      throw new Error('F_TASK_NOT_TOP_FRAME');
    }
  }

  /**
   * @return to be returned as this asynchronous function
   *                              return value.
   */
  result(): Result<T> {
    return new ResultImpl<T>(this);
  }

  finish(res: T) {
    this.checkEnvironment();
    if (privateCurrentTask && !privateCurrentTask.exception) {
      this.res = res;
    }
    this.state = FrameState.FINISHED;
    const frame = this.parent;
    if (privateCurrentTask) {
      privateCurrentTask.top = frame;
    }
    if (this.callback) {
      try {
        this.callback(res);
      } catch (err) {
        this.task.raise(err, frame);
      }

      // callback was called
      this.state = FrameState.DEAD;
    }
  }

  getTask(): Task {
    return this.task;
  }

  /**
   * @return frame name.
   */
  getName(): string {
    return this.name;
  }

  getScheduler(): Scheduler {
    return this.task.scheduler;
  }

  then(callback: (p1: T) => void): void {
    // legal to call when currentTask is null
    switch (this.state) {
      case FrameState.ACTIVE:
        if (this.callback) {
          throw new Error('F_TASK_FRAME_ALREADY_HAS_CALLBACK');
        } else {
          this.callback = callback;
        }
        break;
      case FrameState.FINISHED:
        const task = this.task;
        const frame = this.parent;
        try {
          callback(this.res);
          this.state = FrameState.DEAD;
        } catch (err) {
          this.state = FrameState.DEAD;
          task.raise(err, frame);
        }
        break;
      case FrameState.DEAD:
        throw new Error('F_TASK_DEAD_FRAME');
      default:
        throw new Error(`F_TASK_UNEXPECTED_FRAME_STATE ${this.state}`);
    }
  }

  /**
   * If this task was executed longer than task's slice parameter.
   * @return holds true
   */
  timeSlice(): Result<boolean> {
    const frame = newFrame<boolean>('Frame.timeSlice');
    const scheduler = frame.getScheduler();
    if (scheduler.isTimeSliceOver()) {
      logging.logger.debug('-- time slice --');
      frame.suspend().schedule(true);
    } else {
      frame.finish(true);
    }
    return frame.result();
  }

  /**
   * Yield to other tasks for the specified time.
   * @param delay in milliseconds.
   * @return holds true
   */
  sleep(delay: number): Result<boolean> {
    const frame = newFrame<boolean>('Frame.sleep');
    frame.suspend().schedule(true, delay);
    return frame.result();
  }

  /**
   * Repeatedly execute the given function asynchronously until it returns
   * false.
   * @return holds true.
   */
  loop(func: () => Result<boolean>): Result<boolean> {
    const frame = newFrame<boolean>('Frame.loop');
    const step = (more) => {
      try {
        while (more) {
          const result = func();
          if (result.isPending()) {
            result.then(step);
            return;
          } else {
            result.then((m) => {
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
  }

  /**
   * Similar to loop(), but provides a Frame for loop body function.
   * @return holds true.
   */
  loopWithFrame(func: (p1: LoopBodyFrame) => void): Result<boolean> {
    const task = privateCurrentTask;
    if (!task) {
      throw new Error('E_TASK_NO_CONTEXT');
    }
    return this.loop(() => {
      let result;
      do {
        const frame = new LoopBodyFrame((task as Task), task.top);
        task.top = frame;
        frame.state = FrameState.ACTIVE;
        func(frame);
        result = frame.result();
      } while (!result.isPending() && result.get());
      return result;
    });
  }

  suspend(opt_waitTarget?: any): Continuation<T> {
    this.checkEnvironment();
    if (this.task.continuation) {
      throw new Error('E_TASK_ALREADY_SUSPENDED');
    }
    const continuation: Continuation<T> = new Continuation(this.task);
    this.task.continuation = continuation;
    privateCurrentTask = null;
    this.task.waitTarget = opt_waitTarget || null;
    return continuation;
  }
}

export class LoopBodyFrame extends Frame<boolean> {
  constructor(task: Task, parent: Frame<boolean>) {
    super(task, parent, 'loop');
  }

  continueLoop(): void {
    this.finish(true);
  }

  breakLoop(): void {
    this.finish(false);
  }
}

export class EventItem {
  next: EventItem = null;

  constructor(public event: base.Event) {}
}

/**
 * An class to listen to evens and present them as a readable asynchronous
 * stream to tasks.
 */
export class EventSource {
  continuation: Continuation<boolean> = null;
  listeners:
      {target: base.EventTarget, type: string, listener: base.EventListener}[] =
          [];
  head: EventItem;
  tail: EventItem;

  constructor() {
    this.head = new EventItem(null);
    this.tail = this.head;
  }

  /**
   * Attaches as an event listener to an EventTarget.
   */
  attach(target: base.EventTarget, type: string, opt_preventDefault?: boolean):
      void {
    const self = this;
    const listener = (event) => {
      if (opt_preventDefault) {
        event.preventDefault();
      }
      if (self.tail.event) {
        self.tail.next = new EventItem(event);
        self.tail = self.tail.next;
      } else {
        self.tail.event = event;
        const continuation = self.continuation;
        if (continuation) {
          self.continuation = null;
          continuation.schedule(true);
        }
      }
    };
    target.addEventListener(type, listener, false);
    this.listeners.push({target, type, listener});
  }

  detach(target: base.EventTarget, type: string): void {
    let i = 0;
    let item = null;
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
  }

  /**
   * Read next dispatched event, blocking the current task if needed.
   */
  nextEvent(): Result<base.Event> {
    const frame: Frame<base.Event> = newFrame('EventSource.nextEvent');
    const self = this;
    const readEvent = () => {
      if (self.head.event) {
        const event = self.head.event;
        if (self.head.next) {
          self.head = self.head.next;
        } else {
          self.head.event = null;
        }
        frame.finish(event);
      } else if (self.continuation) {
        throw new Error('E_TASK_EVENT_SOURCE_OTHER_TASK_WAITING');
      } else {
        const frameInternal: Frame<boolean> =
            newFrame('EventSource.nextEventInternal');
        self.continuation = frameInternal.suspend(self);
        frameInternal.result().then(readEvent);
      }
    };
    readEvent();
    return frame.result();
  }
}
