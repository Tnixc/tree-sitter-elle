; Identifiers
(identifier) @variable
(qualified_identifier) @variable

; Assume uppercase names are structs
((identifier) @constructor
  (#match? @constructor "^[A-Z]"))

; Assume all-caps names are constants
((identifier) @constant
  (#match? @constant "^[A-Z][A-Z\\d_]+$"))

; If the regex doesn't match, at least it's right once
(struct_definition (identifier) @constructor)
(constant_definition (identifier) @constant)

; Types
(type) @type
(type (identifier) @type)
(array_type) @type
(pointer_type) @type
(tuple_type) @type

(generic_type) @type
(generic_parameters (identifier) @type)

"ElleMeta" @type
"void" @type
"bool" @type
"char" @type
"i8" @type
"i16" @type
"i32" @type
"i64" @type
"f32" @type
"f64" @type
"string" @type
"any" @type
"FILE" @type

; Constants and literals
(numeric_literal) @number
(string_literal) @string
(character_literal) @string
(boolean_literal) @boolean
(escape_sequence) @string.escape

; Comments
(comment) @comment

; Keywords
"pub" @keyword
"!pub" @keyword
"local" @keyword
"!local" @keyword
"fn" @keyword
"if" @keyword
"else" @keyword
"while" @keyword
"for" @keyword
"in" @keyword
"defer" @keyword
"return" @keyword
"break" @keyword
"continue" @keyword
"struct" @keyword
"const" @keyword
"external" @keyword
"use" @keyword
"namespace" @keyword
"global" @keyword
"let" @keyword

; Function definition
(function_definition name: (identifier) @function)
(function_definition name: (qualified_identifier) @function)
(function_definition name: (exact_literal) @function)
(external_function_declaration name: (identifier) @function)
(external_function_declaration name: (qualified_identifier) @function)
(external_function_declaration name: (exact_literal) @function)

; Function calls
(call_expression function: (identifier) @function)
(call_expression function: (qualified_identifier) @function)
(call_expression function: (member_expression property: (identifier) @function))
(call_expression function: (exact_literal) @function)


; Directives and sigils
(directive_expression name: _ @embedded)

(sigil_expression (identifier) @embedded)

; last item of qualified_identifier
(qualified_identifier name: (identifier) @function)

; Parameters
(parameter (identifier) @variable.special)
(variadic_parameter (identifier) @variable.special)
(no_format_parameter (identifier) @variable)

; Struct fields
(struct_field (identifier) @property)
(struct_field_initializer (identifier) @property)

; Member access
(member_expression property: (identifier) @property)

; Attributes
(attribute (identifier) @attribute)

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "&"
  "|"
  "^"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "<<"
  ">>"
  "&&"
  "||"
  "<>"
  "!"
  "~"
  "?"
  ":"
] @operator

; Assignment operators
[
  "="
  "+="
  "-="
  "*="
  "/="
  "<>="
  ":="
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "<"
  ">"
] @punctuation.bracket

[
  ","
  "."
  "::"
] @punctuation.delimiter

"..." @punctuation.special

[
  "$"
  "#"
  ";"
  "->"
  "@"
] @punctuation

; Import statements
(import_statement (module_path) @primary)

(import_statement (module_path "/" @punctuation.delimiter))
