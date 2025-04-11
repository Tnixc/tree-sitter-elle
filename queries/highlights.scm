; Comments
(comment)@comment

; Keywords
[
"use"
"fn"
"const"
"struct"
"if"
"else"
"while"
"for"
"in"
"return"
"break"
"continue"
"defer"
"external"
"pub"
"local"
"global"
"let"
]@keyword

(struct_definition
  "struct" @keyword)

; Types
(type)@type
[
"void"
"bool"
"char"
"i8"
"i16"
"i32"
"i64"
"f32"
"f64"
"string"
"any"
"ElleMeta"; ElleMeta as a builtin type
]@type.builtin

; Generic parameters
(generic_parameters
  "<" @punctuation.bracket
  ">" @punctuation.bracket)

(generic_parameters
  (identifier) @type)

; Struct generics
(struct_definition
  (generic_parameters
    "<" @punctuation.bracket
    ">" @punctuation.bracket))

(struct_definition
  (generic_parameters
    (identifier) @type))

; Array type brackets
(array_type
  "[]" @punctuation.bracket)

; Pointer type operators
(pointer_type
  "*" @operator); Added to highlight pointer * operators

; Operators
[
"="
"+"
"-"
"*"
"/"
"%"
"^"
"&"
"|"
"~"
"!"
"<"
">"
"<="
">="
"=="
"!="
"+="
"-="
"*="
"/="
"<<"
">>"
"&&"
"||"
"<>"
".."
"..="
":="
]@operator

; Functions
(function_definition
  (identifier) @function)

; Function calls (including generic calls)
(call_expression
  function: (_) @function.call)

(call_expression
  function: (qualified_identifier
    (identifier) @namespace
    (identifier) @function.method.call))

; Variables and parameters
(parameter
  (identifier) @variable.parameter)

(variable_declaration
  (identifier) @variable)

; Attributes
(attribute
  "@" @attribute
  (identifier) @attribute)

; No format directive
(no_format_parameter
  "@nofmt" @attribute)

; Literals
(numeric_literal)@number
(string_literal)@string
(character_literal)@character
(boolean_literal)@boolean
(escape_sequence)@string.escape

; Directives
(directive_expression)@function.macro
(sigil_expression)@function.special

; Punctuation
[
"("
  ")"
"["
"]"
"{"
"}"
";"
","
"::"
"->"
]@punctuation.delimiter

; Identifiers
(exact_literal)@string.special
(struct_field_initializer
  (identifier) @property)
(struct_field
  (identifier) @property)
(member_expression
  (identifier) @property)
