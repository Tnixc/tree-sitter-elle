; Comments
(comment) @comment

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
] @keyword

; Types
(type) @type
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
] @type.builtin

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
  "%="
  "^="
  "&="
  "|="
  "<<" 
  ">>" 
  "&&" 
  "||"
  "<>"
  "<>="
  ".."
  "..="
  ":="
] @operator

; Variables and parameters
(parameter
  (identifier) @variable.parameter)
(variable_declaration
  (identifier) @variable)

; Attributes
(attribute
  (identifier) @attribute)

; Literals
(numeric_literal) @number
(string_literal) @string
(character_literal) @character
(boolean_literal) @boolean
(escape_sequence) @string.escape

; Directives
(directive_expression) @function.macro
(sigil_expression) @function.special

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
] @punctuation.delimiter

; Identifiers
(exact_literal) @string.special

(struct_field_initializer
  (identifier) @property)

(struct_field 
  (identifier) @property)

(member_expression
  property: (identifier) @property)
