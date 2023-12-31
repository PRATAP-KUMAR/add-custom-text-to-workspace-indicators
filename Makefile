SHELL := /bin/bash

# Replace these with the name and domain of your extension!
NAME     := add-custom-text-to-workspace-indicators
DOMAIN   := pratap.fastmail.fm
UUID	 := $(NAME)@$(DOMAIN)
ZIP_NAME := $(UUID).zip

# Some of the recipes below depend on some of these files.
JS_FILES       = $(shell find -type f -and \( -name "*.js" \))

# These files will be included in the extension zip file.
ZIP_CONTENT = $(JS_FILES) \
              schemas/* \
			  schemas/gschemas.compiled \
			  metadata.json

# These five recipes can be invoked by the user.
.PHONY: all zip install uninstall clean

all: $(ZIP_CONTENT)

# The zip recipes only bundles the extension without installing it.
zip: $(ZIP_NAME)

# The install recipes creates the extension zip and installs it.
install: $(ZIP_NAME)
	gnome-extensions install "$(ZIP_NAME)" --force
	@echo "Extension installed successfully! Now restart the Shell ('Alt'+'F2', then 'r' or logout/re-login on Wayland)."

# This uninstalls the previously installed extension.
uninstall:
	gnome-extensions uninstall "$(UUID)"

# This removes all temporary files created with the other recipes.
clean:
	rm -rf $(ZIP_NAME) \
	       schemas/gschemas.compiled

# This bundles the extension
$(ZIP_NAME): $(ZIP_CONTENT)
	@echo "Packing zip file..."
	@rm --force $(ZIP_NAME)
	@zip $(ZIP_NAME) -- $(ZIP_CONTENT)

# Compiles the gschemas.compiled file from the gschema.xml file.
schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	@echo "Compiling schemas..."
	@glib-compile-schemas schemas
