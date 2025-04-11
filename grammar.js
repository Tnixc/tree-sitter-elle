// Tree-sitter grammar for the Elle programming language
module.exports = grammar({
  name: "elle",

  extras: ($) => [/\s|\\\r?\n/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.range_expression],
    [$.while_statement, $.parenthesized_expression],
    [$.expression, $._binary_operand],
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

    global_pub_directive: ($) =>
      seq("global", commaSep1("pub", "external"), ";"),

    // Function definitions
    function_definition: ($) =>
      seq(
        optional("pub"),
        optional("local"),
        optional("!pub"),
        optional("!local"),
        optional("!external"),
        "fn",
        field(
          "name",
          choice($.identifier, $.qualified_identifier, $.exact_literal),
        ),
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

    variadic_parameter: ($) => seq("...", optional($.identifier)),

    // External function declarations
    external_function_declaration: ($) =>
      seq(
        optional("pub"),
        optional("local"),
        optional("!pub"),
        optional("!local"),
        "external",
        "fn",
        field(
          "name",
          choice($.identifier, $.qualified_identifier, $.exact_literal),
        ),
        optional($.generic_parameters),
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
        optional("!pub"),
        optional("!local"),
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
        optional("local"),
        optional("!pub"),
        optional("!local"),
        "struct",
        $.identifier,
        optional($.generic_parameters),
        optional($.attributes),
        "{",
        repeat($.struct_field),
        "};",
      ),

    struct_field: ($) => seq($.type, $.identifier, ";"),

    // Updated generic parameters rule enforcing immediate tokens
    generic_parameters: ($) =>
      prec(
        15,
        seq(
          token.immediate("<"),
          commaSep1($.identifier),
          token.immediate(">"),
        ),
      ),

    // Types
    type: ($) =>
      prec(
        1,
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
      ),

    array_type: ($) => prec.left(1, seq($.type, "[]", repeat("[]"))),

    pointer_type: ($) => prec.left(13, seq($.type, "*", repeat("*"))),

    // Generic type: for types like Foo<Bar>
    generic_type: ($) =>
      seq(
        $.identifier,
        token.immediate("<"),
        commaSep1($.type),
        token.immediate(">"),
      ),

    // Generic call: for calls like add<i32>(a, b)
    _generic_call: ($) =>
      prec(
        21,
        seq(
          field("function", $._callable_expr),
          field(
            "generic_arguments",
            seq(
              token.immediate("<"),
              commaSep1($.type),
              token.immediate(">"),
            ),
          ),
          field("arguments", seq("(", optional($.expression_list), ")")),
        ),
      ),

    tuple_type: ($) => seq("(", $.type, ",", $.type, ")"),

    // Blocks and statements
    block: ($) => seq("{", repeat($.statement), "}"),

    statement: ($) =>
      prec(
        50,
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
      ),

    expression_statement: ($) => seq($.expression, ";"),

    variable_declaration: ($) =>
      seq(
        choice(
          seq($.type, $.identifier),
          seq("let", $.identifier),
          // handle := syntax
          seq($.identifier, ":=", $.expression),
          seq($.identifier, ":="), // this line may or may not be useless
        ),
        optional(seq("=", $.expression)),
        ";",
      ),

    assignment_statement: ($) =>
      seq($.expression, choice("=", "+=", "-=", "*=", "/="), $.expression, ";"),

    if_statement: ($) =>
      prec.right(
        1,
        seq(
          token.immediate("if"),
          field(
            "condition",
            choice(
              seq("(", $.expression, ")"),
              $.expression,
            ),
          ),
          prec.dynamic(10, field("body", $.block)),
          optional($.else_clause),
        ),
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
      seq($.expression, choice("=", "+=", "-=", "*=", "/="), $.expression),

    defer_statement: ($) => seq("defer", $.expression, ";"),

    return_statement: ($) =>
      prec(10, seq("return", optional($.expression), ";")),

    break_statement: ($) => seq("break", ";"),

    continue_statement: ($) => seq("continue", ";"),

    // Expressions
    expression: ($) =>
      choice(
        $.call_expression,
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
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
        $.qualified_identifier,
        $.directive_expression,
        $.sigil_expression,
      ),

    expression_list: ($) => commaSep1($.expression),

    _binary_operand: ($) =>
      choice(
        $.identifier,
        $.binary_expression,
        $.call_expression,
        $.unary_expression,
        $.parenthesized_expression,
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
        // $.struct_literal is intentionally excluded
        $.lambda_expression,
        $.range_expression,
        $.cast_expression,
        // $.directive_expression, //probably can't compare these either
        // $.sigil_expression,
      ),

    binary_expression: ($) => {
      const table = [
        ["*", 9],
        ["/", 9],
        ["%", 9],
        ["+", 8],
        ["-", 8],
        ["&", 5],
        ["|", 3],
        ["^", 4],
        ["==", 6],
        ["!=", 6],
        ["<", 6],
        [">", 6],
        ["<=", 6],
        [">=", 6],
        ["<<", 7],
        [">>", 7],
        ["&&", 2],
        ["||", 1],
        ["<>", 1],
      ];

      return choice(
        ...table.map(([operator, precedence]) => {
          return prec.left(
            precedence,
            seq(
              field("left", $._binary_operand),
              field("operator", operator.toString()),
              field("right", $._binary_operand),
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

    // Non-generic function calls
    call_expression: ($) =>
      choice(
        prec(
          20,
          seq(
            field("function", $._callable_expr),
            field("arguments", seq("(", optional($.expression_list), ")")),
          ),
        ),
        prec(21, $._generic_call),
      ),

    // Helper rule defining what can be called (copied from your original rule)
    _callable_expr: ($) =>
      prec(
        1,
        choice(
          $.identifier,
          $.qualified_identifier,
          $.member_expression,
          $.parenthesized_expression,
        ),
      ),

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
      seq(
        '"',
        repeat(choice(/[^"\\\n]/, $.escape_sequence)),
        '"',
      ),

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
        -1,
        seq(
          $.identifier,
          optional($.generic_parameters),
          "{",
          commaSep($.struct_field_initializer),
          "}",
        ),
      ),

    struct_field_initializer: ($) => seq($.identifier, "=", $.expression),

    range_expression: ($) =>
      prec(12, seq($.expression, choice("..", "..="), $.expression)),

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
