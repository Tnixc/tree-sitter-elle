/**
 * @file Elle grammar for tree-sitter
 * @author Tnixc <tnixxc@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "elle",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
