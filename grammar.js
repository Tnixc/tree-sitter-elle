// Tree-sitter grammar for the Elle programming language

const ASSIGNMENT_OPERATORS = ["=", "+=", "-=", "*=", "/=", "<>="];

module.exports = grammar({
  name: "elle",

  extras: ($) => [/\s|\\\r?\n/, $.comment, ";"],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.range_expression],
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
          $.global_directive,
          $.namespace_directive,
        ),
      ),

    // Comments
    comment: ($) =>
      choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

    // Import statements
    import_statement: ($) => seq("use", $.module_path, ";"),

    module_path: ($) => seq(repeat(seq($.identifier, "/")), $.identifier),

    namespace_directive: ($) =>
      seq(
        "namespace",
        field(
          "name",
          $.identifier,
        ),
        ";",
      ),

    global_directive: ($) =>
      seq(
        "global",
        field(
          "directives",
          seq(
            $._global_directive_option,
            repeat(seq(",", $._global_directive_option)),
            optional(","),
          ),
        ),
        ";",
      ),

    _global_directive_option: ($) =>
      choice(
        "pub",
        "external",
      ),

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
        optional($.block),
        optional(";"),
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
        // Types
        commaSep1($.type),
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
        optional($.type),
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

    generic_parameters: ($) =>
      prec(
        15,
        seq(
          token.immediate("<"),
          commaSep1(choice($.identifier)),
          token.immediate(">"),
        ),
      ),

    // Types
    type: ($) =>
      prec(
        10,
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
          $.generic_type,
          $.identifier,
          $.array_type,
          $.pointer_type,
          $.tuple_type,
        ),
      ),

    array_type: ($) => prec.left(1, seq($.type, "[]", repeat("[]"))),

    pointer_type: ($) => prec.left(13, seq($.type, "*", repeat("*"))),

    // Generic type: for types like Foo<Bar>
    generic_type: ($) =>
      prec.left(
        10,
        seq(
          $.identifier,
          $.generic_parameters,
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

    expression_statement: ($) => prec.left(seq($.expression, ";")),

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
      prec(
        50,
        seq(
          field("set", $.expression),
          choice(...ASSIGNMENT_OPERATORS),
          field("value", $.expression),
          ";",
        ),
      ),

    if_statement: ($) =>
      prec.right(
        1,
        seq(
          token.immediate("if"),
          field(
            "condition",
            choice(
              seq(token("("), $.expression, token(")")),
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
          seq($.type, $.identifier, "=", $.expression),
          seq("let", $.identifier, "=", $.expression),
          seq($.identifier, ":=", $.expression),
        ),
      ),

    assignment_statement_no_semi: ($) =>
      seq($.expression, choice(...ASSIGNMENT_OPERATORS), $.expression),

    defer_statement: ($) => seq("defer", $.expression, ";"),

    return_statement: ($) =>
      prec(
        50,
        choice(
          seq(token.immediate("return"), $.expression, ";"),
          seq(token.immediate("return"), ";"),
        ),
      ),

    break_statement: ($) => seq("break", ";"),

    continue_statement: ($) => seq("continue", ";"),

    // Expressions
    expression: ($) =>
      prec(
        2,
        choice(
          $.cast_expression,
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
          $.identifier,
          $.qualified_identifier,
          $.directive_expression,
          $.sigil_expression,
        ),
      ),

    expression_list: ($) => commaSep1($.expression),

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
              field("left", $.expression),
              field("operator", operator.toString()),
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

    parenthesized_expression: ($) =>
      prec.left(-10, seq(token("("), $.expression, token(")"))),

    call_expression: ($) =>
      choice(
        prec(
          20,
          seq(
            field(
              "function",
              choice(
                $.identifier,
                $.qualified_identifier,
                $.member_expression,
              ),
            ),
            optional(field("generic_parameters", $.generic_parameters)),
            field(
              "arguments",
              seq(
                token("("),
                optional($.expression_list),
                token(")"),
              ),
            ),
          ),
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

    _type_cast: ($) => prec.left(-10, seq(token("("), $.type, token(")"))),

    cast_expression: ($) => seq($._type_cast, $.expression),

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
          token("{"),
          commaSep($.struct_field_initializer),
          token("}"),
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
