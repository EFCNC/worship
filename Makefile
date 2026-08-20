.PHONY: setup

setup:
	@echo "Setting up database..."
	@if [ -f db/worship.db ]; then \
		echo "  -> worship.db already exists. Skipping to prevent data loss."; \
	else \
		cp db/worship.example.db db/worship.db; \
		echo "  -> Created worship.db."; \
	fi
	@echo "Setting up config..."
	@if [ -f web/static/js/config.js ]; then \
		echo "  -> config.js already exists. Skipping copy."; \
	else \
		cp web/static/js/config.example.js web/static/js/config.js; \
		echo "  -> Created config.js."; \
	fi
	@printf "Enter ESV API Key (leave blank to skip): "; \
	read api_key; \
	if [ -z "$$api_key" ]; then \
		echo "Warning: No API key provided."; \
	else \
		sed -i.bak "s/YOUR_ESV_API_KEY_HERE/$$api_key/" web/static/js/config.js; \
		rm -f web/static/js/config.js.bak; \
		echo "API key successfully injected into config.js."; \
	fi
	@echo "Setup complete!"