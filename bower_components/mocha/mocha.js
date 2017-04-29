;((() => {
  // CommonJS require()

  function require(p){
    var path = require.resolve(p);
    var mod = require.modules[path];
    if (!mod) throw new Error('failed to require "' + p + '"');
    if (!mod.exports) {
      mod.exports = {};
      mod.call(mod.exports, mod, mod.exports, require.relative(path));
    }
    return mod.exports;
  }

  require.modules = {};

  require.resolve = path => {
    var orig = path;
    var reg = path + '.js';
    var index = path + '/index.js';
    return require.modules[reg] && reg
      || require.modules[index] && index
      || orig;
  };

  require.register = (path, fn) => {
      require.modules[path] = fn;
    };

  require.relative = parent => p => {
    if ('.' != p.charAt(0)) return require(p);

    var path = parent.split('/');
    var segs = p.split('/');
    path.pop();

    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if ('..' == seg) path.pop();
      else if ('.' != seg) path.push(seg);
    }

    return require(path.join('/'));
  };


  require.register("browser/debug.js", (module, exports, require) => {

  module.exports = type => () => {
  };

  }); // module: browser/debug.js

  require.register("browser/diff.js", (module, exports, require) => {
  /* See LICENSE file for terms of use */

  /*
   * Text diff implementation.
   *
   * This library supports the following APIS:
   * JsDiff.diffChars: Character by character diff
   * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
   * JsDiff.diffLines: Line based diff
   *
   * JsDiff.diffCss: Diff targeted at CSS content
   *
   * These methods are based on the implementation proposed in
   * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
   * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
   */
  var JsDiff = ((() => {
    /*jshint maxparams: 5*/
    function clonePath(path) {
      return { newPos: path.newPos, components: path.components.slice(0) };
    }
    function removeEmpty(array) {
      var ret = [];
      for (var i = 0; i < array.length; i++) {
        if (array[i]) {
          ret.push(array[i]);
        }
      }
      return ret;
    }
    function escapeHTML(s) {
      var n = s;
      n = n.replace(/&/g, '&amp;');
      n = n.replace(/</g, '&lt;');
      n = n.replace(/>/g, '&gt;');
      n = n.replace(/"/g, '&quot;');

      return n;
    }

    var Diff = function(ignoreWhitespace) {
      this.ignoreWhitespace = ignoreWhitespace;
    };
    Diff.prototype = {
        diff(oldString, newString) {
          // Handle the identity case (this is due to unrolling editLength == 0
          if (newString === oldString) {
            return [{ value: newString }];
          }
          if (!newString) {
            return [{ value: oldString, removed: true }];
          }
          if (!oldString) {
            return [{ value: newString, added: true }];
          }

          newString = this.tokenize(newString);
          oldString = this.tokenize(oldString);

          var newLen = newString.length;
          var oldLen = oldString.length;
          var maxEditLength = newLen + oldLen;
          var bestPath = [{ newPos: -1, components: [] }];

          // Seed editLength = 0
          var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
          if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {
            return bestPath[0].components;
          }

          for (var editLength = 1; editLength <= maxEditLength; editLength++) {
            for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {
              var basePath;
              var addPath = bestPath[diagonalPath-1];
              var removePath = bestPath[diagonalPath+1];
              oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
              if (addPath) {
                // No one else is going to attempt to use this value, clear it
                bestPath[diagonalPath-1] = undefined;
              }

              var canAdd = addPath && addPath.newPos+1 < newLen;
              var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
              if (!canAdd && !canRemove) {
                bestPath[diagonalPath] = undefined;
                continue;
              }

              // Select the diagonal that we want to branch from. We select the prior
              // path whose position in the new string is the farthest from the origin
              // and does not pass the bounds of the diff graph
              if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
                basePath = clonePath(removePath);
                this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
              } else {
                basePath = clonePath(addPath);
                basePath.newPos++;
                this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
              }

              var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);

              if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {
                return basePath.components;
              } else {
                bestPath[diagonalPath] = basePath;
              }
            }
          }
        },

        pushComponent(components, value, added, removed) {
          var last = components[components.length-1];
          if (last && last.added === added && last.removed === removed) {
            // We need to clone here as the component clone operation is just
            // as shallow array clone
            components[components.length-1] =
              {value: this.join(last.value, value), added, removed };
          } else {
            components.push({value, added, removed });
          }
        },
        extractCommon(basePath, newString, oldString, diagonalPath) {
          var newLen = newString.length;
          var oldLen = oldString.length;
          var newPos = basePath.newPos;
          var oldPos = newPos - diagonalPath;
          while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {
            newPos++;
            oldPos++;

            this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
          }
          basePath.newPos = newPos;
          return oldPos;
        },

        equals(left, right) {
          var reWhitespace = /\S/;
          if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
            return true;
          } else {
            return left === right;
          }
        },
        join(left, right) {
          return left + right;
        },
        tokenize(value) {
          return value;
        }
    };

    var CharDiff = new Diff();

    var WordDiff = new Diff(true);
    var WordWithSpaceDiff = new Diff();
    WordDiff.tokenize = WordWithSpaceDiff.tokenize = value => removeEmpty(value.split(/(\s+|\b)/));

    var CssDiff = new Diff(true);
    CssDiff.tokenize = value => removeEmpty(value.split(/([{}:;,]|\s+)/));

    var LineDiff = new Diff();
    LineDiff.tokenize = value => value.split(/^/m);

    return {
      Diff,

      diffChars(oldStr, newStr) { return CharDiff.diff(oldStr, newStr); },
      diffWords(oldStr, newStr) { return WordDiff.diff(oldStr, newStr); },
      diffWordsWithSpace(oldStr, newStr) { return WordWithSpaceDiff.diff(oldStr, newStr); },
      diffLines(oldStr, newStr) { return LineDiff.diff(oldStr, newStr); },

      diffCss(oldStr, newStr) { return CssDiff.diff(oldStr, newStr); },

      createPatch(fileName, oldStr, newStr, oldHeader, newHeader) {
        var ret = [];

        ret.push('Index: ' + fileName);
        ret.push('===================================================================');
        ret.push('--- ' + fileName + (typeof oldHeader === 'undefined' ? '' : '\t' + oldHeader));
        ret.push('+++ ' + fileName + (typeof newHeader === 'undefined' ? '' : '\t' + newHeader));

        var diff = LineDiff.diff(oldStr, newStr);
        if (!diff[diff.length-1].value) {
          diff.pop();   // Remove trailing newline add
        }
        diff.push({value: '', lines: []});   // Append an empty value to make cleanup easier

        function contextLines(lines) {
          return lines.map(entry => ' ' + entry);
        }
        function eofNL(curRange, i, current) {
          var last = diff[diff.length-2];
          var isLast = i === diff.length-2;
          var isLastOfType = i === diff.length-3 && (current.added !== last.added || current.removed !== last.removed);

          // Figure out if this is the last line for the given file and missing NL
          if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
            curRange.push('\\ No newline at end of file');
          }
        }

        var oldRangeStart = 0;
        var newRangeStart = 0;
        var curRange = [];
        var oldLine = 1;
        var newLine = 1;
        for (var i = 0; i < diff.length; i++) {
          var current = diff[i];
          var lines = current.lines || current.value.replace(/\n$/, '').split('\n');
          current.lines = lines;

          if (current.added || current.removed) {
            if (!oldRangeStart) {
              var prev = diff[i-1];
              oldRangeStart = oldLine;
              newRangeStart = newLine;

              if (prev) {
                curRange = contextLines(prev.lines.slice(-4));
                oldRangeStart -= curRange.length;
                newRangeStart -= curRange.length;
              }
            }
            curRange.push(...lines.map(entry => (current.added?'+':'-') + entry));
            eofNL(curRange, i, current);

            if (current.added) {
              newLine += lines.length;
            } else {
              oldLine += lines.length;
            }
          } else {
            if (oldRangeStart) {
              // Close out any changes that have been output (or join overlapping)
              if (lines.length <= 8 && i < diff.length-2) {
                // Overlapping
                curRange.push(...contextLines(lines));
              } else {
                // end the range and output
                var contextSize = Math.min(lines.length, 4);
                ret.push(
                    '@@ -' + oldRangeStart + ',' + (oldLine-oldRangeStart+contextSize)
                    + ' +' + newRangeStart + ',' + (newLine-newRangeStart+contextSize)
                    + ' @@');
                ret.push(...curRange);
                ret.push(...contextLines(lines.slice(0, contextSize)));
                if (lines.length <= 4) {
                  eofNL(ret, i, current);
                }

                oldRangeStart = 0;  newRangeStart = 0; curRange = [];
              }
            }
            oldLine += lines.length;
            newLine += lines.length;
          }
        }

        return ret.join('\n') + '\n';
      },

      applyPatch(oldStr, uniDiff) {
        var diffstr = uniDiff.split('\n');
        var diff = [];
        var remEOFNL = false;
        var addEOFNL = false;

        for (var i = (diffstr[0][0]==='I'?4:0); i < diffstr.length; i++) {
          if(diffstr[i][0] === '@') {
            var meh = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
            diff.unshift({
              start:meh[3],
              oldlength:meh[2],
              oldlines:[],
              newlength:meh[4],
              newlines:[]
            });
          } else if(diffstr[i][0] === '+') {
            diff[0].newlines.push(diffstr[i].substr(1));
          } else if(diffstr[i][0] === '-') {
            diff[0].oldlines.push(diffstr[i].substr(1));
          } else if(diffstr[i][0] === ' ') {
            diff[0].newlines.push(diffstr[i].substr(1));
            diff[0].oldlines.push(diffstr[i].substr(1));
          } else if(diffstr[i][0] === '\\') {
            if (diffstr[i-1][0] === '+') {
              remEOFNL = true;
            } else if(diffstr[i-1][0] === '-') {
              addEOFNL = true;
            }
          }
        }

        var str = oldStr.split('\n');
        for (var i = diff.length - 1; i >= 0; i--) {
          var d = diff[i];
          for (var j = 0; j < d.oldlength; j++) {
            if(str[d.start-1+j] !== d.oldlines[j]) {
              return false;
            }
          }
          Array.prototype.splice.apply(str,[d.start-1,+d.oldlength].concat(d.newlines));
        }

        if (remEOFNL) {
          while (!str[str.length-1]) {
            str.pop();
          }
        } else if (addEOFNL) {
          str.push('');
        }
        return str.join('\n');
      },

      convertChangesToXML(changes) {
        var ret = [];
        for ( var i = 0; i < changes.length; i++) {
          var change = changes[i];
          if (change.added) {
            ret.push('<ins>');
          } else if (change.removed) {
            ret.push('<del>');
          }

          ret.push(escapeHTML(change.value));

          if (change.added) {
            ret.push('</ins>');
          } else if (change.removed) {
            ret.push('</del>');
          }
        }
        return ret.join('');
      },

      // See: http://code.google.com/p/google-diff-match-patch/wiki/API
      convertChangesToDMP(changes) {
        var ret = [];
        var change;
        for ( var i = 0; i < changes.length; i++) {
          change = changes[i];
          ret.push([(change.added ? 1 : change.removed ? -1 : 0), change.value]);
        }
        return ret;
      }
    };
  }))();

  if (typeof module !== 'undefined') {
      module.exports = JsDiff;
  }

  }); // module: browser/diff.js

  require.register("browser/events.js", (module, exports, require) => {

  /**
   * Module exports.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Check if `obj` is an array.
   */

  function isArray(obj) {
    return '[object Array]' == {}.toString.call(obj);
  }

  /**
   * Event emitter constructor.
   *
   * @api public
   */

  function EventEmitter(){};

  /**
   * Adds a listener.
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on(...args) {
      self.removeListener(name, on);
      fn.apply(this, args);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    if (name === undefined) {
      this.$events = {};
      return this;
    }

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api public
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = [].slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };
  }); // module: browser/events.js

  require.register("browser/fs.js", (module, exports, require) => {

  }); // module: browser/fs.js

  require.register("browser/path.js", (module, exports, require) => {

  }); // module: browser/path.js

  require.register("browser/progress.js", (module, exports, require) => {

  /**
   * Expose `Progress`.
   */

  module.exports = Progress;

  /**
   * Initialize a new `Progress` indicator.
   */

  function Progress() {
    this.percent = 0;
    this.size(0);
    this.fontSize(11);
    this.font('helvetica, arial, sans-serif');
  }

  /**
   * Set progress size to `n`.
   *
   * @param {Number} n
   * @return {Progress} for chaining
   * @api public
   */

  Progress.prototype.size = function(n){
    this._size = n;
    return this;
  };

  /**
   * Set text to `str`.
   *
   * @param {String} str
   * @return {Progress} for chaining
   * @api public
   */

  Progress.prototype.text = function(str){
    this._text = str;
    return this;
  };

  /**
   * Set font size to `n`.
   *
   * @param {Number} n
   * @return {Progress} for chaining
   * @api public
   */

  Progress.prototype.fontSize = function(n){
    this._fontSize = n;
    return this;
  };

  /**
   * Set font `family`.
   *
   * @param {String} family
   * @return {Progress} for chaining
   */

  Progress.prototype.font = function(family){
    this._font = family;
    return this;
  };

  /**
   * Update percentage to `n`.
   *
   * @param {Number} n
   * @return {Progress} for chaining
   */

  Progress.prototype.update = function(n){
    this.percent = n;
    return this;
  };

  /**
   * Draw on `ctx`.
   *
   * @param {CanvasRenderingContext2d} ctx
   * @return {Progress} for chaining
   */

  Progress.prototype.draw = function(ctx){
    var percent = Math.min(this.percent, 100);
    var size = this._size;
    var half = size / 2;
    var x = half;
    var y = half;
    var rad = half - 1;
    var fontSize = this._fontSize;

    ctx.font = fontSize + 'px ' + this._font;

    var angle = Math.PI * 2 * (percent / 100);
    ctx.clearRect(0, 0, size, size);

    // outer circle
    ctx.strokeStyle = '#9f9f9f';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, angle, false);
    ctx.stroke();

    // inner circle
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    ctx.arc(x, y, rad - 1, 0, angle, true);
    ctx.stroke();

    // text
    var text = this._text || (percent | 0) + '%';

    var w = ctx.measureText(text).width;

    ctx.fillText(
        text
      , x - w / 2 + 1
      , y + fontSize / 2 - 1);

    return this;
  };

  }); // module: browser/progress.js

  require.register("browser/tty.js", (module, exports, require) => {

  exports.isatty = () => true;

  exports.getWindowSize = () => {
    if ('innerHeight' in global) {
      return [global.innerHeight, global.innerWidth];
    } else {
      // In a Web Worker, the DOM Window is not available.
      return [640, 480];
    }
  };

  }); // module: browser/tty.js

  require.register("context.js", (module, exports, require) => {

  /**
   * Expose `Context`.
   */

  module.exports = Context;

  /**
   * Initialize a new `Context`.
   *
   * @api private
   */

  function Context(){}

  /**
   * Set or get the context `Runnable` to `runnable`.
   *
   * @param {Runnable} runnable
   * @return {Context}
   * @api private
   */

  Context.prototype.runnable = function(runnable){
    if (0 == arguments.length) return this._runnable;
    this.test = this._runnable = runnable;
    return this;
  };

  /**
   * Set test timeout `ms`.
   *
   * @param {Number} ms
   * @return {Context} self
   * @api private
   */

  Context.prototype.timeout = function(ms){
    this.runnable().timeout(ms);
    return this;
  };

  /**
   * Set test slowness threshold `ms`.
   *
   * @param {Number} ms
   * @return {Context} self
   * @api private
   */

  Context.prototype.slow = function(ms){
    this.runnable().slow(ms);
    return this;
  };

  /**
   * Inspect the context void of `._runnable`.
   *
   * @return {String}
   * @api private
   */

  Context.prototype.inspect = function(){
    return JSON.stringify(this, (key, val) => {
      if ('_runnable' == key) return;
      if ('test' == key) return;
      return val;
    }, 2);
  };

  }); // module: context.js

  require.register("hook.js", (module, exports, require) => {

  /**
   * Module dependencies.
   */

  var Runnable = require('./runnable');

  /**
   * Expose `Hook`.
   */

  module.exports = Hook;

  /**
   * Initialize a new `Hook` with the given `title` and callback `fn`.
   *
   * @param {String} title
   * @param {Function} fn
   * @api private
   */

  function Hook(title, fn) {
    Runnable.call(this, title, fn);
    this.type = 'hook';
  }

  /**
   * Inherit from `Runnable.prototype`.
   */

  function F(){};
  F.prototype = Runnable.prototype;
  Hook.prototype = new F;
  Hook.prototype.constructor = Hook;


  /**
   * Get or set the test `err`.
   *
   * @param {Error} err
   * @return {Error}
   * @api public
   */

  Hook.prototype.error = function(err){
    if (0 == arguments.length) {
      var err = this._error;
      this._error = null;
      return err;
    }

    this._error = err;
  };

  }); // module: hook.js

  require.register("interfaces/bdd.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Suite = require('../suite');

    var Test = require('../test');
    var utils = require('../utils');

    /**
     * BDD-style interface:
     *
     *      describe('Array', function(){
     *        describe('#indexOf()', function(){
     *          it('should return -1 when not present', function(){
     *
     *          });
     *
     *          it('should return the index when present', function(){
     *
     *          });
     *        });
     *      });
     *
     */

    module.exports = suite => {
      var suites = [suite];

      suite.on('pre-require', (context, file, mocha) => {

        /**
         * Execute before running tests.
         */

        context.before = fn => {
          suites[0].beforeAll(fn);
        };

        /**
         * Execute after running tests.
         */

        context.after = fn => {
          suites[0].afterAll(fn);
        };

        /**
         * Execute before each test case.
         */

        context.beforeEach = fn => {
          suites[0].beforeEach(fn);
        };

        /**
         * Execute after each test case.
         */

        context.afterEach = fn => {
          suites[0].afterEach(fn);
        };

        /**
         * Describe a "suite" with the given `title`
         * and callback `fn` containing nested suites
         * and/or tests.
         */

        context.describe = context.context = (title, fn) => {
          var suite = Suite.create(suites[0], title);
          suites.unshift(suite);
          fn.call(suite);
          suites.shift();
          return suite;
        };

        /**
         * Pending describe.
         */

        context.xdescribe =
        context.xcontext =
        context.describe.skip = (title, fn) => {
          var suite = Suite.create(suites[0], title);
          suite.pending = true;
          suites.unshift(suite);
          fn.call(suite);
          suites.shift();
        };

        /**
         * Exclusive suite.
         */

        context.describe.only = (title, fn) => {
          var suite = context.describe(title, fn);
          mocha.grep(suite.fullTitle());
          return suite;
        };

        /**
         * Describe a specification or test-case
         * with the given `title` and callback `fn`
         * acting as a thunk.
         */

        context.it = context.specify = (title, fn) => {
          var suite = suites[0];
          if (suite.pending) var fn = null;
          var test = new Test(title, fn);
          suite.addTest(test);
          return test;
        };

        /**
         * Exclusive test-case.
         */

        context.it.only = (title, fn) => {
          var test = context.it(title, fn);
          var reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';
          mocha.grep(new RegExp(reString));
          return test;
        };

        /**
         * Pending test case.
         */

        context.xit =
        context.xspecify =
        context.it.skip = title => {
          context.it(title);
        };
      });
    };
  }); // module: interfaces/bdd.js

  require.register("interfaces/exports.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Suite = require('../suite');

    var Test = require('../test');

    /**
     * TDD-style interface:
     *
     *     exports.Array = {
     *       '#indexOf()': {
     *         'should return -1 when the value is not present': function(){
     *
     *         },
     *
     *         'should return the correct index when the value is present': function(){
     *
     *         }
     *       }
     *     };
     *
     */

    module.exports = suite => {
      var suites = [suite];

      suite.on('require', visit);

      function visit(obj) {
        var suite;
        for (var key in obj) {
          if ('function' == typeof obj[key]) {
            var fn = obj[key];
            switch (key) {
              case 'before':
                suites[0].beforeAll(fn);
                break;
              case 'after':
                suites[0].afterAll(fn);
                break;
              case 'beforeEach':
                suites[0].beforeEach(fn);
                break;
              case 'afterEach':
                suites[0].afterEach(fn);
                break;
              default:
                suites[0].addTest(new Test(key, fn));
            }
          } else {
            var suite = Suite.create(suites[0], key);
            suites.unshift(suite);
            visit(obj[key]);
            suites.shift();
          }
        }
      }
    };
  }); // module: interfaces/exports.js

  require.register("interfaces/index.js", (module, exports, require) => {

  exports.bdd = require('./bdd');
  exports.tdd = require('./tdd');
  exports.qunit = require('./qunit');
  exports.exports = require('./exports');

  }); // module: interfaces/index.js

  require.register("interfaces/qunit.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Suite = require('../suite');

    var Test = require('../test');
    var utils = require('../utils');

    /**
     * QUnit-style interface:
     *
     *     suite('Array');
     *
     *     test('#length', function(){
     *       var arr = [1,2,3];
     *       ok(arr.length == 3);
     *     });
     *
     *     test('#indexOf()', function(){
     *       var arr = [1,2,3];
     *       ok(arr.indexOf(1) == 0);
     *       ok(arr.indexOf(2) == 1);
     *       ok(arr.indexOf(3) == 2);
     *     });
     *
     *     suite('String');
     *
     *     test('#length', function(){
     *       ok('foo'.length == 3);
     *     });
     *
     */

    module.exports = suite => {
      var suites = [suite];

      suite.on('pre-require', (context, file, mocha) => {

        /**
         * Execute before running tests.
         */

        context.before = fn => {
          suites[0].beforeAll(fn);
        };

        /**
         * Execute after running tests.
         */

        context.after = fn => {
          suites[0].afterAll(fn);
        };

        /**
         * Execute before each test case.
         */

        context.beforeEach = fn => {
          suites[0].beforeEach(fn);
        };

        /**
         * Execute after each test case.
         */

        context.afterEach = fn => {
          suites[0].afterEach(fn);
        };

        /**
         * Describe a "suite" with the given `title`.
         */

        context.suite = title => {
          if (suites.length > 1) suites.shift();
          var suite = Suite.create(suites[0], title);
          suites.unshift(suite);
          return suite;
        };

        /**
         * Exclusive test-case.
         */

        context.suite.only = (title, fn) => {
          var suite = context.suite(title, fn);
          mocha.grep(suite.fullTitle());
        };

        /**
         * Describe a specification or test-case
         * with the given `title` and callback `fn`
         * acting as a thunk.
         */

        context.test = (title, fn) => {
          var test = new Test(title, fn);
          suites[0].addTest(test);
          return test;
        };

        /**
         * Exclusive test-case.
         */

        context.test.only = (title, fn) => {
          var test = context.test(title, fn);
          var reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';
          mocha.grep(new RegExp(reString));
        };

        /**
         * Pending test case.
         */

        context.test.skip = title => {
          context.test(title);
        };
      });
    };
  }); // module: interfaces/qunit.js

  require.register("interfaces/tdd.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Suite = require('../suite');

    var Test = require('../test');
    var utils = require('../utils');

    /**
     * TDD-style interface:
     *
     *      suite('Array', function(){
     *        suite('#indexOf()', function(){
     *          suiteSetup(function(){
     *
     *          });
     *
     *          test('should return -1 when not present', function(){
     *
     *          });
     *
     *          test('should return the index when present', function(){
     *
     *          });
     *
     *          suiteTeardown(function(){
     *
     *          });
     *        });
     *      });
     *
     */

    module.exports = suite => {
      var suites = [suite];

      suite.on('pre-require', (context, file, mocha) => {

        /**
         * Execute before each test case.
         */

        context.setup = fn => {
          suites[0].beforeEach(fn);
        };

        /**
         * Execute after each test case.
         */

        context.teardown = fn => {
          suites[0].afterEach(fn);
        };

        /**
         * Execute before the suite.
         */

        context.suiteSetup = fn => {
          suites[0].beforeAll(fn);
        };

        /**
         * Execute after the suite.
         */

        context.suiteTeardown = fn => {
          suites[0].afterAll(fn);
        };

        /**
         * Describe a "suite" with the given `title`
         * and callback `fn` containing nested suites
         * and/or tests.
         */

        context.suite = (title, fn) => {
          var suite = Suite.create(suites[0], title);
          suites.unshift(suite);
          fn.call(suite);
          suites.shift();
          return suite;
        };

        /**
         * Pending suite.
         */
        context.suite.skip = (title, fn) => {
          var suite = Suite.create(suites[0], title);
          suite.pending = true;
          suites.unshift(suite);
          fn.call(suite);
          suites.shift();
        };

        /**
         * Exclusive test-case.
         */

        context.suite.only = (title, fn) => {
          var suite = context.suite(title, fn);
          mocha.grep(suite.fullTitle());
        };

        /**
         * Describe a specification or test-case
         * with the given `title` and callback `fn`
         * acting as a thunk.
         */

        context.test = (title, fn) => {
          var suite = suites[0];
          if (suite.pending) var fn = null;
          var test = new Test(title, fn);
          suite.addTest(test);
          return test;
        };

        /**
         * Exclusive test-case.
         */

        context.test.only = (title, fn) => {
          var test = context.test(title, fn);
          var reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';
          mocha.grep(new RegExp(reString));
        };

        /**
         * Pending test case.
         */

        context.test.skip = title => {
          context.test(title);
        };
      });
    };
  }); // module: interfaces/tdd.js

  require.register("mocha.js", (module, exports, require) => {
    /*!
     * mocha
     * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
     * MIT Licensed
     */

    /**
     * Module dependencies.
     */

    var path = require('browser/path');

    var utils = require('./utils');

    /**
     * Expose `Mocha`.
     */

    exports = module.exports = Mocha;

    /**
     * Expose internals.
     */

    exports.utils = utils;
    exports.interfaces = require('./interfaces');
    exports.reporters = require('./reporters');
    exports.Runnable = require('./runnable');
    exports.Context = require('./context');
    exports.Runner = require('./runner');
    exports.Suite = require('./suite');
    exports.Hook = require('./hook');
    exports.Test = require('./test');

    /**
     * Return image `name` path.
     *
     * @param {String} name
     * @return {String}
     * @api private
     */

    function image(name) {
      return __dirname + '/../images/' + name + '.png';
    }

    /**
     * Setup mocha with `options`.
     *
     * Options:
     *
     *   - `ui` name "bdd", "tdd", "exports" etc
     *   - `reporter` reporter instance, defaults to `mocha.reporters.Dot`
     *   - `globals` array of accepted globals
     *   - `timeout` timeout in milliseconds
     *   - `bail` bail on the first test failure
     *   - `slow` milliseconds to wait before considering a test slow
     *   - `ignoreLeaks` ignore global leaks
     *   - `grep` string or regexp to filter tests with
     *
     * @param {Object} options
     * @api public
     */

    function Mocha(options) {
      options = options || {};
      this.files = [];
      this.options = options;
      this.grep(options.grep);
      this.suite = new exports.Suite('', new exports.Context);
      this.ui(options.ui);
      this.bail(options.bail);
      this.reporter(options.reporter);
      if (null != options.timeout) this.timeout(options.timeout);
      this.useColors(options.useColors)
      if (options.slow) this.slow(options.slow);
    }

    /**
     * Enable or disable bailing on the first failure.
     *
     * @param {Boolean} [bail]
     * @api public
     */

    Mocha.prototype.bail = function(bail){
      if (0 == arguments.length) bail = true;
      this.suite.bail(bail);
      return this;
    };

    /**
     * Add test `file`.
     *
     * @param {String} file
     * @api public
     */

    Mocha.prototype.addFile = function(file){
      this.files.push(file);
      return this;
    };

    /**
     * Set reporter to `reporter`, defaults to "dot".
     *
     * @param {String|Function} reporter name or constructor
     * @api public
     */

    Mocha.prototype.reporter = function(reporter){
      if ('function' == typeof reporter) {
        this._reporter = reporter;
      } else {
        reporter = reporter || 'dot';
        var _reporter;
        try { _reporter = require('./reporters/' + reporter); } catch (err) {};
        if (!_reporter) try { _reporter = require(reporter); } catch (err) {};
        if (!_reporter && reporter === 'teamcity')
          console.warn('The Teamcity reporter was moved to a package named ' +
            'mocha-teamcity-reporter ' +
            '(https://npmjs.org/package/mocha-teamcity-reporter).');
        if (!_reporter) throw new Error('invalid reporter "' + reporter + '"');
        this._reporter = _reporter;
      }
      return this;
    };

    /**
     * Set test UI `name`, defaults to "bdd".
     *
     * @param {String} bdd
     * @api public
     */

    Mocha.prototype.ui = function(name){
      name = name || 'bdd';
      this._ui = exports.interfaces[name];
      if (!this._ui) try { this._ui = require(name); } catch (err) {};
      if (!this._ui) throw new Error('invalid interface "' + name + '"');
      this._ui = this._ui(this.suite);
      return this;
    };

    /**
     * Load registered files.
     *
     * @api private
     */

    Mocha.prototype.loadFiles = function(fn){
      var self = this;
      var suite = this.suite;
      var pending = this.files.length;
      this.files.forEach(file => {
        file = path.resolve(file);
        suite.emit('pre-require', global, file, self);
        suite.emit('require', require(file), file, self);
        suite.emit('post-require', global, file, self);
        --pending || (fn && fn());
      });
    };

    /**
     * Enable growl support.
     *
     * @api private
     */

    Mocha.prototype._growl = (runner, reporter) => {
      var notify = require('growl');

      runner.on('end', () => {
        var stats = reporter.stats;
        if (stats.failures) {
          var msg = stats.failures + ' of ' + runner.total + ' tests failed';
          notify(msg, { name: 'mocha', title: 'Failed', image: image('error') });
        } else {
          notify(stats.passes + ' tests passed in ' + stats.duration + 'ms', {
              name: 'mocha'
            , title: 'Passed'
            , image: image('ok')
          });
        }
      });
    };

    /**
     * Add regexp to grep, if `re` is a string it is escaped.
     *
     * @param {RegExp|String} re
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.grep = function(re){
      this.options.grep = 'string' == typeof re
        ? new RegExp(utils.escapeRegexp(re))
        : re;
      return this;
    };

    /**
     * Invert `.grep()` matches.
     *
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.invert = function(){
      this.options.invert = true;
      return this;
    };

    /**
     * Ignore global leaks.
     *
     * @param {Boolean} ignore
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.ignoreLeaks = function(ignore){
      this.options.ignoreLeaks = !!ignore;
      return this;
    };

    /**
     * Enable global leak checking.
     *
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.checkLeaks = function(){
      this.options.ignoreLeaks = false;
      return this;
    };

    /**
     * Enable growl support.
     *
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.growl = function(){
      this.options.growl = true;
      return this;
    };

    /**
     * Ignore `globals` array or string.
     *
     * @param {Array|String} globals
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.globals = function(globals){
      this.options.globals = (this.options.globals || []).concat(globals);
      return this;
    };

    /**
     * Emit color output.
     *
     * @param {Boolean} colors
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.useColors = function(colors){
      this.options.useColors = arguments.length && colors != undefined
        ? colors
        : true;
      return this;
    };

    /**
     * Set the timeout in milliseconds.
     *
     * @param {Number} timeout
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.timeout = function(timeout){
      this.suite.timeout(timeout);
      return this;
    };

    /**
     * Set slowness threshold in milliseconds.
     *
     * @param {Number} slow
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.slow = function(slow){
      this.suite.slow(slow);
      return this;
    };

    /**
     * Makes all tests async (accepting a callback)
     *
     * @return {Mocha}
     * @api public
     */

    Mocha.prototype.asyncOnly = function(){
      this.options.asyncOnly = true;
      return this;
    };

    /**
     * Run tests and invoke `fn()` when complete.
     *
     * @param {Function} fn
     * @return {Runner}
     * @api public
     */

    Mocha.prototype.run = function(fn){
      if (this.files.length) this.loadFiles();
      var suite = this.suite;
      var options = this.options;
      var runner = new exports.Runner(suite);
      var reporter = new this._reporter(runner);
      runner.ignoreLeaks = false !== options.ignoreLeaks;
      runner.asyncOnly = options.asyncOnly;
      if (options.grep) runner.grep(options.grep, options.invert);
      if (options.globals) runner.globals(options.globals);
      if (options.growl) this._growl(runner, reporter);
      exports.reporters.Base.useColors = options.useColors;
      return runner.run(fn);
    };
  }); // module: mocha.js

  require.register("ms.js", (module, exports, require) => {
  /**
   * Helpers.
   */

  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} options
   * @return {String|Number}
   * @api public
   */

  module.exports = (val, options) => {
    options = options || {};
    if ('string' == typeof val) return parse(val);
    return options.long
      ? long(val)
      : short(val);
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse(str) {
    var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
    if (!match) return;
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'y':
        return n * y;
      case 'days':
      case 'day':
      case 'd':
        return n * d;
      case 'hours':
      case 'hour':
      case 'h':
        return n * h;
      case 'minutes':
      case 'minute':
      case 'm':
        return n * m;
      case 'seconds':
      case 'second':
      case 's':
        return n * s;
      case 'ms':
        return n;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function short(ms) {
    if (ms >= d) return Math.round(ms / d) + 'd';
    if (ms >= h) return Math.round(ms / h) + 'h';
    if (ms >= m) return Math.round(ms / m) + 'm';
    if (ms >= s) return Math.round(ms / s) + 's';
    return ms + 'ms';
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function long(ms) {
    return plural(ms, d, 'day')
      || plural(ms, h, 'hour')
      || plural(ms, m, 'minute')
      || plural(ms, s, 'second')
      || ms + ' ms';
  }

  /**
   * Pluralization helper.
   */

  function plural(ms, n, name) {
    if (ms < n) return;
    if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
    return Math.ceil(ms / n) + ' ' + name + 's';
  }

  }); // module: ms.js

  require.register("reporters/base.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var tty = require('browser/tty');

    var diff = require('browser/diff');
    var ms = require('../ms');

    /**
     * Save timer references to avoid Sinon interfering (see GH-237).
     */

    var Date = global.Date;

    var setTimeout = global.setTimeout;
    var setInterval = global.setInterval;
    var clearTimeout = global.clearTimeout;
    var clearInterval = global.clearInterval;

    /**
     * Check if both stdio streams are associated with a tty.
     */

    var isatty = tty.isatty(1) && tty.isatty(2);

    /**
     * Expose `Base`.
     */

    exports = module.exports = Base;

    /**
     * Enable coloring by default.
     */

    exports.useColors = isatty || (process.env.MOCHA_COLORS !== undefined);

    /**
     * Inline diffs instead of +/-
     */

    exports.inlineDiffs = false;

    /**
     * Default color map.
     */

    exports.colors = {
        'pass': 90
      , 'fail': 31
      , 'bright pass': 92
      , 'bright fail': 91
      , 'bright yellow': 93
      , 'pending': 36
      , 'suite': 0
      , 'error title': 0
      , 'error message': 31
      , 'error stack': 90
      , 'checkmark': 32
      , 'fast': 90
      , 'medium': 33
      , 'slow': 31
      , 'green': 32
      , 'light': 90
      , 'diff gutter': 90
      , 'diff added': 42
      , 'diff removed': 41
    };

    /**
     * Default symbol map.
     */

    exports.symbols = {
      ok: '✓',
      err: '✖',
      dot: '․'
    };

    // With node.js on Windows: use symbols available in terminal default fonts
    if ('win32' == process.platform) {
      exports.symbols.ok = '\u221A';
      exports.symbols.err = '\u00D7';
      exports.symbols.dot = '.';
    }

    /**
     * Color `str` with the given `type`,
     * allowing colors to be disabled,
     * as well as user-defined color
     * schemes.
     *
     * @param {String} type
     * @param {String} str
     * @return {String}
     * @api private
     */

    var color = exports.color = (type, str) => {
      if (!exports.useColors) return str;
      return '\u001b[' + exports.colors[type] + 'm' + str + '\u001b[0m';
    };

    /**
     * Expose term window size, with some
     * defaults for when stderr is not a tty.
     */

    exports.window = {
      width: isatty
        ? process.stdout.getWindowSize
          ? process.stdout.getWindowSize(1)[0]
          : tty.getWindowSize()[1]
        : 75
    };

    /**
     * Expose some basic cursor interactions
     * that are common among reporters.
     */

    exports.cursor = {
      hide() {
        isatty && process.stdout.write('\u001b[?25l');
      },

      show() {
        isatty && process.stdout.write('\u001b[?25h');
      },

      deleteLine() {
        isatty && process.stdout.write('\u001b[2K');
      },

      beginningOfLine() {
        isatty && process.stdout.write('\u001b[0G');
      },

      CR() {
        if (isatty) {
          exports.cursor.deleteLine();
          exports.cursor.beginningOfLine();
        } else {
          process.stdout.write('\n');
        }
      }
    };

    /**
     * Outut the given `failures` as a list.
     *
     * @param {Array} failures
     * @api public
     */

    exports.list = failures => {
      console.error();
      failures.forEach((test, i) => {
        // format
        var fmt = color('error title', '  %s) %s:\n')
          + color('error message', '     %s')
          + color('error stack', '\n%s\n');

        // msg
        var err = test.err;

        var message = err.message || '';
        var stack = err.stack || message;
        var index = stack.indexOf(message) + message.length;
        var msg = stack.slice(0, index);
        var actual = err.actual;
        var expected = err.expected;
        var escape = true;

        // uncaught
        if (err.uncaught) {
          msg = 'Uncaught ' + msg;
        }

        // explicitly show diff
        if (err.showDiff && sameType(actual, expected)) {
          escape = false;
          err.actual = actual = stringify(actual);
          err.expected = expected = stringify(expected);
        }

        // actual / expected diff
        if ('string' == typeof actual && 'string' == typeof expected) {
          fmt = color('error title', '  %s) %s:\n%s') + color('error stack', '\n%s\n');
          var match = message.match(/^([^:]+): expected/);
          msg = match ? '\n      ' + color('error message', match[1]) : '';

          if (exports.inlineDiffs) {
            msg += inlineDiff(err, escape);
          } else {
            msg += unifiedDiff(err, escape);
          }
        }

        // indent stack trace without msg
        stack = stack.slice(index ? index + 1 : index)
          .replace(/^/gm, '  ');

        console.error(fmt, (i + 1), test.fullTitle(), msg, stack);
      });
    };

    /**
     * Initialize a new `Base` reporter.
     *
     * All other reporters generally
     * inherit from this reporter, providing
     * stats such as test duration, number
     * of tests passed / failed etc.
     *
     * @param {Runner} runner
     * @api public
     */

    function Base(runner) {
      var self = this;
      var stats = this.stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 };
      var failures = this.failures = [];

      if (!runner) return;
      this.runner = runner;

      runner.stats = stats;

      runner.on('start', () => {
        stats.start = new Date;
      });

      runner.on('suite', suite => {
        stats.suites = stats.suites || 0;
        suite.root || stats.suites++;
      });

      runner.on('test end', test => {
        stats.tests = stats.tests || 0;
        stats.tests++;
      });

      runner.on('pass', test => {
        stats.passes = stats.passes || 0;

        var medium = test.slow() / 2;
        test.speed = test.duration > test.slow()
          ? 'slow'
          : test.duration > medium
            ? 'medium'
            : 'fast';

        stats.passes++;
      });

      runner.on('fail', (test, err) => {
        stats.failures = stats.failures || 0;
        stats.failures++;
        test.err = err;
        failures.push(test);
      });

      runner.on('end', () => {
        stats.end = new Date;
        stats.duration = new Date - stats.start;
      });

      runner.on('pending', () => {
        stats.pending++;
      });
    }

    /**
     * Output common epilogue used by many of
     * the bundled reporters.
     *
     * @api public
     */

    Base.prototype.epilogue = function(){
      var stats = this.stats;
      var tests;
      var fmt;

      console.log();

      // passes
      fmt = color('bright pass', ' ')
        + color('green', ' %d passing')
        + color('light', ' (%s)');

      console.log(fmt,
        stats.passes || 0,
        ms(stats.duration));

      // pending
      if (stats.pending) {
        fmt = color('pending', ' ')
          + color('pending', ' %d pending');

        console.log(fmt, stats.pending);
      }

      // failures
      if (stats.failures) {
        fmt = color('fail', '  %d failing');

        console.error(fmt,
          stats.failures);

        Base.list(this.failures);
        console.error();
      }

      console.log();
    };

    /**
     * Pad the given `str` to `len`.
     *
     * @param {String} str
     * @param {String} len
     * @return {String}
     * @api private
     */

    function pad(str, len) {
      str = String(str);
      return Array(len - str.length + 1).join(' ') + str;
    }


    /**
     * Returns an inline diff between 2 strings with coloured ANSI output
     *
     * @param {Error} Error with actual/expected
     * @return {String} Diff
     * @api private
     */

    function inlineDiff(err, escape) {
      var msg = errorDiff(err, 'WordsWithSpace', escape);

      // linenos
      var lines = msg.split('\n');
      if (lines.length > 4) {
        var width = String(lines.length).length;
        msg = lines.map((str, i) => pad(++i, width) + ' |' + ' ' + str).join('\n');
      }

      // legend
      msg = '\n'
        + color('diff removed', 'actual')
        + ' '
        + color('diff added', 'expected')
        + '\n\n'
        + msg
        + '\n';

      // indent
      msg = msg.replace(/^/gm, '      ');
      return msg;
    }

    /**
     * Returns a unified diff between 2 strings
     *
     * @param {Error} Error with actual/expected
     * @return {String} Diff
     * @api private
     */

    function unifiedDiff(err, escape) {
      var indent = '      ';
      function cleanUp(line) {
        if (escape) {
          line = escapeInvisibles(line);
        }
        if (line[0] === '+') return indent + colorLines('diff added', line);
        if (line[0] === '-') return indent + colorLines('diff removed', line);
        if (line.match(/\@\@/)) return null;
        if (line.match(/\\ No newline/)) return null;
        else return indent + line;
      }
      function notBlank(line) {
        return line != null;
      }
      msg = diff.createPatch('string', err.actual, err.expected);
      var lines = msg.split('\n').splice(4);
      return '\n      '
             + colorLines('diff added',   '+ expected') + ' '
             + colorLines('diff removed', '- actual')
             + '\n\n'
             + lines.map(cleanUp).filter(notBlank).join('\n');
    }

    /**
     * Return a character diff for `err`.
     *
     * @param {Error} err
     * @return {String}
     * @api private
     */

    function errorDiff(err, type, escape) {
      var actual   = escape ? escapeInvisibles(err.actual)   : err.actual;
      var expected = escape ? escapeInvisibles(err.expected) : err.expected;
      return diff['diff' + type](actual, expected).map(str => {
        if (str.added) return colorLines('diff added', str.value);
        if (str.removed) return colorLines('diff removed', str.value);
        return str.value;
      }).join('');
    }

    /**
     * Returns a string with all invisible characters in plain text
     *
     * @param {String} line
     * @return {String}
     * @api private
     */
    function escapeInvisibles(line) {
        return line.replace(/\t/g, '<tab>')
                   .replace(/\r/g, '<CR>')
                   .replace(/\n/g, '<LF>\n');
    }

    /**
     * Color lines for `str`, using the color `name`.
     *
     * @param {String} name
     * @param {String} str
     * @return {String}
     * @api private
     */

    function colorLines(name, str) {
      return str.split('\n').map(str => color(name, str)).join('\n');
    }

    /**
     * Stringify `obj`.
     *
     * @param {Mixed} obj
     * @return {String}
     * @api private
     */

    function stringify(obj) {
      if (obj instanceof RegExp) return obj.toString();
      return JSON.stringify(obj, null, 2);
    }

    /**
     * Check that a / b have the same type.
     *
     * @param {Object} a
     * @param {Object} b
     * @return {Boolean}
     * @api private
     */

    function sameType(a, b) {
      a = Object.prototype.toString.call(a);
      b = Object.prototype.toString.call(b);
      return a == b;
    }
  }); // module: reporters/base.js

  require.register("reporters/doc.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var utils = require('../utils');

    /**
     * Expose `Doc`.
     */

    exports = module.exports = Doc;

    /**
     * Initialize a new `Doc` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function Doc(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var total = runner.total;
      var indents = 2;

      function indent() {
        return Array(indents).join('  ');
      }

      runner.on('suite', suite => {
        if (suite.root) return;
        ++indents;
        console.log('%s<section class="suite">', indent());
        ++indents;
        console.log('%s<h1>%s</h1>', indent(), utils.escape(suite.title));
        console.log('%s<dl>', indent());
      });

      runner.on('suite end', suite => {
        if (suite.root) return;
        console.log('%s</dl>', indent());
        --indents;
        console.log('%s</section>', indent());
        --indents;
      });

      runner.on('pass', test => {
        console.log('%s  <dt>%s</dt>', indent(), utils.escape(test.title));
        var code = utils.escape(utils.clean(test.fn.toString()));
        console.log('%s  <dd><pre><code>%s</code></pre></dd>', indent(), code);
      });
    }
  }); // module: reporters/doc.js

  require.register("reporters/dot.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var color = Base.color;

    /**
     * Expose `Dot`.
     */

    exports = module.exports = Dot;

    /**
     * Initialize a new `Dot` matrix test reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function Dot(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var width = Base.window.width * .75 | 0;
      var n = 0;

      runner.on('start', () => {
        process.stdout.write('\n  ');
      });

      runner.on('pending', test => {
        process.stdout.write(color('pending', Base.symbols.dot));
      });

      runner.on('pass', test => {
        if (++n % width == 0) process.stdout.write('\n  ');
        if ('slow' == test.speed) {
          process.stdout.write(color('bright yellow', Base.symbols.dot));
        } else {
          process.stdout.write(color(test.speed, Base.symbols.dot));
        }
      });

      runner.on('fail', (test, err) => {
        if (++n % width == 0) process.stdout.write('\n  ');
        process.stdout.write(color('fail', Base.symbols.dot));
      });

      runner.on('end', () => {
        console.log();
        self.epilogue();
      });
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    Dot.prototype = new F;
    Dot.prototype.constructor = Dot;
  }); // module: reporters/dot.js

  require.register("reporters/html-cov.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var JSONCov = require('./json-cov');

    var fs = require('browser/fs');

    /**
     * Expose `HTMLCov`.
     */

    exports = module.exports = HTMLCov;

    /**
     * Initialize a new `JsCoverage` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function HTMLCov(runner) {
      var jade = require('jade');
      var file = __dirname + '/templates/coverage.jade';
      var str = fs.readFileSync(file, 'utf8');
      var fn = jade.compile(str, { filename: file });
      var self = this;

      JSONCov.call(this, runner, false);

      runner.on('end', () => {
        process.stdout.write(fn({
            cov: self.cov
          , coverageClass
        }));
      });
    }

    /**
     * Return coverage class for `n`.
     *
     * @return {String}
     * @api private
     */

    function coverageClass(n) {
      if (n >= 75) return 'high';
      if (n >= 50) return 'medium';
      if (n >= 25) return 'low';
      return 'terrible';
    }
  }); // module: reporters/html-cov.js

  require.register("reporters/html.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var utils = require('../utils');
    var Progress = require('../browser/progress');
    var escape = utils.escape;

    /**
     * Save timer references to avoid Sinon interfering (see GH-237).
     */

    var Date = global.Date;

    var setTimeout = global.setTimeout;
    var setInterval = global.setInterval;
    var clearTimeout = global.clearTimeout;
    var clearInterval = global.clearInterval;

    /**
     * Expose `HTML`.
     */

    exports = module.exports = HTML;

    /**
     * Stats template.
     */

    var statsTemplate = '<ul id="mocha-stats">'
      + '<li class="progress"><canvas width="40" height="40"></canvas></li>'
      + '<li class="passes"><a href="#">passes:</a> <em>0</em></li>'
      + '<li class="failures"><a href="#">failures:</a> <em>0</em></li>'
      + '<li class="duration">duration: <em>0</em>s</li>'
      + '</ul>';

    /**
     * Initialize a new `HTML` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function HTML(runner, root) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var total = runner.total;
      var stat = fragment(statsTemplate);
      var items = stat.getElementsByTagName('li');
      var passes = items[1].getElementsByTagName('em')[0];
      var passesLink = items[1].getElementsByTagName('a')[0];
      var failures = items[2].getElementsByTagName('em')[0];
      var failuresLink = items[2].getElementsByTagName('a')[0];
      var duration = items[3].getElementsByTagName('em')[0];
      var canvas = stat.getElementsByTagName('canvas')[0];
      var report = fragment('<ul id="mocha-report"></ul>');
      var stack = [report];
      var progress;
      var ctx;

      root = root || document.getElementById('mocha');

      if (canvas.getContext) {
        var ratio = window.devicePixelRatio || 1;
        canvas.style.width = canvas.width;
        canvas.style.height = canvas.height;
        canvas.width *= ratio;
        canvas.height *= ratio;
        ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        progress = new Progress;
      }

      if (!root) return error('#mocha div missing, add it to your document');

      // pass toggle
      on(passesLink, 'click', () => {
        unhide();
        var name = /pass/.test(report.className) ? '' : ' pass';
        report.className = report.className.replace(/fail|pass/g, '') + name;
        if (report.className.trim()) hideSuitesWithout('test pass');
      });

      // failure toggle
      on(failuresLink, 'click', () => {
        unhide();
        var name = /fail/.test(report.className) ? '' : ' fail';
        report.className = report.className.replace(/fail|pass/g, '') + name;
        if (report.className.trim()) hideSuitesWithout('test fail');
      });

      root.appendChild(stat);
      root.appendChild(report);

      if (progress) progress.size(40);

      runner.on('suite', suite => {
        if (suite.root) return;

        // suite
        var url = self.suiteURL(suite);
        var el = fragment('<li class="suite"><h1><a href="%s">%s</a></h1></li>', url, escape(suite.title));

        // container
        stack[0].appendChild(el);
        stack.unshift(document.createElement('ul'));
        el.appendChild(stack[0]);
      });

      runner.on('suite end', suite => {
        if (suite.root) return;
        stack.shift();
      });

      runner.on('fail', (test, err) => {
        if ('hook' == test.type) runner.emit('test end', test);
      });

      runner.on('test end', function(test){
        // TODO: add to stats
        var percent = stats.tests / this.total * 100 | 0;
        if (progress) progress.update(percent).draw(ctx);

        // update stats
        var ms = new Date - stats.start;
        text(passes, stats.passes);
        text(failures, stats.failures);
        text(duration, (ms / 1000).toFixed(2));

        // test
        if ('passed' == test.state) {
          var url = self.testURL(test);
          var el = fragment('<li class="test pass %e"><h2>%e<span class="duration">%ems</span> <a href="%s" class="replay">‣</a></h2></li>', test.speed, test.title, test.duration, url);
        } else if (test.pending) {
          var el = fragment('<li class="test pass pending"><h2>%e</h2></li>', test.title);
        } else {
          var el = fragment('<li class="test fail"><h2>%e <a href="?grep=%e" class="replay">‣</a></h2></li>', test.title, encodeURIComponent(test.fullTitle()));
          var str = test.err.stack || test.err.toString();

          // FF / Opera do not add the message
          if (!~str.indexOf(test.err.message)) {
            str = test.err.message + '\n' + str;
          }

          // <=IE7 stringifies to [Object Error]. Since it can be overloaded, we
          // check for the result of the stringifying.
          if ('[object Error]' == str) str = test.err.message;

          // Safari doesn't give you a stack. Let's at least provide a source line.
          if (!test.err.stack && test.err.sourceURL && test.err.line !== undefined) {
            str += "\n(" + test.err.sourceURL + ":" + test.err.line + ")";
          }

          el.appendChild(fragment('<pre class="error">%e</pre>', str));
        }

        // toggle code
        // TODO: defer
        if (!test.pending) {
          var h2 = el.getElementsByTagName('h2')[0];

          on(h2, 'click', () => {
            pre.style.display = 'none' == pre.style.display
              ? 'block'
              : 'none';
          });

          var pre = fragment('<pre><code>%e</code></pre>', utils.clean(test.fn.toString()));
          el.appendChild(pre);
          pre.style.display = 'none';
        }

        // Don't call .appendChild if #mocha-report was already .shift()'ed off the stack.
        if (stack[0]) stack[0].appendChild(el);
      });
    }

    /**
     * Provide suite URL
     *
     * @param {Object} [suite]
     */

    HTML.prototype.suiteURL = suite => '?grep=' + encodeURIComponent(suite.fullTitle());

    /**
     * Provide test URL
     *
     * @param {Object} [test]
     */

    HTML.prototype.testURL = test => '?grep=' + encodeURIComponent(test.fullTitle());

    /**
     * Display error `msg`.
     */

    function error(msg) {
      document.body.appendChild(fragment('<div id="mocha-error">%s</div>', msg));
    }

    /**
     * Return a DOM fragment from `html`.
     */

    function fragment(html) {
      var args = arguments;
      var div = document.createElement('div');
      var i = 1;

      div.innerHTML = html.replace(/%([se])/g, (_, type) => {
        switch (type) {
          case 's': return String(args[i++]);
          case 'e': return escape(args[i++]);
        }
      });

      return div.firstChild;
    }

    /**
     * Check for suites that do not have elements
     * with `classname`, and hide them.
     */

    function hideSuitesWithout(classname) {
      var suites = document.getElementsByClassName('suite');
      for (var i = 0; i < suites.length; i++) {
        var els = suites[i].getElementsByClassName(classname);
        if (0 == els.length) suites[i].className += ' hidden';
      }
    }

    /**
     * Unhide .hidden suites.
     */

    function unhide() {
      var els = document.getElementsByClassName('suite hidden');
      for (var i = 0; i < els.length; ++i) {
        els[i].className = els[i].className.replace('suite hidden', 'suite');
      }
    }

    /**
     * Set `el` text to `str`.
     */

    function text(el, str) {
      if (el.textContent) {
        el.textContent = str;
      } else {
        el.innerText = str;
      }
    }

    /**
     * Listen on `event` with callback `fn`.
     */

    function on(el, event, fn) {
      if (el.addEventListener) {
        el.addEventListener(event, fn, false);
      } else {
        el.attachEvent('on' + event, fn);
      }
    }
  }); // module: reporters/html.js

  require.register("reporters/index.js", (module, exports, require) => {

  exports.Base = require('./base');
  exports.Dot = require('./dot');
  exports.Doc = require('./doc');
  exports.TAP = require('./tap');
  exports.JSON = require('./json');
  exports.HTML = require('./html');
  exports.List = require('./list');
  exports.Min = require('./min');
  exports.Spec = require('./spec');
  exports.Nyan = require('./nyan');
  exports.XUnit = require('./xunit');
  exports.Markdown = require('./markdown');
  exports.Progress = require('./progress');
  exports.Landing = require('./landing');
  exports.JSONCov = require('./json-cov');
  exports.HTMLCov = require('./html-cov');
  exports.JSONStream = require('./json-stream');

  }); // module: reporters/index.js

  require.register("reporters/json-cov.js", (module, exports, require) => {

  /**
   * Module dependencies.
   */

  var Base = require('./base');

  /**
   * Expose `JSONCov`.
   */

  exports = module.exports = JSONCov;

  /**
   * Initialize a new `JsCoverage` reporter.
   *
   * @param {Runner} runner
   * @param {Boolean} output
   * @api public
   */

  function JSONCov(runner, output) {
    var self = this;
    var output = 1 == arguments.length ? true : output;

    Base.call(this, runner);

    var tests = [];
    var failures = [];
    var passes = [];

    runner.on('test end', test => {
      tests.push(test);
    });

    runner.on('pass', test => {
      passes.push(test);
    });

    runner.on('fail', test => {
      failures.push(test);
    });

    runner.on('end', () => {
      var cov = global._$jscoverage || {};
      var result = self.cov = map(cov);
      result.stats = self.stats;
      result.tests = tests.map(clean);
      result.failures = failures.map(clean);
      result.passes = passes.map(clean);
      if (!output) return;
      process.stdout.write(JSON.stringify(result, null, 2 ));
    });
  }

  /**
   * Map jscoverage data to a JSON structure
   * suitable for reporting.
   *
   * @param {Object} cov
   * @return {Object}
   * @api private
   */

  function map(cov) {
    var ret = {
        instrumentation: 'node-jscoverage'
      , sloc: 0
      , hits: 0
      , misses: 0
      , coverage: 0
      , files: []
    };

    for (var filename in cov) {
      var data = coverage(filename, cov[filename]);
      ret.files.push(data);
      ret.hits += data.hits;
      ret.misses += data.misses;
      ret.sloc += data.sloc;
    }

    ret.files.sort((a, b) => a.filename.localeCompare(b.filename));

    if (ret.sloc > 0) {
      ret.coverage = (ret.hits / ret.sloc) * 100;
    }

    return ret;
  };

  /**
   * Map jscoverage data for a single source file
   * to a JSON structure suitable for reporting.
   *
   * @param {String} filename name of the source file
   * @param {Object} data jscoverage coverage data
   * @return {Object}
   * @api private
   */

  function coverage(filename, data) {
    var ret = {
      filename,
      coverage: 0,
      hits: 0,
      misses: 0,
      sloc: 0,
      source: {}
    };

    data.source.forEach((line, num) => {
      num++;

      if (data[num] === 0) {
        ret.misses++;
        ret.sloc++;
      } else if (data[num] !== undefined) {
        ret.hits++;
        ret.sloc++;
      }

      ret.source[num] = {
          source: line
        , coverage: data[num] === undefined
          ? ''
          : data[num]
      };
    });

    ret.coverage = ret.hits / ret.sloc * 100;

    return ret;
  }

  /**
   * Return a plain-object representation of `test`
   * free of cyclic properties etc.
   *
   * @param {Object} test
   * @return {Object}
   * @api private
   */

  function clean(test) {
    return {
        title: test.title
      , fullTitle: test.fullTitle()
      , duration: test.duration
    }
  }

  }); // module: reporters/json-cov.js

  require.register("reporters/json-stream.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var color = Base.color;

    /**
     * Expose `List`.
     */

    exports = module.exports = List;

    /**
     * Initialize a new `List` test reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function List(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var total = runner.total;

      runner.on('start', () => {
        console.log(JSON.stringify(['start', { total }]));
      });

      runner.on('pass', test => {
        console.log(JSON.stringify(['pass', clean(test)]));
      });

      runner.on('fail', (test, err) => {
        console.log(JSON.stringify(['fail', clean(test)]));
      });

      runner.on('end', () => {
        process.stdout.write(JSON.stringify(['end', self.stats]));
      });
    }

    /**
     * Return a plain-object representation of `test`
     * free of cyclic properties etc.
     *
     * @param {Object} test
     * @return {Object}
     * @api private
     */

    function clean(test) {
      return {
          title: test.title
        , fullTitle: test.fullTitle()
        , duration: test.duration
      }
    }
  }); // module: reporters/json-stream.js

  require.register("reporters/json.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var cursor = Base.cursor;
    var color = Base.color;

    /**
     * Expose `JSON`.
     */

    exports = module.exports = JSONReporter;

    /**
     * Initialize a new `JSON` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function JSONReporter(runner) {
      var self = this;
      Base.call(this, runner);

      var tests = [];
      var failures = [];
      var passes = [];

      runner.on('test end', test => {
        tests.push(test);
      });

      runner.on('pass', test => {
        passes.push(test);
      });

      runner.on('fail', test => {
        failures.push(test);
      });

      runner.on('end', () => {
        var obj = {
            stats: self.stats
          , tests: tests.map(clean)
          , failures: failures.map(clean)
          , passes: passes.map(clean)
        };

        process.stdout.write(JSON.stringify(obj, null, 2));
      });
    }

    /**
     * Return a plain-object representation of `test`
     * free of cyclic properties etc.
     *
     * @param {Object} test
     * @return {Object}
     * @api private
     */

    function clean(test) {
      return {
          title: test.title
        , fullTitle: test.fullTitle()
        , duration: test.duration
      }
    }
  }); // module: reporters/json.js

  require.register("reporters/landing.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var cursor = Base.cursor;
    var color = Base.color;

    /**
     * Expose `Landing`.
     */

    exports = module.exports = Landing;

    /**
     * Airplane color.
     */

    Base.colors.plane = 0;

    /**
     * Airplane crash color.
     */

    Base.colors['plane crash'] = 31;

    /**
     * Runway color.
     */

    Base.colors.runway = 90;

    /**
     * Initialize a new `Landing` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function Landing(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var width = Base.window.width * .75 | 0;
      var total = runner.total;
      var stream = process.stdout;
      var plane = color('plane', '✈');
      var crashed = -1;
      var n = 0;

      function runway() {
        var buf = Array(width).join('-');
        return '  ' + color('runway', buf);
      }

      runner.on('start', () => {
        stream.write('\n  ');
        cursor.hide();
      });

      runner.on('test end', test => {
        // check if the plane crashed
        var col = -1 == crashed
          ? width * ++n / total | 0
          : crashed;

        // show the crash
        if ('failed' == test.state) {
          plane = color('plane crash', '✈');
          crashed = col;
        }

        // render landing strip
        stream.write('\u001b[4F\n\n');
        stream.write(runway());
        stream.write('\n  ');
        stream.write(color('runway', Array(col).join('⋅')));
        stream.write(plane)
        stream.write(color('runway', Array(width - col).join('⋅') + '\n'));
        stream.write(runway());
        stream.write('\u001b[0m');
      });

      runner.on('end', () => {
        cursor.show();
        console.log();
        self.epilogue();
      });
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    Landing.prototype = new F;
    Landing.prototype.constructor = Landing;
  }); // module: reporters/landing.js

  require.register("reporters/list.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var cursor = Base.cursor;
    var color = Base.color;

    /**
     * Expose `List`.
     */

    exports = module.exports = List;

    /**
     * Initialize a new `List` test reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function List(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var n = 0;

      runner.on('start', () => {
        console.log();
      });

      runner.on('test', test => {
        process.stdout.write(color('pass', '    ' + test.fullTitle() + ': '));
      });

      runner.on('pending', test => {
        var fmt = color('checkmark', '  -')
          + color('pending', ' %s');
        console.log(fmt, test.fullTitle());
      });

      runner.on('pass', test => {
        var fmt = color('checkmark', '  '+Base.symbols.dot)
          + color('pass', ' %s: ')
          + color(test.speed, '%dms');
        cursor.CR();
        console.log(fmt, test.fullTitle(), test.duration);
      });

      runner.on('fail', (test, err) => {
        cursor.CR();
        console.log(color('fail', '  %d) %s'), ++n, test.fullTitle());
      });

      runner.on('end', self.epilogue.bind(self));
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    List.prototype = new F;
    List.prototype.constructor = List;
  }); // module: reporters/list.js

  require.register("reporters/markdown.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var utils = require('../utils');

    /**
     * Expose `Markdown`.
     */

    exports = module.exports = Markdown;

    /**
     * Initialize a new `Markdown` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function Markdown(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var level = 0;
      var buf = '';

      function title(str) {
        return Array(level).join('#') + ' ' + str;
      }

      function indent() {
        return Array(level).join('  ');
      }

      function mapTOC(suite, obj) {
        var ret = obj;
        obj = obj[suite.title] = obj[suite.title] || { suite };
        suite.suites.forEach(suite => {
          mapTOC(suite, obj);
        });
        return ret;
      }

      function stringifyTOC(obj, level) {
        ++level;
        var buf = '';
        var link;
        for (var key in obj) {
          if ('suite' == key) continue;
          if (key) link = ' - [' + key + '](#' + utils.slug(obj[key].suite.fullTitle()) + ')\n';
          if (key) buf += Array(level).join('  ') + link;
          buf += stringifyTOC(obj[key], level);
        }
        --level;
        return buf;
      }

      function generateTOC(suite) {
        var obj = mapTOC(suite, {});
        return stringifyTOC(obj, 0);
      }

      generateTOC(runner.suite);

      runner.on('suite', suite => {
        ++level;
        var slug = utils.slug(suite.fullTitle());
        buf += '<a name="' + slug + '"></a>' + '\n';
        buf += title(suite.title) + '\n';
      });

      runner.on('suite end', suite => {
        --level;
      });

      runner.on('pass', test => {
        var code = utils.clean(test.fn.toString());
        buf += test.title + '.\n';
        buf += '\n```js\n';
        buf += code + '\n';
        buf += '```\n\n';
      });

      runner.on('end', () => {
        process.stdout.write('# TOC\n');
        process.stdout.write(generateTOC(runner.suite));
        process.stdout.write(buf);
      });
    }
  }); // module: reporters/markdown.js

  require.register("reporters/min.js", (module, exports, require) => {

  /**
   * Module dependencies.
   */

  var Base = require('./base');

  /**
   * Expose `Min`.
   */

  exports = module.exports = Min;

  /**
   * Initialize a new `Min` minimal test reporter (best used with --watch).
   *
   * @param {Runner} runner
   * @api public
   */

  function Min(runner) {
    Base.call(this, runner);

    runner.on('start', () => {
      // clear screen
      process.stdout.write('\u001b[2J');
      // set cursor position
      process.stdout.write('\u001b[1;3H');
    });

    runner.on('end', this.epilogue.bind(this));
  }

  /**
   * Inherit from `Base.prototype`.
   */

  function F(){};
  F.prototype = Base.prototype;
  Min.prototype = new F;
  Min.prototype.constructor = Min;


  }); // module: reporters/min.js

  require.register("reporters/nyan.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var color = Base.color;

    /**
     * Expose `Dot`.
     */

    exports = module.exports = NyanCat;

    /**
     * Initialize a new `Dot` matrix test reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function NyanCat(runner) {
      Base.call(this, runner);
      var self = this;
      var stats = this.stats;
      var width = Base.window.width * .75 | 0;
      var rainbowColors = this.rainbowColors = self.generateColors();
      var colorIndex = this.colorIndex = 0;
      var numerOfLines = this.numberOfLines = 4;
      var trajectories = this.trajectories = [[], [], [], []];
      var nyanCatWidth = this.nyanCatWidth = 11;
      var trajectoryWidthMax = this.trajectoryWidthMax = (width - nyanCatWidth);
      var scoreboardWidth = this.scoreboardWidth = 5;
      var tick = this.tick = 0;
      var n = 0;

      runner.on('start', () => {
        Base.cursor.hide();
        self.draw();
      });

      runner.on('pending', test => {
        self.draw();
      });

      runner.on('pass', test => {
        self.draw();
      });

      runner.on('fail', (test, err) => {
        self.draw();
      });

      runner.on('end', () => {
        Base.cursor.show();
        for (var i = 0; i < self.numberOfLines; i++) write('\n');
        self.epilogue();
      });
    }

    /**
     * Draw the nyan cat
     *
     * @api private
     */

    NyanCat.prototype.draw = function(){
      this.appendRainbow();
      this.drawScoreboard();
      this.drawRainbow();
      this.drawNyanCat();
      this.tick = !this.tick;
    };

    /**
     * Draw the "scoreboard" showing the number
     * of passes, failures and pending tests.
     *
     * @api private
     */

    NyanCat.prototype.drawScoreboard = function(){
      var stats = this.stats;
      var colors = Base.colors;

      function draw(color, n) {
        write(' ');
        write('\u001b[' + color + 'm' + n + '\u001b[0m');
        write('\n');
      }

      draw(colors.green, stats.passes);
      draw(colors.fail, stats.failures);
      draw(colors.pending, stats.pending);
      write('\n');

      this.cursorUp(this.numberOfLines);
    };

    /**
     * Append the rainbow.
     *
     * @api private
     */

    NyanCat.prototype.appendRainbow = function(){
      var segment = this.tick ? '_' : '-';
      var rainbowified = this.rainbowify(segment);

      for (var index = 0; index < this.numberOfLines; index++) {
        var trajectory = this.trajectories[index];
        if (trajectory.length >= this.trajectoryWidthMax) trajectory.shift();
        trajectory.push(rainbowified);
      }
    };

    /**
     * Draw the rainbow.
     *
     * @api private
     */

    NyanCat.prototype.drawRainbow = function(){
      var self = this;

      this.trajectories.forEach((line, index) => {
        write('\u001b[' + self.scoreboardWidth + 'C');
        write(line.join(''));
        write('\n');
      });

      this.cursorUp(this.numberOfLines);
    };

    /**
     * Draw the nyan cat
     *
     * @api private
     */

    NyanCat.prototype.drawNyanCat = function() {
      var self = this;
      var startWidth = this.scoreboardWidth + this.trajectories[0].length;
      var color = '\u001b[' + startWidth + 'C';
      var padding = '';

      write(color);
      write('_,------,');
      write('\n');

      write(color);
      padding = self.tick ? '  ' : '   ';
      write('_|' + padding + '/\\_/\\ ');
      write('\n');

      write(color);
      padding = self.tick ? '_' : '__';
      var tail = self.tick ? '~' : '^';
      var face;
      write(tail + '|' + padding + this.face() + ' ');
      write('\n');

      write(color);
      padding = self.tick ? ' ' : '  ';
      write(padding + '""  "" ');
      write('\n');

      this.cursorUp(this.numberOfLines);
    };

    /**
     * Draw nyan cat face.
     *
     * @return {String}
     * @api private
     */

    NyanCat.prototype.face = function() {
      var stats = this.stats;
      if (stats.failures) {
        return '( x .x)';
      } else if (stats.pending) {
        return '( o .o)';
      } else if(stats.passes) {
        return '( ^ .^)';
      } else {
        return '( - .-)';
      }
    }

    /**
     * Move cursor up `n`.
     *
     * @param {Number} n
     * @api private
     */

    NyanCat.prototype.cursorUp = n => {
      write('\u001b[' + n + 'A');
    };

    /**
     * Move cursor down `n`.
     *
     * @param {Number} n
     * @api private
     */

    NyanCat.prototype.cursorDown = n => {
      write('\u001b[' + n + 'B');
    };

    /**
     * Generate rainbow colors.
     *
     * @return {Array}
     * @api private
     */

    NyanCat.prototype.generateColors = () => {
      var colors = [];

      for (var i = 0; i < (6 * 7); i++) {
        var pi3 = Math.floor(Math.PI / 3);
        var n = (i * (1.0 / 6));
        var r = Math.floor(3 * Math.sin(n) + 3);
        var g = Math.floor(3 * Math.sin(n + 2 * pi3) + 3);
        var b = Math.floor(3 * Math.sin(n + 4 * pi3) + 3);
        colors.push(36 * r + 6 * g + b + 16);
      }

      return colors;
    };

    /**
     * Apply rainbow to the given `str`.
     *
     * @param {String} str
     * @return {String}
     * @api private
     */

    NyanCat.prototype.rainbowify = function(str){
      var color = this.rainbowColors[this.colorIndex % this.rainbowColors.length];
      this.colorIndex += 1;
      return '\u001b[38;5;' + color + 'm' + str + '\u001b[0m';
    };

    /**
     * Stdout helper.
     */

    function write(string) {
      process.stdout.write(string);
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    NyanCat.prototype = new F;
    NyanCat.prototype.constructor = NyanCat;
  }); // module: reporters/nyan.js

  require.register("reporters/progress.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var cursor = Base.cursor;
    var color = Base.color;

    /**
     * Expose `Progress`.
     */

    exports = module.exports = Progress;

    /**
     * General progress bar color.
     */

    Base.colors.progress = 90;

    /**
     * Initialize a new `Progress` bar test reporter.
     *
     * @param {Runner} runner
     * @param {Object} options
     * @api public
     */

    function Progress(runner, options) {
      Base.call(this, runner);

      var self = this;
      var options = options || {};
      var stats = this.stats;
      var width = Base.window.width * .50 | 0;
      var total = runner.total;
      var complete = 0;
      var max = Math.max;

      // default chars
      options.open = options.open || '[';
      options.complete = options.complete || '▬';
      options.incomplete = options.incomplete || Base.symbols.dot;
      options.close = options.close || ']';
      options.verbose = false;

      // tests started
      runner.on('start', () => {
        console.log();
        cursor.hide();
      });

      // tests complete
      runner.on('test end', () => {
        complete++;
        var incomplete = total - complete;
        var percent = complete / total;
        var n = width * percent | 0;
        var i = width - n;

        cursor.CR();
        process.stdout.write('\u001b[J');
        process.stdout.write(color('progress', '  ' + options.open));
        process.stdout.write(Array(n).join(options.complete));
        process.stdout.write(Array(i).join(options.incomplete));
        process.stdout.write(color('progress', options.close));
        if (options.verbose) {
          process.stdout.write(color('progress', ' ' + complete + ' of ' + total));
        }
      });

      // tests are complete, output some stats
      // and the failures if any
      runner.on('end', () => {
        cursor.show();
        console.log();
        self.epilogue();
      });
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    Progress.prototype = new F;
    Progress.prototype.constructor = Progress;
  }); // module: reporters/progress.js

  require.register("reporters/spec.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var cursor = Base.cursor;
    var color = Base.color;

    /**
     * Expose `Spec`.
     */

    exports = module.exports = Spec;

    /**
     * Initialize a new `Spec` test reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function Spec(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var indents = 0;
      var n = 0;

      function indent() {
        return Array(indents).join('  ')
      }

      runner.on('start', () => {
        console.log();
      });

      runner.on('suite', suite => {
        ++indents;
        console.log(color('suite', '%s%s'), indent(), suite.title);
      });

      runner.on('suite end', suite => {
        --indents;
        if (1 == indents) console.log();
      });

      runner.on('test', test => {
        process.stdout.write(indent() + color('pass', '  ◦ ' + test.title + ': '));
      });

      runner.on('pending', test => {
        var fmt = indent() + color('pending', '  - %s');
        console.log(fmt, test.title);
      });

      runner.on('pass', test => {
        if ('fast' == test.speed) {
          var fmt = indent()
            + color('checkmark', '  ' + Base.symbols.ok)
            + color('pass', ' %s ');
          cursor.CR();
          console.log(fmt, test.title);
        } else {
          var fmt = indent()
            + color('checkmark', '  ' + Base.symbols.ok)
            + color('pass', ' %s ')
            + color(test.speed, '(%dms)');
          cursor.CR();
          console.log(fmt, test.title, test.duration);
        }
      });

      runner.on('fail', (test, err) => {
        cursor.CR();
        console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
      });

      runner.on('end', self.epilogue.bind(self));
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    Spec.prototype = new F;
    Spec.prototype.constructor = Spec;
  }); // module: reporters/spec.js

  require.register("reporters/tap.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var cursor = Base.cursor;
    var color = Base.color;

    /**
     * Expose `TAP`.
     */

    exports = module.exports = TAP;

    /**
     * Initialize a new `TAP` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function TAP(runner) {
      Base.call(this, runner);

      var self = this;
      var stats = this.stats;
      var n = 1;
      var passes = 0;
      var failures = 0;

      runner.on('start', () => {
        var total = runner.grepTotal(runner.suite);
        console.log('%d..%d', 1, total);
      });

      runner.on('test end', () => {
        ++n;
      });

      runner.on('pending', test => {
        console.log('ok %d %s # SKIP -', n, title(test));
      });

      runner.on('pass', test => {
        passes++;
        console.log('ok %d %s', n, title(test));
      });

      runner.on('fail', (test, err) => {
        failures++;
        console.log('not ok %d %s', n, title(test));
        if (err.stack) console.log(err.stack.replace(/^/gm, '  '));
      });

      runner.on('end', () => {
        console.log('# tests ' + (passes + failures));
        console.log('# pass ' + passes);
        console.log('# fail ' + failures);
      });
    }

    /**
     * Return a TAP-safe title of `test`
     *
     * @param {Object} test
     * @return {String}
     * @api private
     */

    function title(test) {
      return test.fullTitle().replace(/#/g, '');
    }
  }); // module: reporters/tap.js

  require.register("reporters/xunit.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var Base = require('./base');

    var utils = require('../utils');
    var escape = utils.escape;

    /**
     * Save timer references to avoid Sinon interfering (see GH-237).
     */

    var Date = global.Date;

    var setTimeout = global.setTimeout;
    var setInterval = global.setInterval;
    var clearTimeout = global.clearTimeout;
    var clearInterval = global.clearInterval;

    /**
     * Expose `XUnit`.
     */

    exports = module.exports = XUnit;

    /**
     * Initialize a new `XUnit` reporter.
     *
     * @param {Runner} runner
     * @api public
     */

    function XUnit(runner) {
      Base.call(this, runner);
      var stats = this.stats;
      var tests = [];
      var self = this;

      runner.on('pass', test => {
        tests.push(test);
      });

      runner.on('fail', test => {
        tests.push(test);
      });

      runner.on('end', () => {
        console.log(tag('testsuite', {
            name: 'Mocha Tests'
          , tests: stats.tests
          , failures: stats.failures
          , errors: stats.failures
          , skipped: stats.tests - stats.failures - stats.passes
          , timestamp: (new Date).toUTCString()
          , time: (stats.duration / 1000) || 0
        }, false));

        tests.forEach(test);
        console.log('</testsuite>');
      });
    }

    /**
     * Inherit from `Base.prototype`.
     */

    function F(){}
    F.prototype = Base.prototype;
    XUnit.prototype = new F;
    XUnit.prototype.constructor = XUnit;


    /**
     * Output tag for the given `test.`
     */

    function test(test) {
      var attrs = {
          classname: test.parent.fullTitle()
        , name: test.title
        , time: test.duration / 1000
      };

      if ('failed' == test.state) {
        var err = test.err;
        attrs.message = escape(err.message);
        console.log(tag('testcase', attrs, false, tag('failure', attrs, false, cdata(err.stack))));
      } else if (test.pending) {
        console.log(tag('testcase', attrs, false, tag('skipped', {}, true)));
      } else {
        console.log(tag('testcase', attrs, true) );
      }
    }

    /**
     * HTML tag helper.
     */

    function tag(name, attrs, close, content) {
      var end = close ? '/>' : '>';
      var pairs = [];
      var tag;

      for (var key in attrs) {
        pairs.push(key + '="' + escape(attrs[key]) + '"');
      }

      tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
      if (content) tag += content + '</' + name + end;
      return tag;
    }

    /**
     * Return cdata escaped CDATA `str`.
     */

    function cdata(str) {
      return '<![CDATA[' + escape(str) + ']]>';
    }
  }); // module: reporters/xunit.js

  require.register("runnable.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var EventEmitter = require('browser/events').EventEmitter;

    var debug = require('browser/debug')('mocha:runnable');
    var milliseconds = require('./ms');

    /**
     * Save timer references to avoid Sinon interfering (see GH-237).
     */

    var Date = global.Date;

    var setTimeout = global.setTimeout;
    var setInterval = global.setInterval;
    var clearTimeout = global.clearTimeout;
    var clearInterval = global.clearInterval;

    /**
     * Object#toString().
     */

    var toString = Object.prototype.toString;

    /**
     * Expose `Runnable`.
     */

    module.exports = Runnable;

    /**
     * Initialize a new `Runnable` with the given `title` and callback `fn`.
     *
     * @param {String} title
     * @param {Function} fn
     * @api private
     */

    function Runnable(title, fn) {
      this.title = title;
      this.fn = fn;
      this.async = fn && fn.length;
      this.sync = ! this.async;
      this._timeout = 2000;
      this._slow = 75;
      this.timedOut = false;
    }

    /**
     * Inherit from `EventEmitter.prototype`.
     */

    function F(){}
    F.prototype = EventEmitter.prototype;
    Runnable.prototype = new F;
    Runnable.prototype.constructor = Runnable;


    /**
     * Set & get timeout `ms`.
     *
     * @param {Number|String} ms
     * @return {Runnable|Number} ms or self
     * @api private
     */

    Runnable.prototype.timeout = function(ms){
      if (0 == arguments.length) return this._timeout;
      if ('string' == typeof ms) ms = milliseconds(ms);
      debug('timeout %d', ms);
      this._timeout = ms;
      if (this.timer) this.resetTimeout();
      return this;
    };

    /**
     * Set & get slow `ms`.
     *
     * @param {Number|String} ms
     * @return {Runnable|Number} ms or self
     * @api private
     */

    Runnable.prototype.slow = function(ms){
      if (0 === arguments.length) return this._slow;
      if ('string' == typeof ms) ms = milliseconds(ms);
      debug('timeout %d', ms);
      this._slow = ms;
      return this;
    };

    /**
     * Return the full title generated by recursively
     * concatenating the parent's full title.
     *
     * @return {String}
     * @api public
     */

    Runnable.prototype.fullTitle = function(){
      return this.parent.fullTitle() + ' ' + this.title;
    };

    /**
     * Clear the timeout.
     *
     * @api private
     */

    Runnable.prototype.clearTimeout = function(){
      clearTimeout(this.timer);
    };

    /**
     * Inspect the runnable void of private properties.
     *
     * @return {String}
     * @api private
     */

    Runnable.prototype.inspect = function(){
      return JSON.stringify(this, (key, val) => {
        if ('_' == key[0]) return;
        if ('parent' == key) return '#<Suite>';
        if ('ctx' == key) return '#<Context>';
        return val;
      }, 2);
    };

    /**
     * Reset the timeout.
     *
     * @api private
     */

    Runnable.prototype.resetTimeout = function(){
      var self = this;
      var ms = this.timeout() || 1e9;

      this.clearTimeout();
      this.timer = setTimeout(() => {
        self.callback(new Error('timeout of ' + ms + 'ms exceeded'));
        self.timedOut = true;
      }, ms);
    };

    /**
     * Run the test and invoke `fn(err)`.
     *
     * @param {Function} fn
     * @api private
     */

    Runnable.prototype.run = function(fn){
      var self = this;
      var ms = this.timeout();
      var start = new Date;
      var ctx = this.ctx;
      var finished;
      var emitted;

      if (ctx) ctx.runnable(this);

      // timeout
      if (this.async) {
        if (ms) {
          this.timer = setTimeout(() => {
            done(new Error('timeout of ' + ms + 'ms exceeded'));
            self.timedOut = true;
          }, ms);
        }
      }

      // called multiple times
      function multiple(err) {
        if (emitted) return;
        emitted = true;
        self.emit('error', err || new Error('done() called multiple times'));
      }

      // finished
      function done(err) {
        if (self.timedOut) return;
        if (finished) return multiple(err);
        self.clearTimeout();
        self.duration = new Date - start;
        finished = true;
        fn(err);
      }

      // for .resetTimeout()
      this.callback = done;

      // async
      if (this.async) {
        try {
          this.fn.call(ctx, err => {
            if (err instanceof Error || toString.call(err) === "[object Error]") return done(err);
            if (null != err) return done(new Error('done() invoked with non-Error: ' + err));
            done();
          });
        } catch (err) {
          done(err);
        }
        return;
      }

      if (this.asyncOnly) {
        return done(new Error('--async-only option in use without declaring `done()`'));
      }

      // sync
      try {
        if (!this.pending) this.fn.call(ctx);
        this.duration = new Date - start;
        fn();
      } catch (err) {
        fn(err);
      }
    };
  }); // module: runnable.js

  require.register("runner.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var EventEmitter = require('browser/events').EventEmitter;

    var debug = require('browser/debug')('mocha:runner');
    var Test = require('./test');
    var utils = require('./utils');
    var filter = utils.filter;
    var keys = utils.keys;

    /**
     * Non-enumerable globals.
     */

    var globals = [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'XMLHttpRequest',
      'Date'
    ];

    /**
     * Expose `Runner`.
     */

    module.exports = Runner;

    /**
     * Initialize a `Runner` for the given `suite`.
     *
     * Events:
     *
     *   - `start`  execution started
     *   - `end`  execution complete
     *   - `suite`  (suite) test suite execution started
     *   - `suite end`  (suite) all tests (and sub-suites) have finished
     *   - `test`  (test) test execution started
     *   - `test end`  (test) test completed
     *   - `hook`  (hook) hook execution started
     *   - `hook end`  (hook) hook complete
     *   - `pass`  (test) test passed
     *   - `fail`  (test, err) test failed
     *   - `pending`  (test) test pending
     *
     * @api public
     */

    function Runner(suite) {
      var self = this;
      this._globals = [];
      this.suite = suite;
      this.total = suite.total();
      this.failures = 0;
      this.on('test end', test => { self.checkGlobals(test); });
      this.on('hook end', hook => { self.checkGlobals(hook); });
      this.grep(/.*/);
      this.globals(this.globalProps().concat(['errno']));
    }

    /**
     * Wrapper for setImmediate, process.nextTick, or browser polyfill.
     *
     * @param {Function} fn
     * @api private
     */

    Runner.immediately = global.setImmediate || process.nextTick;

    /**
     * Inherit from `EventEmitter.prototype`.
     */

    function F(){}
    F.prototype = EventEmitter.prototype;
    Runner.prototype = new F;
    Runner.prototype.constructor = Runner;


    /**
     * Run tests with full titles matching `re`. Updates runner.total
     * with number of tests matched.
     *
     * @param {RegExp} re
     * @param {Boolean} invert
     * @return {Runner} for chaining
     * @api public
     */

    Runner.prototype.grep = function(re, invert){
      debug('grep %s', re);
      this._grep = re;
      this._invert = invert;
      this.total = this.grepTotal(this.suite);
      return this;
    };

    /**
     * Returns the number of tests matching the grep search for the
     * given suite.
     *
     * @param {Suite} suite
     * @return {Number}
     * @api public
     */

    Runner.prototype.grepTotal = function(suite) {
      var self = this;
      var total = 0;

      suite.eachTest(test => {
        var match = self._grep.test(test.fullTitle());
        if (self._invert) match = !match;
        if (match) total++;
      });

      return total;
    };

    /**
     * Return a list of global properties.
     *
     * @return {Array}
     * @api private
     */

    Runner.prototype.globalProps = () => {
      var props = utils.keys(global);

      // non-enumerables
      for (var i = 0; i < globals.length; ++i) {
        if (~utils.indexOf(props, globals[i])) continue;
        props.push(globals[i]);
      }

      return props;
    };

    /**
     * Allow the given `arr` of globals.
     *
     * @param {Array} arr
     * @return {Runner} for chaining
     * @api public
     */

    Runner.prototype.globals = function(arr){
      if (0 == arguments.length) return this._globals;
      debug('globals %j', arr);
      utils.forEach(arr, function(arr){
        this._globals.push(arr);
      }, this);
      return this;
    };

    /**
     * Check for global variable leaks.
     *
     * @api private
     */

    Runner.prototype.checkGlobals = function(test){
      if (this.ignoreLeaks) return;
      var ok = this._globals;
      var globals = this.globalProps();
      var isNode = process.kill;
      var leaks;

      // check length - 2 ('errno' and 'location' globals)
      if (isNode && 1 == ok.length - globals.length) return;
      else if (2 == ok.length - globals.length) return;

      if(this.prevGlobalsLength == globals.length) return;
      this.prevGlobalsLength = globals.length;

      leaks = filterLeaks(ok, globals);
      this._globals = this._globals.concat(leaks);

      if (leaks.length > 1) {
        this.fail(test, new Error('global leaks detected: ' + leaks.join(', ') + ''));
      } else if (leaks.length) {
        this.fail(test, new Error('global leak detected: ' + leaks[0]));
      }
    };

    /**
     * Fail the given `test`.
     *
     * @param {Test} test
     * @param {Error} err
     * @api private
     */

    Runner.prototype.fail = function(test, err){
      ++this.failures;
      test.state = 'failed';

      if ('string' == typeof err) {
        err = new Error('the string "' + err + '" was thrown, throw an Error :)');
      }

      this.emit('fail', test, err);
    };

    /**
     * Fail the given `hook` with `err`.
     *
     * Hook failures (currently) hard-end due
     * to that fact that a failing hook will
     * surely cause subsequent tests to fail,
     * causing jumbled reporting.
     *
     * @param {Hook} hook
     * @param {Error} err
     * @api private
     */

    Runner.prototype.failHook = function(hook, err){
      this.fail(hook, err);
      this.emit('end');
    };

    /**
     * Run hook `name` callbacks and then invoke `fn()`.
     *
     * @param {String} name
     * @param {Function} function
     * @api private
     */

    Runner.prototype.hook = function(name, fn){
      var suite = this.suite;
      var hooks = suite['_' + name];
      var self = this;
      var timer;

      function next(i) {
        var hook = hooks[i];
        if (!hook) return fn();
        if (self.failures && suite.bail()) return fn();
        self.currentRunnable = hook;

        hook.ctx.currentTest = self.test;

        self.emit('hook', hook);

        hook.on('error', err => {
          self.failHook(hook, err);
        });

        hook.run(err => {
          hook.removeAllListeners('error');
          var testError = hook.error();
          if (testError) self.fail(self.test, testError);
          if (err) return self.failHook(hook, err);
          self.emit('hook end', hook);
          delete hook.ctx.currentTest;
          next(++i);
        });
      }

      Runner.immediately(() => {
        next(0);
      });
    };

    /**
     * Run hook `name` for the given array of `suites`
     * in order, and callback `fn(err)`.
     *
     * @param {String} name
     * @param {Array} suites
     * @param {Function} fn
     * @api private
     */

    Runner.prototype.hooks = function(name, suites, fn){
      var self = this;
      var orig = this.suite;

      function next(suite) {
        self.suite = suite;

        if (!suite) {
          self.suite = orig;
          return fn();
        }

        self.hook(name, err => {
          if (err) {
            self.suite = orig;
            return fn(err);
          }

          next(suites.pop());
        });
      }

      next(suites.pop());
    };

    /**
     * Run hooks from the top level down.
     *
     * @param {String} name
     * @param {Function} fn
     * @api private
     */

    Runner.prototype.hookUp = function(name, fn){
      var suites = [this.suite].concat(this.parents()).reverse();
      this.hooks(name, suites, fn);
    };

    /**
     * Run hooks from the bottom up.
     *
     * @param {String} name
     * @param {Function} fn
     * @api private
     */

    Runner.prototype.hookDown = function(name, fn){
      var suites = [this.suite].concat(this.parents());
      this.hooks(name, suites, fn);
    };

    /**
     * Return an array of parent Suites from
     * closest to furthest.
     *
     * @return {Array}
     * @api private
     */

    Runner.prototype.parents = function(){
      var suite = this.suite;
      var suites = [];
      while (suite = suite.parent) suites.push(suite);
      return suites;
    };

    /**
     * Run the current test and callback `fn(err)`.
     *
     * @param {Function} fn
     * @api private
     */

    Runner.prototype.runTest = function(fn){
      var test = this.test;
      var self = this;

      if (this.asyncOnly) test.asyncOnly = true;

      try {
        test.on('error', err => {
          self.fail(test, err);
        });
        test.run(fn);
      } catch (err) {
        fn(err);
      }
    };

    /**
     * Run tests in the given `suite` and invoke
     * the callback `fn()` when complete.
     *
     * @param {Suite} suite
     * @param {Function} fn
     * @api private
     */

    Runner.prototype.runTests = function(suite, fn){
      var self = this;
      var tests = suite.tests.slice();
      var test;

      function next(err) {
        // if we bail after first err
        if (self.failures && suite._bail) return fn();

        // next test
        test = tests.shift();

        // all done
        if (!test) return fn();

        // grep
        var match = self._grep.test(test.fullTitle());
        if (self._invert) match = !match;
        if (!match) return next();

        // pending
        if (test.pending) {
          self.emit('pending', test);
          self.emit('test end', test);
          return next();
        }

        // execute test and hook(s)
        self.emit('test', self.test = test);
        self.hookDown('beforeEach', () => {
          self.currentRunnable = self.test;
          self.runTest(err => {
            test = self.test;

            if (err) {
              self.fail(test, err);
              self.emit('test end', test);
              return self.hookUp('afterEach', next);
            }

            test.state = 'passed';
            self.emit('pass', test);
            self.emit('test end', test);
            self.hookUp('afterEach', next);
          });
        });
      }

      this.next = next;
      next();
    };

    /**
     * Run the given `suite` and invoke the
     * callback `fn()` when complete.
     *
     * @param {Suite} suite
     * @param {Function} fn
     * @api private
     */

    Runner.prototype.runSuite = function(suite, fn){
      var total = this.grepTotal(suite);
      var self = this;
      var i = 0;

      debug('run suite %s', suite.fullTitle());

      if (!total) return fn();

      this.emit('suite', this.suite = suite);

      function next() {
        var curr = suite.suites[i++];
        if (!curr) return done();
        self.runSuite(curr, next);
      }

      function done() {
        self.suite = suite;
        self.hook('afterAll', () => {
          self.emit('suite end', suite);
          fn();
        });
      }

      this.hook('beforeAll', () => {
        self.runTests(suite, next);
      });
    };

    /**
     * Handle uncaught exceptions.
     *
     * @param {Error} err
     * @api private
     */

    Runner.prototype.uncaught = function(err){
      debug('uncaught exception %s', err.message);
      var runnable = this.currentRunnable;
      if (!runnable || 'failed' == runnable.state) return;
      runnable.clearTimeout();
      err.uncaught = true;
      this.fail(runnable, err);

      // recover from test
      if ('test' == runnable.type) {
        this.emit('test end', runnable);
        this.hookUp('afterEach', this.next);
        return;
      }

      // bail on hooks
      this.emit('end');
    };

    /**
     * Run the root suite and invoke `fn(failures)`
     * on completion.
     *
     * @param {Function} fn
     * @return {Runner} for chaining
     * @api public
     */

    Runner.prototype.run = function(fn){
      var self = this;
      var fn = fn || (() => {});

      function uncaught(err){
        self.uncaught(err);
      }

      debug('start');

      // callback
      this.on('end', () => {
        debug('end');
        process.removeListener('uncaughtException', uncaught);
        fn(self.failures);
      });

      // run suites
      this.emit('start');
      this.runSuite(this.suite, () => {
        debug('finished running');
        self.emit('end');
      });

      // uncaught exception
      process.on('uncaughtException', uncaught);

      return this;
    };

    /**
     * Filter leaks with the given globals flagged as `ok`.
     *
     * @param {Array} ok
     * @param {Array} globals
     * @return {Array}
     * @api private
     */

    function filterLeaks(ok, globals) {
      return filter(globals, key => {
        // Firefox and Chrome exposes iframes as index inside the window object
        if (/^d+/.test(key)) return false;

        // in firefox
        // if runner runs in an iframe, this iframe's window.getInterface method not init at first
        // it is assigned in some seconds
        if (global.navigator && /^getInterface/.test(key)) return false;

        // an iframe could be approached by window[iframeIndex]
        // in ie6,7,8 and opera, iframeIndex is enumerable, this could cause leak
        if (global.navigator && /^\d+/.test(key)) return false;

        // Opera and IE expose global variables for HTML element IDs (issue #243)
        if (/^mocha-/.test(key)) return false;

        var matched = filter(ok, ok => {
          if (~ok.indexOf('*')) return 0 == key.indexOf(ok.split('*')[0]);
          return key == ok;
        });
        return matched.length == 0 && (!global.navigator || 'onerror' !== key);
      });
    }
  }); // module: runner.js

  require.register("suite.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var EventEmitter = require('browser/events').EventEmitter;

    var debug = require('browser/debug')('mocha:suite');
    var milliseconds = require('./ms');
    var utils = require('./utils');
    var Hook = require('./hook');

    /**
     * Expose `Suite`.
     */

    exports = module.exports = Suite;

    /**
     * Create a new `Suite` with the given `title`
     * and parent `Suite`. When a suite with the
     * same title is already present, that suite
     * is returned to provide nicer reporter
     * and more flexible meta-testing.
     *
     * @param {Suite} parent
     * @param {String} title
     * @return {Suite}
     * @api public
     */

    exports.create = (parent, title) => {
      var suite = new Suite(title, parent.ctx);
      suite.parent = parent;
      if (parent.pending) suite.pending = true;
      title = suite.fullTitle();
      parent.addSuite(suite);
      return suite;
    };

    /**
     * Initialize a new `Suite` with the given
     * `title` and `ctx`.
     *
     * @param {String} title
     * @param {Context} ctx
     * @api private
     */

    function Suite(title, ctx) {
      this.title = title;
      this.ctx = ctx;
      this.suites = [];
      this.tests = [];
      this.pending = false;
      this._beforeEach = [];
      this._beforeAll = [];
      this._afterEach = [];
      this._afterAll = [];
      this.root = !title;
      this._timeout = 2000;
      this._slow = 75;
      this._bail = false;
    }

    /**
     * Inherit from `EventEmitter.prototype`.
     */

    function F(){}
    F.prototype = EventEmitter.prototype;
    Suite.prototype = new F;
    Suite.prototype.constructor = Suite;


    /**
     * Return a clone of this `Suite`.
     *
     * @return {Suite}
     * @api private
     */

    Suite.prototype.clone = function(){
      var suite = new Suite(this.title);
      debug('clone');
      suite.ctx = this.ctx;
      suite.timeout(this.timeout());
      suite.slow(this.slow());
      suite.bail(this.bail());
      return suite;
    };

    /**
     * Set timeout `ms` or short-hand such as "2s".
     *
     * @param {Number|String} ms
     * @return {Suite|Number} for chaining
     * @api private
     */

    Suite.prototype.timeout = function(ms){
      if (0 == arguments.length) return this._timeout;
      if ('string' == typeof ms) ms = milliseconds(ms);
      debug('timeout %d', ms);
      this._timeout = parseInt(ms, 10);
      return this;
    };

    /**
     * Set slow `ms` or short-hand such as "2s".
     *
     * @param {Number|String} ms
     * @return {Suite|Number} for chaining
     * @api private
     */

    Suite.prototype.slow = function(ms){
      if (0 === arguments.length) return this._slow;
      if ('string' == typeof ms) ms = milliseconds(ms);
      debug('slow %d', ms);
      this._slow = ms;
      return this;
    };

    /**
     * Sets whether to bail after first error.
     *
     * @parma {Boolean} bail
     * @return {Suite|Number} for chaining
     * @api private
     */

    Suite.prototype.bail = function(bail){
      if (0 == arguments.length) return this._bail;
      debug('bail %s', bail);
      this._bail = bail;
      return this;
    };

    /**
     * Run `fn(test[, done])` before running tests.
     *
     * @param {Function} fn
     * @return {Suite} for chaining
     * @api private
     */

    Suite.prototype.beforeAll = function(fn){
      if (this.pending) return this;
      var hook = new Hook('"before all" hook', fn);
      hook.parent = this;
      hook.timeout(this.timeout());
      hook.slow(this.slow());
      hook.ctx = this.ctx;
      this._beforeAll.push(hook);
      this.emit('beforeAll', hook);
      return this;
    };

    /**
     * Run `fn(test[, done])` after running tests.
     *
     * @param {Function} fn
     * @return {Suite} for chaining
     * @api private
     */

    Suite.prototype.afterAll = function(fn){
      if (this.pending) return this;
      var hook = new Hook('"after all" hook', fn);
      hook.parent = this;
      hook.timeout(this.timeout());
      hook.slow(this.slow());
      hook.ctx = this.ctx;
      this._afterAll.push(hook);
      this.emit('afterAll', hook);
      return this;
    };

    /**
     * Run `fn(test[, done])` before each test case.
     *
     * @param {Function} fn
     * @return {Suite} for chaining
     * @api private
     */

    Suite.prototype.beforeEach = function(fn){
      if (this.pending) return this;
      var hook = new Hook('"before each" hook', fn);
      hook.parent = this;
      hook.timeout(this.timeout());
      hook.slow(this.slow());
      hook.ctx = this.ctx;
      this._beforeEach.push(hook);
      this.emit('beforeEach', hook);
      return this;
    };

    /**
     * Run `fn(test[, done])` after each test case.
     *
     * @param {Function} fn
     * @return {Suite} for chaining
     * @api private
     */

    Suite.prototype.afterEach = function(fn){
      if (this.pending) return this;
      var hook = new Hook('"after each" hook', fn);
      hook.parent = this;
      hook.timeout(this.timeout());
      hook.slow(this.slow());
      hook.ctx = this.ctx;
      this._afterEach.push(hook);
      this.emit('afterEach', hook);
      return this;
    };

    /**
     * Add a test `suite`.
     *
     * @param {Suite} suite
     * @return {Suite} for chaining
     * @api private
     */

    Suite.prototype.addSuite = function(suite){
      suite.parent = this;
      suite.timeout(this.timeout());
      suite.slow(this.slow());
      suite.bail(this.bail());
      this.suites.push(suite);
      this.emit('suite', suite);
      return this;
    };

    /**
     * Add a `test` to this suite.
     *
     * @param {Test} test
     * @return {Suite} for chaining
     * @api private
     */

    Suite.prototype.addTest = function(test){
      test.parent = this;
      test.timeout(this.timeout());
      test.slow(this.slow());
      test.ctx = this.ctx;
      this.tests.push(test);
      this.emit('test', test);
      return this;
    };

    /**
     * Return the full title generated by recursively
     * concatenating the parent's full title.
     *
     * @return {String}
     * @api public
     */

    Suite.prototype.fullTitle = function(){
      if (this.parent) {
        var full = this.parent.fullTitle();
        if (full) return full + ' ' + this.title;
      }
      return this.title;
    };

    /**
     * Return the total number of tests.
     *
     * @return {Number}
     * @api public
     */

    Suite.prototype.total = function(){
      return utils.reduce(this.suites, (sum, suite) => sum + suite.total(), 0) + this.tests.length;
    };

    /**
     * Iterates through each suite recursively to find
     * all tests. Applies a function in the format
     * `fn(test)`.
     *
     * @param {Function} fn
     * @return {Suite}
     * @api private
     */

    Suite.prototype.eachTest = function(fn){
      utils.forEach(this.tests, fn);
      utils.forEach(this.suites, suite => {
        suite.eachTest(fn);
      });
      return this;
    };
  }); // module: suite.js

  require.register("test.js", (module, exports, require) => {

  /**
   * Module dependencies.
   */

  var Runnable = require('./runnable');

  /**
   * Expose `Test`.
   */

  module.exports = Test;

  /**
   * Initialize a new `Test` with the given `title` and callback `fn`.
   *
   * @param {String} title
   * @param {Function} fn
   * @api private
   */

  function Test(title, fn) {
    Runnable.call(this, title, fn);
    this.pending = !fn;
    this.type = 'test';
  }

  /**
   * Inherit from `Runnable.prototype`.
   */

  function F(){};
  F.prototype = Runnable.prototype;
  Test.prototype = new F;
  Test.prototype.constructor = Test;


  }); // module: test.js

  require.register("utils.js", (module, exports, require) => {
    /**
     * Module dependencies.
     */

    var fs = require('browser/fs');

    var path = require('browser/path');
    var join = path.join;
    var debug = require('browser/debug')('mocha:watch');

    /**
     * Ignored directories.
     */

    var ignore = ['node_modules', '.git'];

    /**
     * Escape special characters in the given string of html.
     *
     * @param  {String} html
     * @return {String}
     * @api private
     */

    exports.escape = html => String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    /**
     * Array#forEach (<=IE8)
     *
     * @param {Array} array
     * @param {Function} fn
     * @param {Object} scope
     * @api private
     */

    exports.forEach = (arr, fn, scope) => {
      for (var i = 0, l = arr.length; i < l; i++)
        fn.call(scope, arr[i], i);
    };

    /**
     * Array#indexOf (<=IE8)
     *
     * @parma {Array} arr
     * @param {Object} obj to find index of
     * @param {Number} start
     * @api private
     */

    exports.indexOf = (arr, obj, start) => {
      for (var i = start || 0, l = arr.length; i < l; i++) {
        if (arr[i] === obj)
          return i;
      }
      return -1;
    };

    /**
     * Array#reduce (<=IE8)
     *
     * @param {Array} array
     * @param {Function} fn
     * @param {Object} initial value
     * @api private
     */

    exports.reduce = (arr, fn, val) => {
      var rval = val;

      for (var i = 0, l = arr.length; i < l; i++) {
        rval = fn(rval, arr[i], i, arr);
      }

      return rval;
    };

    /**
     * Array#filter (<=IE8)
     *
     * @param {Array} array
     * @param {Function} fn
     * @api private
     */

    exports.filter = (arr, fn) => {
      var ret = [];

      for (var i = 0, l = arr.length; i < l; i++) {
        var val = arr[i];
        if (fn(val, i, arr)) ret.push(val);
      }

      return ret;
    };

    /**
     * Object.keys (<=IE8)
     *
     * @param {Object} obj
     * @return {Array} keys
     * @api private
     */

    exports.keys = Object.keys || (obj => {
      var keys = []; // for `window` on <=IE8
      var has = Object.prototype.hasOwnProperty;

      for (var key in obj) {
        if (has.call(obj, key)) {
          keys.push(key);
        }
      }

      return keys;
    });

    /**
     * Watch the given `files` for changes
     * and invoke `fn(file)` on modification.
     *
     * @param {Array} files
     * @param {Function} fn
     * @api private
     */

    exports.watch = (files, fn) => {
      var options = { interval: 100 };
      files.forEach(file => {
        debug('file %s', file);
        fs.watchFile(file, options, (curr, prev) => {
          if (prev.mtime < curr.mtime) fn(file);
        });
      });
    };

    /**
     * Ignored files.
     */

    function ignored(path){
      return !~ignore.indexOf(path);
    }

    /**
     * Lookup files in the given `dir`.
     *
     * @return {Array}
     * @api private
     */

    exports.files = (dir, ret) => {
      ret = ret || [];

      fs.readdirSync(dir)
      .filter(ignored)
      .forEach(path => {
        path = join(dir, path);
        if (fs.statSync(path).isDirectory()) {
          exports.files(path, ret);
        } else if (path.match(/\.(js|coffee|litcoffee|coffee.md)$/)) {
          ret.push(path);
        }
      });

      return ret;
    };

    /**
     * Compute a slug from the given `str`.
     *
     * @param {String} str
     * @return {String}
     * @api private
     */

    exports.slug = str => str
      .toLowerCase()
      .replace(/ +/g, '-')
      .replace(/[^-\w]/g, '');

    /**
     * Strip the function definition from `str`,
     * and re-indent for pre whitespace.
     */

    exports.clean = str => {
      str = str
        .replace(/^function *\(.*\) *{/, '')
        .replace(/\s+\}$/, '');

      var whitespace = str.match(/^\n?(\s*)/)[1];
      var re = new RegExp('^' + whitespace, 'gm');

      str = str.replace(re, '');

      return exports.trim(str);
    };

    /**
     * Escape regular expression characters in `str`.
     *
     * @param {String} str
     * @return {String}
     * @api private
     */

    exports.escapeRegexp = str => str.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");

    /**
     * Trim the given `str`.
     *
     * @param {String} str
     * @return {String}
     * @api private
     */

    exports.trim = str => str.replace(/^\s+|\s+$/g, '');

    /**
     * Parse the given `qs`.
     *
     * @param {String} qs
     * @return {Object}
     * @api private
     */

    exports.parseQuery = qs => exports.reduce(qs.replace('?', '').split('&'), (obj, pair) => {
      var i = pair.indexOf('=');
      var key = pair.slice(0, i);
      var val = pair.slice(++i);

      obj[key] = decodeURIComponent(val);
      return obj;
    }, {});

    /**
     * Highlight the given string of `js`.
     *
     * @param {String} js
     * @return {String}
     * @api private
     */

    function highlight(js) {
      return js
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\/\/(.*)/gm, '<span class="comment">//$1</span>')
        .replace(/('.*?')/gm, '<span class="string">$1</span>')
        .replace(/(\d+\.\d+)/gm, '<span class="number">$1</span>')
        .replace(/(\d+)/gm, '<span class="number">$1</span>')
        .replace(/\bnew *(\w+)/gm, '<span class="keyword">new</span> <span class="init">$1</span>')
        .replace(/\b(function|new|throw|return|var|if|else)\b/gm, '<span class="keyword">$1</span>')
    }

    /**
     * Highlight the contents of tag `name`.
     *
     * @param {String} name
     * @api private
     */

    exports.highlightTags = name => {
      var code = document.getElementsByTagName(name);
      for (var i = 0, len = code.length; i < len; ++i) {
        code[i].innerHTML = highlight(code[i].innerHTML);
      }
    };
  }); // module: utils.js
  // The global object is "self" in Web Workers.
  global = (function() { return this; })();

  /**
   * Save timer references to avoid Sinon interfering (see GH-237).
   */

  var Date = global.Date;
  var setTimeout = global.setTimeout;
  var setInterval = global.setInterval;
  var clearTimeout = global.clearTimeout;
  var clearInterval = global.clearInterval;

  /**
   * Node shims.
   *
   * These are meant only to allow
   * mocha.js to run untouched, not
   * to allow running node code in
   * the browser.
   */

  var process = {};
  process.exit = status => {};
  process.stdout = {};

  /**
   * Remove uncaughtException listener.
   */

  process.removeListener = e => {
    if ('uncaughtException' == e) {
      global.onerror = () => {};
    }
  };

  /**
   * Implements uncaughtException listener.
   */

  process.on = (e, fn) => {
    if ('uncaughtException' == e) {
      global.onerror = (err, url, line) => {
        fn(new Error(err + ' (' + url + ':' + line + ')'));
      };
    }
  };

  /**
   * Expose mocha.
   */

  var Mocha = global.Mocha = require('mocha');

  var mocha = global.mocha = new Mocha({ reporter: 'html' });
  var immediateQueue = [];
  var immediateTimeout;

  function timeslice() {
    var immediateStart = new Date().getTime();
    while (immediateQueue.length && (new Date().getTime() - immediateStart) < 100) {
      immediateQueue.shift()();
    }
    if (immediateQueue.length) {
      immediateTimeout = setTimeout(timeslice, 0);
    } else {
      immediateTimeout = null;
    }
  }

  /**
   * High-performance override of Runner.immediately.
   */

  Mocha.Runner.immediately = callback => {
    immediateQueue.push(callback);
    if (!immediateTimeout) {
      immediateTimeout = setTimeout(timeslice, 0);
    }
  };

  /**
   * Override ui to ensure that the ui functions are initialized.
   * Normally this would happen in Mocha.prototype.loadFiles.
   */

  mocha.ui = function(ui){
    Mocha.prototype.ui.call(this, ui);
    this.suite.emit('pre-require', global, null, this);
    return this;
  };

  /**
   * Setup mocha with the given setting options.
   */

  mocha.setup = function(opts){
    if ('string' == typeof opts) opts = { ui: opts };
    for (var opt in opts) this[opt](opts[opt]);
    return this;
  };

  /**
   * Run mocha, returning the Runner.
   */

  mocha.run = fn => {
    var options = mocha.options;
    mocha.globals('location');

    var query = Mocha.utils.parseQuery(global.location.search || '');
    if (query.grep) mocha.grep(query.grep);
    if (query.invert) mocha.invert();

    return Mocha.prototype.run.call(mocha, () => {
      // The DOM Document is not available in Web Workers.
      if (global.document) {
        Mocha.utils.highlightTags('code');
      }
      if (fn) fn();
    });
  };

  /**
   * Expose the process shim.
   */

  Mocha.process = process;
}))();