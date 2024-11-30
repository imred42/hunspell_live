# Hunspell Live

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)

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

## License

```
Copyright 2024 Chenfei Xiong

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.