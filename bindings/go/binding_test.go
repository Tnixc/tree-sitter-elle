package tree_sitter_elle_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_elle "github.com/tnixc/tree-sitter-elle/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_elle.Language())
	if language == nil {
		t.Errorf("Error loading Elle grammar")
	}
}
