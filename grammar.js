/**
 * @file Elle grammar for tree-sitter
 * @author Tnixc <tnixxc@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Tree-sitter grammar for the Elle programming language
module.exports = grammar({
  name: "elle",

  extras: ($) => [/\s|\\\r?\n/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.type, $.expression],
    [$.binary_expression, $.unary_expression, $.call_expression],
    [$.binary_expression, $.call_expression, $.cast_expression],
    [$.binary_expression, $.call_expression],
    [$.if_statement, $.parenthesized_expression],
    [$.while_statement, $.parenthesized_expression],
  ],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.import_statement,
          $.function_definition,
          $.constant_definition,
          $.external_function_declaration,
          $.struct_definition,
          $.global_pub_directive,
        ),
      ),

    // Comments
    comment: ($) =>
      choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    // Import statements
    import_statement: ($) => seq("use", $.module_path, ";"),

    module_path: ($) => seq(repeat(seq($.identifier, "/")), $.identifier),

    global_pub_directive: ($) => seq("global", "pub", ";"),

    // Function definitions
    function_definition: ($) =>
      seq(
        optional("pub"),
        optional("local"),
        "fn",
        choice($.identifier, $.qualified_identifier, $.exact_literal),
        optional($.generic_parameters),
        "(",
        optional($.parameter_list),
        ")",
        optional($.attributes),
        optional(seq("->", $.type)),
        $.block,
      ),

    qualified_identifier: ($) => seq($.identifier, "::", $.identifier),

    attributes: ($) => repeat1($.attribute),

    attribute: ($) =>
      seq(
        "@",
        $.identifier,
        optional(seq("(", optional($.expression_list), ")")),
      ),

    // Fix: Restructure parameter_list to never match empty string
    parameter_list: ($) =>
      choice(
        // ElleMeta with more parameters
        seq(
          "ElleMeta",
          $.identifier,
          ",",
          commaSep1(
            choice($.parameter, $.variadic_parameter, $.no_format_parameter),
          ),
        ),

        // ElleMeta alone
        seq("ElleMeta", $.identifier),

        // Regular parameters without ElleMeta
        commaSep1(
          choice($.parameter, $.variadic_parameter, $.no_format_parameter),
        ),
      ),

    parameter: ($) => seq($.type, $.identifier),

    no_format_parameter: ($) => seq("@nofmt", $.type, $.identifier),

    variadic_parameter: ($) => "...",

    // External function declarations
    external_function_declaration: ($) =>
      seq(
        optional("pub"),
        "external",
        "fn",
        $.identifier,
        "(",
        optional($.parameter_list),
        ")",
        optional($.attributes),
        optional(seq("->", $.type)),
        ";",
      ),

    // Constant definitions
    constant_definition: ($) =>
      seq(
        optional("pub"),
        optional("local"),
        "const",
        $.type,
        $.identifier,
        "=",
        $.expression,
        ";",
      ),

    // Struct definitions
    struct_definition: ($) =>
      seq(
        optional("pub"),
        "struct",
        $.identifier,
        optional($.generic_parameters),
        optional($.attributes),
        "{",
        repeat($.struct_field),
        "};",
      ),

    struct_field: ($) => seq($.type, $.identifier, ";"),

    generic_parameters: ($) => seq("<", commaSep1($.identifier), ">"),

    // Types
    type: ($) =>
      choice(
        "void",
        "bool",
        "char",
        "i8",
        "i16",
        "i32",
        "i64",
        "f32",
        "f64",
        "fn",
        "string",
        "any",
        "FILE",
        $.identifier,
        $.array_type,
        $.pointer_type,
        $.generic_type,
        $.tuple_type,
      ),

    array_type: ($) => prec.left(1, seq($.type, "[]", repeat("[]"))),

    pointer_type: ($) => prec.left(1, seq($.type, "*", repeat("*"))),

    generic_type: ($) => seq($.identifier, "<", commaSep1($.type), ">"),

    tuple_type: ($) => seq("(", $.type, ",", $.type, ")"),

    // Blocks and statements
    block: ($) => seq("{", repeat($.statement), "}"),

    statement: ($) =>
      choice(
        $.expression_statement,
        $.variable_declaration,
        $.assignment_statement,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.foreach_statement,
        $.defer_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.block,
        $.static_buffer,
      ),

    expression_statement: ($) => seq($.expression, ";"),

    variable_declaration: ($) =>
      seq(
        choice(
          seq($.type, $.identifier),
          seq("let", $.identifier),
          seq($.identifier, ":="),
        ),
        "=",
        $.expression,
        ";",
      ),

    assignment_statement: ($) =>
      seq(
        $.expression,
        choice(
          "=",
          "+=",
          "-=",
          "*=",
          "/=",
          "%=",
          "&=",
          "|=",
          "^=",
          "<<=",
          ">>=",
          "<>=",
        ),
        $.expression,
        ";",
      ),

    if_statement: ($) =>
      seq(
        "if",
        optional("("),
        $.expression,
        optional(")"),
        $.block,
        optional($.else_clause),
      ),

    else_clause: ($) =>
      choice(seq("else", $.block), seq("else", $.if_statement)),

    while_statement: ($) =>
      seq("while", optional("("), $.expression, optional(")"), $.block),

    for_statement: ($) =>
      seq(
        "for",
        optional("("),
        choice($.variable_declaration_no_semi, $.expression),
        ";",
        $.expression,
        ";",
        choice($.assignment_statement_no_semi, $.expression),
        optional(")"),
        $.block,
      ),

    foreach_statement: ($) =>
      seq("for", $.identifier, "in", $.expression, $.block),

    variable_declaration_no_semi: ($) =>
      seq(
        choice(
          seq($.type, $.identifier),
          seq("let", $.identifier),
          seq($.identifier, ":="),
        ),
        "=",
        $.expression,
      ),

    assignment_statement_no_semi: ($) =>
      seq(
        $.expression,
        choice(
          "=",
          "+=",
          "-=",
          "*=",
          "/=",
          "%=",
          "&=",
          "|=",
          "^=",
          "<<=",
          ">>=",
          "<>=",
        ),
        $.expression,
      ),

    defer_statement: ($) => seq("defer", $.expression, ";"),

    return_statement: ($) => seq("return", optional($.expression), ";"),

    break_statement: ($) => seq("break", ";"),

    continue_statement: ($) => seq("continue", ";"),

    // Expressions
    expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.call_expression,
        $.member_expression,
        $.subscript_expression,
        $.conditional_expression,
        $.numeric_literal,
        $.string_literal,
        $.boolean_literal,
        $.character_literal,
        $.array_literal,
        $.tuple_literal,
        $.triple_literal,
        $.struct_literal,
        $.lambda_expression,
        $.range_expression,
        $.cast_expression,
        $.identifier,
        $.directive_expression,
        $.sigil_expression,
      ),

    expression_list: ($) => commaSep1($.expression),

    binary_expression: ($) => {
      const PREC = {
        range: 1,
        or: 2,
        and: 3,
        bitwise_or: 4,
        bitwise_xor: 5,
        bitwise_and: 6,
        equal: 7,
        compare: 8,
        shift: 9,
        add: 10,
        multiply: 11,
        concat: 12,
      };

      return choice(
        ...[
          ["..", PREC.range],
          ["..=", PREC.range],
          ["||", PREC.or],
          ["&&", PREC.and],
          ["|", PREC.bitwise_or],
          ["^", PREC.bitwise_xor],
          ["&", PREC.bitwise_and],
          ["==", PREC.equal],
          ["!=", PREC.equal],
          ["<", PREC.compare],
          ["<=", PREC.compare],
          [">", PREC.compare],
          [">=", PREC.compare],
          ["<<", PREC.shift],
          [">>", PREC.shift],
          ["+", PREC.add],
          ["-", PREC.add],
          ["*", PREC.multiply],
          ["/", PREC.multiply],
          ["%", PREC.multiply],
          ["<>", PREC.concat],
        ].map(([operator, precedence]) => {
          return prec.left(
            precedence,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          );
        }),
      );
    },

    unary_expression: ($) =>
      prec.left(
        12,
        seq(
          field("operator", choice("!", "~", "&", "-", "+", "*")),
          field("argument", $.expression),
        ),
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    call_expression: ($) =>
      prec.left(
        14,
        seq(
          field("function", choice($.expression, $.qualified_identifier)),
          optional($.generic_arguments),
          field("arguments", seq("(", optional($.expression_list), ")")),
        ),
      ),

    generic_arguments: ($) => seq("<", commaSep1($.type), ">"),

    member_expression: ($) =>
      prec.left(
        13,
        seq(
          field("object", $.expression),
          ".",
          field("property", $.identifier),
        ),
      ),

    subscript_expression: ($) =>
      prec.left(
        13,
        seq(
          field("object", $.expression),
          "[",
          field("index", $.expression),
          "]",
        ),
      ),

    conditional_expression: ($) =>
      prec.right(
        1,
        seq(
          field("condition", $.expression),
          "?",
          field("consequence", $.expression),
          ":",
          field("alternative", $.expression),
        ),
      ),

    cast_expression: ($) => prec.left(12, seq("(", $.type, ")", $.expression)),

    // Literals
    numeric_literal: ($) => {
      const hex = /0[xX][0-9a-fA-F](_?[0-9a-fA-F])*/;
      const octal = /0[oO][0-7](_?[0-7])*/;
      const binary = /0[bB][01](_?[01])*/;
      const decimal = /[0-9](_?[0-9])*/;
      const scientific =
        /[0-9](_?[0-9])*(\.[0-9](_?[0-9])*)?(e|E)(\+|-)?[0-9](_?[0-9])*/;
      const floating = /[0-9](_?[0-9])*\.[0-9](_?[0-9])*/;

      return token(choice(hex, octal, binary, scientific, floating, decimal));
    },

    string_literal: ($) =>
      seq('"', repeat(choice(/[^"\\\n]/, $.escape_sequence)), '"'),

    escape_sequence: ($) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[^xu0-7]/,
            /[0-7]{1,3}/,
            /x[0-9a-fA-F]{2}/,
            /u[0-9a-fA-F]{4}/,
          ),
        ),
      ),

    character_literal: ($) =>
      seq("'", choice(/[^'\\\n]/, $.escape_sequence), "'"),

    boolean_literal: ($) => choice("true", "false"),

    array_literal: ($) =>
      seq(
        optional("#"),
        "[",
        optional(seq($.type, ";")),
        optional(commaSep($.expression)),
        "]",
      ),

    tuple_literal: ($) =>
      prec(11, seq("$(", $.expression, ",", $.expression, ")")),

    triple_literal: ($) =>
      prec(
        11,
        seq("$$(", $.expression, ",", $.expression, ",", $.expression, ")"),
      ),

    struct_literal: ($) =>
      prec(
        15,
        seq(
          $.identifier,
          optional($.generic_arguments),
          "{",
          commaSep($.struct_field_initializer),
          "}",
        ),
      ),

    struct_field_initializer: ($) => seq($.identifier, "=", $.expression),

    range_expression: ($) =>
      seq($.expression, choice("..", "..="), $.expression),

    lambda_expression: ($) =>
      seq(
        "fn",
        "(",
        optional($.parameter_list),
        ")",
        choice($.expression, $.block),
      ),

    // Directives and sigils
    directive_expression: ($) =>
      prec.left(
        13,
        seq(
          "#",
          choice(
            seq("len", "(", $.expression, ")"),
            seq("size", "(", $.type, ")"),
            seq("i", "(", $.identifier, ")"),
            "env",
            seq("alloc", "(", $.type, optional(seq(",", $.expression)), ")"),
            seq(
              "realloc",
              "(",
              $.expression,
              ",",
              $.type,
              optional(seq(",", $.expression)),
              ")",
            ),
            seq("free", "(", $.expression, ")"),
            seq("set_allocator", "(", $.expression, ")"),
            seq("reset_allocator", "(", ")"),
          ),
        ),
      ),

    sigil_expression: ($) =>
      prec.left(
        13,
        seq(
          "$",
          choice(
            $.identifier,
            seq($.identifier, "(", optional($.expression_list), ")"),
          ),
        ),
      ),

    exact_literal: ($) => seq("`", /[^`]+/, "`"),

    static_buffer: ($) =>
      seq($.type, $.identifier, "[", $.expression, "]", ";"),

    // Identifiers
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)), optional(","));
}
