// Generated by CoffeeScript 1.4.0
(function() {
  var AFFINITY, KEYS, TextField, XPATH_FOCUSABLE_FIELD, findFieldFollowing, findFieldPreceding, isWordChar, makeFirstResponder,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  KEYS = {
    A: 65,
    ZERO: 48,
    NINE: 57,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    BACKSPACE: 8,
    DELETE: 46,
    TAB: 9
  };

  KEYS.isDigit = function(keyCode) {
    return (this.ZERO <= keyCode && keyCode <= this.NINE);
  };

  KEYS.isDirectional = function(keyCode) {
    return keyCode === this.LEFT || keyCode === this.RIGHT || keyCode === this.UP || keyCode === this.DOWN;
  };

  AFFINITY = {
    UPSTREAM: 0,
    DOWNSTREAM: 1,
    NONE: null
  };

  isWordChar = function(char) {
    return char && /^\w$/.test(char);
  };

  XPATH_FOCUSABLE_FIELD = '*[name(.)="input" or name(.)="select"][not(type="hidden")][not(contains(@class, "formatted-text-field-interceptor"))]';

  findFieldFollowing = function(element) {
    var result;
    result = document.evaluate("following::" + XPATH_FOCUSABLE_FIELD, element, null, XPathResult.ANY_TYPE, null);
    return result.iterateNext();
  };

  findFieldPreceding = function(element) {
    var result;
    result = document.evaluate("preceding::" + XPATH_FOCUSABLE_FIELD, element, null, XPathResult.ANY_TYPE, null);
    return result.iterateNext();
  };

  makeFirstResponder = function(field, event) {
    var formattedTextField;
    if (formattedTextField = $(field).data('formatted-text-field')) {
      return formattedTextField.becomeFirstResponder(event);
    } else {
      if (typeof field.focus === "function") {
        field.focus();
      }
      return typeof field.select === "function" ? field.select() : void 0;
    }
  };

  TextField = (function() {

    TextField.prototype.selectionAffinity = AFFINITY.NONE;

    function TextField(element) {
      this.element = element;
      this.click = __bind(this.click, this);

      this.paste = __bind(this.paste, this);

      this.keyUp = __bind(this.keyUp, this);

      this.keyPress = __bind(this.keyPress, this);

      this.keyDown = __bind(this.keyDown, this);

      this.afterInterceptorKeyUp = __bind(this.afterInterceptorKeyUp, this);

      this.beforeInterceptorKeyUp = __bind(this.beforeInterceptorKeyUp, this);

      this.element.on('keydown', this.keyDown);
      this.element.on('keypress', this.keyPress);
      this.element.on('keyup', this.keyUp);
      this.element.on('click', this.click);
      this.element.on('paste', this.paste);
      this.element.data('formatted-text-field', this);
      this.createTabInterceptors();
    }

    TextField.prototype.createTabInterceptors = function() {
      var afterInterceptor, beforeInterceptor, createInterceptor, input;
      input = this.element.get(0);
      createInterceptor = function() {
        var interceptor;
        interceptor = input.ownerDocument.createElement('input');
        interceptor.style.position = 'absolute';
        interceptor.style.top = '0';
        interceptor.style.left = '0';
        interceptor.style.opacity = 0;
        interceptor.style.zIndex = -9999;
        interceptor.style.pointerEvents = 'none';
        interceptor.className = 'formatted-text-field-interceptor';
        return interceptor;
      };
      beforeInterceptor = createInterceptor();
      beforeInterceptor.onkeyup = this.beforeInterceptorKeyUp;
      input.parentNode.insertBefore(beforeInterceptor, input);
      afterInterceptor = createInterceptor();
      afterInterceptor.onkeyup = this.afterInterceptorKeyUp;
      if (input.nextSibling) {
        return input.parentNode.insertBefore(afterInterceptor, input.nextSibling);
      } else {
        return input.parentNode.appendChild(afterInterceptor);
      }
    };

    TextField.prototype.beforeInterceptorKeyUp = function(event) {
      var previousField;
      if (event.keyCode === KEYS.TAB && event.shiftKey) {
        if (previousField = findFieldPreceding(event.target)) {
          return makeFirstResponder(previousField);
        }
      }
    };

    TextField.prototype.afterInterceptorKeyUp = function(event) {
      var nextField;
      if (event.keyCode === KEYS.TAB && !event.shiftKey) {
        if (nextField = findFieldFollowing(event.target)) {
          return makeFirstResponder(nextField);
        }
      }
    };

    TextField.prototype.insertCharacter = function(event) {
      var range;
      event.preventDefault();
      if (this.hasSelection) {
        this.clearSelection();
      }
      if (this.formatter.length && this.text.length >= this.formatter.length) {
        return;
      }
      this.replaceSelection(String.fromCharCode(event.charCode));
      range = this.selectedRange;
      range.start += range.length;
      range.length = 0;
      return this.setSelectedRange(range);
    };

    TextField.prototype.moveUp = function(event) {
      event.preventDefault();
      return this.setSelectedRange({
        start: 0,
        length: 0
      });
    };

    TextField.prototype.moveToBeginningOfParagraph = function(event) {
      return this.moveUp(event);
    };

    TextField.prototype.moveUpAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
        case AFFINITY.NONE:
          range.length += range.start;
          range.start = 0;
          break;
        case AFFINITY.DOWNSTREAM:
          range.length = range.start;
          range.start = 0;
      }
      return this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
    };

    TextField.prototype.moveParagraphBackwardAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
        case AFFINITY.NONE:
          range.length += range.start;
          range.start = 0;
          break;
        case AFFINITY.DOWNSTREAM:
          range.length = 0;
      }
      return this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
    };

    TextField.prototype.moveToBeginningOfDocument = function(event) {
      return this.moveToBeginningOfLine(event);
    };

    TextField.prototype.moveToBeginningOfDocumentAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      range.length += range.start;
      range.start = 0;
      return this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
    };

    TextField.prototype.moveDown = function(event) {
      var range;
      event.preventDefault();
      range = {
        start: this.text.length,
        length: 0
      };
      return this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
    };

    TextField.prototype.moveToEndOfParagraph = function(event) {
      return this.moveDown(event);
    };

    TextField.prototype.moveDownAndModifySelection = function(event) {
      var end, range;
      event.preventDefault();
      range = this.selectedRange;
      end = this.text.length;
      if (this.selectionAffinity === AFFINITY.UPSTREAM) {
        range.start += range.length;
      }
      range.length = end - range.start;
      return this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
    };

    TextField.prototype.moveParagraphForwardAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.DOWNSTREAM:
        case AFFINITY.NONE:
          range.length = this.text.length - range.start;
          break;
        case AFFINITY.UPSTREAM:
          range.start += range.length;
          range.length = 0;
      }
      return this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
    };

    TextField.prototype.moveToEndOfDocument = function(event) {
      return this.moveToEndOfLine(event);
    };

    TextField.prototype.moveToEndOfDocumentAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      range.length = this.text.length - range.start;
      return this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
    };

    TextField.prototype.moveLeft = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      if (range.length !== 0) {
        range.length = 0;
      } else {
        range.start--;
      }
      return this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
    };

    TextField.prototype.moveLeftAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
        case AFFINITY.NONE:
          this.selectionAffinity = AFFINITY.UPSTREAM;
          range.start--;
          range.length++;
          break;
        case AFFINITY.DOWNSTREAM:
          range.length--;
      }
      return this.setSelectedRange(range);
    };

    TextField.prototype.moveWordLeft = function(event) {
      var index;
      event.preventDefault();
      index = this.lastWordBreakBeforeIndex(this.selectedRange.start - 1);
      return this.setSelectedRange({
        start: index,
        length: 0
      });
    };

    TextField.prototype.moveWordLeftAndModifySelection = function(event) {
      var end, range, start;
      event.preventDefault();
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
        case AFFINITY.NONE:
          this.selectionAffinity = AFFINITY.UPSTREAM;
          start = this.lastWordBreakBeforeIndex(range.start - 1);
          range.length += range.start - start;
          range.start = start;
          break;
        case AFFINITY.DOWNSTREAM:
          end = this.lastWordBreakBeforeIndex(range.start + range.length);
          if (end < range.start) {
            end = range.start;
          }
          range.length -= range.start + range.length - end;
      }
      return this.setSelectedRange(range);
    };

    TextField.prototype.moveToBeginningOfLine = function(event) {
      event.preventDefault();
      return this.setSelectedRange({
        start: 0,
        length: 0
      });
    };

    TextField.prototype.moveToBeginningOfLineAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      range.length += range.start;
      range.start = 0;
      return this.setSelectedRangeWithAffinity(range, AFFINITY.UPSTREAM);
    };

    TextField.prototype.moveRight = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      if (range.length !== 0) {
        range.start += range.length;
        range.length = 0;
      } else {
        range.start++;
      }
      return this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
    };

    TextField.prototype.moveRightAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
          range.start++;
          range.length--;
          break;
        case AFFINITY.DOWNSTREAM:
        case AFFINITY.NONE:
          this.selectionAffinity = AFFINITY.DOWNSTREAM;
          range.length++;
      }
      return this.setSelectedRange(range);
    };

    TextField.prototype.moveWordRight = function(event) {
      var index, range;
      event.preventDefault();
      range = this.selectedRange;
      index = this.nextWordBreakAfterIndex(range.start + range.length);
      return this.setSelectedRange({
        start: index,
        length: 0
      });
    };

    TextField.prototype.moveWordRightAndModifySelection = function(event) {
      var end, range, start;
      event.preventDefault();
      range = this.selectedRange;
      start = range.start;
      end = range.start + range.length;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
          start = Math.min(this.nextWordBreakAfterIndex(start), end);
          break;
        case AFFINITY.DOWNSTREAM:
        case AFFINITY.NONE:
          this.selectionAffinity = AFFINITY.DOWNSTREAM;
          end = this.nextWordBreakAfterIndex(range.start + range.length);
      }
      return this.setSelectedRange({
        start: start,
        length: end - start
      });
    };

    TextField.prototype.moveToEndOfLine = function(event) {
      var text;
      event.preventDefault();
      text = this.text;
      return this.setSelectedRange({
        start: this.text.length,
        length: 0
      });
    };

    TextField.prototype.moveToEndOfLineAndModifySelection = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      range.length = this.text.length - range.start;
      return this.setSelectedRangeWithAffinity(range, AFFINITY.DOWNSTREAM);
    };

    TextField.prototype.deleteBackward = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      if (range.length === 0) {
        range.start--;
        range.length++;
        this.setSelectedRange(range);
      }
      return this.clearSelection();
    };

    TextField.prototype.deleteWordBackward = function(event) {
      var range, start;
      if (this.hasSelection) {
        return this.deleteBackward(event);
      }
      event.preventDefault();
      range = this.selectedRange;
      start = this.lastWordBreakBeforeIndex(range.start);
      range.length += range.start - start;
      range.start = start;
      this.setSelectedRange(range);
      return this.clearSelection();
    };

    TextField.prototype.deleteBackwardByDecomposingPreviousCharacter = function(event) {
      return this.deleteBackward(event);
    };

    TextField.prototype.deleteBackwardToBeginningOfLine = function(event) {
      var range;
      if (this.hasSelection) {
        return this.deleteBackward(event);
      }
      event.preventDefault();
      range = this.selectedRange;
      range.length = range.start;
      range.start = 0;
      this.setSelectedRange(range);
      return this.clearSelection();
    };

    TextField.prototype.deleteForward = function(event) {
      var range;
      event.preventDefault();
      range = this.selectedRange;
      if (range.length === 0) {
        range.length++;
        this.setSelectedRange(range);
      }
      return this.clearSelection();
    };

    TextField.prototype.deleteWordForward = function(event) {
      var end, range;
      if (this.hasSelection) {
        return this.deleteForward(event);
      }
      event.preventDefault();
      range = this.selectedRange;
      end = this.nextWordBreakAfterIndex(range.start + range.length);
      this.setSelectedRange({
        start: range.start,
        length: end - range.start
      });
      return this.clearSelection();
    };

    TextField.prototype.insertTab = function(event) {};

    TextField.prototype.insertBackTab = function(event) {};

    TextField.prototype.becomeFirstResponder = function(event) {
      var _this = this;
      this.element.focus();
      return this.rollbackInvalidChanges(function() {
        return _this.element.select();
      });
    };

    TextField.prototype.resignFirstResponder = function(event) {
      event.preventDefault();
      this.element.blur();
      return $('#no-selection-test').focus();
    };

    TextField.prototype.__defineGetter__('hasSelection', function() {
      return this.selectedRange.length !== 0;
    });

    TextField.prototype.lastWordBreakBeforeIndex = function(index) {
      var indexes, result, wordBreakIndex, _i, _len;
      indexes = this.leftWordBreakIndexes;
      result = indexes[0];
      for (_i = 0, _len = indexes.length; _i < _len; _i++) {
        wordBreakIndex = indexes[_i];
        if (index > wordBreakIndex) {
          result = wordBreakIndex;
        } else {
          break;
        }
      }
      return result;
    };

    TextField.prototype.__defineGetter__('leftWordBreakIndexes', function() {
      var i, result, text, _i, _ref;
      result = [];
      text = this.text;
      for (i = _i = 0, _ref = text.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (!isWordChar(text[i - 1]) && isWordChar(text[i])) {
          result.push(i);
        }
      }
      return result;
    });

    TextField.prototype.nextWordBreakAfterIndex = function(index) {
      var indexes, result, wordBreakIndex, _i, _len;
      indexes = this.rightWordBreakIndexes.reverse();
      result = indexes[0];
      for (_i = 0, _len = indexes.length; _i < _len; _i++) {
        wordBreakIndex = indexes[_i];
        if (index < wordBreakIndex) {
          result = wordBreakIndex;
        } else {
          break;
        }
      }
      return result;
    };

    TextField.prototype.__defineGetter__('rightWordBreakIndexes', function() {
      var i, result, text, _i, _ref;
      result = [];
      text = this.text;
      for (i = _i = 0, _ref = text.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (isWordChar(text[i]) && !isWordChar(text[i + 1])) {
          result.push(i + 1);
        }
      }
      return result;
    });

    TextField.prototype.clearSelection = function() {
      return this.replaceSelection('');
    };

    TextField.prototype.replaceSelection = function(replacement) {
      var end, range, text;
      range = this.selectedRange;
      end = range.start + range.length;
      text = this.text;
      text = text.substring(0, range.start) + replacement + text.substring(end);
      range.length = replacement.length;
      this.text = text;
      return this.setSelectedRangeWithAffinity(range, AFFINITY.NONE);
    };

    TextField.prototype.selectAll = function(event) {
      event.preventDefault();
      return this.setSelectedRangeWithAffinity({
        start: 0,
        length: this.text.length
      }, AFFINITY.NONE);
    };

    TextField.prototype.readSelectionFromPasteboard = function(pasteboard) {
      var range, text;
      text = pasteboard.getData('Text');
      this.replaceSelection(text);
      range = this.selectedRange;
      range.start += range.length;
      range.length = 0;
      return this.setSelectedRange(range);
    };

    TextField.prototype.keyDown = function(event) {
      var _this = this;
      return this.rollbackInvalidChanges(function() {
        var altKey, ctrlKey, keyCode, metaKey, modifiers, shiftKey;
        keyCode = event.keyCode, metaKey = event.metaKey, ctrlKey = event.ctrlKey, shiftKey = event.shiftKey, altKey = event.altKey;
        modifiers = [];
        if (altKey) {
          modifiers.push('alt');
        }
        if (ctrlKey) {
          modifiers.push('ctrl');
        }
        if (metaKey) {
          modifiers.push('meta');
        }
        if (shiftKey) {
          modifiers.push('shift');
        }
        modifiers = modifiers.join('+');
        if ((metaKey || ctrlKey) && keyCode === KEYS.A) {
          _this.selectAll(event);
        } else if (keyCode === KEYS.LEFT) {
          switch (modifiers) {
            case '':
              _this.moveLeft(event);
              break;
            case 'alt':
              _this.moveWordLeft(event);
              break;
            case 'shift':
              _this.moveLeftAndModifySelection(event);
              break;
            case 'alt+shift':
              _this.moveWordLeftAndModifySelection(event);
              break;
            case 'meta':
              _this.moveToBeginningOfLine(event);
              break;
            case 'meta+shift':
              _this.moveToBeginningOfLineAndModifySelection(event);
              break;
            default:
              throw new Error("unhandled left+" + modifiers);
          }
        } else if (keyCode === KEYS.RIGHT) {
          switch (modifiers) {
            case '':
              _this.moveRight(event);
              break;
            case 'alt':
              _this.moveWordRight(event);
              break;
            case 'shift':
              _this.moveRightAndModifySelection(event);
              break;
            case 'alt+shift':
              _this.moveWordRightAndModifySelection(event);
              break;
            case 'meta':
              _this.moveToEndOfLine(event);
              break;
            case 'meta+shift':
              _this.moveToEndOfLineAndModifySelection(event);
              break;
            default:
              throw new Error("unhandled right+" + modifiers);
          }
        } else if (keyCode === KEYS.UP) {
          switch (modifiers) {
            case '':
              _this.moveUp(event);
              break;
            case 'alt':
              _this.moveToBeginningOfParagraph(event);
              break;
            case 'shift':
              _this.moveUpAndModifySelection(event);
              break;
            case 'alt+shift':
              _this.moveParagraphBackwardAndModifySelection(event);
              break;
            case 'meta':
              _this.moveToBeginningOfDocument(event);
              break;
            case 'meta+shift':
              _this.moveToBeginningOfDocumentAndModifySelection(event);
              break;
            default:
              throw new Error("unhandled up+" + modifiers);
          }
        } else if (keyCode === KEYS.DOWN) {
          switch (modifiers) {
            case '':
              _this.moveDown(event);
              break;
            case 'alt':
              _this.moveToEndOfParagraph(event);
              break;
            case 'shift':
              _this.moveDownAndModifySelection(event);
              break;
            case 'alt+shift':
              _this.moveParagraphForwardAndModifySelection(event);
              break;
            case 'meta':
              _this.moveToEndOfDocument(event);
              break;
            case 'meta+shift':
              _this.moveToEndOfDocumentAndModifySelection(event);
              break;
            default:
              throw new Error("unhandled down+" + modifiers);
          }
        } else if (keyCode === KEYS.BACKSPACE) {
          switch (modifiers) {
            case '':
              _this.deleteBackward(event);
              break;
            case 'alt':
            case 'alt+shift':
              _this.deleteWordBackward(event);
              break;
            case 'ctrl':
            case 'ctrl+shift':
              _this.deleteBackwardByDecomposingPreviousCharacter(event);
              break;
            case 'meta':
            case 'meta+shift':
              _this.deleteBackwardToBeginningOfLine(event);
              break;
            default:
              throw new Error("unhandled backspace+" + modifiers);
          }
        } else if (keyCode === KEYS.DELETE) {
          if (altKey) {
            _this.deleteWordForward(event);
          } else {
            _this.deleteForward(event);
          }
        } else if (keyCode === KEYS.TAB) {
          if (shiftKey) {
            _this.insertBackTab(event);
          } else {
            _this.insertTab(event);
          }
        }
        return null;
      });
    };

    TextField.prototype.keyPress = function(event) {
      var _this = this;
      return this.rollbackInvalidChanges(function() {
        return _this.insertCharacter(event);
      });
    };

    TextField.prototype.keyUp = function(event) {
      var _this = this;
      return this.rollbackInvalidChanges(function() {
        if (event.keyCode === KEYS.TAB) {
          return _this.selectAll(event);
        }
      });
    };

    TextField.prototype.paste = function(event) {
      var _this = this;
      event.preventDefault();
      return this.rollbackInvalidChanges(function() {
        return _this.readSelectionFromPasteboard(event.originalEvent.clipboardData);
      });
    };

    TextField.prototype.rollbackInvalidChanges = function(callback) {
      var change, ctext, deleted, i, inserted, ptext, result, sharedPrefixLength, sharedSuffixLength, _i, _j, _ref, _ref1, _ref2;
      change = {
        field: this,
        current: {
          caret: this.caret,
          text: this.text
        }
      };
      result = callback();
      change.proposed = {
        caret: this.caret,
        text: this.text
      };
      if (change.proposed.text !== change.current.text) {
        ctext = change.current.text;
        ptext = change.proposed.text;
        sharedPrefixLength = ctext.length;
        sharedSuffixLength = 0;
        for (i = _i = 0, _ref = ctext.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (ptext[i] !== ctext[i]) {
            sharedPrefixLength = i;
            break;
          }
        }
        for (i = _j = 0, _ref1 = ctext.length - sharedPrefixLength; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          if (ptext[ptext.length - 1 - i] !== ctext[ctext.length - 1 - i]) {
            sharedSuffixLength = i;
            break;
          }
        }
        inserted = {
          start: sharedPrefixLength,
          end: ptext.length - sharedSuffixLength
        };
        deleted = {
          start: sharedPrefixLength,
          end: ctext.length - sharedSuffixLength
        };
        inserted.text = ptext.substring(inserted.start, inserted.end);
        deleted.text = ctext.substring(deleted.start, deleted.end);
        change.inserted = inserted;
        change.deleted = deleted;
      } else {
        change.inserted = {
          start: change.proposed.caret.start,
          end: change.proposed.caret.end,
          text: ''
        };
        change.deleted = {
          start: change.current.caret.start,
          end: change.current.caret.end,
          text: ''
        };
      }
      if (typeof ((_ref2 = this.formatter) != null ? _ref2.isChangeValid : void 0) === 'function') {
        if (this.formatter.isChangeValid(change)) {
          this.text = change.proposed.text;
          this.caret = change.proposed.caret;
        } else {
          this.text = change.current.text;
          this.caret = change.current.caret;
        }
      }
      return result;
    };

    TextField.prototype.click = function(event) {
      return this.selectionAffinity = AFFINITY.NONE;
    };

    TextField.prototype.on = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.element).on.apply(_ref, args);
    };

    TextField.prototype.off = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.element).off.apply(_ref, args);
    };

    TextField.prototype.__defineGetter__('text', function() {
      return this.element.val();
    });

    TextField.prototype.__defineSetter__('text', function(text) {
      return this.element.val(text);
    });

    TextField.prototype.__defineGetter__('value', function() {
      var value;
      value = this.element.val();
      if (!this._formatter) {
        return value;
      }
      return this._formatter.parse(value);
    });

    TextField.prototype.__defineSetter__('value', function(value) {
      if (this._formatter) {
        value = this._formatter.format(value);
      }
      this.element.val("" + value);
      return this.element.trigger('change');
    });

    TextField.prototype.__defineGetter__('formatter', function() {
      return this._formatter;
    });

    TextField.prototype.__defineSetter__('formatter', function(formatter) {
      var value;
      value = this.value;
      this._formatter = formatter;
      return this.value = value;
    });

    TextField.prototype.__defineGetter__('caret', function() {
      var end, start, _ref;
      _ref = this.element.caret(), start = _ref.start, end = _ref.end;
      return {
        start: start,
        end: end
      };
    });

    TextField.prototype.__defineGetter__('selectedRange', function() {
      var caret;
      caret = this.caret;
      return {
        start: caret.start,
        length: caret.end - caret.start
      };
    });

    TextField.prototype.__defineSetter__('caret', function(caret) {
      var max, min;
      min = 0;
      max = this.text.length;
      caret = {
        start: Math.max(min, Math.min(max, caret.start)),
        end: Math.max(min, Math.min(max, caret.end))
      };
      this.element.caret(caret);
      if (caret.start === caret.end) {
        return this.selectionAffinity = AFFINITY.NONE;
      }
    });

    TextField.prototype.setSelectedRange = function(range) {
      return this.setSelectedRangeWithAffinity(range, this.selectionAffinity);
    };

    TextField.prototype.setSelectedRangeWithAffinity = function(range, affinity) {
      this.selectionAffinity = affinity;
      return this.caret = {
        start: range.start,
        end: range.start + range.length
      };
    };

    TextField.prototype.__defineGetter__('selectionAnchor', function() {
      var range;
      range = this.selectedRange;
      switch (this.selectionAffinity) {
        case AFFINITY.UPSTREAM:
          return range.start + range.length;
        case AFFINITY.DOWNSTREAM:
          return range.start;
        default:
          return null;
      }
    });

    return TextField;

  })();

  if (typeof module !== "undefined" && module !== null) {
    module.exports = TextField;
  } else if (typeof window !== "undefined" && window !== null) {
    (this.FieldKit || (this.FieldKit = {})).TextField = TextField;
  }

}).call(this);