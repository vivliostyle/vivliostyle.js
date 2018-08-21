// Copyright 2008 The Closure Library Authors. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 * The compiler has an option to disable asserts. So code like:
 * <code>
 * var x = goog.asserts.assert(foo()); goog.asserts.assert(bar());
 * </code>
 * will be transformed into:
 * <code>
 * var x = foo();
 * </code>
 * The compiler will leave in foo() (because its return value is used),
 * but it will remove bar() because it assumes it does not have side-effects.
 *
 * @author agrieve@google.com (Andrew Grieve)
 */
import {Error} from '../debug/error';
import {NodeType} from '../dom/nodetype';
import * as string from '../string/string';

/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.define('goog.asserts.ENABLE_ASSERTS', goog.DEBUG);

/**
 * Error object for failed assertions.
 * @param messagePattern The pattern that was used to form message.
 * @param messageArgs The items to substitute into the pattern.
 * @final
 */
export class AssertionError extends Error {
  constructor(public messagePattern: string, messageArgs: any[]) {
    messageArgs.unshift(messagePattern);
    super(string.subs.apply(null, messageArgs));

    // Remove the messagePattern afterwards to avoid permenantly modifying the
    // passed in array.
    messageArgs.shift();
  }
}

/** @override */
AssertionError.prototype.name = 'AssertionError';

/**
 * The default error handler.
 * @param e The exception to be handled.
 */
export function DEFAULT_ERROR_HANDLER(e: AssertionError) {
  throw e;
}

/**
 * The handler responsible for throwing or logging assertion errors.
 */
export const errorHandler_: (p1: AssertionError) => any = DEFAULT_ERROR_HANDLER;

/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param defaultMessage The message to use if givenMessage is empty.
 * @param defaultArgs The substitution arguments for defaultMessage.
 * @param givenMessage Message supplied by the caller.
 * @param givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
export function doAssertFailure_(
    defaultMessage: string, defaultArgs: any[], givenMessage: string|undefined,
    givenArgs: any[]) {
  let message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    let args = givenArgs;
  } else {
    if (defaultMessage) {
      message += ': ' + defaultMessage;
      args = defaultArgs;
    }
  }

  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  let e = new AssertionError('' + message, args || []);
  errorHandler_(e);
}

/**
 * Sets a custom error handler that can be used to customize the behavior of
 * assertion failures, for example by turning all assertion failures into log
 * messages.
 */
export function setErrorHandler(errorHandler: (p1: AssertionError) => any) {
  if (goog.asserts.ENABLE_ASSERTS) {
    errorHandler_ = errorHandler;
  }
}

/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @template T
 * @param condition The condition to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value of the condition.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
export function assert(
    condition: T, opt_message?: string, ...var_args: any[]): T {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    doAssertFailure_(
        '', null, opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return condition;
}

/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
export function fail(opt_message?: string, ...var_args: any[]) {
  if (goog.asserts.ENABLE_ASSERTS) {
    errorHandler_(new AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1)));
  }
}

/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
export function assertNumber(
    value: any, opt_message?: string, ...var_args: any[]): number {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    doAssertFailure_(
        'Expected number but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as number);
}

/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
export function assertString(
    value: any, opt_message?: string, ...var_args: any[]): string {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    doAssertFailure_(
        'Expected string but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as string);
}

/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
export function assertFunction(
    value: any, opt_message?: string, ...var_args: any[]): Function {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    doAssertFailure_(
        'Expected function but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as Function);
}

/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
export function assertObject(
    value: any, opt_message?: string, ...var_args: any[]): Object {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    doAssertFailure_(
        'Expected object but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as Object);
}

/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
export function assertArray(
    value: any, opt_message?: string, ...var_args: any[]): any[] {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    doAssertFailure_(
        'Expected array but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as any[]);
}

/**
 * Checks if the value is a boolean if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, guaranteed to be a boolean when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
export function assertBoolean(
    value: any, opt_message?: string, ...var_args: any[]): boolean {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    doAssertFailure_(
        'Expected boolean but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as boolean);
}

/**
 * Checks if the value is a DOM Element if goog.asserts.ENABLE_ASSERTS is true.
 * @param value The value to check.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @return The value, likely to be a DOM Element when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not an Element.
 */
export function assertElement(
    value: any, opt_message?: string, ...var_args: any[]): Element {
  if (goog.asserts.ENABLE_ASSERTS &&
      (!goog.isObject(value) || value.nodeType != NodeType.ELEMENT)) {
    doAssertFailure_(
        'Expected Element but got %s: %s.', [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return (value as Element);
}

/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 *
 * The compiler may tighten the type returned by this function.
 *
 * @param value The value to check.
 * @param type A user-defined constructor.
 * @param opt_message Error message in case of failure.
 * @param var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 * @template T
 */
export function assertInstanceof(
    value: any, type: (...p1) => any, opt_message?: string,
    ...var_args: any[]): T {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    doAssertFailure_(
        'Expected instanceof %s but got %s.', [getType_(type), getType_(value)],
        opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return value;
}

/**
 * Checks that no enumerable keys are present in Object.prototype. Such keys
 * would break most code that use {@code for (var ... in ...)} loops.
 */
export function assertObjectPrototypeIsIntact() {
  for (let key in Object.prototype) {
    fail(key + ' should not be enumerable in Object.prototype.');
  }
}

/**
 * Returns the type of a value. If a constructor is passed, and a suitable
 * string cannot be found, 'unknown type name' will be returned.
 * @param value A constructor, object, or primitive.
 * @return The best display name for the value, or 'unknown type name'.
 */
export function getType_(value: any): string {
  if (value instanceof Function) {
    return value.displayName || value.name || 'unknown type name';
  } else {
    if (value instanceof Object) {
      return value.constructor.displayName || value.constructor.name ||
          Object.prototype.toString.call(value);
    } else {
      return value === null ? 'null' : typeof value;
    }
  }
}
