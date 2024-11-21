# Hunspell Live

Live demo: [URL]

## Introduction
Hunspell Live is a customized spell-checking tool powered by [Spylls](https://spylls.readthedocs.io/en/latest/). It enables developers and linguistic researchers to perform real-time spell checking using custom Hunspell dictionaries.

## Prerequisites
- [Docker Desktop](https://www.docker.com/get-started)

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/imred42/hunspell_live.git
cd hunspell_live
```

### Environment Setup
1. Create a `.env` file in the root directory
2. Add the following environment variables:
```bash
DJANGO_SECRET_KEY=your_secret_key_here
BASE_URL_DEV=http://localhost:8000
BASE_URL_PROD=https://your-production-api.com
```

### Build and Run
```bash
docker compose up --build
```

### Adding Custom Dictionaries
To add your own Hunspell dictionaries:

1. Place your `.aff` and `.dic` files in a new directory under `/hunspell_live_backend/hunspell/dicts/[language_code]/`
2. Update `dicts_config/custom_dicts_config.json` with your language configuration:
   ```json
   {
     "language_code": {
       "name": "Full Language Name",
       "direction": "ltr",  // or "rtl" fo right-to-left languages
       "path": "path/to/dictionary"
     }
   }
   ```
   > **Note:** Ensure your language directory name matches the `language_code` in your configuration.

3. Generate the frontend language options:
   ```bash
   python scripts/update_language_options.py
   ```

Your new language will now appear in the client interface dropdown menu.