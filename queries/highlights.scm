; Comments
(comment)
@comment
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
  "let"]
@keyword
; Types
(type)
@type
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
  "any"]
@type.builtin
; Generic parameters
(generic_parameters
  "<"
  @punctuation.bracket
  (identifier)
  @type.parameter
  ">"
  @punctuation.bracket)
; Generic arguments
(generic_arguments
  "<"
  @punctuation.bracket
  ">"
  @punctuation.bracket)
; Array type brackets
(array_type
  "[]"
  @punctuation.bracket)
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
  ":="]
@operator
; Functions
(function_definition
  (identifier)
  @function)

; Function calls
(call_expression
  function:
  (expression (identifier) @function.call))

(call_expression
  function:
  (qualified_identifier
    (identifier)
    @namespace
    (identifier)
    @function.method.call))

; Variables and parameters
(parameter
  (identifier)
  @variable.parameter)
(variable_declaration
  (identifier)
  @variable)
; Attributes
(attribute
  (identifier)
  @attribute)
; Literals
(numeric_literal)
@number
(string_literal)
@string
(character_literal)
@character
(boolean_literal)
@boolean
(escape_sequence)
@string.escape
; Directives
(directive_expression)
@function.macro
(sigil_expression)
@function.special
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
  "->"]
@punctuation.delimiter
; Identifiers
(exact_literal)
@string.special
(struct_field_initializer
  (identifier)
  @property)
(struct_field
  (identifier)
  @property)
(member_expression
  (identifier)
  @property)
