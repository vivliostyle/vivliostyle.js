// Copyright 2006 The Closure Library Authors. All Rights Reserved.
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
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 * @author arv@google.com (Erik Arvidsson)
 *
 * @provideGoog
 */

/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
const COMPILED: boolean = false;

/**
 * Base namespace for the Closure library.  Checks to see goog is already
 * defined in the current scope before assigning to prevent clobbering if
 * base.js is loaded more than once.
 *
 */
const goog = goog || {};

/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;

/**
 * A hook for overriding the define values in uncompiled mode.
 *
 * In uncompiled mode, {@code CLOSURE_UNCOMPILED_DEFINES} may be defined before
 * loading base.js.  If a key is defined in {@code CLOSURE_UNCOMPILED_DEFINES},
 * {@code goog.define} will use the value instead of the default value.  This
 * allows flags to be overwritten without compilation (this is normally
 * accomplished with the compiler's "define" flag).
 *
 * Example:
 * <pre>
 *   var CLOSURE_UNCOMPILED_DEFINES = {'goog.DEBUG': false};
 * </pre>
 *
 */
goog.global.CLOSURE_UNCOMPILED_DEFINES;

/**
 * A hook for overriding the define values in uncompiled or compiled mode,
 * like CLOSURE_UNCOMPILED_DEFINES but effective in compiled code.  In
 * uncompiled code CLOSURE_UNCOMPILED_DEFINES takes precedence.
 *
 * Also unlike CLOSURE_UNCOMPILED_DEFINES the values must be number, boolean or
 * string literals or the compiler will emit an error.
 *
 * While any @define value may be set, only those set with goog.define will be
 * effective for uncompiled code.
 *
 * Example:
 * <pre>
 *   var CLOSURE_DEFINES = {'goog.DEBUG': false} ;
 * </pre>
 *
 */
goog.global.CLOSURE_DEFINES;

/**
 * Returns true if the specified value is not undefined.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.
 *
 * @param val Variable to test.
 * @return Whether variable is defined.
 */
goog.isDef = function(val: any): boolean {
  // void 0 always evaluates to undefined and hence we do not need to depend on
  // the definition of the global variable named 'undefined'.
  return val !== void 0;
};

/**
 * Builds an object structure for the provided namespace path, ensuring that
 * names that already exist are not overwritten. For example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param name name of the object that this file defines.
 * @param opt_object the object to expose at the end of the path.
 * @param opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportPath_ = function(
    name: string, opt_object?: any, opt_objectToExportTo?: Object) {
  let parts = name.split('.');
  let cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (let part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else {
      if (cur[part]) {
        cur = cur[part];
      } else {
        cur = cur[part] = {};
      }
    }
  }
};

/**
 * Defines a named value. In uncompiled mode, the value is retrieved from
 * CLOSURE_DEFINES or CLOSURE_UNCOMPILED_DEFINES if the object is defined and
 * has the property specified, and otherwise used the defined defaultValue.
 * When compiled the default can be overridden using the compiler
 * options or the value set in the CLOSURE_DEFINES object.
 *
 * @param name The distinguished name to provide.
 */
goog.define = function(name: string, defaultValue: string|number|boolean) {
  let value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_UNCOMPILED_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_UNCOMPILED_DEFINES, name)) {
      value = goog.global.CLOSURE_UNCOMPILED_DEFINES[name];
    } else {
      if (goog.global.CLOSURE_DEFINES &&
          Object.prototype.hasOwnProperty.call(
              goog.global.CLOSURE_DEFINES, name)) {
        value = goog.global.CLOSURE_DEFINES[name];
      }
    }
  }
  goog.exportPath_(name, value);
};

/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.define('goog.DEBUG', true);

/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.define('goog.LOCALE', 'en');

// default to en

/**
 * @define {boolean} Whether this code is running on trusted sites.
 *
 * On untrusted sites, several native functions can be defined or overridden by
 * external libraries like Prototype, Datejs, and JQuery and setting this flag
 * to false forces closure to use its own implementations when possible.
 *
 * If your JavaScript can be loaded by a third party site and you are wary about
 * relying on non-standard implementations, specify
 * "--define goog.TRUSTED_SITE=false" to the JSCompiler.
 */
goog.define('goog.TRUSTED_SITE', true);

/**
 * @define {boolean} Whether a project is expected to be running in strict mode.
 *
 * This define can be used to trigger alternate implementations compatible with
 * running in EcmaScript Strict mode or warn about unavailable functionality.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
 *
 */
goog.define('goog.STRICT_MODE_COMPATIBLE', false);

/**
 * @define {boolean} Whether code that calls {@link goog.setTestOnly} should
 *     be disallowed in the compilation unit.
 */
goog.define('goog.DISALLOW_TEST_ONLY_CODE', COMPILED && !goog.DEBUG);

/**
 * @define {boolean} Whether to use a Chrome app CSP-compliant method for
 *     loading scripts via goog.require. @see appendScriptSrcNode_.
 */
goog.define('goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING', false);

/**
 * Defines a namespace in Closure.
 *
 * A namespace may only be defined once in a codebase. It may be defined using
 * goog.provide() or goog.module().
 *
 * The presence of one or more goog.provide() calls in a file indicates
 * that the file defines the given objects/namespaces.
 * Provided symbols must not be null or undefined.
 *
 * In addition, goog.provide() creates the object stubs for a namespace
 * (for example, goog.provide("goog.foo.bar") will create the object
 * goog.foo.bar if it does not already exist).
 *
 * Build tools also scan for provide/require/module statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 *
 * @see goog.require
 * @see goog.module
 * @param name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name: string) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
  }
  goog.constructNamespace_(name);
};

/**
 * @param name Namespace provided by this file in the form
 *     "goog.package.part".
 * @param opt_obj The object to embed in the namespace.
 */
goog.constructNamespace_ = function(name: string, opt_obj?: Object) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];
    let namespace = name;
    while (namespace = namespace.substring(0, namespace.lastIndexOf('.'))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }
  goog.exportPath_(name, opt_obj);
};

/**
 * Module identifier validation regexp.
 * Note: This is a conservative check, it is very possible to be more lenient,
 *   the primary exclusion here is "/" and "\" and a leading ".", these
 *   restrictions are intended to leave the door open for using goog.require
 *   with relative file paths rather than module identifiers.
 */
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;

/**
 * Defines a module in Closure.
 *
 * Marks that this file must be loaded as a module and claims the namespace.
 *
 * A namespace may only be defined once in a codebase. It may be defined using
 * goog.provide() or goog.module().
 *
 * goog.module() has three requirements:
 * - goog.module may not be used in the same file as goog.provide.
 * - goog.module must be the first statement in the file.
 * - only one goog.module is allowed per file.
 *
 * When a goog.module annotated file is loaded, it is enclosed in
 * a strict function closure. This means that:
 * - any variables declared in a goog.module file are private to the file
 * (not global), though the compiler is expected to inline the module.
 * - The code must obey all the rules of "strict" JavaScript.
 * - the file will be marked as "use strict"
 *
 * NOTE: unlike goog.provide, goog.module does not declare any symbols by
 * itself. If declared symbols are desired, use
 * goog.module.declareLegacyNamespace().
 *
 *
 * See the public goog.module proposal: http://goo.gl/Va1hin
 *
 * @param name Namespace provided by this file in the form
 *     "goog.package.part", is expected but not required.
 */
goog.module = function(name: string) {
  if (!goog.isString(name) || !name ||
      name.search(goog.VALID_MODULE_RE_) == -1) {
    throw Error('Invalid module identifier');
  }
  if (!goog.isInModuleLoader_()) {
    throw Error('Module ' + name + ' has been loaded incorrectly.');
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module may only be called once per module.');
  }

  // Store the module name for the loader.
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};

/**
 * @param name The module identifier.
 * @return The module exports for an already loaded module or null.
 *
 * Note: This is not an alternative to goog.require, it does not
 * indicate a hard dependency, instead it is used to indicate
 * an optional dependency or to access the exports of a module
 * that has already been loaded.
 * @suppress {missingProvide}
 */
goog.module.get = function(name: string): any {
  return goog.module.getInternal_(name);
};

/**
 * @param name The module identifier.
 * @return The module exports for an already loaded module or null.
 */
goog.module.getInternal_ = function(name: string): any {
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      // goog.require only return a value with-in goog.module files.
      return name in goog.loadedModules_ ? goog.loadedModules_[name] :
                                           goog.getObjectByName(name);
    } else {
      return null;
    }
  }
};

/**
{?{
 *   moduleName: (string|undefined),
 *   declareTestMethods: boolean
 * }}
 */
goog.moduleLoaderState_ = null;

/**
 * @return Whether a goog.module is currently being initialized.
 */
goog.isInModuleLoader_ = function(): boolean {
  return goog.moduleLoaderState_ != null;
};

/**
 * Indicate that a module's exports that are known test methods should
 * be copied to the global object.  This makes the test methods visible to
 * test runners that inspect the global object.
 *
 * TODO(johnlenz): Make the test framework aware of goog.module so
 * that this isn't necessary. Alternately combine this with goog.setTestOnly
 * to minimize boiler plate.
 * @suppress {missingProvide}
 * @deprecated This approach does not translate to ES6 module syntax, instead
 *    use goog.testing.testSuite to declare the test methods.
 */
goog.module.declareTestMethods = function() {
  if (!goog.isInModuleLoader_()) {
    throw new Error(
        'goog.module.declareTestMethods must be called from ' +
        'within a goog.module');
  }
  goog.moduleLoaderState_.declareTestMethods = true;
};

/**
 * Provide the module's exports as a globally accessible object under the
 * module's declared name.  This is intended to ease migration to goog.module
 * for files that have existing usages.
 * @suppress {missingProvide}
 */
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw new Error(
        'goog.module.declareLegacyNamespace must be called from ' +
        'within a goog.module');
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error(
        'goog.module must be called prior to ' +
        'goog.module.declareLegacyNamespace.');
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
};

/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 *
 * In the case of unit tests, the message may optionally be an exact namespace
 * for the test (e.g. 'goog.stringTest'). The linter will then ignore the extra
 * provide (if not explicitly defined in the code).
 *
 * @param opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message?: string) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    opt_message = opt_message || '';
    throw Error(
        'Importing test-only code into non-debug environment' +
        (opt_message ? ': ' + opt_message : '.'));
  }
};

/**
 * Forward declares a symbol. This is an indication to the compiler that the
 * symbol may be used in the source yet is not required and may not be provided
 * in compilation.
 *
 * The most common usage of forward declaration is code that takes a type as a
 * function parameter but does not need to require it. By forward declaring
 * instead of requiring, no hard dependency is made, and (if not required
 * elsewhere) the namespace may never be required and thus, not be pulled
 * into the JavaScript binary. If it is required elsewhere, it will be type
 * checked as normal.
 *
 *
 * @param name The namespace to forward declare in the form of
 *     "goog.package.part".
 */
goog.forwardDeclare = function(name: string) {};
if (!COMPILED) {
  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param name name of the object to look for.
   * @return Whether the name has been provided.
   */
  goog.isProvided_ = function(name: string): boolean {
    return name in goog.loadedModules_ ||
        !goog.implicitNamespaces_[name] &&
        goog.isDefAndNotNull(goog.getObjectByName(name));
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares that 'goog' and
   * 'goog.events' must be namespaces.
   *
   */
  goog.implicitNamespaces_ = {'goog.module': true};
}

// NOTE: We add goog.module as an implicit namespace as goog.module is defined
// here and because the existing module package has not been moved yet out of
// the goog.module namespace. This satisifies both the debug loader and
// ahead-of-time dependency management.

/**
 * Returns an object based on its fully qualified external name.  The object
 * is not found if null or undefined.  If you are using a compilation pass that
 * renames property names beware that using this function will not find renamed
 * properties.
 *
 * @param name The fully qualified name.
 * @param opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name: string, opt_obj?: Object): any {
  let parts = name.split('.');
  let cur = opt_obj || goog.global;
  for (let part; part = parts.shift();) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};

/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param obj The namespace to globalize.
 * @param opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj: Object, opt_global?: Object) {
  let global = opt_global || goog.global;
  for (let x in obj) {
    global[x] = obj[x];
  }
};

/**
 * Adds a dependency from a file to the files it requires.
 * @param relPath The path to the js file.
 * @param provides An array of strings with
 *     the names of the objects this file provides.
 * @param requires An array of strings with
 *     the names of the objects this file requires.
 * @param opt_isModule Whether this dependency must be loaded as
 *     a module as declared by goog.module.
 */
goog.addDependency = function(
    relPath: string, provides: string[], requires: string[],
    opt_isModule?: boolean) {
  if (goog.DEPENDENCIES_ENABLED) {
    let provide, require;
    let path = relPath.replace(/\\/g, '/');
    let deps = goog.dependencies_;
    for (let i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      deps.pathIsModule[path] = !!opt_isModule;
    }
    for (let j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};

// NOTE(nnaze): The debug DOM loader was included in base.js as an original way
// to do "debug-mode" development.  The dependency system can sometimes be
// confusing, as can the debug DOM loader's asynchronous nature.
// With the DOM loader, a call to goog.require() is not blocking -- the script
// will not load until some point after the current script.  If a namespace is
// needed at runtime, it needs to be defined in a previous script, or loaded via
// require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// https://developers.google.com/closure/library/docs/depswriter
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.

/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.define('goog.ENABLE_DEBUG_LOADER', true);
goog.logToConsole_ = function(msg: string) {
  if (goog.global.console) {
    goog.global.console['error'](msg);
  }
};

/**
 * Implements a system for the dynamic resolution of dependencies that works in
 * parallel with the BUILD system. Note that all calls to goog.require will be
 * stripped by the JSCompiler when the --closure_pass option is used.
 * @see goog.provide
 * @param name Namespace to include (as was given in goog.provide()) in
 *     the form "goog.package.part".
 * @return If called within a goog.module file, the associated namespace or
 *     module otherwise null.
 */
goog.require = function(name: string): any {
  // If the object already exists we do not need do do anything.
  if (!COMPILED) {
    if (goog.ENABLE_DEBUG_LOADER && goog.IS_OLD_IE_) {
      goog.maybeProcessDeferredDep_(name);
    }
    if (goog.isProvided_(name)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(name);
      } else {
        return null;
      }
    }
    if (goog.ENABLE_DEBUG_LOADER) {
      let path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return null;
      }
    }
    let errorMessage = 'goog.require could not find: ' + name;
    goog.logToConsole_(errorMessage);
    throw Error(errorMessage);
  }
};

/**
 * Path for included scripts.
 */
goog.basePath = '';

/**
 * A hook for overriding the base path.
 */
goog.global.CLOSURE_BASE_PATH;

/**
 * Whether to write out Closure's deps file. By default, the deps are written.
 */
goog.global.CLOSURE_NO_DEPS;

/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;

/**
 * Null function used for default values of callbacks, etc.
 * @return Nothing.
 */
goog.nullFunction = function(): void {};

/**
 * When defining a class Foo with an abstract method bar(), you can do:
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error will be thrown
 * when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as an argument
 * because that would make it more difficult to obfuscate our JavaScript code.
 *
 * @throws {Error} when invoked to indicate the method should be overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};

/**
 * Adds a {@code getInstance} static method that always returns the same
 * instance object.
 * @param ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor: Function) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor();
  };
};

/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 */
goog.instantiatedSingletons_ = [];

/**
 * @define {boolean} Whether to load goog.modules using {@code eval} when using
 * the debug loader.  This provides a better debugging experience as the
 * source is unmodified and can be edited using Chrome Workspaces or similar.
 * However in some environments the use of {@code eval} is banned
 * so we provide an alternative.
 */
goog.define('goog.LOAD_MODULE_USING_EVAL', true);

/**
 * @define {boolean} Whether the exports of goog.modules should be sealed when
 * possible.
 */
goog.define('goog.SEAL_MODULE_EXPORTS', goog.DEBUG);

/**
 * The registry of initialized modules:
 * the module identifier to module exports map.
 */
goog.loadedModules_ = {};

/**
 * True if goog.dependencies_ is available.
 */
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
if (goog.DEPENDENCIES_ENABLED) {
  /**
   * Object used to keep track of urls that have already been added. This record
   * allows the prevention of circular dependencies.
   */
  goog.included_ = {};

  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts.
   */
  goog.dependencies_ = {
    pathIsModule: {},
    // 1 to 1
    nameToPath: {},
    // 1 to 1
    requires: {},
    // 1 to many
    // Used when resolving dependencies to prevent us from visiting file twice.
    visited: {},
    written: {},
    // Used to keep track of script files we have written.
    deferred: {}
  };

  // Used to track deferred module evaluations in old IEs

  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return True if it looks like HTML document.
   */
  goog.inHtmlDocument_ = function(): boolean {
    let doc = goog.global.document;
    return typeof doc != 'undefined' && 'write' in doc;
  };

  // XULDocument misses write.

  /**
   * Tries to detect the base path of base.js script that bootstraps Closure.
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else {
      if (!goog.inHtmlDocument_()) {
        return;
      }
    }
    let doc = goog.global.document;
    let scripts = doc.getElementsByTagName('SCRIPT');

    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (let i = scripts.length - 1; i >= 0; --i) {
      let script = (scripts[i] as HTMLScriptElement);
      let src = script.src;
      let qmark = src.lastIndexOf('?');
      let l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };

  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param src Script source.
   * @param opt_sourceText The optionally source text to evaluate
   */
  goog.importScript_ = function(src: string, opt_sourceText?: string) {
    let importScript =
        goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if (importScript(src, opt_sourceText)) {
      goog.dependencies_.written[src] = true;
    }
  };
  goog.IS_OLD_IE_ =
      !goog.global.atob && goog.global.document && goog.global.document.all;

  /**
   * Given a URL initiate retrieval and execution of the module.
   * @param src Script source URL.
   */
  goog.importModule_ = function(src: string) {
    // In an attempt to keep browsers from timing out loading scripts using
    // synchronous XHRs, put each load in its own script block.
    let bootstrap = 'goog.retrieveAndExecModule_("' + src + '");';
    if (goog.importScript_('', bootstrap)) {
      goog.dependencies_.written[src] = true;
    }
  };
  goog.queuedModules_ = [];

  /**
   * Return an appropriate module text. Suitable to insert into
   * a script tag (that is unescaped).
   */
  goog.wrapModule_ = function(srcUrl: string, scriptText: string): string {
    if (!goog.LOAD_MODULE_USING_EVAL || !goog.isDef(goog.global.JSON)) {
      return '' +
          'goog.loadModule(function(exports) {' +
          '"use strict";' + scriptText + '\n' +
          // terminate any trailing single line comment.
          ';return exports' +
          '});' +
          '\n//# sourceURL=' + srcUrl + '\n';
    } else {
      return '' +
          'goog.loadModule(' +
          goog.global.JSON.stringify(
              scriptText + '\n//# sourceURL=' + srcUrl + '\n') +
          ');';
    }
  };

  // On IE9 and earlier, it is necessary to handle
  // deferred module loads. In later browsers, the
  // code to be evaluated is simply inserted as a script
  // block in the correct order. To eval deferred
  // code at the right time, we piggy back on goog.require to call
  // goog.maybeProcessDeferredDep_.
  // The goog.requires are used both to bootstrap
  // the loading process (when no deps are available) and
  // declare that they should be available.
  // Here we eval the sources, if all the deps are available
  // either already eval'd or goog.require'd.  This will
  // be the case when all the dependencies have already
  // been loaded, and the dependent module is loaded.
  // But this alone isn't sufficient because it is also
  // necessary to handle the case where there is no root
  // that is not deferred.  For that there we register for an event
  // and trigger goog.loadQueuedModules_ handle any remaining deferred
  // evaluations.

  /**
   * Handle any remaining deferred goog.module evals.
   */
  goog.loadQueuedModules_ = function() {
    let count = goog.queuedModules_.length;
    if (count > 0) {
      let queue = goog.queuedModules_;
      goog.queuedModules_ = [];
      for (let i = 0; i < count; i++) {
        let path = queue[i];
        goog.maybeProcessDeferredPath_(path);
      }
    }
  };

  /**
   * Eval the named module if its dependencies are
   * available.
   * @param name The module to load.
   */
  goog.maybeProcessDeferredDep_ = function(name: string) {
    if (goog.isDeferredModule_(name) && goog.allDepsAreAvailable_(name)) {
      let path = goog.getPathFromDeps_(name);
      goog.maybeProcessDeferredPath_(goog.basePath + path);
    }
  };

  /**
   * @param name The module to check.
   * @return Whether the name represents a
   *     module whose evaluation has been deferred.
   */
  goog.isDeferredModule_ = function(name: string): boolean {
    let path = goog.getPathFromDeps_(name);
    if (path && goog.dependencies_.pathIsModule[path]) {
      let abspath = goog.basePath + path;
      return abspath in goog.dependencies_.deferred;
    }
    return false;
  };

  /**
   * @param name The module to check.
   * @return Whether the name represents a
   *     module whose declared dependencies have all been loaded
   *     (eval'd or a deferred module load)
   */
  goog.allDepsAreAvailable_ = function(name: string): boolean {
    let path = goog.getPathFromDeps_(name);
    if (path && path in goog.dependencies_.requires) {
      for (let requireName in goog.dependencies_.requires[path]) {
        if (!goog.isProvided_(requireName) &&
            !goog.isDeferredModule_(requireName)) {
          return false;
        }
      }
    }
    return true;
  };
  goog.maybeProcessDeferredPath_ = function(abspath: string) {
    if (abspath in goog.dependencies_.deferred) {
      let src = goog.dependencies_.deferred[abspath];
      delete goog.dependencies_.deferred[abspath];
      goog.globalEval(src);
    }
  };

  /**
   * @param moduleDef The module definition.
   */
  goog.loadModule = function(moduleDef: ((p1: any) => any)|string) {
    // NOTE: we allow function definitions to be either in the from
    // of a string to eval (which keeps the original source intact) or
    // in a eval forbidden environment (CSP) we allow a function definition
    // which in its body must call {@code goog.module}, and return the exports
    // of the module.
    let previousState = goog.moduleLoaderState_;
    try {
      goog.moduleLoaderState_ = {
        moduleName: undefined,
        declareTestMethods: false
      };
      let exports;
      if (goog.isFunction(moduleDef)) {
        exports = moduleDef.call(goog.global, {});
      } else {
        if (goog.isString(moduleDef)) {
          exports = goog.loadModuleFromSource_.call(goog.global, moduleDef);
        } else {
          throw Error('Invalid module definition');
        }
      }
      let moduleName = goog.moduleLoaderState_.moduleName;
      if (!goog.isString(moduleName) || !moduleName) {
        throw Error('Invalid module name "' + moduleName + '"');
      }

      // Don't seal legacy namespaces as they may be uses as a parent of
      // another namespace
      if (goog.moduleLoaderState_.declareLegacyNamespace) {
        goog.constructNamespace_(moduleName, exports);
      } else {
        if (goog.SEAL_MODULE_EXPORTS && Object.seal) {
          Object.seal(exports);
        }
      }
      goog.loadedModules_[moduleName] = exports;
      if (goog.moduleLoaderState_.declareTestMethods) {
        for (let entry in exports) {
          if (entry.indexOf('test', 0) === 0 || entry == 'tearDown' ||
              entry == 'setUp' || entry == 'setUpPage' ||
              entry == 'tearDownPage') {
            goog.global[entry] = exports[entry];
          }
        }
      }
    } finally {
      goog.moduleLoaderState_ = previousState;
    }
  };
  goog.loadModuleFromSource_ = function(source: string): Object {
    // NOTE: we avoid declaring parameters or local variables here to avoid
    // masking globals or leaking values into the module definition.
    let exports = {};
    eval(arguments[0]);
    return exports;
  };

  /**
   * Writes a new script pointing to {@code src} directly into the DOM.
   *
   * NOTE: This method is not CSP-compliant. @see goog.appendScriptSrcNode_ for
   * the fallback mechanism.
   *
   * @param src The script URL.
   */
  goog.writeScriptSrcNode_ = function(src: string) {
    goog.global.document.write(
        '<script type="text/javascript" src="' + src + '"></' +
        'script>');
  };

  /**
   * Appends a new script node to the DOM using a CSP-compliant mechanism. This
   * method exists as a fallback for document.write (which is not allowed in a
   * strict CSP context, e.g., Chrome apps).
   *
   * NOTE: This method is not analogous to using document.write to insert a
   * <script> tag; specifically, the user agent will execute a script added by
   * document.write immediately after the current script block finishes
   * executing, whereas the DOM-appended script node will not be executed until
   * the entire document is parsed and executed. That is to say, this script is
   * added to the end of the script execution queue.
   *
   * The page must not attempt to call goog.required entities until after the
   * document has loaded, e.g., in or after the window.onload callback.
   *
   * @param src The script URL.
   */
  goog.appendScriptSrcNode_ = function(src: string) {
    let doc = goog.global.document;
    let scriptEl = doc.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.src = src;
    scriptEl.defer = false;
    scriptEl.async = false;
    doc.head.appendChild(scriptEl);
  };

  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param src The script url.
   * @param opt_sourceText The optionally source text to evaluate
   * @return True if the script was imported, false otherwise.
   */
  goog.writeScriptTag_ = function(
      src: string, opt_sourceText?: string): boolean {
    if (goog.inHtmlDocument_()) {
      let doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page. This does not apply to the CSP-compliant method
      // of writing script tags.
      if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING &&
          doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        let isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      let isOldIE = goog.IS_OLD_IE_;
      if (opt_sourceText === undefined) {
        if (!isOldIE) {
          if (goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
            goog.appendScriptSrcNode_(src);
          } else {
            goog.writeScriptSrcNode_(src);
          }
        } else {
          let state = ' onreadystatechange=\'goog.onScriptLoad_(this, ' +
              ++goog.lastNonModuleScriptIndex_ + ')\' ';
          doc.write(
              '<script type="text/javascript" src="' + src + '"' + state +
              '></' +
              'script>');
        }
      } else {
        doc.write(
            '<script type="text/javascript">' + opt_sourceText + '</' +
            'script>');
      }
      return true;
    } else {
      return false;
    }
  };
  goog.lastNonModuleScriptIndex_ = 0;

  /**
   * A readystatechange handler for legacy IE
   */
  goog.onScriptLoad_ = function(
      script: HTMLScriptElement, scriptIndex: number): boolean {
    // for now load the modules when we reach the last script,
    // later allow more inter-mingling.
    if (script.readyState == 'complete' &&
        goog.lastNonModuleScriptIndex_ == scriptIndex) {
      goog.loadQueuedModules_();
    }
    return true;
  };

  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   */
  goog.writeScripts_ = function() {
    /*The scripts we need to write this time. */
    let scripts: string[] = [];
    let seenScript = {};
    let deps = goog.dependencies_;

    function visitNode(path: string) {
      if (path in deps.written) {
        return;
      }

      // We have already visited this one. We can get here if we have cyclic
      // dependencies.
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }
      deps.visited[path] = true;
      if (path in deps.requires) {
        for (let requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }
      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }
    for (let path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    // record that we are going to load all these scripts.
    for (let i = 0; i < scripts.length; i++) {
      let path = scripts[i];
      goog.dependencies_.written[path] = true;
    }

    // If a module is loaded synchronously then we need to
    // clear the current inModuleLoader value, and restore it when we are
    // done loading the current "requires".
    let moduleState = goog.moduleLoaderState_;
    goog.moduleLoaderState_ = null;
    let loadingModule = false;
    for (let i = 0; i < scripts.length; i++) {
      let path = scripts[i];
      if (path) {
        if (!deps.pathIsModule[path]) {
          goog.importScript_(goog.basePath + path);
        } else {
          loadingModule = true;
          goog.importModule_(goog.basePath + path);
        }
      } else {
        goog.moduleLoaderState_ = moduleState;
        throw Error('Undefined script input');
      }
    }

    // restore the current "module loading state"
    goog.moduleLoaderState_ = moduleState;
  };

  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param rule In the form goog.namespace.Class or project.script.
   * @return Url corresponding to the rule, or null.
   */
  goog.getPathFromDeps_ = function(rule: string): string|null {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };
  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}

/**
 * Normalize a file path by removing redundant ".." and extraneous "." file
 * path components.
 */
goog.normalizePath_ = function(path: string): string {
  let components = path.split('/');
  let i = 0;
  while (i < components.length) {
    if (components[i] == '.') {
      components.splice(i, 1);
    } else {
      if (i && components[i] == '..' && components[i - 1] &&
          components[i - 1] != '..') {
        components.splice(--i, 2);
      } else {
        i++;
      }
    }
  }
  return components.join('/');
};

/**
 * Loads file by synchronous XHR. Should not be used in production environments.
 * @param src Source URL.
 * @return File contents.
 */
goog.loadFileSync_ = function(src: string): string {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(src);
  } else {
    let xhr = new goog.global['XMLHttpRequest']();
    xhr.open('get', src, false);
    xhr.send();
    return xhr.responseText;
  }
};

/**
 * Retrieve and execute a module.
 * @param src Script source URL.
 */
goog.retrieveAndExecModule_ = function(src: string) {
  if (!COMPILED) {
    // The full but non-canonicalized URL for later use.
    let originalPath = src;

    // Canonicalize the path, removing any /./ or /../ since Chrome's debugging
    // console doesn't auto-canonicalize XHR loads as it does <script> srcs.
    src = goog.normalizePath_(src);
    let importScript =
        goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    let scriptText = goog.loadFileSync_(src);
    if (scriptText != null) {
      let execModuleScript = goog.wrapModule_(src, scriptText);
      let isOldIE = goog.IS_OLD_IE_;
      if (isOldIE) {
        goog.dependencies_.deferred[originalPath] = execModuleScript;
        goog.queuedModules_.push(originalPath);
      } else {
        importScript(src, execModuleScript);
      }
    } else {
      throw new Error('load of ' + src + 'failed');
    }
  }
};

//==============================================================================
// Language Enhancements
//==============================================================================

/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param value The value to get the type of.
 * @return The name of the type.
 */
goog.typeOf = function(value: any): string {
  let s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else {
        if (value instanceof Object) {
          return s;
        }
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      let className = Object.prototype.toString.call((value as Object));

      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if (className == '[object Array]' ||
          // In IE all non value types are wrapped as objects across window
          // boundaries (not iframe though) so we have to do object detection
          // for this edge case.
          typeof value.length == 'number' &&
              typeof value.splice != 'undefined' &&
              typeof value.propertyIsEnumerable != 'undefined' &&
              !value.propertyIsEnumerable('splice')) {
        return 'array';
      }

      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if (className == '[object Function]' ||
          typeof value.call != 'undefined' &&
              typeof value.propertyIsEnumerable != 'undefined' &&
              !value.propertyIsEnumerable('call')) {
        return 'function';
      }
    } else {
      return 'null';
    }
  } else {
    if (s == 'function' && typeof value.call == 'undefined') {
      // In Safari typeof nodeList returns 'function', and on Firefox typeof
      // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps.
      // We would like to return object for those and we can detect an invalid
      // function by making sure that the function object has a call method.
      return 'object';
    }
  }
  return s;
};

/**
 * Returns true if the specified value is null.
 * @param val Variable to test.
 * @return Whether variable is null.
 */
goog.isNull = function(val: any): boolean {
  return val === null;
};

/**
 * Returns true if the specified value is defined and not null.
 * @param val Variable to test.
 * @return Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val: any): boolean {
  // Note that undefined == null.
  return val != null;
};

/**
 * Returns true if the specified value is an array.
 * @param val Variable to test.
 * @return Whether variable is an array.
 */
goog.isArray = function(val: any): boolean {
  return goog.typeOf(val) == 'array';
};

/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property. As a special case, a function value is not array like, because its
 * length property is fixed to correspond to the number of expected arguments.
 * @param val Variable to test.
 * @return Whether variable is an array.
 */
goog.isArrayLike = function(val: any): boolean {
  let type = goog.typeOf(val);

  // We do not use goog.isObject here in order to exclude function values.
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};

/**
 * Returns true if the object looks like a Date. To qualify as Date-like the
 * value needs to be an object and have a getFullYear() function.
 * @param val Variable to test.
 * @return Whether variable is a like a Date.
 */
goog.isDateLike = function(val: any): boolean {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};

/**
 * Returns true if the specified value is a string.
 * @param val Variable to test.
 * @return Whether variable is a string.
 */
goog.isString = function(val: any): boolean {
  return typeof val == 'string';
};

/**
 * Returns true if the specified value is a boolean.
 * @param val Variable to test.
 * @return Whether variable is boolean.
 */
goog.isBoolean = function(val: any): boolean {
  return typeof val == 'boolean';
};

/**
 * Returns true if the specified value is a number.
 * @param val Variable to test.
 * @return Whether variable is a number.
 */
goog.isNumber = function(val: any): boolean {
  return typeof val == 'number';
};

/**
 * Returns true if the specified value is a function.
 * @param val Variable to test.
 * @return Whether variable is a function.
 */
goog.isFunction = function(val: any): boolean {
  return goog.typeOf(val) == 'function';
};

/**
 * Returns true if the specified value is an object.  This includes arrays and
 * functions.
 * @param val Variable to test.
 * @return Whether variable is an object.
 */
goog.isObject = function(val: any): boolean {
  let type = typeof val;
  return type == 'object' && val != null || type == 'function';
};

// return Object(val) === val also works, but is slower, especially if val is
// not an object.

/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. The unique ID is
 * guaranteed to be unique across the current session amongst objects that are
 * passed into {@code getUid}. There is no guarantee that the ID is unique or
 * consistent across sessions. It is unsafe to generate unique ID for function
 * prototypes.
 *
 * @param obj The object to get the unique ID for.
 * @return The unique ID for the object.
 */
goog.getUid = function(obj: Object): number {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};

/**
 * Whether the given object is already assigned a unique ID.
 *
 * This does not modify the object.
 *
 * @param obj The object to check.
 * @return Whether there is an assigned unique id for the object.
 */
goog.hasUid = function(obj: Object): boolean {
  return !!obj[goog.UID_PROPERTY_];
};

/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj: Object) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In IE, DOM nodes are not instances of Object and throw an exception if we
  // try to delete.  Instead we try to use removeAttribute.
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }

  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};

/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure JavaScript on the same page.
 */
goog.UID_PROPERTY_ = 'closure_uid_' + (Math.random() * 1e9 >>> 0);

/**
 * Counter for UID.
 */
goog.uidCounter_ = 0;

/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param obj The object to get the hash code for.
 * @return The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;

/**
 * Removes the hash code field from an object.
 * @param obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;

/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param obj The value to clone.
 * @return A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj: any): any {
  let type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    let clone = type == 'array' ? [] : {};
    for (let key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }
  return obj;
};

/**
 * A native implementation of goog.bind.
 * @param fn A function to partially apply.
 * @param selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param var_args Additional arguments that are partially applied to the
 *     function.
 * @return A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind is
 *     deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(
    fn: Function, selfObj: Object|undefined, ...var_args: any[]): Function {
  return (fn.call.apply(fn.bind, arguments) as Function);
};

/**
 * A pure-JS implementation of goog.bind.
 * @param fn A function to partially apply.
 * @param selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param var_args Additional arguments that are partially applied to the
 *     function.
 * @return A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.bindJs_ = function(
    fn: Function, selfObj: Object|undefined, ...var_args: any[]): Function {
  if (!fn) {
    throw new Error();
  }
  if (arguments.length > 2) {
    let boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      let newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };
  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};

/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of this 'pre-specified'.
 *
 * Remaining arguments specified at call-time are appended to the pre-specified
 * ones.
 *
 * Also see: {@link #partial}.
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param fn A function to partially apply.
 * @param selfObj Specifies the object which this should point to when the
 *     function is run.
 * @param var_args Additional arguments that are partially applied to the
 *     function.
 * @return A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @template T
 * @suppress {deprecated} See above.
 */
goog.bind = function(
    fn: ((...p1) => any)|null, selfObj: T, ...var_args: any[]): Function {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default Chrome
      // extension environment. This means that for Chrome extensions, they get
      // the implementation of Function.prototype.bind that calls goog.bind
      // instead of the native one. Even worse, we don't want to introduce a
      // circular dependency between goog.bind and Function.prototype.bind, so
      // we have to hack this to make sure it works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};

/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param fn A function to partially apply.
 * @param var_args Additional arguments that are partially applied to fn.
 * @return A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn: Function, ...var_args: any[]): Function {
  let args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Clone the array (with slice()) and append additional arguments
    // to the existing arguments.
    let newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};

/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param target Target.
 * @param source Source.
 */
goog.mixin = function(target: Object, source: Object) {
  for (let x in source) {
    target[x] = source[x];
  }
};

// For IE7 or lower, the for-in-loop does not contain any properties that are
// not enumerable on the prototype object (for example, isPrototypeOf from
// Object.prototype) but also it will not include 'replace' on objects that
// extend String and change 'replace' (not that it is common for anyone to
// extend anything except Object).

/**
 * @return An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = goog.TRUSTED_SITE && Date.now || function(): number {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
};

/**
 * Evals JavaScript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param script JavaScript string.
 */
goog.globalEval = function(script: string) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else {
    if (goog.global.eval) {
      // Test to see if eval works
      if (goog.evalWorksForGlobals_ == null) {
        goog.global.eval('var _evalTest_ = 1;');
        if (typeof goog.global['_evalTest_'] != 'undefined') {
          try {
            delete goog.global['_evalTest_'];
          } catch (ignore) {
          }

          // Microsoft edge fails the deletion above in strict mode.
          goog.evalWorksForGlobals_ = true;
        } else {
          goog.evalWorksForGlobals_ = false;
        }
      }
      if (goog.evalWorksForGlobals_) {
        goog.global.eval(script);
      } else {
        let doc = goog.global.document;
        let scriptElt = doc.createElement('SCRIPT');
        scriptElt.type = 'text/javascript';
        scriptElt.defer = false;

        // Note(user): can't use .innerHTML since "t('<test>')" will fail and
        // .text doesn't work in Safari 2.  Therefore we append a text node.
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt);
      }
    } else {
      throw Error('goog.globalEval not available');
    }
  }
};

/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 */
goog.evalWorksForGlobals_ = null;

/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;

/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;

/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a hyphen and
 * passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which these
 * mappings are used. In the BY_PART style, each part (i.e. in between hyphens)
 * of the passed in css name is rewritten according to the map. In the BY_WHOLE
 * style, the full css name is looked up in the map directly. If a rewrite is
 * not specified by the map, the compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls to
 * goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed only the
 * modifier will be processed, as it is assumed the first argument was generated
 * as a result of calling goog.getCssName.
 *
 * @param className The class name.
 * @param opt_modifier A modifier to be appended to the class name.
 * @return The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className: string, opt_modifier?: string): string {
  let getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };
  let renameByParts = function(cssName) {
    // Remap all the parts individually.
    let parts = cssName.split('-');
    let mapped = [];
    for (let i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };
  let rename;
  if (goog.cssNameMapping_) {
    rename =
        goog.cssNameMappingStyle_ == 'BY_WHOLE' ? getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }
  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};

/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping: Object, opt_style?: string) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};

/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;
if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}

/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param.
 * @param opt_values Maps place holder name to value.
 * @return message with placeholders filled.
 */
goog.getMsg = function(
    str: string, opt_values?: {[key: string]: string}): string {
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};

/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primitive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param a The preferred message.
 * @param b The fallback message.
 * @return The best translated message.
 */
goog.getMsgWithFallback = function(a: string, b: string): string {
  return a;
};

/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated, unless they are
 * exported in turn via this function or goog.exportProperty.
 *
 * Also handy for making public items that are defined in anonymous closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction', Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param publicPath Unobfuscated name to export.
 * @param object Object the name should point to.
 * @param opt_objectToExportTo The object to add the path to; default
 *     is goog.global.
 */
goog.exportSymbol = function(
    publicPath: string, object: any, opt_objectToExportTo?: Object) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};

/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param object Object whose static property is being exported.
 * @param publicName Unobfuscated name to export.
 * @param symbol Object the name should point to.
 */
goog.exportProperty = function(
    object: Object, publicName: string, symbol: any) {
  object[publicName] = symbol;
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the aliases
 * applied.  In uncompiled code the function is simply run since the aliases as
 * written are valid JavaScript.
 *
 *
 * @param fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *     (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn: () => any) {
  fn.call(goog.global);
};

/*
 * To support uncompiled, strict mode bundles that use eval to divide source
 * like so:
 *    eval('someSource;//# sourceUrl sourcefile.js');
 * We need to export the globally defined symbols "goog" and "COMPILED".
 * Exporting "goog" breaks the compiler optimizations, so we required that
 * be defined externally.
 * NOTE: We don't use goog.exportSymbol here because we don't want to trigger
 * extern generation when that compiler option is enabled.
 */
if (!COMPILED) {
  goog.global['COMPILED'] = COMPILED;
}

//==============================================================================
// goog.defineClass implementation
//==============================================================================

/**
 * Creates a restricted form of a Closure "class":
 *   - from the compiler's perspective, the instance returned from the
 *     constructor is sealed (no new properties may be added).  This enables
 *     better checks.
 *   - the compiler will rewrite this definition to a form that is optimal
 *     for type checking and optimization (initially this will be a more
 *     traditional form).
 *
 * @param superClass The superclass, Object or null.
 *     An object literal describing
 *     the class.  It may have the following properties:
 *     "constructor": the constructor function
 *     "statics": an object literal containing methods to add to the constructor
 *        as "static" methods or a function that will receive the constructor
 *        function as its only parameter to which static properties can
 *        be added.
 *     all other properties are added to the prototype.
 * @return The class constructor.
 */
goog.defineClass = function(
    superClass: Function, def: goog.defineClass.ClassDescriptor): Function {
  // TODO(johnlenz): consider making the superClass an optional parameter.
  let constructor = def.constructor;
  let statics = def.statics;

  // Wrap the constructor prior to setting up the prototype and static methods.
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw Error('cannot instantiate an interface (no constructor defined).');
    };
  }
  let cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }

  // Remove all the properties that should not be copied to the prototype.
  delete def.constructor;
  delete def.statics;
  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }
  return cls;
};
type ClassDescriptor = Object|{constructor: Function}|
    {constructor: Function, statics: Object | ((p1: Function) => void)};

/**
 * @define {boolean} Whether the instances returned by
 * goog.defineClass should be sealed when possible.
 */
goog.define('goog.defineClass.SEAL_CLASS_INSTANCES', goog.DEBUG);

/**
 * If goog.defineClass.SEAL_CLASS_INSTANCES is enabled and Object.seal is
 * defined, this function will wrap the constructor in a function that seals the
 * results of the provided constructor function.
 *
 * @param ctr The constructor whose results maybe be sealed.
 * @param superClass The superclass constructor.
 * @return The replacement constructor.
 */
goog.defineClass.createSealingConstructor_ = function(
    ctr: Function, superClass: Function): Function {
  if (goog.defineClass.SEAL_CLASS_INSTANCES &&
      Object.seal instanceof Function) {
    // Don't seal subclasses of unsealable-tagged legacy classes.
    if (superClass && superClass.prototype &&
        superClass.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]) {
      return ctr;
    }

    /**
     * @this {Object}
     */
    let wrappedCtr = function(): any {
      // Don't seal an instance of a subclass when it calls the constructor of
      // its super class as there is most likely still setup to do.
      let instance = ctr.apply(this, arguments) || this;
      instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
      if (this.constructor === wrappedCtr) {
        Object.seal(instance);
      }
      return instance;
    };
    return wrappedCtr;
  }
  return ctr;
};

// TODO(johnlenz): share these values with the goog.object
/**
 * The names of the fields that are defined on Object.prototype.
 */
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = [
  'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
  'toLocaleString', 'toString', 'valueOf'
];

// TODO(johnlenz): share this function with the goog.object
/**
 * @param target The object to add properties to.
 * @param source The object to copy properties from.
 */
goog.defineClass.applyProperties_ = function(target: Object, source: Object) {
  // TODO(johnlenz): update this to support ES5 getters/setters
  let key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }

  // For IE the for-in-loop does not contain any properties that are not
  // enumerable on the prototype object (for example isPrototypeOf from
  // Object.prototype) and it will also not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
  for (let i = 0; i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};

/**
 * Sealing classes breaks the older idiom of assigning properties on the
 * prototype rather than in the constructor.  As such, goog.defineClass
 * must not seal subclasses of these old-style classes until they are fixed.
 * Until then, this marks a class as "broken", instructing defineClass
 * not to seal subclasses.
 * @param ctr The legacy constructor to tag as unsealable.
 */
goog.tagUnsealableClass = function(ctr: Function) {
  if (!COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES) {
    ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = true;
  }
};

/**
 * Name for unsealable tag property.
 */
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = 'goog_defineClass_legacy_unsealable';
